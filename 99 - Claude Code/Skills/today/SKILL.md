---
name: today
description: Generate or update the day plan — schedule adapted to energy, calendar constraints, work/personal/hobby hours and recent feedback. Reads daily notes, sessions, project kanbans, mood tracker, ICS calendar and mail webhook. Trigger when the user says "today", "/today", "plan du jour", "qu'est-ce que je fais aujourd'hui", "generate my plan", "what do I start with", or at the beginning of the day. Automatically adapts based on time (morning = full plan, afternoon = refocused, evening = lightweight).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **narrative qualitative** output. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narrative). Preservation of qualitative content takes priority over line reduction.

**Triggers the day plan** — Generates a schedule adapted to energy, constraints and priorities.

**Invocation**: `/today` at any time of day (before 12pm = full plan, 12pm-5pm = refocused plan, after 5pm = lightweight plan).

**Example scenario**: {USER_NAME} calls `/today` at 2:45pm, has a meeting at 3:30pm (45 min before). The skill detects the short window, displays "⚡ Micro-session (< 0.5h)", proposes 1 light task + the current WIP, then asks for the next action after the meeting.

  

## Preamble — Initialize control variables

Before any step, initialize these control variables to avoid undefined on read:

```
LAUNCH_TIME = null
MIN_WINDOW = Infinity  
SHORT_WINDOW = false
CALENDAR_FAILED = false
MAIL_FAILED = false
FIRST_SESSION_TODAY = false
MAINTENANCE_OVERDUE = false
DURATIONS_REF = {}
```

---

## Step 0 — Tech digest (conditional, non-blocking)

Check if today's daily note already contains a `## 📰 Digest` section:
- If **yes** → skip (digest already collected)
- If **no** → display in the plan: `⚠️ No digest — launch /digest in a dedicated session if you want a digest today` and continue without blocking

> **Why a dedicated session**: `/digest` + `/research-scout` spawns 9 parallel agents (~30-45 API calls). Launched in the same session as `/today`, it consumes ~70% of the 5h quota. Recommended workflow: launch `/digest` in the evening with `/closeday` → the digest is ready the next morning.

---

## Step 1 — Launch time + Day focus

**Get current time**: execute `date +"%H:%M"` (bash). Store as `LAUNCH_TIME` (ex: "09:15").

Use `LAUNCH_TIME` to adapt the plan:
- **Morning (before 12pm)** → full plan, normal time windows
- **Afternoon (12pm–5pm)** → flag morning tasks as missed if they don't make sense later, refocus on what's still doable today
- **Evening (after 5pm)** → light plan, prioritize short tasks or hobbies, no deep work — signal *"Evening — lightweight plan"*

Display `LAUNCH_TIME` in the header of the final plan (Step 5 template).

---

**Day focus**

If today's daily note already exists with a `## 📅 Plan du jour` section **and that section contains checkable tasks** (at least one checkbox `- [ ]` in a subsection other than `### 📅 Agenda`, ex: `### 💼 Travail`) → use the implicit focus of the existing plan, go directly to Step 6 followup.

Otherwise (section missing or containing only the agenda), ask {USER_NAME}: *"Is there something particular you want to work on today?"* — wait for his response with short timeout.
- If response received → use as constraint, integrate it as priority 1 in suggestions (Step 4)
- If silence (timeout ~5s) → continue without explicit focus (fallback: suggest the WIPs and let {USER_NAME} validate in Step 5)

---

## Step 2 — Read the context

Steps 2.0 to 2.12 are executed **in parallel** (no inter-step dependencies). Launch 2.0 (Calendar) and 2.12 (Mails) in background if their sources are remote/slow. Steps 2.1–2.11 (local vault reads) require nothing — launch immediately. Complete all reads before Step 2.13.

**2.0 — Calendar** — Verify that `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/config/calendar-url.md` exists. If yes, **fetch each ICS URL** listed in the main sections of the file (Personal Outlook, ISEP Outlook, Theodo pro — all sections at level `## …` containing a URL in a code block) **in parallel via WebFetch**, then **merge events from all sources** into final lists `EVENTS_TODAY` / `EVENTS_FUTURE`. Otherwise note "Calendar not configured" and continue without blocking. **⚠️ Case sensitivity**: the actual folder is `99 - Claude Code` (capital C) — it's the value in `vault-settings.md`. macOS tolerates case, **Linux is case-sensitive** → always use `99 - Claude Code` exactly.
   
   **If fetch succeeds** (for each source):
   - Parse ICS content. Each event starts with `BEGIN:VEVENT` and ends with `END:VEVENT`
   - Extract `SUMMARY` (title), `DTSTART`, `DTEND`, `DESCRIPTION` (optional)
   - **Theodo confidentiality**: for events from the Theodo pro URL, **never** store `DESCRIPTION` (may contain client names / sensitive subjects). Title only authorized in `EVENTS_TODAY` / `EVENTS_FUTURE`.
   - DTSTART format (3 cases): 
     * `DTSTART;TZID=Europe/Prague:20260321T140000` → local time Prague, extract timestamp `20260321T140000` → convert to `21/03 2:00pm` (timezone already local, don't transform)
     * `DTSTART;VALUE=DATE:20260321` → all-day event (no time) → convert to `21/03 (all-day)`
     * `DTSTART:20260321T140000Z` → UTC with `Z`, transform to {USER_NAME}'s local timezone (Brno = UTC+1 winter, UTC+2 summer) → convert to `21/03 3:00pm (or 4:00pm)` depending on season
   - Extract events from **current day** and **next 7 days** (use YYYY-MM-DD date to filter)
   - Store events in two lists: `EVENTS_TODAY` (for day), `EVENTS_FUTURE` (for 7 days)
   - If `EVENTS_TODAY` is empty → don't signal "empty agenda", continue normally (full day possible)
   - **Calculate `MIN_WINDOW`**: for each fixed-time event today not yet passed (event time > LAUNCH_TIME), calculate available time before: `window_minutes = (event_time - LAUNCH_TIME) in minutes`. Store the minimum in `MIN_WINDOW` (remains `Infinity` if no future event).
   - **Decode imminent messages**: 
     * If event in next 3 days contains `rendu|deadline|remise|livraison|dossier|exam|soutenance` → store as `DEADLINE_SIGNALED = true`
     * If event today or tomorrow contains `réunion|présentation|entretien|soutenance|meeting` → plan context task "Prepare summary"
   
   **If fetch fails or ICS invalid** → mark `CALENDAR_FAILED = true`, leave `EVENTS_TODAY` and `EVENTS_FUTURE` empty, `MIN_WINDOW` at `Infinity`. Signal to {USER_NAME} in Step 5 template.

**2.1 — Today's daily note**

Read `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\YYYY-MM-DD.md` (today's date). If it doesn't exist → create it with this minimal template (don't write beyond the frontmatter):
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

Search for the `## 🌙 Day summary` section in yesterday's note. If absent → signal at top of plan: `⚠️ Yesterday not closed — launch \`/closeyesterday\` before starting`

Also search for the `## 📅 Plan du jour` section in yesterday's note. Extract all `- [ ]` lines present in plan subsections (Personal, Work, Hobby — not Agenda or Refinement). Store as `UNCHECKED_TASKS_J1`. If section absent or empty → `UNCHECKED_TASKS_J1 = []`.

**2.3 — Commitment scan**

Search for patterns in daily notes (today, yesterday, day-before-yesterday if available) indicating unfollowed commitment:
- Patterns: lines containing `(je vais|j'ai dit|à faire|je dois|promis)` in lowercase, NOT preceded by `[x]` (checked) and NOT mentioned in a kanban as WIP/Done
- For each match → extract full line text (the line until `\n`) 
- Classify as Personal (personal/hobby/dev mentions) or Work (pro/work projects mentions)
- Surface as task in Step 4 with source = original note

**2.4 — Last session**

List all files in `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` and sort by descending date.
- If the most recent file has a date < today → mark `FIRST_SESSION_TODAY = true`
- If the most recent file is dated today → read it to know next step and end-of-session state

**2.5 — Inbox**

Read `{VAULT_PATH}\{INBOX_FOLDER}\` — list notes present

**2.6 — Active projects**

Read `{VAULT_PATH}\{PROJECTS_FOLDER}\INDEX.md` for active projects

**2.7 — Project kanbans**

For each active project, read its Kanban. Note **WIP**, **Ready**, **Blocked** and **Idea** tickets.
- For each **Ready** or **Idea** ticket with associated note (`[[TicketName]]`) → read the note
- **Dependencies rule**: before suggesting a ticket, check its `### Dependencies` section — if "Blocked by: [[X]]" and X is not Done → propose X instead

**2.8 — Hobby Kanban**

Read `{VAULT_PATH}\{HOBBIES_FOLDER}\Hobby Kanban.md` — note **WIP** and **Ready** tickets. Categories ignored (#warhammer, #guitar, #3d, #dnd) since they reside in ticket notes, not in the kanban.

> **Checked box = WIP, not finished rule**: a `[x]` checkbox in the hobby kanban signals **partial progress** (painting in progress, step completed), **never** a finished task/figurine. Never deduce that a hobby item is done from a checked checkbox — it remains WIP until {USER_NAME} confirms it explicitly.

**2.9 — Special kanbans**

Read and note **WIP**, **Ready**, **Blocked** and **Idea** in:
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Claude Code Kanban.md`

For each **Idea** ticket with note → read the note.

**2.10 — ADHD profile**

Read `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` — "Work mode and energy" markdown section to extract suggested adaptations (ex: "one task at a time", "no context switch"). Use these preferences to adapt the pool composition in Step 4.

**2.11 — Vault maintenance**

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md` if exists. For each command, compare `last_run + frequency` vs today's date:
- If overdue → note for Step 4 (🔄 Vault maintenance section)
- Auto-exclude: `/essay-check` (post-session hook, managed via `/closeday`), `/my-world` (already integrated Step 4.0)
- Special context: suggest `/closeweek` if day = Sunday or Monday, `/closemonth` if day = 1st of month
- Missing file → continue without signal (new vault)
- **Non-droppable guard**: if at least one command is overdue → `MAINTENANCE_OVERDUE = true`. The `🔄 Vault maintenance` section is mandatory in the final plan if `MAINTENANCE_OVERDUE = true`, regardless of budget or plan load. Never drop it silently — it's the only safeguard against the cluster effect (everything overdue at once a week later).

**2.12 — Mails (n8n)**

Check n8n and mail-analysis webhook (bash/WSL2) — initialize `MAIL_SECTION = ""` before starting:
- Verify the N100 is reachable: execute `curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://100.75.159.73:5678/`
- If non-200 → `MAIL_FAILED = true` + signal `⚠️ N100 down` to {USER_NAME} in Step 5, continue without mails
- Call webhook with timeout (30s for fetch + render): execute `curl -s -m 30 "http://100.75.159.73:5678/webhook/mail-analysis"`
- Parse response:
  * If response is JSON with `.markdown` key non-empty → store text content in `MAIL_SECTION`
  * If response JSON but `.markdown` absent or empty → `MAIL_SECTION = ""` (no mails to display, no error)
  * **If curl succeeds (exit code 0) but returns empty response (empty string)** → `MAIL_SECTION = ""` (empty inbox or webhook with no mails to surface — not an error, don't set `MAIL_FAILED = true`)
  * If response invalid (malformed JSON or curl fails with non-zero code) → mark `MAIL_FAILED = true`, `MAIL_SECTION = ""`. Signal to {USER_NAME} in Step 5 template.
  * If curl timeout (> 10s) → `MAIL_FAILED = true`, continue without mails

---

## Step 2.13 — Verify available window

After reading all context (Steps 2.0–2.12):

Use `MIN_WINDOW` calculated in Step 2.0:
- If `MIN_WINDOW` < 90 minutes (1.5h) AND `CALENDAR_FAILED` = false (ie, calendar operational AND event found) → store `SHORT_WINDOW = true` for Step 4 (surfacing quick tickets before event)
- Otherwise → `SHORT_WINDOW = false`

Reminder: `CALENDAR_FAILED` and `MAIL_FAILED` initialized in Preamble, updated in Step 2.0/2.12.

## Step 2.14 — Sport session (day + rotation)

Determine if today is a session day and which rotation session to display.

1. Initialize `SPORT_SECTION = ""`.
2. Get day of week: `date +%u` (1 = Monday … 7 = Sunday).
3. **Quota gate**: if `personal_hours` from frontmatter (memorized in 2.1) is `0`, empty or unset → `SPORT_SECTION` stays empty, go to Step 3. {USER_NAME}'s decision: no session displayed on days with zero personal time — avoid guilt-tripping when the day simply has no room.
4. Session days:
   - **{USER_NAME}**: Tuesday (2), Thursday (4), Saturday (6)
   - **Jay**: Thursday (4), Saturday (6) — never Tuesday (PT)
   - If current day is not in {2, 4, 6} → `SPORT_SECTION` stays empty, go to Step 3.
5. **A/B/C rotation**: read `{VAULT_PATH}/{HOBBIES_FOLDER}/Sport/Tracking séances.md`. Count checked lines `- [x]` under `## Séances`. `index = (sessions_done) mod 3` → 0 = Session A, 1 = Session B, 2 = Session C.
   - File absent or no sessions checked → index 0 (Session A).
   - **Phase 0**: B and C not yet designed — display the calculated session label, but the wikilink always targets `[[02 - Hobbies/Sport/Programme]]` (the note explains that B/C point to A pending design).
6. Build `SPORT_SECTION` based on day:
   - Tuesday: `- [ ] Sport session ([calculated session]) — {USER_NAME} — [[02 - Hobbies/Sport/Programme]]`
   - Thursday / Saturday: `- [ ] Sport session ([calculated session]) — {USER_NAME} + Jay — [[02 - Hobbies/Sport/Programme]]`
7. **Quota**: the sport session consumes **~30min of `budget_perso`** (Step 3). It stays in the dedicated section `### 🏋️ Sport` (not mixed with productive personal tasks) but its cost is deducted as a 30min personal task in the dry-run of Step 4. If the gate from step 3 above emptied `SPORT_SECTION`, nothing is deducted.

## Step 3 — Calibrate pool + budgets

**Extract frontmatter** (already memorized in 2.1):
- `energy:` — energy level (1-5, default 3)
- `work_hours:`, `personal_hours:`, `hobby_hours:` — hours (default 0 each)

**Load reference durations**: read `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ticket-durations.md` if present.
- Parse main table: for each type (CC maintenance, CC skill, FSTG, HUSKER, GYLT, Practical Personal, Hobby, Vault maintenance, Other) → store `{nb_tickets, median_min}` in `DURATIONS_REF`
- If file absent → `DURATIONS_REF = {}` (the `/closeweek` skill creates it at next weekly close). Don't signal to {USER_NAME} — it's expected while < 1 week of data.
- If file corrupted (parsing fail) → `DURATIONS_REF = {}` + signal at plan top: `⚠️ ticket-durations.md unreadable — estimates on fallback 45min.`

**If energy ≤ 2** — before generating the pool, ask:
> Low energy detected — you want to go with:
> A) Mechanical tasks (refinement, maintenance, quick tickets)
> B) Normal plan but reduced (usual mix, pool cut due to energy)

Wait for response to guide selection in Step 4. If silence → continue in mode B.

**Calculate context budgets**:

```
budget_perso  = personal_hours  ← time for projects/vault/productive tasks ONLY
budget_hobby  = hobby_hours
budget_work   = work_hours
```

**Calculate `CAP_TOTAL`** (long day safeguard):
Read last 2 daily notes (J-1 and J-2). For each, sum `work_hours + personal_hours + hobby_hours` from frontmatter.
- If **both consecutive days** have sum > 10h each → `CAP_TOTAL = 10h` (forced recovery)
- Otherwise → `CAP_TOTAL = min(work_hours + personal_hours + hobby_hours declared today, 16h)`

Never exceed `CAP_TOTAL` in task selection (replaces old fixed 10h cap).

> **Strict definition of `personal_hours`**: time allocated to projects, vault and productive tasks. External activities (outings, tourism, social activities with Jay) are **outside quota** — mention if deadline near but never deduct from personal budget.
>
> **Sport exception**: the sport session (Step 2.14) **counts in quota** — it consumes ~30min of `budget_perso` and doesn't appear if `personal_hours = 0`. {USER_NAME}'s decision: no session on days with zero personal time, to avoid guilt when the day simply has no room.

> **`/my-world` is outside quota**: never deduct it from `personal_hours`. It displays only in the `💡 Day start` section, not in the personal tasks table.

For each selected task, **infer estimated duration in minutes** in this order:

1. **Explicit estimate in ticket** (ex: ticket says "(~45min)" or contains "30min") → use directly
2. **Classify task type** (same categories as `/closeweek` Step 3.2: CC maintenance, CC skill, FSTG, HUSKER, GYLT, Practical Personal, Hobby, Vault maintenance) → search in `DURATIONS_REF`
   - If type found AND `nb_tickets ≥ 3` → use observed **median**
   - If type found BUT `nb_tickets < 3` → fallback 45min + signal once at plan bottom: `ℹ️ Insufficient data for [type] (< 3 tickets) — estimates on fallback 45min`
3. **If no classification possible** (raw inbox task, ad-hoc) → fallback 45min

Why this order: ticket estimate reflects scope ({USER_NAME} evaluated at refine); historical median recalibrates by type when estimate missing. Median beats average — robust to outliers (ex: one CC maintenance ticket that ballooned to 3h won't skew baseline).

**Patch Claude Code tickets**: lessons.md already internalized — for tickets fixing config/skills/lessons, divide estimate by 4 (already applied via type "CC maintenance" if historical median reflects this adjustment, but remains a signal if no data yet).

**Duration filter by task (per energy)**:

- Energy ≤ 2: keep only tasks estimated ≤ 1h
- Energy > 2 and ≤ 3.5: keep only tasks estimated ≤ 2h
- Energy > 3.5: no per-task duration limit

If energy unset or non-numeric → use `energy = 3` (filter ≤ 2h).

**Selection stop rule**: stop at first ceiling reached:
1. Context budget exhausted (work/personal/hobby > declared hours), OR
2. If energy < 2.5: 5 tasks reached (all sections combined, excl. Refinement), OR
3. No more candidates available (after duration filter applied)

Refinement section is outside quota and always added.

**Work/personal/hobby split**:

- Include a block only if > 0h
- If all = 0 → signal in Step 5: `⚠️ No hours set — prioritize WIPs`
- Never mix the 3 blocks in a suggestion
- Location noted in frontmatter → exclude PC-bound, adapt mobile

**Detect overload** (read last 2-3 daily notes):
- If patterns "too much", "exhausted" → ask in Step 5: *"I detect overload. Want to cut the plan by 20-30%?"*
- Otherwise continue normally

**Social battery rule — PC = recharge, not drain**:
- If today's agenda contains an outing / social activity in afternoon (non-routine in-person class, social outings, lunch with friends, medical appointment…) → **don't auto-reduce** `personal_hours` budget for evening on this basis
- The pattern *PC = recharge* holds for {USER_NAME} — see [[01 - Me/hypothese-batterie-sociale]] and `{USER_NAME}.md`
- Continue respecting frontmatter ({USER_NAME} declares real load), but never self-cut evening under pretense that day was socially busy
- Exception: if {USER_NAME} **explicitly** flagged lasting social fatigue in recent daily note (ex: dump "can't see anyone anymore") → treat as overload and apply rule above

  

## Step 4 — Generate suggestions

  

Prioritize from these sources in order:

0. **First session of day** (if `FIRST_SESSION_TODAY = true`) → include in separate `### 💡 Day start` section, before any other suggestion: `launch \`/my-world\` to load your context before starting`. **Outside quota** — never count in `personal_hours` budget or in personal tasks table. This section vanishes once 2nd non-/my-world action is launched or checked.

0.5. **Session resumption** (if `FIRST_SESSION_TODAY = false`) → a session already exists for today (read in Step 2.4). Mention at plan top: `⚠️ Resuming session — if you return after compaction, verify key decisions are still in context.` Non-blocking signal, one line, then continue.

0.6. **Big Thing — neglected annual goal for the week** → generate `### 🎯 Big Thing` section, displayed right after `### 💡 Day start` (or at plan top if Day start absent). Purpose: the top-down layer (vision → annual goals) slides into the day without {USER_NAME} having to consult it. Section is **always present** — one goal is inevitably least worked, and that's precisely the one to surface.

  **a. Read goals.** Read `{VAULT_PATH}/{PERSONAL_FOLDER}/Goals/objectifs-2026.md`. If absent → omit section without blocking (no top-down layer yet). Each goal is numbered there (`## 1.`, `## 2.`, …).

  **b. Map goal → signals.** Each goal is recognized in a daily note by its slugs/project name (case-insensitive):

  | Goal | Matching signals |
  |------|------------------|
  | 1 — Theodo pro posture | `theodo`, `bpifrance`, `signaux-anti-kshuttle`, `kshuttle` |
  | 2 — ISEP Diploma | `isep`, `soutenance`, `rattrapage`, `architecture-et-programmation` |
  | 3 — Husker Phase 4 | `Husker` project (slug or name in `[[…]]` link) |
  | 4 — Exist publicly | `FSTG` / `from-sprue-to-glory`, `wpf`, `repo-github-public` projects |

  If `objectifs-2026.md` changed (goals added/renamed) and mapping no longer covers all → signal one line `⚠️ Big Thing: goal↔slug mapping needs update in /today` and continue with known mapping.

  **c. Counting window frozen on week.** Calculate **Monday of current ISO week** (`MONDAY_ISO`). Analysis window is `[MONDAY_ISO − 14 days; MONDAY_ISO]`. Window is anchored to Monday, not sliding: recalculated each `/today` gives **same result Monday through Sunday** → week's goal is stable, no cache file to maintain.

  **d. Anti-dormancy pick.** For each goal, count daily notes (`{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md`) in window containing at least one of its signals (count by note, not occurrence — one note = one point, to avoid over-weighting a chatty day). **Count daily notes only** — don't include sessions. **Big Thing = goal with smallest count** (most neglected over 14 days). Tie → **lowest goal number** wins (deterministic tie-break, never subjective relevance judgment).

  **e. Contributing ticket of day.** Once today's suggestion pool is built (points 1→5 below), search among retained tasks for one whose source note matches Big Thing goal signal. Multiple matches → take topmost ticket in Work > Personal > Hobby order. **Zero match** → display goal alone with nudge `⚠️ No plan ticket contributes to it today — it's this week's blind spot.` Never invent ticket to fill: absence of aligned ticket IS the useful signal.

1. **WIP tickets** — finish what's in progress before starting else. If WIP empty but {USER_NAME} expressed focus (Step 1) → focus becomes 1st suggestion (replaces WIP as starting point)

1.5. **Unchecked tasks J-1** (`UNCHECKED_TASKS_J1`) — if list non-empty, inject each task in matching section (Personal, Work or Hobby per context), labeled *"→ carry-over J-1"*. Apply duration filter (energy): ignore tasks estimated too long. Don't surface Agenda or Refinement tasks.

2. **Vault overdue commands** — signal in `🔄 Vault maintenance` section (separate from plan) overdue commands identified in Step 2.11

3. **Ready features** — ready to dev, not yet started

4. **Inbox** — notes to organize, develop or archive

5. **Recurring ideas** — topics surfacing in recent daily notes without being capitalized

**Pool composition rules (normal mode only)**:

- **Identify priority project**: apply in order — (1) count project name mentions (slug or exact name) in last 3 daily notes — most mentioned wins; (2) tied, project with most WIP tickets; (3) final tie, take first in `04 - Projects/INDEX.md` order → allocate it 2-3 suggestions in priority. Rule is deterministic: never subjective judgment on "felt activity".
- **Selection order in kanban**: WIP before Ready, Ready before Idea. Within Ready column, **don't assume top = priority** — kanban is unordered list. Use already-defined priority signals (priority project, dormancy, existing WIP) to select from Ready, not file position.
- **Mandatory kanban coverage**: each active kanban (active projects + Claude Code Kanban + Hobby Kanban) must contribute ≥ 1 suggestion if WIP or Ready tickets available and not blocked (unless budget exhausted or low-energy cap reached)
- **Short window**: if `SHORT_WINDOW = true`, identify in pool tickets estimated < 30min and reserve for `⚡ Before [event]` section in Step 5 — they're part of pool but presented separately
- **Work / Personal / Hobby balance**: respect frontmatter hour split. If budget = 0 for a section → omit from pool.
- **Geographical filtering**: if {USER_NAME} traveling (check `project_victor_location.md` in memory), exclude tasks needing Issy apartment, equipment stored there, or local physical presence. Apply to all sources (inbox, kanbans, J-1 summary).
- **Empty pool**: if no candidates (all WIP/Ready empty, inbox empty) → don't generate empty section, simply signal "No tasks in stock, good day for refinement!" and display only Refinement if Idea tickets exist.
- **Present pool as choice list**: display all suggestions, then ask {USER_NAME} which ones to keep for his plan. Don't pre-select for him.
- **Daily note written only after validation**: write only tasks {USER_NAME} retained (hourly budget per context = main constraint). Refinement section outside quota.
- **Low energy (< 2.5)**: after presenting 5 tasks, add at plan bottom: *"Low energy — 5 tasks proposed. Ask me for more if you want to do more today."*

**`🗂️ Refinement` section — generation logic:**

Section is **independent** of main plan — always generated when ≥ 1 Idea ticket in any kanban, regardless of plan load.

Count total Idea tickets in all kanbans (active projects + Claude Code Kanban + Hobby Kanban):
- If total = 0 → omit Refinement section
- If total ∈ [1, 9] → propose 2-3 tickets
- If total ≥ 10 → propose up to 5 tickets

Selection order (apply in this order):
- **Priority 1**: tickets proposed in `🗂️ Refinement` section of yesterday's daily note but unchecked → bring back at top ({USER_NAME} has fresh context)
- **Priority 2**: tickets whose associated note appears in last 3 days daily notes or sessions (context resonance)
- **Priority 3**: tickets without note or detached note — taken in kanban order (top = priority). No judgment on thematic relevance.

For each ticket: `[[TicketName]]` (or plain text if no note) + context in 1 sentence + action: **→ spec** or **→ trash**

**After plan validation (Step 5)**: for each ticket {USER_NAME} marks **spec** → immediately invoke `/refine [[TicketName]]`. Don't write daily note before each `/refine` ends. If {USER_NAME} marks multiple spec tickets, process sequentially (one `/refine` at a time).

`🗂️ Refinement` section **doesn't count** in context budgets or low-energy cap (5 tasks). Always shown if ≥ 1 ticket.

  

**Mandatory dormancy safeguard (before dry-run)**:

For each active project in `04 - Projects/INDEX.md`:
1. Scan **last 7 days** daily notes — search for project slug or exact name
2. If **0 mention** in these 7 days AND project has ≥ 1 Ready ticket → project **dormant**
3. For each dormant project (INDEX.md order): take its **1st Ready ticket** (kanban order) and insert at **position 3 in Personal section** — after WIP and 1st suggestion from priority project, before normal suggestions
4. If multiple dormant projects → insert at successive positions (3, 4, …)
5. Project already in pool (via mandatory coverage or priority project) isn't considered dormant even if unmentioned

**Rationale**: 7 days unmentioned = real drift risk. 1 forced visible ticket = progress slows but project stays alive.

---

**Mandatory verification dry-run (before Step 5)**:

Before presenting anything, mechanically verify:
1. Verify duration filter: each task respects per-energy limit (≤ 2 → 1h max, ≤ 3.5 → 2h max, > 3.5 → free) → remove non-conformant tasks.
2. If energy < 2.5 and > 5 tasks (excl. Refinement) → remove last ones down to 5.
3. For each context (Work / Personal / Hobby): sum estimated durations → if **strictly exceeds** context budget (residual budget < 0): remove last added task and retry next. Budget = 0 after adding = exact fit, keep. **If `SPORT_SECTION` non-empty → add 30min to Personal sum** (sport session reserved first in `budget_perso`, before productive personal tasks); if adding causes Personal to go negative, truncate a productive personal task, never the sport session.
4. If task has no estimate → assign 45min before summing
5. **Never present non-conformant plan** — truncate first, present after

This dry-run is silent (not shown to {USER_NAME}). Its result is the definitive list sent to Step 5.

---

Each suggestion must be:

- **Concrete** — precise action, not "work on project"

- **Realistic** — doable in one session or less (one task = one session)

- **Useful** — brings something tangible

- **One at a time** — don't propose tasks needing context switch

- **Linked to source** — always include Obsidian `[[]]` link to source note or ticket so {USER_NAME} finds context without searching

  

## Step 5 — Present plan to {USER_NAME} and write in daily note

  

Present plan to {USER_NAME}:

**Template and display order**:

Display in this order. Omit sections with indication in parentheses.

```
## 📅 Plan of [date]

> ⚠️ Yesterday not closed — launch `/closeyesterday` before starting
(Omit if closed)

> 🔴 Calendar unavailable — no events surfaced
(Omit if CALENDAR_FAILED = false)

> 🔴 Mails webhook down — check n8n
(Omit if MAIL_FAILED = false)

*Plan generated at [LAUNCH_TIME]*

> OPTIONAL: If overload detected in Step 3, add
> I detect overload these past 2-3 days. Want to cut plan by 20-30%?

**Today: [day intention in one sentence]**

Energy: [X/5] | Work: [X]h | Personal: [X]h | Hobby: [X]h | Total: [X]h/[CAP_TOTAL]h max

### 💡 Day start
launch `/my-world` to load your context before starting
(Omit if FIRST_SESSION_TODAY = false — outside quota)

### 🎯 Big Thing
**Goal [N] — [goal title]**
↳ [[ticket from plan that contributes]]
(If zero aligned ticket, replace ↳ line with: ⚠️ No plan ticket contributes today — it's this week's blind spot.)
(Omit only if objectifs-2026.md absent — otherwise always present)

### 📅 Agenda
- [time] — [event title]
- [short date] [time] — [event title]
(Omit if no event found)

### ⚡ Before [event] at [time]
- [ ] [quick ticket estimated <30min] — (~Xmin)
(Omit if SHORT_WINDOW = false)

### 💼 Work
- [ ] [Concrete pro action] — [short reason] — (~Xh / ~Xmin)
(Omit if work_hours = 0)

### 🎯 Personal
- [ ] [Concrete personal action] — [short reason] — (~Xh / ~Xmin)
(Omit if personal_hours = 0)

### 🎨 Hobby
- [ ] [Concrete hobby suggestion] — (~Xh / ~Xmin)
(Omit if hobby_hours = 0)

### 🏋️ Sport
[SPORT_SECTION]
(Omit if SPORT_SECTION empty — outside quota, never deducted from budget)

### 🔄 Vault maintenance
- [ ] /harvest — last: [date] (+[X]d)
- [ ] /link — last: [date] (+[X]d)
(Omit if MAINTENANCE_OVERDUE = false — **mandatory if MAINTENANCE_OVERDUE = true**)

### 📬 Mails
[MAIL_SECTION]
(Omit if MAIL_SECTION empty)

### 🗂️ Refinement — [X] Ideas total
- [ ] [[TicketName]] — [1-sentence context] — **spec** / **trash**

---

**You can validate, skip, or ask me to review priorities.**
```

  

- Omit a section if its hours are 0 or empty

- **Dynamic cap** — never exceed `CAP_TOTAL` (calculated in Step 3). A day > 10h is ok, not 2 consecutive days — 3rd is capped at 10h.

- For hobby suggestions: rely on mentions in recent daily notes (hobby activities mentioned: painting, guitar, 3D, D&D, etc.)

Once validated by {USER_NAME}, write plan in `## 📅 Plan du jour` section of today's daily note as checkboxes with Obsidian links to source notes.

**⚠️ Critical rule: write ALL non-empty sections** — Big Thing, Agenda, Mails, Personal, Hobby, Sport, Work, Vault maintenance, Refinement. Never write only a "main" subset claiming they're principal. If section is empty (ex: no mail, no agenda) → omit; if has content → always write, even if {USER_NAME} didn't mention during validation discussion.

  

```markdown

## 📅 Plan of day

### 🎯 Big Thing
**Goal [N] — [goal title]**
↳ [[ticket from plan that contributes]]
(If zero aligned ticket: ⚠️ No plan ticket contributes today — it's this week's blind spot.)
(Omit only if objectifs-2026.md absent)

### 📅 Agenda
- [time] — [event title]
- [date] [time] — [event title]

### ⚡ Before [event] at [time]
- [ ] [quick ticket estimated <30min]
(Omit if SHORT_WINDOW = false)

### 💼 Work

- [ ] [Pro action] — [[path/to/note-or-ticket]]
  

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
(Omit if no overdue command)

### 📬 Mails
- **[Sender]** — [short summary]
(Omit if MAIL_SECTION empty)

### 🗂️ Refinement — [X] Ideas total
- [ ] [[TicketName]] — [1-sentence context] — **spec** / **trash**
(Omit if no Idea ticket)

```

  

Link rules:

- Kanban ticket with own note `[[TicketName]]` → direct link to ticket note

- Kanban ticket without dedicated note (text only in kanban) → link to project kanban

- Inbox note → direct link to inbox note

- Knowledge/Hobbies note → direct link to note

- Task without associated note → no link, just text

- Omit sections whose hours are 0

  

If section doesn't exist in daily note → create. If already exists → don't overwrite, add new actions after.

  

## Step 6 — Followup during day

  

When user says "done", "it's finished", "next", "what do I do now":

1. Read `## 📅 Plan du jour` section of today's daily note

2. Check completed task: `- [x] [Action] ✅ HH:mm` (example: `- [x] Finish task X ✅ HH:mm`)

3. If task corresponds to kanban ticket → **ask {USER_NAME}**: "Can I move this ticket to Done on kanban?" — wait confirmation before moving

4. **If unchecked tasks remain** → suggest next without waiting for more request

5. **If all plan tasks checked** → re-read kanbans and inbox, suggest new action or declare day done

  

## Absolute rules

- **Write in daily note only** — never elsewhere
- **Don't overwrite existing content** — append if section exists
- **Hourly budget = main constraint** — fill available hours per context (frontmatter). Filter by duration per energy: ≤ 2 → 1h max/task, ≤ 3.5 → 2h max/task, > 3.5 → free. If energy < 2.5 → cap 5 tasks + note "on demand". Refinement section outside quota.
- **Always prioritize WIPs** before else
- **One task at a time** — no overload (ADHD profile)
- **Pair-programming validation** — Step 6: ask permission before moving ticket to Done (never autonomous)
