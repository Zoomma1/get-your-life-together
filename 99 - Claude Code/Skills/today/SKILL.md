---
name: today
description: Generate or update the daily plan — agenda adapted to energy levels, calendar constraints, work/personal/hobby hours and recent feedback. Reads daily notes, sessions, project kanbans, ICS calendar and email webhook. Trigger when the user says "today", "/today", "daily plan", "what do I do today", "generate my plan", "what do I start with", or at the start of the day. Automatically adapts by time of day (morning = full plan, afternoon = refocused, evening = lightweight).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, highlights, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

**Triggers the day's plan** — Generates an agenda adapted to energy levels, constraints, and priorities.

**Invocation** : `/today` at any time of day (before 12pm = full plan, 12pm-5pm = refocused plan, after 5pm = lightweight plan).

**Example scenario** : {USER_NAME} calls `/today` at 2:45pm, has a meeting at 3:30pm (45 min ahead). The skill detects the short window, displays "⚡ Micro-session (< 0.5h)", proposes 1 light task + the WIP in progress, then asks for the next action after the meeting.

  

## Preamble — Initialize variables

Before any step, initialize these control variables to avoid undefined readings:

```
HEURE_LANCEMENT = null
FENETRE_MIN = Infinity  
FENETRE_COURTE = false
CALENDAR_FAILED = false
MAIL_FAILED = false
FIRST_SESSION_TODAY = false
MAINTENANCE_OVERDUE = false
NB_EXPLO_READY = 0
EXPLO_OVERFLOW = false
DURATIONS_REF = {}
```

---

## Step 0 — Tech digest (conditional, non-blocking)

Check if today's daily note already contains a `## 📰 Digest` section:
- If **yes** → skip (digest already collected)
- If **no** → display in the plan: `⚠️ No digest — launch /digest in a dedicated session if you want a digest today` and continue without blocking

> **Why a dedicated session** : `/digest` + `/research-scout` spawns 9 parallel agents (~30-45 API calls). Launched in the same session as `/today`, this consumes ~70% of the 5h quota. Recommended workflow: launch `/digest` in the evening with `/closeday` → the digest is ready tomorrow morning.

---

## Step 1 — Launch time + Day's focus

**Get current time** : execute `date +"%H:%M"` (bash). Store as `HEURE_LANCEMENT` (ex: "09:15").

Use `HEURE_LANCEMENT` to adapt the plan:
- **Morning (before 12pm)** → full plan, normal windows
- **Afternoon (12pm–5pm)** → flag morning tasks as missed if they don't make sense later, refocus on what's still doable today
- **Evening (after 5pm)** → light plan, prioritize short or hobby tasks, no deep work — flag *"Evening — lightweight plan"*

Display `HEURE_LANCEMENT` in the header of the final plan (Step 5 template).

---

**Day's focus**

If today's daily note already exists with a `## 📅 Plan du jour` section **and that section contains checkable tasks** (at least one checkbox `- [ ]` in a sub-section other than `### 📅 Agenda`, ex: `### 💼 Work`) → use the implicit focus from the existing plan, jump directly to Step 6 follow-up.

Otherwise (section missing or containing only the agenda), ask {USER_NAME}: *"Any particular focus for what you want to work on today?"* — wait for response with short timeout.
- If response received → use as constraint, integrate as priority 1 of suggestions (Step 4)
- If silence (timeout ~5s) → continue without explicit focus (fallback: propose the WIP and let {USER_NAME} validate in Step 5)

---

## Step 2 — Read context

Steps 2.0 through 2.12 are executed **in parallel** (no inter-step dependencies). Launch 2.0 (Calendar) and 2.12 (Emails) in the background if their sources are remote/slow. Steps 2.1–2.11 (local vault reading) don't wait for anything — launch immediately. Complete all reads before Step 2.13.

**2.0 — Calendar** — Verify that `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/config/calendar-url.md` exists. If not, note "Calendar not configured" and continue without blocking. **⚠️ Case-sensitivity** : the actual folder is `99 - Claude Code` (C uppercase) — this is the value in `vault-settings.md`. macOS tolerates case, **Linux is case-sensitive** → always use `99 - Claude Code` exactly.

   **Never read ICS with `WebFetch`.** Execute the skill script, which handles all the work of fetching, parsing, expanding recurrences and timezone conversion:

   ```bash
   python3 ~/.claude/skills/today/scripts/fetch-calendar.py \
     "{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/config/calendar-url.md" \
     --start YYYY-MM-DD --days 8
   ```

   > ⛔ **Why not `WebFetch`** — it converts the resource to markdown, **truncates** it, and has a small model answer the remaining fragment. The Theodo ICS is **2.28 MB / 841 VEVENT** : on 04/08/2026, `WebFetch` returned **2 events instead of 37**, both outside the requested window, with no error signal. It's not intermittent, it's deterministic and proportional to file size. Full diagnosis: [[09 - Inbox/tickets/investiguer-webfetch-calendriers-fetch-incomplet]].

   **The script guarantees** (don't redo by hand) : expansion of `RRULE`, reconciliation of `RECURRENCE-ID` (moved occurrence) and `EXDATE` (cancelled occurrence), exclusion of `STATUS:CANCELLED`, conversion of all timezones — IANA, Windows Outlook names, `Z` UTC, `VALUE=DATE` — to `Europe/Paris`, deduplication, sorting.

   **Privacy** : the script **never** emits `DESCRIPTION` or URL — URLs are tokens (ADR-004). The "title only" rule is therefore structural, there's nothing more to filter downstream.

   **Output** : a block `## <source name> — N events [N VEVENT read, N recurring series]`, then one line per event in format `DD/MM   HH:MM  Title` (or `DD/MM  (all-day)  Title`).

   **If `exit 0`** :
   - Distribute events into `EVENTS_TODAY` (current day) and `EVENTS_FUTURE` (next 7 days).
   - If `EVENTS_TODAY` is empty → don't signal "empty agenda", continue normally.
   - **Calculate `FENETRE_MIN`** : for each fixed-time event today not yet passed (event time > HEURE_LANCEMENT), `window_minutes = (event_time - HEURE_LANCEMENT)`. Keep the minimum (remains `Infinity` if no future event).
   - **Decode imminent messages** :
     * Event in next 3 days containing `rendu|deadline|remise|livraison|dossier|exam|soutenance` → `DEADLINE_SIGNALED = true`
     * Event today or tomorrow containing `réunion|présentation|entretien|soutenance|meeting` → plan "Prepare summary" context task
     * Event containing `vacances|congés|absent|PTO` → **check if named person carries a deadline in a ticket** (kanbans read in 2.7/2.9). An interlocutor on vacation during a deadline shifts the real window, not the deadline. *(Cause: 04/08/2026, `Vacations Corentin 08→10/08` invisible while THEO-43 carried « to build with Corentin ~10/08 ».)*
   - **Weekly Abbott exclusion** : the recurring event `Weekly Abbott` doesn't include {USER_NAME} — remove it from `EVENTS_TODAY` / `EVENTS_FUTURE` and never count it in Theodo plans or windows. The script filters nothing on business, that's done here.

   **If `exit ≠ 0`** → `CALENDAR_FAILED = true`, `EVENTS_TODAY`/`EVENTS_FUTURE` empty, `FENETRE_MIN` to `Infinity`. Signal to {USER_NAME} in Step 5. The script exits with error on: unreadable config, no reachable source, **0 events on all sources** (suspect, never interpreted as a free agenda), or partially failing source (`exit 2`, agenda potentially incomplete).

   **Never reuse yesterday's agenda on failure.** Display that the calendar is unavailable. An agenda carried over from yesterday reads as today's agenda and causes missed meetings — this happened on 03 and 04/08/2026.

   ⚠️ **Known limitation** : an all-day multi-day event appears only on its start date (the script reads `DTSTART`, not `DTEND`).

**2.1 — Today's daily note**

Read `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\YYYY-MM-DD.md` (today's date). If it doesn't exist → create with this minimal template (don't write beyond the frontmatter) :
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

Search for the `## 🌙 Day summary` section in yesterday's note. If absent → signal at the top of the plan: `⚠️ Yesterday not closed — run \`/closeyesterday\` before starting`

Also search for the `## 📅 Plan du jour` section in yesterday's note. Extract all `- [ ]` lines present in plan sub-sections (Personal, Work, Hobby — not Agenda or Refining). Store as `TACHES_NON_COCHEES_J1`. If section missing or empty → `TACHES_NON_COCHEES_J1 = []`.

Also scan the **Tomorrow** section of yesterday's summary: recover the WIP code/dev listed there (separate note if background/passive supervision — see Step 4.1 — active task otherwise). Don't rely solely on kanbans: a code WIP may exist only in this section.

**2.3 — Commitment scan**

Search patterns in daily notes (today, yesterday, day-before-yesterday if available) that indicate an untracked commitment:
- Patterns: lines containing `(je vais|j'ai dit|à faire|je dois|promis)` in lowercase, NOT preceded by `[x]` (checked) and NOT mentioned in a kanban as WIP/Done
- For each match → extract full text (the line up to `\n`)
- Classify as Personal (personal/hobby/dev mentions) or Work (pro/work projects mentions)
- Surface as task in Step 4 with source = original note

**2.4 — Last session**

List all files in `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` and sort by descending date.
- If the most recent file has date < today → mark `FIRST_SESSION_TODAY = true`
- If the most recent file is dated today → read to know the next step and end-of-session state

**2.5 — Inbox**

Read `{VAULT_PATH}\{INBOX_FOLDER}\` — list notes present

**2.6 — Active projects**

Read `{VAULT_PATH}\{PROJECTS_FOLDER}\INDEX.md` for active projects

**2.7 — Project kanbans**

For each active project, read its Kanban. Note tickets **WIP**, **Ready**, **Blocked** and **Idea**.
- For each **Ready** or **Idea** ticket with associated note (`[[TicketName]]`) → read the note
- **Dependency rule** : before suggesting a ticket, check its `### Dependencies` section — if "Blocked by: [[X]]" and X is not Done → suggest X instead

**2.8 — Hobby Kanban**

Read `{VAULT_PATH}\{HOBBIES_FOLDER}\Hobby Kanban.md` — note tickets **WIP** and **Ready**. Categories ignored (#warhammer, #guitar, #3d, #jdr) since they reside in ticket notes, not in the kanban.

> **Rule checkbox checked = WIP, not completed** : a checked box `[x]` in the hobby kanban signals **partial progress** (painting in progress, milestone reached), **never** a finished task/figurine. Never deduce that a hobby item is completed from a checked checkbox — it remains WIP until {USER_NAME} explicitly confirms it.

**2.9 — Special kanbans**

Read and note **WIP**, **Ready**, **Blocked** and **Idea** in:
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Claude Code Kanban.md`

For each **Idea** ticket with note → read the note.

**Count of explorations in Ready** (feeds the `/triage-explo` nudge in vault Maintenance section, Step 5) — done here because this is the only point where the CC Kanban Ready column is on hand :

- Scan the `## Ready` column of the CC Kanban (section between `## Ready` and the next title `## ` whatever it is — don't hardcode the next column, column order changes). A ticket counts as an **exploration** if one of these signals is true — **heuristic taken as-is from `~/.claude/skills/triage-explo/SKILL.md` Step 1, source of truth; don't write a second definition here** :
  * its slug starts with `explorer-` or `investiguer-` ;
  * its label/description frames a deliverable of type « read an external tool/repo/article → **Knowledge note + verdict** (adopt / inspire / skip) », even without the prefix.
- Filter noise (not explorations): essays (`📝`), bugs (`🐛`), dev features, refactors, personal tasks.
- Store total in `NB_EXPLO_READY`. If `NB_EXPLO_READY >= 12` → `EXPLO_OVERFLOW = true`.
- ⚠️ `EXPLO_OVERFLOW` is **strictly decoupled** from `MAINTENANCE_OVERDUE` : it's a soft nudge, not an overdue command. It never makes the vault Maintenance section non-droppable and never promotes the guard.

**2.10 — ADHD profile**

Read `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` — "Work mode and energy" markdown section to extract suggested adaptations (ex: "one task at a time", "no context switching"). Use these preferences to adapt pool composition in Step 4.

**2.11 — Vault maintenance**

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md` if exists. For each command, compare `last_run + frequency` vs today's date:
- If overdue → note for Step 4 (section 🔄 Vault maintenance)
- Auto-exclude: `/essay-check` (post-session hook, managed `/closeday`), `/my-world` (Step 4.0 management already integrated)
- Special context: suggest `/closeweek` if day = Sunday or Monday, `/closemonth` if day = 1st of month
- Missing file → continue without signal (new vault)
- **Non-droppable guard** : if at least one command is overdue → `MAINTENANCE_OVERDUE = true`. The `🔄 Vault maintenance` section is mandatory in the final plan if `MAINTENANCE_OVERDUE = true`, regardless of budget or plan load. Never drop it silently — it's the only safeguard against clustering effect (all overdue at once a week later).

**2.12 — Emails (n8n)**

Check n8n and email-analysis webhook (bash/WSL2) — initialize `MAIL_SECTION = ""` before starting :
> ✅ **n8n is addressed by stable MagicDNS hostname `docker-host`** (resolves across tailnet, survives node recreation — no more hardcoded Tailscale IP here). If curl fails, check `tailscale status` before concluding « machine down ».

- Verify n8n is reachable: execute `curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://docker-host:5678/`
- If not 200 → `MAIL_FAILED = true` + signal `⚠️ n8n unreachable (docker-host)` to {USER_NAME} in Step 5, continue without emails
- Call webhook with timeout (30s for retrieval + rendering): execute `curl -s -m 30 "http://docker-host:5678/webhook/mail-analysis"`
- Parse response:
  * If response is JSON with `.markdown` key non-empty → store text content in `MAIL_SECTION`
  * If response JSON but `.markdown` absent or empty → `MAIL_SECTION = ""` (no emails to display, no error)
  * **If curl succeeds (exit code 0) but returns empty response (empty string)** → `MAIL_SECTION = ""` (empty inbox or webhook with no emails to surface — not an error, don't set `MAIL_FAILED = true`)
  * If response invalid (malformed JSON or curl fails with non-zero code) → mark `MAIL_FAILED = true`, `MAIL_SECTION = ""`. Signal to {USER_NAME} in Step 5 template.
  * If curl timeout (> 10s) → `MAIL_FAILED = true`, continue without emails

---

## Step 2.13 — Check available window

After reading all context (Steps 2.0–2.12):

Use `FENETRE_MIN` calculated in Step 2.0:
- If `FENETRE_MIN` < 90 minutes (1.5h) AND `CALENDAR_FAILED` = false (i.e., calendar operational AND event found) → store `FENETRE_COURTE = true` for Step 4 (surface quick tickets before the event)
- Otherwise → `FENETRE_COURTE = false`

Reminder: `CALENDAR_FAILED` and `MAIL_FAILED` initialized in Preamble, updated in Step 2.0/2.12.

## Step 2.14 — Workout session (day + rotation)

Determine if today is a session day and which session in the rotation to display.

1. Initialize `SPORT_SECTION = ""`.
2. Get day of week: `date +%u` (1 = Monday … 7 = Sunday).
3. **Quota gate** : if `personal_hours` from frontmatter (memorized in 2.1) is `0`, empty or unset → `SPORT_SECTION` stays empty, go to Step 3. {USER_NAME} decision: no session displayed on days without personal time — avoid a session that feels guilty when the day simply has no room.
4. Session days:
   - **{USER_NAME}** : Tuesday (2), Thursday (4), Saturday (6)
   - **Jay** : Thursday (4), Saturday (6) — never Tuesday (physiotherapy)
   - If current day is not in {2, 4, 6} → `SPORT_SECTION` stays empty, go to Step 3.
5. **Rotation A/B/C** : read `{VAULT_PATH}/{HOBBIES_FOLDER}/Sport/Tracking séances.md`. Count checked lines `- [x]` under `## Séances`. `index = (nb_sessions_done) mod 3` → 0 = Session A, 1 = Session B, 2 = Session C.
   - File absent or no sessions checked → index 0 (Session A).
   - **Phase 0** : B and C not yet designed — display the label of calculated session, but wikilink target always `[[02 - Hobbies/Sport/Programme]]` (the note explains that B/C point to A for now).
6. Build `SPORT_SECTION` per day:
   - Tuesday: `- [ ] Workout session ([calculated session]) — {USER_NAME} — [[02 - Hobbies/Sport/Programme]]`
   - Thursday / Saturday: `- [ ] Workout session ([calculated session]) — {USER_NAME} + Jay — [[02 - Hobbies/Sport/Programme]]`
7. **Quota** : the workout session consumes **~30min of `budget_perso`** (Step 3). It stays in dedicated section `### 🏋️ Sport` (not mixed with productive personal tasks) but its cost is deducted as a 30min personal task in the dry-run of Step 4. If the gate in step 3 above emptied `SPORT_SECTION`, nothing is deducted.

## Step 3 — Calibrate pool + budgets

**Extract frontmatter** (already memorized in 2.1):
- `energy:` — energy level (1-5, default 3)
- `work_hours:`, `personal_hours:`, `hobby_hours:` — hours (default 0 each)

**Load reference durations** : read `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ticket-durations.md` if present.
- Parse main table: for each type (CC maintenance, CC skill, FSTG, HUSKER, GYLT, Practical personal, Hobby, Vault maintenance, Other) → store `{nb_tickets, median_min}` in `DURATIONS_REF`
- If file absent → `DURATIONS_REF = {}` (the `/closeweek` skill creates it at next weekly close). Don't signal to {USER_NAME} — this is expected within < 1 week of data.
- If file corrupted (parsing fail) → `DURATIONS_REF = {}` + signal at top of plan: `⚠️ ticket-durations.md unreadable — estimates on 45min fallback.`

**If energy ≤ 2** — before generating the pool, ask the question:
> Low energy detected — do you go for:
> A) Mechanical tasks (refining, maintenance, quick tickets)
> B) Normal plan lightened (usual mix, reduced pool given energy)

Wait for response to orient selection in Step 4. If silence → continue in mode B.

**Calculate budgets by context** :

```
budget_perso  = personal_hours  ← time for projects/vault/productive tasks ONLY
budget_hobby  = hobby_hours
budget_work   = work_hours
```

**Calculate `CAP_TOTAL`** (long-day safeguard):
Read the last 2 daily notes (J-1 and J-2). For each, sum `work_hours + personal_hours + hobby_hours` from frontmatter.
- If **both consecutive days** have a sum > 10h → `CAP_TOTAL = 10h` (forced recovery)
- Otherwise → `CAP_TOTAL = min(work_hours + personal_hours + hobby_hours declared today, 16h)`

Never exceed `CAP_TOTAL` in task selection (replaces old fixed cap at 10h).

> **Strict definition of `personal_hours`** : time allocated to projects, vault and productive tasks. External activities (outings, tourism, social activities with Jay) are **outside quota** — mention if deadline close but never deduct from personal budget.
>
> **Sport exception** : the workout session (Step 2.14) **counts in quota** — it consumes ~30min of `budget_perso` and doesn't appear if `personal_hours = 0`. {USER_NAME} decision: no session displayed on days without personal time, to avoid guilt when the day simply has no room.
>
> **Evening prep / talk / community sharing Theodo = Theodo time** : count in `budget_work`, never deducted from `personal_hours`.
>
> **Evening = personal, but a Theodo project stays in work hours** : a Theodo project (ex run-watcher) stays on `budget_work` (Improvement Friday / TT), never in personal slot evening/weekend. `/today` never places a Theodo project in a personal section of an evening or weekend slot.

> **`/my-world` is outside quota** : never deduct from `personal_hours`. It appears in the `💡 Start of day` section only, not in the personal tasks table.

For each selected task, **infer an estimated duration in minutes** following this order:

1. **Explicit estimate in ticket** (ex: ticket says "(~45min)" or contains "30min") → use directly
2. **Classify task type** (same categories as `/closeweek` Step 3.2: CC maintenance, CC skill, FSTG, HUSKER, GYLT, Practical personal, Hobby, Vault maintenance) → search `DURATIONS_REF`
   - If type found AND `nb_tickets ≥ 3` → use the **median** observed
   - If type found BUT `nb_tickets < 3` → fallback 45min + signal once at bottom of plan: `ℹ️ Insufficient data for [type] (< 3 tickets) — estimates on 45min fallback`
3. **If no classification possible** (raw inbox task, ad-hoc) → fallback 45min

Why this order: the task estimate reflects scope ({USER_NAME} evaluated at refine); historical median recalibrates per type when estimate is missing. Median beats mean — robust to outliers (ex: a CC maintenance ticket that spiraled to 3h doesn't bias the baseline).

**Patch Claude Code tickets** : lessons.md already internalized — for config/skills/lessons patch tickets, divide estimate by 4 (already applied via "CC maintenance" type if historical median reflects this adjustment, but remains a signal if no data yet).

**Duration filter by task (by energy)** :

- Energy ≤ 2 : keep only tasks estimated ≤ 1h
- Energy > 2 and ≤ 3.5 : keep only tasks estimated ≤ 2h
- Energy > 3.5 : no duration limit per task

If energy unset or non-numeric → use `energy = 3` (≤ 2h filter).

**Selection stop rule** : stop at first ceiling reached:
1. Context budget exhausted (work/personal/hobby > declared hours), OR
2. If energy < 2.5 : 5 tasks reached (all sections combined, excl. Refining), OR
3. No more candidates available (after duration filter applied)

The Refining section is outside quota and always added.

**Work/personal/hobby distribution** :

- Include a block only if it has > 0h
- If all = 0 → signal in Step 5 : `⚠️ No hours set — prioritize WIP`
- Never mix the 3 blocks in a suggestion
- Location noted in frontmatter → exclude PC-bound, adapt mobile

**Detect overload** (read 2-3 last daily notes):
- If patterns "too much", "exhausted" → ask in Step 5 : *"I detect overload. Want to cut the plan by 20-30%?"*
- Otherwise continue normally

**Social battery rule — PC = recharge, not discharge** :
- If today's agenda contains an outing / afternoon social activity (non-routine in-person course, social outings, friend lunch, medical visit…) → **don't auto-reduce** `personal_hours` budget for evening on that basis
- The pattern *PC = recharge* holds for {USER_NAME} — see [[01 - Me/hypothese-batterie-sociale]] and `{USER_NAME}.md`
- Continue respecting frontmatter ({USER_NAME} declares actual load), but never auto-cut evening under the guise of social charge
- Exception: if {USER_NAME} **explicitly** signaled lasting social fatigue in recent daily note (ex: dump "I can't see anyone") → treat as overload and apply rule above

  

## Step 4 — Generate suggestions

  

Pick from these sources in priority order:

0. **First session of the day** (if `FIRST_SESSION_TODAY = true`) → include in separate `### 💡 Start of day` section, before any other suggestion: `run \`/my-world\` to load your context before starting`. **Outside quota** — never count in `personal_hours` budget or personal tasks table. This section disappears from plan once 2nd non-/my-world action is launched or checked.

0.5. **Session resumption** (if `FIRST_SESSION_TODAY = false`) → a session already exists for today (read in Step 2.4). Mention at top of plan: `⚠️ Session resumption — if you return after compaction, verify that key decisions are still in context.` Non-blocking signal, one line, then continue.

0.6. **Big Thing — neglected annual objective of the week** → generate `### 🎯 Big Thing` section, displayed just after `### 💡 Start of day` (or at plan top if Start of day absent). Goal: the top-down layer (vision → annual goals) slides into the day without {USER_NAME} having to consult it. The section is **always present** — one objective is necessarily the least worked, and that's precisely the one to surface.

  **a. Read objectives.** Read `{VAULT_PATH}/{PERSONAL_FOLDER}/Goals/objectifs-2026.md`. If absent → omit section without blocking (no top-down layer yet). Each objective is numbered there (`## 1.`, `## 2.`, …).

  **b. Map objective → signals.** Each objective is recognized in daily notes by its slugs/project name (case-insensitive):

  | Obj | Matching signals |
  |-----|---------------------|
  | 1 — Theodo professional posture | `theodo`, `bpifrance`, `signaux-anti-kshuttle`, `kshuttle` |
  | 2 — ISEP degree | `isep`, `soutenance`, `rattrapage`, `architecture-et-programmation` |
  | 3 — Husker Phase 4 | project `Husker` (slug or name in link `[[…]]`) |
  | 4 — Exist publicly | project `FSTG` / `from-sprue-to-glory`, `wpf`, `repo-github-public` |

  If `objectifs-2026.md` changed (objectives added/renamed) and mapping no longer covers all → signal one line `⚠️ Big Thing : objective↔slug mapping to update in /today` and continue with known mapping.

  **c. Counting window frozen to week.** Calculate **Monday of current ISO week** (`LUNDI_ISO`). Analysis window is `[LUNDI_ISO − 14 days ; LUNDI_ISO]`. This window is anchored to Monday, not sliding: recalculated at each `/today` it gives the **same result Monday through Sunday** → week's objective is stable, no cache file to maintain.

  **d. Anti-dormancy selection.** For each objective, count the number of daily notes (`{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md`) in the window containing at least one of its signals (count per note, not per occurrence — one note = one point, to not over-weight a chatty day). **Counting on daily notes alone** — don't include sessions. The **Big Thing = objective with smallest count** (most neglected over 14 days). On tie → **smallest objective number wins** (deterministic tie-break, never judgment on perceived relevance).

  **e. Today's contributor ticket.** Once day's suggestion pool is built (points 1→5 below), search among retained tasks the one whose source note matches a Big Thing objective signal. Multiple matches → take highest ticket in order Work > Personal > Hobby. **Zero match** → display objective alone with nudge `⚠️ No ticket in plan aligns with it today — that's the week's blind spot.` Never invent ticket to fill: the absence of aligned ticket IS the useful signal.

1. **WIP tickets** — finish what's in progress before starting something else. If WIP empty but {USER_NAME} expressed a focus (Step 1) → focus becomes 1st suggestion (replaces WIP as starting point). **Background WIP** (vibe coding, passive supervision) ≠ active task: don't count in `budget_perso` or push as active task — mention as separate note for visibility (`ℹ️ Background WIP : [title]`).

1.5. **Unchecked tasks J-1** (`TACHES_NON_COCHEES_J1`) — if list non-empty, inject each task in corresponding section (Personal, Work or Hobby per context), labeled *"→ carry-over J-1"*. Apply duration filter (energy): ignore tasks estimated too long. Don't surface Agenda or Refining tasks.

2. **Overdue vault commands** — surface in `🔄 Vault maintenance` section (separate from plan) overdue commands identified in Step 2.11. If `EXPLO_OVERFLOW = true` (counted in Step 2.9), add to same section the `/triage-explo` nudge line — outside non-droppable guard, it doesn't count as overdue command.

3. **Ready features** — ready to dev, not yet started

4. **Inbox** — notes to organize, develop or archive

5. **Recurring ideas** — subjects returning in recent daily notes without being capitalized

**Pool composition rules (normal mode only)** :

- **Identify priority project** : apply in order — (1) count project name/slug mentions in last 3 daily notes — most mentioned wins; (2) tied, project with most WIP tickets; (3) final tie, take first in `04 - Projects/INDEX.md` order → allocate 2-3 suggestions as priority. Deterministic rule: never judgment on "felt activity".
- **Selection order within kanban** : WIP before Ready, Ready before Idea. Within Ready column, **don't assume top = priority** — kanban is unordered list. Use already-defined priority signals (priority project, dormancy, existing WIP) to select in Ready, not file position.
- **Mandatory coverage of all kanbans** : each active kanban (active projects + Claude Code Kanban + Hobby Kanban) must contribute at least 1 suggestion if WIP or Ready tickets available and not blocked (except if budget exhausted or low-energy ceiling reached)
- **Short window** : if `FENETRE_COURTE = true`, identify in pool tickets estimated < 30min and reserve for `⚡ Before [event]` section of Step 5 — they're part of pool but presented separately
- **Work / Personal / Hobby balance** : respect frontmatter hour distribution. If budget = 0 for a section → omit from pool.
- **Geographic filter** : if {USER_NAME} traveling (check `project_victor_location.md` in memory), exclude tasks requiring Issy apartment, equipment stored there, or local physical presence. Apply to all sources (inbox, kanbans, J-1 summary).
- **Empty pool** : if no candidates (all WIP/Ready empty, inbox empty) → don't generate empty section, simply signal "No tasks in stock, good day for refining!" and show Refining only if Idea tickets exist.
- **Present pool as choice list** : display all suggestions, then ask {USER_NAME} to select retained ones for plan. Don't pre-select for them.
- **Daily note written only after validation** : write only tasks {USER_NAME} retained (hourly budget per context = main constraint). Refining section is outside quota.
- **Low energy (< 2.5)** : after presenting 5 tasks, add at bottom of plan: *"Low energy — 5 tasks proposed. Ask me again if you want to do more today."*

**`🗂️ Refining` section — generation logic :**

Section is **independent** from main plan — always generated if there are Idea tickets in any kanban, regardless of plan load.

Count total Idea tickets across all kanbans (active projects + Claude Code Kanban + Hobby Kanban):
- If total = 0 → omit Refining section
- If total ∈ [1, 9] → propose 2-3 tickets
- If total ≥ 10 → propose up to 5 tickets

Selection order (apply in this order):
- **Priority 1** : tickets proposed in yesterday's daily note `🗂️ Refining` section but unchecked → take up front ({USER_NAME} has fresh context). **Refilter current column** : surface only those still in Idea column — a ticket moved to Ready/Specs since doesn't surface again.
- **Priority 2** : tickets whose associated note appears in daily notes or sessions of last 3 days (context resonance)
- **Priority 3** : tickets with no note or detached note — taken in kanban appearance order (top = priority). No judgment on thematic relevance.

For each ticket: `[[TicketName]]` (or plain text if no note) + 1-sentence context + action: **→ spec** or **→ trash**

**After plan validation (Step 5)** : for each ticket {USER_NAME} marks **spec** → immediately invoke `/refine [[TicketName]]`. Don't write daily note before each `/refine` ends. If {USER_NAME} marks multiple tickets spec, treat in sequence (one `/refine` at a time).

The `🗂️ Refining` section **doesn't count** in context budgets or low-energy ceiling (5 tasks). Always shown if ≥ 1 ticket.

  

**Dormancy safeguard (mandatory before dry-run)** :

For each active project in `04 - Projects/INDEX.md`:
1. Scan daily notes of **last 7 days** — search for project slug or exact name
2. If **0 mentions** in 7 days AND project has at least 1 Ready ticket → project **dormant**
3. For each dormant project (appearance order in INDEX.md): take its **1st Ready ticket** (kanban appearance order) and insert at **position 3 of Personal section** — after WIP and 1st suggestion of priority project, before normal suggestions
4. If multiple dormant projects → inserted in sequence (positions 3, 4, …)
5. A project already in pool (via mandatory coverage or priority project) isn't dormant even if unmentioned

**Rationale** : 7 days without mention = real drift risk. 1 forced visible ticket = progress slows but project stays alive.

---

**Verification dry-run (mandatory before Step 5)** :

Before presenting anything, mechanically verify:
1. Check duration filter: each task respects limit per energy (≤ 2 → 1h max, ≤ 3.5 → 2h max, > 3.5 → free) → remove non-conforming tasks.
2. If energy < 2.5 and > 5 tasks (excl. Refining) → remove last until 5.
3. For each context (Work / Personal / Hobby) : sum estimated durations → if **strictly greater** than context budget (residual budget < 0): remove last added task and retry next. Budget = 0 after addition = exact fit, keep. **If `SPORT_SECTION` non-empty → add 30min to Personal sum** (workout booked first in `budget_perso`, before productive personal tasks); if addition pushes Personal negative, trim a personal productive task, never the workout.
4. If a task has no estimated duration → assign 45min before summing
5. **Never present non-conforming plan** — trim first, present after

This dry-run is silent (not displayed to {USER_NAME}). Its result is the definitive list sent to Step 5.

---

Each suggestion must be:

- **Concrete** — specific action, not "work on a project"

- **Realistic** — doable in one session or less (one task = one session)

- **Useful** — brings something tangible

- **One at a time** — don't propose tasks requiring context switching

- **Linked to source** — always include Obsidian link `[[]]` to original note or ticket so {USER_NAME} finds context without searching

  

## Step 5 — Present plan to {USER_NAME} and write in daily note

  

Present plan to {USER_NAME}:

**Template and display order** :

Display in this order. Omit sections with instruction in parentheses.

```
## 📅 Plan du [date]

> ⚠️ Yesterday not closed — run `/closeyesterday` before starting
(Omit if closed)

> 🔴 Calendar unavailable — no events retrieved
(Omit if CALENDAR_FAILED = false)

> 🔴 Email webhook down — check n8n
(Omit if MAIL_FAILED = false)

*Plan generated at [HEURE_LANCEMENT]*

> OPTIONAL: If overload detected in Step 3, add
> I detect overload over last 2-3 days. Want to cut plan by 20-30%?

**Today: [day's intent in one sentence]**

Energy: [X/5] | Work: [X]h | Personal: [X]h | Hobby: [X]h | Total: [X]h/[CAP_TOTAL]h max

### 💡 Start of day
run `/my-world` to load your context before starting
(Omit if FIRST_SESSION_TODAY = false — outside quota)

### 🎯 Big Thing
**Objective [N] — [objective title]**
↳ [[ticket from plan that contributes to it]]
(If zero aligned ticket, replace ↳ line with: ⚠️ No ticket in plan aligns with it today — that's the week's blind spot.)
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
(Omit if SPORT_SECTION empty — outside quota, never deducted from budget)

### 🔄 Vault maintenance
- [ ] /harvest — last: [date] (+[X]d)
- [ ] /link — last: [date] (+[X]d)
🗂️ [NB_EXPLO_READY] explorations in Ready (threshold 12) — remember `/triage-explo`
(Omit command lines if MAINTENANCE_OVERDUE = false — **mandatory if MAINTENANCE_OVERDUE = true**)
(Omit 🗂️ line if EXPLO_OVERFLOW = false. It **doesn't enter** non-droppable guard: never forces section appearance, never sets MAINTENANCE_OVERDUE to true. If no command overdue but EXPLO_OVERFLOW = true, section shows with only 🗂️ line.)

### 📬 Emails
[MAIL_SECTION]
(Omit if MAIL_SECTION empty)

### 🗂️ Refining — [X] Ideas total
- [ ] [[TicketName]] — [1-sentence context] — **spec** / **trash**

---

**You can validate, skip, or ask me to revisit priorities.**
```

  

- Omit section if its hours are 0 or empty

- **Dynamic cap** — never exceed `CAP_TOTAL` (calculated in Step 3). A day > 10h ok, not 2 consecutive — third is capped at 10h.

- For hobby suggestions: rely on mentions in recent daily notes (hobby activities mentioned: painting, guitar, 3D, TTG, etc.)

Once validated by {USER_NAME}, write plan in `## 📅 Plan du jour` section of today's daily note as checkboxes with Obsidian links to source notes.

**⚠️ Critical rule: write ALL non-empty sections** — Big Thing, Agenda, Emails, Personal, Hobby, Sport, Work, Vault maintenance, Refining. Never write only a subset claiming they're "main". If section empty (ex: no emails, no agenda) → omit; if has content → always write, even if {USER_NAME} didn't discuss it during validation.

  

```markdown

## 📅 Plan du jour

### 🎯 Big Thing
**Objective [N] — [objective title]**
↳ [[ticket from plan that contributes to it]]
(If zero aligned ticket: ⚠️ No ticket in plan aligns with it today — that's the week's blind spot.)
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
🗂️ [NB_EXPLO_READY] explorations in Ready (threshold 12) — remember `/triage-explo`
(Omit command lines if no command overdue; omit 🗂️ line if EXPLO_OVERFLOW = false. Section written if either has content.)

### 📬 Emails
- **[Sender]** — [short summary]
(Omit if MAIL_SECTION empty)

### 🗂️ Refining — [X] Ideas total
- [ ] [[TicketName]] — [1-sentence context] — **spec** / **trash**
(Omit if no Idea ticket)

```

  

Link rules:

- Kanban ticket with own note `[[TicketName]]` → direct link to ticket note

- Kanban ticket without dedicated note (kanban text only) → link to project kanban

- Inbox note → direct link to inbox note

- Knowledge/Hobbies note → direct link to note

- Task with no note → no link, just text

- Omit sections whose hours are 0

  

If section doesn't exist in daily note → create it. If exists → don't overwrite, add new actions after.

  

## Step 6 — Follow-up during day

  

When user says "done", "it's done", "next", "what do I do":

1. Read `## 📅 Plan du jour` section of today's daily note

2. Check completed task: `- [x] [Action] ✅ HH:mm` (example: `- [x] Finish task X ✅ HH:mm`)

3. If task matches kanban ticket → **ask {USER_NAME}** : "Can I move this ticket to Done on kanban?" — wait confirmation before moving

4. **If unchecked tasks exist** → propose next without waiting for additional request

5. **If all plan tasks checked** → reread kanbans and inbox, propose new action or declare day done

  

## Absolute rules

- **Write in daily note only** — never elsewhere
- **Don't overwrite existing content** — add after if section exists
- **Hourly budget = main constraint** — fill available hours per context (frontmatter). Duration filter by energy: ≤ 2 → 1h max/task, ≤ 3.5 → 2h max/task, > 3.5 → free. If energy < 2.5 → cap 5 tasks + note "on request". Refining section outside quota.
- **Always prioritize WIP** before everything else
- **One task at a time** — don't overload (ADHD profile)
- **Pair-programming validation** — Step 6: ask permission before moving ticket to Done (never autonomous)
