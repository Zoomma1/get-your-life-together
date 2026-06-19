---
name: today
description: Generate or update the daily plan — adapted agenda based on energy, calendar constraints, work/personal/hobby hours and recent feedback. Reads daily notes, sessions, project kanbans, mood tracker, ICS calendar and mail webhooks. Trigger when the user says "today", "/today", "daily plan", "what am I doing today", "generate my plan", "what do I start with", or early in the day. Automatically adapts based on time (morning = full plan, afternoon = refocused, evening = light).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

**Triggers the daily plan** — Generates an adapted agenda based on energy, constraints and priorities.

**Invocation**: `/today` at any time of day (before 12pm = full plan, 12pm-5pm = refocused plan, after 5pm = light plan).

**Example scenario**: {USER_NAME} calls `/today` at 2:45pm, they have a meeting at 3:30pm (45 min before). The skill detects the short window, displays "⚡ Micro-session (< 0.5h)", proposes 1 light task + the WIP in progress, then asks for next action after the meeting.

  

## Preamble — Initialize control variables

Before any step, initialize these control variables to avoid undefined reads:

```
HEURE_LANCEMENT = null
FENETRE_MIN = Infinity  
FENETRE_COURTE = false
CALENDAR_FAILED = false
MAIL_FAILED = false
FIRST_SESSION_TODAY = false
MAINTENANCE_OVERDUE = false
DURATIONS_REF = {}
```

---

## Step 0 — Tech news digest (conditional, non-blocking)

Check if today's daily note already contains a `## 📰 Digest` section:
- If **yes** → skip (digest already collected)
- If **no** → display in the plan: `⚠️ No digest — launch /digest in a dedicated session if you want a digest today` and continue without blocking

> **Why a dedicated session**: `/digest` + `/research-scout` spawns 9 parallel agents (~30-45 API calls). Launched in the same session as `/today`, this consumes ~70% of the 5h quota. Recommended workflow: launch `/digest` in the evening with `/closeday` → the digest is ready next morning.

---

## Step 1 — Launch time + Focus of the day

**Get current time**: execute `date +"%H:%M"` (bash). Store as `HEURE_LANCEMENT` (ex: "09:15").

Use `HEURE_LANCEMENT` to adapt the plan:
- **Morning (before 12pm)** → full plan, normal windows
- **Afternoon (12pm–5pm)** → flag morning tasks as missed if they don't make sense later, refocus on what's still doable today
- **Evening (after 5pm)** → light plan, prioritize short tasks or hobby, no deep work — flag *"Evening — light plan"*

Display `HEURE_LANCEMENT` in the header of the final plan (Step 5 template).

---

**Focus of the day**

If today's daily note already exists with a `## 📅 Daily plan` section **and this section contains checkable tasks** (at least one checkbox `- [ ]` in a subsection other than `### 📅 Agenda`, ex: `### 💼 Work`) → use the implicit focus of the existing plan, jump directly to Step 6 tracking.

Otherwise (section absent or containing only the agenda), ask {USER_NAME}: *"Anything specific you want to work on today?"* — wait for their response with short timeout.
- If response received → use as constraint, integrate it as priority 1 of suggestions (Step 4)
- If silence (timeout ~5s) → continue without explicit focus (fallback: propose the WIP and let {USER_NAME} validate in Step 5)

---

## Step 2 — Read context

Steps 2.0 to 2.12 are executed **in parallel** (no inter-step dependencies). Launch 2.0 (Calendar) and 2.12 (Mails) in the background if their sources are remote/slow. Steps 2.1–2.11 (local vault read) don't wait for anything — launch immediately. Complete all reads before Step 2.13.

**2.0 — Calendar** — Verify that `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/config/calendar-url.md` exists. If yes, fetch the ICS URL via WebFetch, otherwise note "Calendar not configured" and continue without blocking. **⚠️ Linux case-sensitive**: if the file seems absent, verify that `CLAUDE_CODE_FOLDER` resolves correctly to `99 - Claude code` (lowercase c) — the variable read from vault-settings.md may have Windows casing (`99 - Claude Code`) which won't match on Linux.
   
   **If fetch succeeds**:
   - Parse the ICS content. Each event starts with `BEGIN:VEVENT` and ends with `END:VEVENT`
   - Extract `SUMMARY` (title), `DTSTART`, `DTEND`, `DESCRIPTION` (optional)
   - DTSTART format (3 cases): 
     * `DTSTART;TZID=Europe/Prague:20260321T140000` → local time Prague, extract timestamp `20260321T140000` → convert to `21/03 14h00` (timezone already local, don't transform)
     * `DTSTART;VALUE=DATE:20260321` → all day (no time) → convert to `21/03 (all day)`
     * `DTSTART:20260321T140000Z` → UTC with `Z`, transform to {USER_NAME}'s local timezone (Brno = UTC+1 winter, UTC+2 summer) → convert to `21/03 15h00 (or 16h00)` depending on season
   - Extract events for **current day** and **next 7 days** (use YYYY-MM-DD date format to filter)
   - Store events in two lists: `EVENTS_TODAY` (for day), `EVENTS_FUTURE` (for 7 days)
   - If `EVENTS_TODAY` is empty → don't flag "empty agenda", continue normally (full day possible)
   - **Calculate `FENETRE_MIN`**: for each fixed-time event today not yet passed (event time > HEURE_LANCEMENT), calculate available time before: `window_minutes = (event_time - HEURE_LANCEMENT) in minutes`. Store the minimum in `FENETRE_MIN` (remains `Infinity` if no future event).
   - **Decode imminent messages**: 
     * If event in next 3 days contains `deadline|remise|delivery|filing|exam|defense` → store as `DEADLINE_SIGNALED = true`
     * If event today or tomorrow contains `meeting|presentation|interview|defense|meeting` → plan context task "Prepare summary"
   
   **If fetch fails or ICS invalid** → mark `CALENDAR_FAILED = true`, leave `EVENTS_TODAY` and `EVENTS_FUTURE` empty, `FENETRE_MIN` at `Infinity`. Signal to {USER_NAME} in Step 5 template.

**2.1 — Today's daily note**

Read `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\YYYY-MM-DD.md` (today's date). If it doesn't exist → create with this minimal template (don't write beyond frontmatter):
```yaml
---
date: YYYY-MM-DD
energy: 
work_hours: 
personal_hours: 
hobby_hours: 
---
```
Memorize the frontmatter content for Step 3 (extract energy, hours).

**2.2 — Yesterday's daily note**

Look for the `## 🌙 Day summary` section in yesterday's note. If absent → flag at top of plan: `⚠️ Yesterday not closed — launch \`/closeyesterday\` before starting`

Also look for the `## 📅 Daily plan` section in yesterday's note. Extract all `- [ ]` lines present in plan subsections (Personal, Work, Hobby — not Agenda or Refinement). Store as `TACHES_NON_COCHEES_J1`. If section absent or empty → `TACHES_NON_COCHEES_J1 = []`.

**2.3 — Commitment scan**

Search patterns in daily notes (today, yesterday, day before if available) indicating untracked commitment:
- Patterns: lines containing `(i will|i said|to do|i must|promised)` in lowercase, NOT preceded by `[x]` (checked) and NOT mentioned in a kanban as WIP/Done
- For each match → extract full text (the line until `\n`) 
- Classify as Personal (mentions personal/hobby/dev) or Work (mentions professional/work projects)
- Surface as task in Step 4 with source = original note

**2.4 — Last session**

List all files in `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` and sort by descending date.
- If most recent file has date < today → mark `FIRST_SESSION_TODAY = true`
- If most recent file is dated today → read to know next step and session-end state

**2.5 — Inbox**

Read `{VAULT_PATH}\{INBOX_FOLDER}\` — list notes present

**2.6 — Active projects**

Read `{VAULT_PATH}\{PROJECTS_FOLDER}\INDEX.md` for active projects

**2.7 — Project kanbans**

For each active project, read its Kanban. Note **WIP**, **Ready**, **Blocked** and **Idea** tickets.
- For each **Ready** or **Idea** ticket with associated note (`[[TicketName]]`) → read the note
- **Dependencies rule**: before suggesting a ticket, check its `### Dependencies` section — if "Blocked by: [[X]]" and X is not Done → suggest X instead

**2.8 — Hobby Kanban**

Read `{VAULT_PATH}\{HOBBIES_FOLDER}\Hobby Kanban.md` — note **WIP** and **Ready** tickets. Categories ignored (#warhammer, #guitar, #3d, #jdr) since they reside in ticket notes, not in the kanban.

**2.9 — Special kanbans**

Read and note **WIP**, **Ready**, **Blocked** and **Idea** in:
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Claude Code Kanban.md`

For each **Idea** ticket with note → read the note.

**2.10 — ADHD profile**

Read `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` — markdown section "Work mode and energy" to extract suggested adaptations (ex: "one task at a time", "no context switch"). Use these preferences to adapt pool composition in Step 4.

**2.11 — Vault maintenance**

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md` if exists. For each command, compare `last_run + frequency` vs today's date:
- If overdue → note for Step 4 (section 🔄 Vault maintenance)
- Automatically exclude: `/essay-check` (post-session hook, managed by `/closeday`), `/my-world` (management already integrated in Step 4.0)
- Special context: propose `/closeweek` if day = Sunday or Monday, `/closemonth` if day = 1st of month
- Missing file → continue without signal (new vault)
- **Non-droppable guard**: if at least one command is overdue → `MAINTENANCE_OVERDUE = true`. The `🔄 Vault maintenance` section is mandatory in the final plan if `MAINTENANCE_OVERDUE = true`, regardless of budget or plan load. Never drop it silently — it's the only safeguard against the clustering effect (everything overdue at the same time a week later).

**2.12 — Mails (n8n)**

Check n8n and mail-analysis webhook (bash/WSL2) — initialize `MAIL_SECTION = ""` before starting:
- Verify that N100 is reachable: execute `curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://100.75.159.73:5678/`
- If not 200 → `MAIL_FAILED = true` + flag `⚠️ N100 down` to {USER_NAME} in Step 5, continue without mails
- Call webhook with timeout (30s for fetch + render): execute `curl -s -m 30 "http://100.75.159.73:5678/webhook/mail-analysis"`
- Parse response:
  * If response is JSON with non-empty `.markdown` key → store text content in `MAIL_SECTION`
  * If response JSON but `.markdown` absent or empty → `MAIL_SECTION = ""` (no mails to display, no error)
  * **If curl succeeds (exit code 0) but returns empty response (empty string)** → `MAIL_SECTION = ""` (empty inbox or webhook with no mails — not an error, don't set `MAIL_FAILED = true`)
  * If invalid response (malformed JSON or curl fails with non-zero code) → mark `MAIL_FAILED = true`, `MAIL_SECTION = ""`. Signal to {USER_NAME} in Step 5 template.
  * If curl timeout (> 10s) → `MAIL_FAILED = true`, continue without mails

---

## Step 2.13 — Check available window

After reading all context (Steps 2.0–2.12):

Use `FENETRE_MIN` calculated in Step 2.0:
- If `FENETRE_MIN` < 90 minutes (1.5h) AND `CALENDAR_FAILED` = false (ie, calendar operational AND event found) → store `FENETRE_COURTE = true` for Step 4 (surface quick tickets before event)
- Otherwise → `FENETRE_COURTE = false`

Reminder: `CALENDAR_FAILED` and `MAIL_FAILED` initialized in Preamble, updated in Step 2.0/2.12.

## Step 2.14 — Sports session (day + rotation)

Determine if today is a session day and which session in the rotation to display.

1. Initialize `SPORT_SECTION = ""`.
2. Get day of week: `date +%u` (1 = Monday … 7 = Sunday).
3. **Quota gate**: if `personal_hours` from frontmatter (memorized in 2.1) is `0`, empty or not set → `SPORT_SECTION` stays empty, move to Step 3. {USER_NAME}'s decision: no session displayed on days without personal time — avoid guilt-tripping when the day simply has no room.
4. Session days:
   - **{USER_NAME}**: Tuesday (2), Thursday (4), Saturday (6)
   - **Jay**: Thursday (4), Saturday (6) — never Tuesday (physio)
   - If current day is not in {2, 4, 6} → `SPORT_SECTION` stays empty, move to Step 3.
5. **Rotation A/B/C**: read `{VAULT_PATH}/{HOBBIES_FOLDER}/Sport/Tracking sessions.md`. Count checked lines `- [x]` under `## Sessions`. `index = (nb_sessions_done) mod 3` → 0 = Session A, 1 = Session B, 2 = Session C.
   - File absent or no sessions checked → index 0 (Session A).
   - **Phase 0**: B and C not yet designed — display the label of the calculated session, but the wikilink target is always `[[02 - Hobbies/Sport/Programme]]` (the note explains that B/C point to A for now).
6. Build `SPORT_SECTION` depending on day:
   - Tuesday: `- [ ] Sports session ([calculated session]) — {USER_NAME} — [[02 - Hobbies/Sport/Programme]]`
   - Thursday / Saturday: `- [ ] Sports session ([calculated session]) — {USER_NAME} + Jay — [[02 - Hobbies/Sport/Programme]]`
7. **Quota**: the sports session consumes **~30min of `budget_perso`** (Step 3). It stays in dedicated `### 🏋️ Sport` section (not mixed with productive personal tasks) but its cost is deducted as a 30min personal task in the Step 4 dry-run. If the gate in step 3 above emptied `SPORT_SECTION`, nothing is deducted.

## Step 3 — Calibrate pool + budgets

**Extract frontmatter** (already memorized in 2.1):
- `energy:` — energy level (1-5, default 3)
- `work_hours:`, `personal_hours:`, `hobby_hours:` — hours (default 0 each)

**Load reference durations**: read `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ticket-durations.md` if present.
- Parse main table: for each type (CC maintenance, CC skill, FSTG, HUSKER, GYLT, Personal practical, Hobby, Vault maintenance, Other) → store `{nb_tickets, median_min}` in `DURATIONS_REF`
- If file absent → `DURATIONS_REF = {}` (the `/closeweek` skill creates it at next weekly close). Don't flag to {USER_NAME} — it's expected with < 1 week of data.
- If file corrupted (parsing fail) → `DURATIONS_REF = {}` + signal at top of plan: `⚠️ ticket-durations.md unreadable — estimates on 45min fallback.`

**If energy ≤ 2** — before generating the pool, ask:
> Low energy detected — going with:
> A) Mechanical tasks (refinement, maintenance, quick tickets)
> B) Normal light plan (usual mix, reduced pool due to energy)

Wait for response to orient selection in Step 4. If silence → continue in mode B.

**Calculate budgets by context**:

```
budget_perso  = personal_hours  ← time for projects/vault/productive tasks ONLY
budget_hobby  = hobby_hours
budget_work   = work_hours
```

**Calculate `CAP_TOTAL`** (guard against long days):
Read last 2 daily notes (D-1 and D-2). For each, sum `work_hours + personal_hours + hobby_hours` from frontmatter.
- If **both of 2 consecutive days** have sum > 10h → `CAP_TOTAL = 10h` (forced recovery)
- Otherwise → `CAP_TOTAL = min(work_hours + personal_hours + hobby_hours declared today, 16h)`

Never exceed `CAP_TOTAL` in task selection (replaces old fixed 10h cap).

> **Strict definition of `personal_hours`**: time allocated to projects, vault and productive tasks. External activities (outings, tourism, social activities with Jay) are **out of quota** — mention if deadline near but never deduct from budget.
>
> **Sports exception**: the sports session (Step 2.14) **counts in quota** — it consumes ~30min of `budget_perso` and doesn't appear if `personal_hours = 0`. {USER_NAME}'s decision: no session displayed on days without personal time, to avoid guilt when the day simply has no room.

> **`/my-world` is out of quota**: never deduct from `personal_hours`. It displays in `💡 Start of day` section only, not in the personal tasks table.

For each selected task, **infer estimated duration in minutes** in this order:

1. **Explicit estimate in ticket** (ex: ticket says "(~45min)" or contains "30min") → use directly
2. **Classify task type** (same categories as `/closeweek` Step 3.2: CC maintenance, CC skill, FSTG, HUSKER, GYLT, Personal practical, Hobby, Vault maintenance) → search in `DURATIONS_REF`
   - If type found AND `nb_tickets ≥ 3` → use observed **median**
   - If type found BUT `nb_tickets < 3` → fallback 45min + flag once at bottom of plan: `ℹ️ Insufficient data for [type] (< 3 tickets) — estimates on 45min fallback`
3. **If no classification possible** (raw inbox task, ad-hoc) → fallback 45min

Why this order: ticket estimate reflects scope ({USER_NAME} evaluated at refine); historical median recalibrates by type when estimate missing. Median beats average — robust to outliers (ex: one CC maintenance ticket that overran 3h doesn't bias baseline).

**Patch Claude Code tickets**: lessons.md already internalized — for patch config/skills/lessons tasks, divide estimate by 4 (already applied via "CC maintenance" type if historical median reflects adjustment, but remains a signal if no data yet).

**Duration filter by task (based on energy)**:

- Energy ≤ 2: keep only tasks estimated ≤ 1h
- Energy > 2 and ≤ 3.5: keep only tasks estimated ≤ 2h
- Energy > 3.5: no duration limit per task

If energy not set or non-numeric → use `energy = 3` (filter ≤ 2h).

**Selection stop rule**: stop at first ceiling reached:
1. Context budget exhausted (work/personal/hobby > declared hours), OR
2. If energy < 2.5: 5 tasks reached (all sections combined, excl. Refinement), OR
3. No more available candidates (after duration filter applied)

Refinement section is out of quota and always added.

**Work/personal/hobby split**:

- Include block only if > 0h
- If all = 0 → flag in Step 5: `⚠️ No hours set — prioritize WIP`
- Never mix 3 blocks in a suggestion
- Movement noted in frontmatter → exclude PC-bound, adapt mobile

**Detects overload** (read last 2-3 daily notes):
- If patterns "too much", "exhausted" → ask in Step 5: *"I detect overload. Want to reduce plan by 20-30%?"*
- Otherwise continue normally

**Social battery rule — PC = recharge, not discharge**:
- If today's agenda contains an outing / social activity in afternoon (routine non-physical course, social outings, friend lunch, doctor appointment…) → **don't auto-reduce** `personal_hours` from evening budget on this basis
- Pattern *PC = recharge* holds for {USER_NAME} — see [[01 - Me/hypothesis-batterie-sociale]] and `{USER_NAME}.md`
- Continue respecting frontmatter ({USER_NAME} declares actual load), but never auto-cut evening under pretext of social charge
- Exception: if {USER_NAME} **explicitly** flagged lasting social fatigue in recent daily note (ex: dump "can't see people anymore") → treat as overload and apply rule above

  

## Step 4 — Generate suggestions

  

Pick from these sources by priority order:

0. **First session of day** (if `FIRST_SESSION_TODAY = true`) → include in separate `### 💡 Start of day` section, before all other suggestions: `launch \`/my-world\` to load your context before starting`. **Out of quota** — never count in `personal_hours` budget or in personal tasks table. This section disappears from plan once 2nd non-/my-world action is launched or checked.

0.5. **Session continuation** (if `FIRST_SESSION_TODAY = false`) → a session already exists for today (read in Step 2.4). Mention at top of plan: `⚠️ Session continuation — if returning after compaction, verify important decisions still in context.` Non-blocking signal, one line, then continue.

0.6. **Big Thing — neglected annual objective of the week** → generate `### 🎯 Big Thing` section, displayed right after `### 💡 Start of day` (or at top if Start of day absent). Goal: top-down layer (vision → annual objectives) slips into day without {USER_NAME} having to consult it. Section is **always present** — one objective is surely least worked, precisely that one should surface.

  **a. Read objectives.** Read `{VAULT_PATH}/{PERSONAL_FOLDER}/Goals/objectifs-2026.md`. If absent → omit section without blocking (no top-down layer yet). Each objective numbered there (`## 1.`, `## 2.`, …).

  **b. Objective → signal mapping.** Each objective recognized in daily note by its slugs/project name (case-insensitive):

  | Obj | Matching signals |
  |-----|---------------------|
  | 1 — Theodo pro posture | `theodo`, `bpifrance`, `signaux-anti-kshuttle`, `kshuttle` |
  | 2 — ISEP degree | `isep`, `defense`, `makeup`, `architecture-et-programmation` |
  | 3 — Husker Phase 4 | `Husker` project (slug or name in `[[…]]` link) |
  | 4 — Exist publicly | `FSTG` / `from-sprue-to-glory`, `wpf`, `repo-github-public` |

  If `objectifs-2026.md` changed (objectives added/renamed) and mapping no longer covers all → flag one line `⚠️ Big Thing: objective↔slug mapping needs update in /today` and continue with known mapping.

  **c. Counting window frozen on week.** Calculate **Monday of current ISO week** (`LUNDI_ISO`). Analysis window is `[LUNDI_ISO − 14 days ; LUNDI_ISO]`. Window anchored to Monday, not sliding: recalculated at each `/today` gives **same result Monday to Sunday** → week objective stable, no cache file to maintain.

  **d. Anti-dormancy selection.** For each objective, count daily notes (`{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md`) in window containing at least one signal (count by note, not occurrence — one note = one point, avoid over-weighting chatty day). **Counting on daily notes only** — don't include sessions. **Big Thing = objective with smallest count** (most neglected over 14 days). On tie → **smallest objective number** wins (deterministic tie-break, never on perceived relevance).

  **e. Today's contributor ticket.** Once daily suggestion pool built (points 1→5 below), search retained tasks for one whose source note matches Big Thing objective signal. Multiple matches → take ticket highest in Work > Personal > Hobby order. **Zero match** → display objective alone with nudge `⚠️ No plan ticket contributes to this today — it's the blind spot of the week.` Never invent ticket to fill: absent ticket IS the useful signal.

1. **WIP tickets** — finish what's in progress before starting anything else. If WIP empty but {USER_NAME} expressed focus (Step 1) → focus becomes 1st suggestion (replaces WIP as starting point)

1.5. **Unchecked tasks from D-1** (`TACHES_NON_COCHEES_J1`) — if list non-empty, inject each task in matching section (Personal, Work or Hobby per context), labeled *"→ D-1 carried forward"*. Apply duration filter (energy): ignore tasks estimated too long. Don't surface Agenda or Refinement tasks.

2. **Overdue vault commands** — flag in `🔄 Vault maintenance` section (separate from plan) commands overdue from Step 2.11

3. **Ready features** — ready to dev, not yet started

4. **Inbox** — notes to organize, develop or archive

5. **Recurring ideas** — topics returning in recent daily notes without being capitalized

**Pool composition rules (normal mode only)**:

- **Identify priority project**: apply in order — (1) count project name mentions (slug or exact name) in last 3 daily notes — most mentioned wins; (2) tie = project with most WIP tickets; (3) final tie = first in `04 - Projects/INDEX.md` order → allocate 2-3 suggestions in priority. Deterministic rule: never on "felt activity".
- **Selection order in kanban**: WIP before Ready, Ready before Idea. Within Ready column, **don't assume top = priority** — kanban is unordered list. Use already-defined priority signals (priority project, dormancy, existing WIP) to select in Ready, not file position.
- **Mandatory coverage of all kanbans**: each active kanban (active projects + Claude Code Kanban + Hobby Kanban) must contribute ≥ 1 suggestion if WIP or Ready tickets available and not blocked (except if budget exhausted or low energy ceiling reached)
- **Short window**: if `FENETRE_COURTE = true`, identify in pool tickets estimated < 30min and reserve for `⚡ Before [event]` section in Step 5 — part of pool but presented separately
- **Work / Personal / Hobby balance**: respect frontmatter hours split. If budget = 0 for section → omit from pool.
- **Geographic filtering**: if {USER_NAME} traveling (check `project_victor_location.md` in memory), exclude tasks needing Issy apartment, equipment stored there, or local physical presence. Apply to all sources (inbox, kanbans, D-1 balance).
- **Empty pool**: if no candidates (all WIP/Ready empty, inbox empty) → don't generate empty section, simply flag "No tasks in stock, good day for refinement!" and show Refinement only if Idea tickets exist.
- **Present pool as choice list**: display all suggestions, then ask {USER_NAME} to select retained ones for their plan. Don't pre-select.
- **Daily note written only after validation**: write only tasks {USER_NAME} retained (hourly budget per context = main constraint). Refinement section out of quota.
- **Low energy (< 2.5)**: after presenting 5 tasks, add at bottom: *"Low energy — 5 tasks proposed. Ask me for more tasks if you want to do more today."*

**`🗂️ Refinement` section — generation logic:**

Section is **independent** of main plan — always generated when Idea tickets exist in any kanban, regardless of plan load.

Count total Idea tickets in all kanbans (active projects + Claude Code Kanban + Hobby Kanban):
- If total = 0 → omit Refinement section
- If total ∈ [1, 9] → propose 2-3 tickets
- If total ≥ 10 → propose up to 5 tickets

Selection order (apply in this order):
- **Priority 1**: tickets proposed in yesterday's `🗂️ Refinement` section but unchecked → resume at top ({USER_NAME} has fresh context)
- **Priority 2**: tickets whose source note appears in last 3 days' daily notes or sessions (context resonance)
- **Priority 3**: tickets without note or detached note — taken in kanban order (top = priority). No judgment on thematic relevance.

For each ticket: `[[TicketName]]` (or plain text if no note) + context in 1 sentence + action: **→ spec** or **→ trash**

**After plan validation (Step 5)**: for each ticket {USER_NAME} marks **spec** → invoke immediately `/refine [[TicketName]]`. Don't write daily note before each `/refine` ends. If {USER_NAME} marks multiple tickets spec, process sequentially (one `/refine` at a time).

The `🗂️ Refinement` section **doesn't count** in context budgets or low energy ceiling (5 tasks). Always shown if ≥ 1 ticket.

  

**Dormancy safeguard (mandatory before dry-run)**:

For each active project in `04 - Projects/INDEX.md`:
1. Scan **last 7 days** of daily notes — search for project slug or exact name
2. If **0 mentions** in 7 days AND project has ≥ 1 Ready ticket → project **dormant**
3. For each dormant project (INDEX.md order): take its **1st Ready ticket** (kanban order) and insert at **position 3 of Personal section** — after WIP and 1st suggestion of priority project, before normal suggestions
4. If multiple dormant projects → insert in sequence (positions 3, 4, …)
5. Project already in pool (via mandatory coverage or priority project) isn't considered dormant even if not mentioned

**Rationale**: 7 days no mention = real drift risk. 1 ticket forced in visible position = progress slows but project stays alive.

---

**Verification dry-run (mandatory before Step 5)**:

Before presenting anything, verify mechanically:
1. Check duration filter: each task respects limit per energy (≤ 2 → 1h max, ≤ 3.5 → 2h max, > 3.5 → free) → delete non-compliant tasks.
2. If energy < 2.5 and > 5 tasks (excl. Refinement) → delete last ones down to 5.
3. For each context (Work / Personal / Hobby): sum estimated durations → if **strictly greater** than context budget (residual budget < 0): delete last added task and retry next. Budget = 0 after addition = exact fit, keep. **If `SPORT_SECTION` non-empty → add 30min to Personal sum** (sports session reserved first in `budget_perso`, before productive tasks); if addition makes Personal negative, truncate personal task, never sports session.
4. If task has no estimate → assign 45min before summing
5. **Never present non-compliant plan** — truncate first, present after

This dry-run is silent (not shown to {USER_NAME}). Its result is the definitive list sent to Step 5.

---

Each suggestion must be:

- **Concrete** — precise action, not "work on a project"

- **Realistic** — doable in one session or less (one task = one session)

- **Useful** — tangible outcome

- **One at a time** — no context-switching tasks

- **Linked to source** — always include Obsidian `[[]]` link to source note or ticket so {USER_NAME} finds context without searching

  

## Step 5 — Present plan to {USER_NAME} and write in daily note

  

Present plan to {USER_NAME}:

**Template and display order**:

Display in this order. Omit sections with indication in parentheses.

```
## 📅 Plan for [date]

> ⚠️ Yesterday not closed — launch `/closeyesterday` before starting
(Omit if closed)

> 🔴 Calendar unavailable — no events retrieved
(Omit if CALENDAR_FAILED = false)

> 🔴 Mail webhook down — check n8n
(Omit if MAIL_FAILED = false)

*Plan generated at [HEURE_LANCEMENT]*

> OPTIONAL: If overload detected in Step 3, add
> I detect overload these last 2-3 days. Want to reduce plan by 20-30%?

**Today: [daily intention in one sentence]**

Energy: [X/5] | Work: [X]h | Personal: [X]h | Hobby: [X]h | Total: [X]h/[CAP_TOTAL]h max

### 💡 Start of day
launch `/my-world` to load your context before starting
(Omit if FIRST_SESSION_TODAY = false — out of quota)

### 🎯 Big Thing
**Objective [N] — [objective title]**
↳ [[plan ticket that contributes]]
(If zero aligned ticket, replace ↳ line with: ⚠️ No plan ticket contributes to this today — it's the blind spot of the week.)
(Omit only if objectifs-2026.md absent — otherwise always present)

### 📅 Agenda
- [time] — [event title]
- [short date] [time] — [event title]
(Omit if no events found)

### ⚡ Before [event] at [time]
- [ ] [quick ticket estimated <30min] — (~Xmin)
(Omit if FENETRE_COURTE = false)

### 💼 Work
- [ ] [Concrete work action] — [short reason] — (~Xh / ~Xmin)
(Omit if work_hours = 0)

### 🎯 Personal
- [ ] [Concrete personal action] — [short reason] — (~Xh / ~Xmin)
(Omit if personal_hours = 0)

### 🎨 Hobby
- [ ] [Concrete hobby suggestion] — (~Xh / ~Xmin)
(Omit if hobby_hours = 0)

### 🏋️ Sport
[SPORT_SECTION]
(Omit if SPORT_SECTION empty — out of quota, never deducted from budget)

### 🔄 Vault maintenance
- [ ] /harvest — last: [date] (+[X]d)
- [ ] /link — last: [date] (+[X]d)
(Omit if MAINTENANCE_OVERDUE = false — **mandatory if MAINTENANCE_OVERDUE = true**)

### 📬 Mails
[MAIL_SECTION]
(Omit if MAIL_SECTION empty)

### 🗂️ Refinement — [X] Ideas total
- [ ] [[TicketName]] — [context 1 sentence] — **spec** / **trash**

---

**You can validate, ignore, or ask me to review priorities.**
```

  

- Omit section if hours are 0 or empty

- **Dynamic cap** — never exceed `CAP_TOTAL` (calculated in Step 3). Day > 10h ok, not 2 consecutive days — third capped to 10h.

- For hobby suggestions: base on mentions in recent daily notes (hobby activities mentioned: painting, guitar, 3D, JDR, etc.)

Once validated by {USER_NAME}, write plan in `## 📅 Daily plan` section of today's daily note as checkboxes with Obsidian links to source note.

**⚠️ Critical rule: write ALL non-empty sections** — Big Thing, Agenda, Mails, Personal, Hobby, Sport, Work, Vault maintenance, Refinement. Never write only a "main" subset. If section empty (ex: no mails, no agenda) → omit; if has content → always write, even if {USER_NAME} didn't mention during validation.

  

```markdown

## 📅 Daily plan

### 🎯 Big Thing
**Objective [N] — [objective title]**
↳ [[plan ticket that contributes]]
(If zero aligned ticket: ⚠️ No plan ticket contributes to this today — it's the blind spot of the week.)
(Omit only if objectifs-2026.md absent)

### 📅 Agenda
- [time] — [event title]
- [date] [time] — [event title]

### ⚡ Before [event] at [time]
- [ ] [quick ticket estimated <30min]
(Omit if FENETRE_COURTE = false)

### 💼 Work

- [ ] [Work action] — [[path/to/note-or-ticket]]
  

### 🎯 Personal
- [ ] [Concrete personal action] — [[04 - Projects/[Project]/Kanban]]
- [ ] Organize note on claude-mem — [[09 - Inbox/claude-mem]]


### 🎨 Hobby
- [ ] [Concrete hobby action] — [[02 - Hobbies/[Relevant Kanban]]]

### 🏋️ Sport
[SPORT_SECTION]
(Omit if SPORT_SECTION empty)

### 🔄 Vault maintenance
- [ ] /[command] — last: [date] (+[X]d)
(Omit if no overdue commands)

### 📬 Mails
- **[Sender]** — [short summary]
(Omit if MAIL_SECTION empty)

### 🗂️ Refinement — [X] Ideas total
- [ ] [[TicketName]] — [context 1 sentence] — **spec** / **trash**
(Omit if no Idea ticket)

```

  

Link rules:

- Kanban ticket with its own note `[[TicketName]]` → direct link to ticket note

- Kanban ticket without dedicated note (text only in kanban) → link to project kanban

- Inbox note → direct link to inbox note

- Knowledge/Hobbies note → direct link to note

- Task without associated note → no link, just text

- Omit sections with 0 hours

  

If section doesn't exist in daily note → create it. If exists → don't overwrite, add new actions after.

  

## Step 6 — Tracking during day

  

When user says "done", "it's done", "next", "what do I do":

1. Read `## 📅 Daily plan` section from today's daily note

2. Check completed task: `- [x] [Action] ✅ HH:mm` (example: `- [x] Finish task X ✅ HH:mm`)

3. If task matches kanban ticket → **ask {USER_NAME}**: "Can I move this ticket to Done on kanban?" — wait for confirmation before moving

4. **If unchecked tasks exist** → propose next without waiting for request

5. **If all plan tasks checked** → re-read kanbans and inbox, propose new action or declare day done

  

## Absolute rules

- **Write in daily note only** — never elsewhere
- **Don't overwrite existing content** — add after if section exists
- **Hourly budget = main constraint** — fill available hours per context (frontmatter). Duration filter per energy: ≤ 2 → 1h max/task, ≤ 3.5 → 2h max/task, > 3.5 → free. If energy < 2.5 → cap 5 tasks + note "on request". Refinement section out of quota.
- **Always prioritize WIP** over everything else
- **One task at a time** — no overload (ADHD profile)
- **Pair-programming validation** — Step 6: ask permission before moving ticket to Done (never autonomous)
