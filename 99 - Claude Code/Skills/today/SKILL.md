---
name: today
description: Generate or update the daily plan — agenda adapted to energy, calendar constraints, work/personal/hobby hours and recent feedback. Reads daily notes, sessions, project kanbans, ICS calendar and mail webhook. Trigger when the user says "today", "/today", "daily plan", "what am I doing today", "generate my plan", "what do I start with", or at the beginning of the day. Adapts automatically by time (morning = full plan, afternoon = refocused, evening = light).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **narrative qualitative** output. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, strong moments, open questions, tone, narration). Preserving qualitative content takes priority over reducing lines.

**Triggers the daily plan** — Generates an agenda adapted to energy, constraints and priorities. 

**Invocation**: `/today` at any time of day (before 12pm = full plan, 12pm-5pm = refocused plan, after 5pm = light plan).

**Example scenario**: {USER_NAME} calls `/today` at 2:45pm, has a meeting at 3:30pm (45 min away). The skill detects the short window, displays "⚡ Micro-session (< 0.5h)", suggests 1 light task + current WIP, then asks for next action after the meeting.

  

## Preamble — Initialize variables

Before any step, initialize these control variables to avoid undefined reads:

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
STRANGER_VETO = false
DURATIONS_REF = {}
```

---

## Step 0 — Tech watch digest (conditional, non-blocking)

Check if today's daily note already contains a `## 📰 Digest` section:
- If **yes** → skip (digest already collected)
- If **no** → display in the plan: `⚠️ No digest — launch /digest in a dedicated session if you want a digest today` and continue without blocking

> **Why a dedicated session**: `/digest` + `/research-scout` spawns 9 parallel agents (~30-45 API calls). Launched in the same session as `/today`, this consumes ~70% of the 5h quota. Recommended workflow: launch `/digest` in the evening with `/closeday` → digest is ready the next morning.

---

## Step 1 — Launch time + Daily focus

**Get current time**: execute `date +"%H:%M"` (bash). Store as `HEURE_LANCEMENT` (ex: "09:15").

Use `HEURE_LANCEMENT` to adapt the plan:
- **Morning (before 12pm)** → full plan, normal windows
- **Afternoon (12pm–5pm)** → flag morning tasks as missed if they don't make sense later, refocus on what remains doable today
- **Evening (after 5pm)** → light plan, prioritize short tasks or hobby, no deep work — flag *"Evening — light plan"*

Display `HEURE_LANCEMENT` in the plan header (Step 5 template).

---

**Daily focus**

If today's daily note already exists with a `## 📅 Daily Plan` section **and this section contains checkable tasks** (at least one checkbox `- [ ]` in a subsection other than `### 📅 Agenda`, ex: `### 💼 Work`) → use the implicit focus from the existing plan, skip directly to Step 6 for tracking.

Otherwise (section absent or containing only agenda), ask {USER_NAME}: *"Do you have a particular desire what to work on today?"* — wait for their response with short timeout.
- If response received → use as constraint, integrate it as priority 1 of suggestions (Step 4)
- If silence (timeout ~5s) → continue without explicit focus (fallback: suggest WIPs and let {USER_NAME} validate in Step 5)

---

## Step 2 — Read context

Steps 2.0 through 2.12 are executed **in parallel** (no inter-step dependencies). Launch 2.0 (Calendar) and 2.12 (Mails) in the background if their sources are remote/slow. Steps 2.1–2.11 (local vault reads) don't wait for anything — launch immediately. Finish all reads before Step 2.13.

**2.0 — Calendar** — Verify that `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/config/calendar-url.md` exists. If not, note "Calendar not configured" and continue without blocking. **⚠️ Case sensitivity**: the actual folder is `99 - Claude Code` (capital C) — this is the value from `vault-settings.md`. macOS tolerates case, **Linux is case-sensitive** → always use `99 - Claude Code` exactly.

   **Never read ICS with `WebFetch`.** Execute the skill script, which handles all fetch, parsing, recurrence expansion and timezone conversion:

   ```bash
   python3 ~/.claude/skills/today/scripts/fetch-calendar.py \
     "{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/config/calendar-url.md" \
     --start YYYY-MM-DD --days 8
   ```

   > ⛔ **Why not `WebFetch`** — it converts the resource to markdown, **truncates** it, and makes a small model respond to the fragment. [employer]'s ICS is **2.28 MB / 841 VEVENT**: on 08/04/2026, `WebFetch` returned **2 events instead of 37**, both outside the requested window, with no error signal. This isn't intermittent, it's deterministic and proportional to file size. Full diagnosis: [[investigate-webfetch-calendars-fetch-incomplete]].

   **The script guarantees** (don't redo by hand): expansion of `RRULE`, reconciliation of `RECURRENCE-ID` (moved occurrence) and `EXDATE` (cancelled occurrence), exclusion of `STATUS:CANCELLED`, conversion of all timezones — IANA, Windows Outlook names, `Z` UTC, `VALUE=DATE` — to `Europe/Paris`, deduplication, sorting.

   **Confidentiality**: the script **never** emits `DESCRIPTION` or URL — URLs are tokens (ADR-004). So the "title only" rule is structural, there's nothing left to filter downstream.

   **Output**: a block `## <source name> — N events [N VEVENT read, N recurring series]`, then one line per event in format `DD/MM   HH:MM  Title` (or `DD/MM  (all day)  Title`).

   **If `exit 0`**:
   - Distribute events into `EVENTS_TODAY` (current day) and `EVENTS_FUTURE` (next 7 days).
   - If `EVENTS_TODAY` is empty → don't flag "empty agenda", continue normally.
   - **Calculate `FENETRE_MIN`**: for each fixed-time event today not yet passed (event time > HEURE_LANCEMENT), `window_minutes = (event_time - HEURE_LANCEMENT)`. Keep the minimum (stays `Infinity` if no future event).
   - **Decode imminent messages**:
     * Event in next 3 days containing `submission|deadline|delivery|assignment|exam|presentation` → `DEADLINE_SIGNALED = true`
     * Event today or tomorrow containing `meeting|presentation|interview|presentation|meeting` → plan context task "Prepare summary"
     * Event containing `vacation|leave|absent|PTO` → **check if the named person carries a deadline in a ticket** (kanbans read in 2.7/2.9). An interlocutor on leave for a deadline shifts the real window, not the deadline. *(Cause: 08/04/2026, `Corentin Vacation 08→10/08` invisible while THEO-43 carried "to build with Corentin ~10/08".)*
   - **[recurring-meeting] exclusion**: the recurring event `[recurring-meeting]` doesn't include {USER_NAME} — remove it from `EVENTS_TODAY` / `EVENTS_FUTURE` and never count it in [employer] plans or windows. The script filters no business logic, that's what happens here.

   **If `exit ≠ 0`** → `CALENDAR_FAILED = true`, `EVENTS_TODAY`/`EVENTS_FUTURE` empty, `FENETRE_MIN` at `Infinity`. Signal to {USER_NAME} in Step 5. The script errors on: unreadable config, no source reachable, **0 events across all sources** (suspect, never interpreted as free agenda), or partially failed source (`exit 2`, potentially incomplete agenda).

   **Never copy yesterday's agenda on failure.** Display that the calendar is unavailable. An agenda carried from yesterday reads as today's agenda and causes missed meetings — happened on 08/03 and 08/04/2026.

   ⚠️ **Known limit**: a multi-day all-day event appears only on its start date (script reads `DTSTART`, not `DTEND`).

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

Look for the `## 🌙 Daily summary` section in yesterday's note. If absent → flag at top of plan: `⚠️ Yesterday not closed — launch \`/closeyesterday\` before starting`

Also look for the `## 📅 Daily Plan` section in yesterday's note. Extract all `- [ ]` lines in plan subsections (Personal, Work, Hobby — not Agenda or Refinement). Store as `TACHES_NON_COCHEES_J1`. If section absent or empty → `TACHES_NON_COCHEES_J1 = []`.

Also scan the **Tomorrow** section of the J-1 summary: surface the WIP code/dev listed there (separate note if background/passive supervision — see Step 4.1 — active task otherwise). Don't rely only on kanbans: a code WIP may exist only in this section.

**2.3 — Commitment scan**

Look for patterns in daily notes (today, yesterday, day before if available) indicating unfollowed commitment:
- Patterns: lines containing `(going to|said|to do|must|promised)` in lowercase, NOT preceded by `[x]` (checked) and NOT mentioned in a kanban as WIP/Done
- For each match → extract complete text (line until `\n`) 
- Classify as Personal (personal/hobby/dev mentions) or Work (work/work projects mentions)
- Surface as task carried in Step 4 with source = note origin

**2.4 — Last session**

List all files in `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` and sort by descending date.
- If the most recent file has date < today → mark `FIRST_SESSION_TODAY = true`
- If the most recent file is dated today → read to know the next step and state at end of previous session

**2.5 — Inbox**

Read `{VAULT_PATH}\{INBOX_FOLDER}\` — list notes present

**2.6 — Active projects**

Read `{VAULT_PATH}\{PROJECTS_FOLDER}\INDEX.md` for active projects

**2.7 — Project kanbans**

For each active project, read its Kanban. Note **WIP**, **Ready**, **Blocked** and **Idea** tickets.
- For each **Ready** or **Idea** ticket with associated note (`[[TicketName]]`) → read the note
- **Dependencies rule**: before suggesting a ticket, check its `### Dependencies` section — if "Blocked by: [[X]]" and X is not Done → suggest X instead

**2.8 — Hobby Kanban**

Read `{VAULT_PATH}\{HOBBIES_FOLDER}\Hobby Kanban.md` — note **WIP** and **Ready** tickets. Categories ignored (#warhammer, #guitar, #3d, #dnd) since they live in ticket notes, not the kanban.

> **Rule checked box = WIP, not finished**: a checked `[x]` in the hobby kanban signals **partial progress** (painting in progress, step achieved), **never** a finished task/figurine. Never infer that a hobby item is finished from a checked checkbox — it stays WIP until {USER_NAME} explicitly confirms it.

**2.9 — Special kanbans**

Read and note **WIP**, **Ready**, **Blocked** and **Idea** in:
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Claude Code Kanban.md`

For each **Idea** ticket with note → read the note.

**Counting Ready explos** (feeds the `/triage-explo` nudge in Vault maintenance section, Step 5) — happens here because it's the only point where the Ready column of CC Kanban is at hand:

- Browse the `## Ready` column of CC Kanban (section between `## Ready` and next title `## ` whatever it is — don't hardcode the next column, column order changes). A ticket counts as **explo** if one of these signals is true — **heuristic taken as-is from `~/.claude/skills/triage-explo/SKILL.md` Step 1, source of truth; don't write a second definition here**:
  * its slug starts with `explore-` or `investigate-`;
  * its label/description frames a deliverable like "read external tool/repo/article → **Knowledge note + verdict** (adopt / inspire / skip)", even without the prefix.
- Filter out noise (not explos): essays (`📝`), bugs (`🐛`), dev features, refactors, personal tasks.
- Store total in `NB_EXPLO_READY`. If `NB_EXPLO_READY >= 12` → `EXPLO_OVERFLOW = true`.
- ⚠️ `EXPLO_OVERFLOW` is **strictly decoupled** from `MAINTENANCE_OVERDUE`: it's a soft nudge, not an overdue command. It never makes Vault maintenance section non-droppable and never promotes the guard.

**2.10 — ADHD profile**

Read `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` — "Work mode and energy" markdown section to extract suggested adaptations (ex: "one task at a time", "no context switch"). Use these preferences to adapt pool composition in Step 4.

**2.11 — Vault maintenance**

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md` if exists. For each command, compare `last_run + frequency` vs today's date:
- If overdue → note for Step 4 (section 🔄 Vault maintenance)
- Auto-exclude: `/essay-check` (post-session hook, managed by `/closeday`), `/my-world` (management in Step 4.0 already integrated)
- Special context: suggest `/closeweek` if day = Sunday or Monday, `/closemonth` if day = 1st of month
- File missing → continue without signal (new vault)
- **Non-droppable guard**: if at least one command is overdue → `MAINTENANCE_OVERDUE = true`. The `🔄 Vault maintenance` section is mandatory in the final plan if `MAINTENANCE_OVERDUE = true`, regardless of budget or plan load. Never drop it silently — it's the only safeguard against clustering (everything overdue at once a week later).
  - ⚠️ **Exception `/stranger`**: if `STRANGER_VETO = true` (calculated below), `/stranger` is **excluded from this count** — it never promotes `MAINTENANCE_OVERDUE` to `true`. If it's the only overdue command of the day, guard stays `false` and section is not made mandatory.

**Health veto — applies to `/stranger` only**

If `/stranger` is overdue, evaluate `STRANGER_VETO` **before** adding it to the section:

- Backtrack daily notes over **max 7 calendar days**, collect the **first 2 non-empty `score` values** from frontmatter
- `STRANGER_VETO = true` if (both collected values are all `≤ 3`) **OR** (J-1 daily note has `energy ≤ 2`)
- **Fail-open**: if fewer than 2 `score` values found in the window, or J-1 missing → `STRANGER_VETO = false`. Missing data **never** blocks — the veto is a safety net, not permission.
- The veto applies to **no other command** in the tracker.

**Effect on display**:

- `STRANGER_VETO = false` → the line displays **bare**: `- [ ] /stranger — last: [date] (+[X]d)`
- `STRANGER_VETO = true` → the line **is not written** (and guard ignores it, cf. exception above)

**Silent-report safeguard** — without it, veto turns a *loud* debt into *invisible* debt:

- If `/stranger` is overdue for **more than 15 days** **AND** `STRANGER_VETO = true`, write in the Vault maintenance section a **signal** line, not a task:
  `🩺 /stranger hidden by health veto for [X] days — last execution: [date]`
- This line is **outside non-droppable guard** (it never makes `MAINTENANCE_OVERDUE` true), just like the `/triage-explo` nudge.

> ⚠️ **The `/stranger` line writes bare.** Never append conditional mentions to it ("outside stress", "outside stress period", "if the day allows", "not recommended today"…), **even if the `/stranger` skill `description` states one** — this guard is already borne by `STRANGER_VETO`, recopying it in the plan makes it unmeasurable and creates phantom debt. Either the veto is false and the line displays without comment, or it's true and the line doesn't exist.
>
> *(Cause: 6 consecutive reports between 07/19 and 07/27, the mention "stress-only" recopied daily without ever being evaluated. It's stored nowhere in this file — it's **regenerated** from `/stranger` `description`, hence this explicit ban. Cf. [[09 - Inbox/tickets/resolve-gate-stranger-outside-stress]].)*

**2.12 — Mails (n8n)**

Verify n8n and mail-analysis webhook (bash/WSL2) — initialize `MAIL_SECTION = ""` before starting:
> ✅ **n8n is addressed by stable MagicDNS hostname `docker-host`** (resolves on whole tailnet, survives node recreation — never hardcode Tailscale IP here). If curl fails, check `tailscale status` before concluding "machine down".

- Verify n8n is reachable: execute `curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://docker-host:5678/`
- If non-200 → `MAIL_FAILED = true` + flag `⚠️ n8n unreachable (docker-host)` to {USER_NAME} in Step 5, continue without mails
- Call webhook with timeout (30s for fetch + render): execute `curl -s -m 30 "http://docker-host:5678/webhook/mail-analysis"`
- Parse response:
  * If response is JSON with non-empty `.markdown` key → store text content in `MAIL_SECTION`
  * If JSON but `.markdown` absent or empty → `MAIL_SECTION = ""` (no mails to display, no error)
  * **If curl succeeds (exit code 0) but returns empty response (empty string)** → `MAIL_SECTION = ""` (empty box or webhook without mails to surface — not an error, don't set `MAIL_FAILED = true`)
  * If invalid response (malformed JSON or curl fails with non-zero code) → mark `MAIL_FAILED = true`, `MAIL_SECTION = ""`. Signal to {USER_NAME} in Step 5 template.
  * If curl timeout (> 10s) → `MAIL_FAILED = true`, continue without mails

---

## Step 2.13 — Check available window

After reading all context (Steps 2.0–2.12):

Use `FENETRE_MIN` calculated in Step 2.0:
- If `FENETRE_MIN` < 90 minutes (1.5h) AND `CALENDAR_FAILED` = false (ie, operational calendar AND event found) → store `FENETRE_COURTE = true` for Step 4 (surface quick tickets before event)
- Otherwise → `FENETRE_COURTE = false`

Reminder: `CALENDAR_FAILED` and `MAIL_FAILED` initialized in Preamble, updated in Step 2.0/2.12.

## Step 2.14 — Sport session (day + rotation)

Determine if today is a session day and which rotation session to display.

1. Initialize `SPORT_SECTION = ""`.
2. Get day of week: `date +%u` (1 = Monday … 7 = Sunday).
3. **Quota gate**: if `personal_hours` from frontmatter (memorized in 2.1) is `0`, empty or unspecified → `SPORT_SECTION` stays empty, move to Step 3. {USER_NAME}'s decision: no session displayed on days without personal time — avoid a session that guilt-trips when the day simply has no room.
4. Session days:
   - **{USER_NAME}**: Tuesday (2), Thursday (4), Saturday (6)
   - **[partner]**: Thursday (4), Saturday (6) — never Tuesday (physical therapy)
   - If today isn't in {2, 4, 6} → `SPORT_SECTION` stays empty, move to Step 3.
5. **A/B/C Rotation**: read `{VAULT_PATH}/{HOBBIES_FOLDER}/Sport/Session tracking.md`. Count checked `- [x]` lines under `## Sessions`. `index = (sessions_done) mod 3` → 0 = Session A, 1 = Session B, 2 = Session C.
   - File absent or no checked sessions → index 0 (Session A).
   - **Phase 0**: B and C not yet designed — display the label of the calculated session, but the wikilink always targets `[[02 - Hobbies/Sport/Program]]` (the note explains B/C point to A for now).
6. Build `SPORT_SECTION` by day:
   - Tuesday: `- [ ] Sport session ([calculated session]) — {USER_NAME} — [[02 - Hobbies/Sport/Program]]`
   - Thursday / Saturday: `- [ ] Sport session ([calculated session]) — {USER_NAME} + [partner] — [[02 - Hobbies/Sport/Program]]`
7. **Quota**: the sport session consumes **~30min of `budget_perso`** (Step 3). It stays in the dedicated `### 🏋️ Sport` section (not mixed with productive personal tasks) but its cost is deducted like a 30min personal task in the Step 4 dry-run. If the gate in step 3 above emptied `SPORT_SECTION`, nothing is deducted.

## Step 3 — Calibrate pool + budgets

**Extract frontmatter** (already memorized in 2.1):
- `energy:` — energy level (1-5, default 3)
- `work_hours:`, `personal_hours:`, `hobby_hours:` — hours (default 0 each)

**Load reference durations**: read `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ticket-durations.md` if present.
- Parse main table: for each type (CC maintenance, CC skill, [project-A], [example-project], GYLT, Personal practical, Hobby, Vault maintenance, Other) → store `{nb_tickets, median_min}` in `DURATIONS_REF`
- If file absent → `DURATIONS_REF = {}` (the `/closeweek` skill creates it at next weekly close). Don't flag to {USER_NAME} — expected while < 1 week of data.
- If file corrupted (parsing fail) → `DURATIONS_REF = {}` + flag at top of plan: `⚠️ ticket-durations.md unreadable — estimates fall back to 45min.`

**If energy ≤ 2** — before generating pool, ask:
> Low energy detected — are you going for:
> A) Mechanical tasks (refinement, maintenance, quick tickets)
> B) Normal plan lightened (usual mix, reduced pool due to energy)

Wait for response to orient selection in Step 4. If silence → continue in mode B.

**Calculate budgets by context**:

```
budget_perso  = personal_hours  ← time for projects/vault/productive tasks ONLY
budget_hobby  = hobby_hours
budget_work   = work_hours
```

**Calculate `CAP_TOTAL`** (long day safeguard):
Read the last 2 daily notes (J-1 and J-2). For each, sum `work_hours + personal_hours + hobby_hours` from frontmatter.
- If **both consecutive days** both have a sum > 10h → `CAP_TOTAL = 10h` (forced recovery)
- Otherwise → `CAP_TOTAL = min(work_hours + personal_hours + hobby_hours declared today, 16h)`

Never exceed `CAP_TOTAL` in task selection (replaces old fixed 10h cap).

> **Strict definition of `personal_hours`**: time allocated to projects, vault and productive tasks. Outside activities (outings, tourism, social activities with [partner]) are **outside quota** — mention if deadline near but never deduct from personal budget.
>
> **Sport exception**: the sport session (Step 2.14) **counts in quota** — consumes ~30min of `budget_perso` and doesn't display if `personal_hours = 0`. {USER_NAME}'s decision: no session displayed on days without personal time, to avoid guilt-tripping when the day simply has no room.
>
> **[employer] watch prep / talk / community sharing = [employer] time**: count in `budget_work`, never deducted from `personal_hours`.
>
> **Evening = personal, but a [employer] project stays work hours**: a [employer] project (ex run-watcher) stays on `budget_work` (Improvement Friday / TT), never in personal evening/weekend slot. `/today` never puts a [employer] project in personal section of evening or weekend slot.
>
> **[employer] days — `work_hours` covers meetings + tickets**: never subtract meetings from `budget_work` to announce a "remaining available". Priority goes to the ticket on **~5h**, because that's the timesheet base; the rest (THEO tickets, watch, improvement) happens on residual availability. This is {USER_NAME}'s choice, not an arbitration to resubmit — present the plan with this hierarchy, not with free-slot arithmetic. Validated {USER_NAME} 2026-08-05 *(cause: `/today` from 08/05 announces "meetings 2h45 + tasks 2h = only 2h15 left for Run" and proposes removing a ticket, when Run **is** the priority and meetings are already in the 7h).*
> ⏳ **Scope: valid only during RUN mission (TMA FR).** The "~5h timesheeted" base is a constraint of this mission, not a permanent rule — **to re-evaluate at mission end (~Sept. 2026)**, where billing model changes.

> **`/my-world` is outside quota**: never deduct from `personal_hours`. It displays in `💡 Start of day` section only, not in personal tasks table.

For each selected task, **infer estimated duration in minutes** in this order:

1. **Explicit estimate in ticket** (ex: ticket says "(~45min)" or contains "30min") → use directly
2. **Classify task type** (same categories as `/closeweek` Step 3.2: CC maintenance, CC skill, [project-A], [example-project], GYLT, Personal practical, Hobby, Vault maintenance) → look in `DURATIONS_REF`
   - If type found AND `nb_tickets ≥ 3` → use **median** observed
   - If type found BUT `nb_tickets < 3` → fallback 45min + flag once at bottom of plan: `ℹ️ Insufficient data for [type] (< 3 tickets) — estimates fall back to 45min`
3. **If no classification possible** (raw inbox task, ad-hoc) → fallback 45min

Why this order: the ticket estimate reflects scope ({USER_NAME} evaluated at refine); historical median recalibrates by type when estimate is missing. Median beats mean — robust to outliers (ex: a CC maintenance ticket that dragged to 3h doesn't bias the baseline).

**Claude Code ticket patch**: lessons.md already internalized — for config/skills/lessons patch tickets, divide estimate by 4 (already applied via "CC maintenance" type if historical median reflects this adjustment, but remains a signal if no data yet).

**Task duration filter (by energy)**:

- Energy ≤ 2: keep only tasks estimated ≤ 1h
- Energy > 2 and ≤ 3.5: keep only tasks estimated ≤ 2h
- Energy > 3.5: no task duration limit

If energy unspecified or non-numeric → use `energy = 3` (≤ 2h filter).

**Selection stop rule**: stop at first ceiling reached:
1. Context budget exhausted (work/personal/hobby > declared hours), OR
2. If energy < 2.5: 5 tasks reached (all sections combined, excl. Refinement), OR
3. No more candidates (after duration filter applied)

The Refinement section is outside quota and always added.

**Work/Personal/Hobby split**:

- Include a block only if it has > 0h
- If all = 0 → flag in Step 5: `⚠️ No hours specified — prioritize WIPs`
- Never mix the 3 blocks in one suggestion
- Location noted in frontmatter → exclude PC-bound, adapt mobile

**Detect overload** (read last 2-3 daily notes):
- If patterns "too much", "exhausted" → ask in Step 5: *"I detect overload. Want to reduce the plan by 20-30%?"*
- Otherwise continue normally

**Social battery rule — PC = recharge, not drain**:
- If today's agenda contains an outing / social activity in the afternoon (non-routine in-person course, social outings, friend lunch, medical appointment…) → **don't automatically reduce** personal evening budget based on this
- The *PC = recharge* pattern holds for {USER_NAME} — see [[01 - Me/social-battery-hypothesis]] and `{USER_NAME}.md`
- Continue respecting frontmatter ({USER_NAME} declares actual load), but never auto-cut evening on the grounds that the day was socially loaded
- Exception: if {USER_NAME} has **explicitly** flagged lasting social fatigue in a recent daily note (ex: dump "can't see people anymore") → treat as overload and apply rule above

### 🧮 Who decides today's budget

**Common root of three rules below**: never treat a {USER_NAME} decision as **input data to re-challenge**. Frontmatter *is* the arbitration — it was already made at write time.

**1. A constraint already encoded in frontmatter doesn't get recounted a second time.**
When {USER_NAME} declares hours **knowing** a day constraint (guest, outing, meeting, travel), reproposing to cut on top means **charging the same constraint twice** and returning a decision he just made.
The constraint acts on the **order** of tasks (queue, cut from bottom) and what **gets dropped** — never on the total.
> **Recognizable signal**: I propose an option whose justification word-for-word repeats info {USER_NAME} gave me to calibrate his budget. If it's *his* data, arbitration is done.

*(Cause: 2026-08-15 — `personal_hours: 2` declared on a holiday Saturday knowing Thomas was coming afternoon. I surfaced an option "Thomas arrives → cut to photo + sport + guitar"; {USER_NAME} settles "that's where the 2h comes from". The 2h **was** the answer to the question I was re-asking.)*

**2. Light work day → write wider than personal budget, without touching frontmatter.**
When {USER_NAME} announces a light work day (*"theoretically I'm at work, nothing much really but you never know what might come up"*), the plan can carry **more personal tasks than `personal_hours`**. Frontmatter stays the honest declaration of hours; the surplus is a **depth reserve**.

Two conditions so this pollutes nothing:
- the overage is **written in the plan with its reason**, never implicit — else `/closeday` reads it as a skill calc error or missed objective;
- it's presented as an **ordered queue**, not a target — order matters more than total, the bottom half may never be reached.

The failure mode avoided is double and symmetric: **truncating** deprives {USER_NAME} of the depth he just stated having, **bumping frontmatter** fabricates false personal hours on an officially-work day.

*(Cause: 2026-08-14 — I posed the choice binary ("2h and 2 tickets, or 4h and 4 tickets"); {USER_NAME} splits the third way: "keep 2h perso but you can put 4h in it". My error: **closing the answer space to two options** when neither was right.)*

**3. Ticket reported 3× → re-split, not re-estimate.**
When a ticket returns in the daily plan for the **3rd time**, check its **estimate history** (`grep` the slug in daily notes) **before** re-entering it.

An estimate that **drops** from one report to the next signals that we're **compressing the ticket** to fit the available slot — not that we understand it better. The right move is to split on its **real technical unknown** and re-estimate **higher**.

*(Cause: 2026-08-03, WPF-07 — `~30-45min` (06/09) → `~17min` (06/10) → `~15min` (08/03) never moves, for real scope of ~2h30; blockers cleared since 06/08, so neither blocked nor avoided — just a ticket compressed until it lost any relation to its content. Split into WPF-07a (spatial segmentation, ~1h30, the only unknown) + WPF-07b (labeling + testing, ~1h, mechanical).)*
> Cross-skill: `/today` records the estimate, `/workon` consumes it.

  

## Step 4 — Generate suggestions

  

Draw from these sources by priority:

0. **First session of day** (if `FIRST_SESSION_TODAY = true`) → include in separate `### 💡 Start of day` section, before any other suggestion: `launch \`/my-world\` to load your context before starting`. **Outside quota** — never count in `personal_hours` budget or personal tasks table. This section disappears once the 2nd non-/my-world action is launched or checked.

0.5. **Session resume** (if `FIRST_SESSION_TODAY = false`) → a session already exists for today (read in Step 2.4). Mention at top of plan: `⚠️ Session resume — if you're coming back after a compaction, verify that important decisions are still in context.` Non-blocking signal, one line, then continue.

0.6. **Big Thing — neglected annual goal of the week** → generate `### 🎯 Big Thing` section, displayed right after `### 💡 Start of day` (or top of plan if Start of day absent). Purpose: the top-down layer (vision → annual goals) slides into the day without {USER_NAME} having to consult it. The section is **always present** — one goal is necessarily the least worked, and that's precisely the one to surface.

  **a. Read goals.** Read `{VAULT_PATH}/{PERSONAL_FOLDER}/Goals/goals-2026.md`. If absent → omit section without blocking (no top-down layer yet). Each goal is numbered there (`## 1.`, `## 2.`, …).

  **b. Goal → signal mapping.** Each goal is recognized in a daily note by its slugs/project name (case-insensitive):

  | Goal | Matching signals |
  |------|-------------------|
  | 1 — [employer] professional stance | `[employer]`, `[client-a]`, `anti-[client-tool]-signals`, `[client-tool]` |
  | 2 — ISEP degree | `isep`, `presentation`, `makeup`, `architecture-and-programming` |
  | 3 — Husker Phase 4 | `Husker` project (slug or name in a `[[…]]` link) |
  | 4 — Tech lead legitimacy | `tech lead`, `[employer]-goals`, `AI cohort`, `dantotsu`, `RDP`, `THEO-47`, `yokoten` |

  ⚠️ **Goal 4 signals are intentionally narrow — don't widen to `[employer]`, `tmafr` or `THEO-`.** Goal 4 shares ground with Goal 1 (both are [employer]), so only **tech lead moves** distinguish it: carry a decision, transmit, shift how the team works. A broad signal matches *working at [employer]*, which isn't the goal. **Measured 2026-08-16** on window `07/27 → 08/10`: broad mapping (`…|tmafr|THEO-`) renders **15/15**, ie **all** notes — and since the selector in step **d** takes the **minimum**, a saturated goal can **never** become Big Thing. The mapping above renders **10/15**, keeping it in the race without artificial win. `onboard` was removed for the same reason: it matches equally {USER_NAME} *who is onboarded* and {USER_NAME} *who onboards*.

  > 📌 History: this mapping coded "4 — Exist publicly" (`[project-A]`, `wpf`, `repo-github-public`) until 2026-08-16, while the goal had been **requalified 08/03**. Flagged nine times between 08/04 and 08/15 without ever being fixed in this file — the 08/12 summary claimed the fix was made, but it only applied to that day's calc. Cf. [[01 - Me/Goals/goals-2026]] for the definition that rules.

  If `goals-2026.md` changed (goals added/renamed) and the mapping no longer covers all goals → flag one line `⚠️ Big Thing: goal↔slug mapping needs update in /today` and continue with known mapping.

  **c. Frozen counting window on the week.** Calculate the **Monday of current ISO week** (`LUNDI_ISO`). Analysis window is `[LUNDI_ISO − 14 days; LUNDI_ISO]`. This window is anchored to Monday, not sliding: recalculated each `/today` it gives the **same result Mon–Sun** → the week's goal is stable, no cache file needed.

  **d. Anti-dormancy selection.** For each goal, count daily notes (`{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md`) in window containing at least one of its signals (count per note, not per occurrence — one note = one point, to not over-weight a chatty day). **Count daily notes only** — don't include sessions. **Big Thing = goal with smallest count** (most neglected over 14 days). On tie → **smallest goal number** wins (deterministic tie-break, never judgment on felt relevance).

  **e. Day's contributing ticket.** Once the day's suggestion pool is built (points 1→5 below), find among selected tasks the one whose source note matches a Big Thing goal signal. Multiple matches → take the highest in Work > Personal > Hobby order. **Zero match** → display goal alone with nudge `⚠️ No ticket in today's plan contributes — it's the week's blind spot.` Never invent a ticket to fill: the absence of aligned ticket IS the useful signal.

1. **WIP tickets** — finish what's in progress before starting other things. If WIP empty but {USER_NAME} expressed a focus (Step 1) → focus becomes the 1st suggestion (replaces WIP as starting point). **Background WIP** (vibe coding, passive supervision) ≠ active task: don't count in `budget_perso` or push as active task — mention in separate note for visibility (`ℹ️ Background WIP: [title]`).

1.5. **Unchecked tasks from J-1** (`TACHES_NON_COCHEES_J1`) — if list non-empty, inject each task in matching section (Personal, Work or Hobby per context), labeled *"→ carry from J-1"*. Apply duration filter (energy): ignore tasks estimated too long. Don't surface Agenda or Refinement tasks.

2. **Overdue vault commands** — flag in `🔄 Vault maintenance` section (separate from plan) overdue commands identified in Step 2.11. If `EXPLO_OVERFLOW = true` (counted in Step 2.9), add the `/triage-explo` nudge line in same section — outside non-droppable guard, doesn't count as overdue command. If `STRANGER_VETO = true` **and** `/stranger` overdue > 15d, add the `🩺` signal line (Step 2.11) — also outside guard. `/stranger` under veto **never** figures as overdue command, and its line carries **no conditional mention** (cf. Step 2.11 note).

3. **Ready features** — ready to dev, not yet started

4. **Inbox** — notes to organize, develop or archive

5. **Recurring ideas** — topics returning in recent daily notes without being capitalized

**Pool composition rules (normal mode only)**:

- **Identify priority project**: apply in order — (1) count project name mentions (slug or exact name) in last 3 daily notes — most mentioned wins; (2) on tie, project with most WIP tickets; (3) final tie, take first in `04 - Projects/INDEX.md` order → allocate 2-3 suggestions to it. Deterministic rule: never judgment on "felt activity".
- **Kanban selection order**: WIP before Ready, Ready before Idea. Within Ready column, **don't assume top = priority** — kanban is unordered. Use already-defined priority signals (priority project, dormancy, existing WIP) to select in Ready, not file position.
- **All-kanban coverage mandatory**: each active kanban (active projects + Claude Code Kanban + Hobby Kanban) must contribute ≥ 1 suggestion if WIP or Ready tickets exist and are unblocked (unless budget exhausted or low-energy ceiling reached)
- **Short window**: if `FENETRE_COURTE = true`, identify in pool tickets estimated < 30min and reserve for the `⚡ Before [event]` section in Step 5 — they're part of pool but presented separately
- **Work / Personal / Hobby balance**: respect frontmatter hours split. If budget = 0 for a section → omit from pool.
- **Geographic filter**: if {USER_NAME} is traveling (check `project_victor_location.md` in memory), exclude tasks needing the Issy apartment, equipment stored there, or local presence. Apply to all sources (inbox, kanbans, J-1 summary).
- **Empty pool**: if no candidates (all WIP/Ready empty, inbox empty) → don't generate empty section, simply flag "No tasks in stock, good day for refinement!" and display only Refinement if Idea tickets exist.
- **Present pool as choice list**: display all suggestions, then ask {USER_NAME} to select ones he keeps for his plan. Don't pre-select for him.
- **Daily note written only after validation**: write only tasks {USER_NAME} retained (context hourly budget = main constraint). Refinement section is outside quota.
- **Low energy (< 2.5)**: after presenting 5 tasks, add at bottom of plan: *"Low energy — 5 tasks suggested. You can ask me for more if you want to do more today."*

**`🗂️ Refinement` section — generation logic:**

The section is **independent** from main plan — always generated when there are Idea tickets in any kanban, whatever the plan load.

Count total Idea tickets in all kanbans (active projects + Claude Code Kanban + Hobby Kanban):
- If total = 0 → omit Refinement section
- If total ∈ [1, 9] → propose 2-3 tickets
- If total ≥ 10 → propose up to 5 tickets

Selection order (apply in order):
- **Priority 1**: tickets proposed in `🗂️ Refinement` section of yesterday's daily note but unchecked → pick up first ({USER_NAME} has fresh context). **Re-filter current column**: surface only those still in Idea column — a ticket moved to Ready/Specs since then doesn't surface.
- **Priority 2**: tickets whose associated note appears in daily notes or sessions from last 3 days (context resonance)
- **Priority 3**: tickets with no note or detached note — taken in kanban appearance order (top = priority). No judgment on thematic relevance.

For each ticket: `[[TicketName]]` (or plain text if no note) + 1-sentence context + action: **→ spec** or **→ trash**

**After plan validation (Step 5)**: for each ticket {USER_NAME} marks **spec** → immediately invoke `/refine [[TicketName]]`. Don't write daily note until each `/refine` ends. If {USER_NAME} marks multiple spec tickets, treat sequentially (one `/refine` at a time).

The `🗂️ Refinement` section **doesn't count** in context budgets or low-energy ceiling (5 tasks). Always displayed if ≥ 1 ticket.

  

**Dormancy safeguard (mandatory before dry-run)**:

For each active project in `04 - Projects/INDEX.md`:
1. Scan daily notes from **last 7 days** — search for project slug or exact name
2. If **0 mentions** in these 7 days AND project has ≥ 1 Ready ticket → project is **dormant**
3. For each dormant project (appearance order in INDEX.md): take its **1st Ready ticket** (kanban appearance order) and insert at **position 3 in Personal section** — after WIP and 1st suggestion of priority project, before normal suggestions
4. If multiple dormant projects → insert in sequence (positions 3, 4, …)
5. A project already in pool (via coverage mandatory or priority project) isn't dormant even if unmentioned

**Rationale**: 7 days no mention = real drift risk. 1 forced visible ticket = progress slows but project stays alive.

---

**Verification dry-run (mandatory before Step 5)**:

Before presenting anything, mechanically verify:
1. Check duration filter: each task respects limit by energy (≤ 2 → 1h max, ≤ 3.5 → 2h max, > 3.5 → free) → remove non-conforming tasks.
2. If energy < 2.5 and > 5 tasks (excl. Refinement) → remove until 5.
3. For each context (Work / Personal / Hobby): sum estimated durations → if **strictly exceeds** context budget (residual budget < 0): remove last added task and try next. Budget = 0 after addition = exact fit, keep. **If `SPORT_SECTION` non-empty → add 30min to Personal sum** (sport session reserved first in `budget_perso`, before productive personal tasks); if addition pushes Personal negative, truncate a productive personal task, never the sport session.
4. If a task has no estimate → assign 45min before summing
5. **Never present non-conforming plan** — truncate first, present after

This dry-run is silent (not shown to {USER_NAME}). Its result is the definitive list sent to Step 5.

---

Each suggestion must be:

- **Concrete** — a precise action, not "work on a project"

- **Realistic** — doable in one session or less (one task = one session)

- **Useful** — brings something tangible

- **One at a time** — don't suggest tasks needing context switch

- **Linked to source** — always include an Obsidian `[[]]` link to source note or ticket so {USER_NAME} finds context without searching

  

## Step 5 — Present plan to {USER_NAME} and write in daily note

  

Present the plan to {USER_NAME}:

**Template and display order**:

Display in this order. Omit sections with indication in parentheses.

```
## 📅 Plan du [date]

> ⚠️ Yesterday not closed — launch `/closeyesterday` before starting
(Omit if closed)

> 🔴 Calendar unavailable — no events surfaced
(Omit if CALENDAR_FAILED = false)

> 🔴 Webhook mails down — check n8n
(Omit if MAIL_FAILED = false)

*Plan generated at [HEURE_LANCEMENT]*

> OPTIONAL: If overload detected in Step 3, add
> I detect overload these 2-3 days. Want to cut the plan 20-30%?

**Today: [one-sentence day intention]**

Energy: [X/5] | Work: [X]h | Personal: [X]h | Hobby: [X]h | Total: [X]h/[CAP_TOTAL]h max

### 💡 Start of day
launch `/my-world` to load your context before starting
(Omit if FIRST_SESSION_TODAY = false — outside quota)

### 🎯 Big Thing
**Goal [N] — [goal title]**
↳ [[plan ticket that contributes]]
(If zero aligned ticket, replace ↳ line with: ⚠️ No ticket in today's plan contributes — it's the week's blind spot.)
(Omit only if goals-2026.md absent — else always present)

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
🗂️ [NB_EXPLO_READY] explos Ready (threshold 12) — remember `/triage-explo`
🩺 /stranger hidden by health veto for [X] days — last execution: [date]
(Omit command lines if MAINTENANCE_OVERDUE = false — **mandatory if MAINTENANCE_OVERDUE = true**)
(Omit 🩺 line except if STRANGER_VETO = true **and** /stranger overdue > 15d. Like 🗂️ line, it **doesn't enter** non-droppable guard. `- [ ] /stranger` line and 🩺 line are **mutually exclusive** — never both same day.)
(Omit 🗂️ line if EXPLO_OVERFLOW = false. It **doesn't enter** non-droppable guard: doesn't force section appearance and never makes MAINTENANCE_OVERDUE true. If no command overdue but EXPLO_OVERFLOW = true, section displays with only 🗂️ line.)

### 📬 Mails
[MAIL_SECTION]
(Omit if MAIL_SECTION empty)

### 🗂️ Refinement — [X] Ideas total
- [ ] [[TicketName]] — [1-sentence context] — **spec** / **trash**

---

**You can validate, ignore, or ask me to review priorities.**
```

  

- Omit a section if its hours are 0 or empty

- **Dynamic cap** — never exceed `CAP_TOTAL` (calculated in Step 3). A day > 10h is ok, not 2 consecutive — the third is capped at 10h.

- For hobby suggestions: rely on mentions in recent daily notes (hobby activities mentioned: painting, guitar, 3D, D&D, etc.)

Once validated by {USER_NAME}, write the plan in the `## 📅 Daily Plan` section of today's daily note as checkboxes with Obsidian links to source notes.

**⚠️ Critical rule: write ALL non-empty sections** — Big Thing, Agenda, Mails, Personal, Hobby, Sport, Work, Vault maintenance, Refinement. Never write just a subset of sections claiming they're the "main" ones. If a section is empty (ex: no mail, no agenda) → omit it; if it has content → always write it, even if {USER_NAME} didn't mention it during validation discussion.

  

```markdown

## 📅 Daily Plan

### 🎯 Big Thing
**Goal [N] — [goal title]**
↳ [[plan ticket that contributes]]
(If zero aligned ticket: ⚠️ No ticket in today's plan contributes — it's the week's blind spot.)
(Omit only if goals-2026.md absent)

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
- [ ] Organize claude-mem note — [[09 - Inbox/claude-mem]]


### 🎨 Hobby
- [ ] [Concrete hobby action] — [[02 - Hobbies/[Relevant Kanban]]]

### 🏋️ Sport
[SPORT_SECTION]
(Omit if SPORT_SECTION empty)

### 🔄 Vault maintenance
- [ ] /[command] — last: [date] (+[X]d)
🗂️ [NB_EXPLO_READY] explos Ready (threshold 12) — remember `/triage-explo`
🩺 /stranger hidden by health veto for [X] days — last execution: [date]
(Omit command lines if no command overdue; omit 🗂️ line if EXPLO_OVERFLOW = false; omit 🩺 line except if STRANGER_VETO = true **and** /stranger overdue > 15d. Section writes when any of the three has content. `- [ ] /stranger` line and 🩺 line are mutually exclusive.)

### 📬 Mails
- **[Sender]** — [short summary]
(Omit if MAIL_SECTION empty)

### 🗂️ Refinement — [X] Ideas total
- [ ] [[TicketName]] — [1-sentence context] — **spec** / **trash**
(Omit if no Idea tickets)

```

  

Rules for links:

- Kanban ticket with its own note `[[TicketName]]` → direct link to ticket note

- Kanban ticket without dedicated note (text only in kanban) → link to project kanban

- Inbox note → direct link to inbox note

- Knowledge/Hobbies note → direct link to note

- Task with no associated note → no link, just text

- Omit sections with 0 hours

  

If section doesn't exist in daily note → create it. If it exists → don't overwrite, add new actions to end.

  

## Step 6 — In-day tracking

  

When the user says "done", "finished", "next", "what do I have to do":

1. Read the `## 📅 Daily Plan` section of today's daily note

2. Check completed task: `- [x] [Action] ✅ HH:mm` (example: `- [x] Finish task X ✅ HH:mm`)

3. If task is a kanban ticket → **ask {USER_NAME}**: "Can I move this ticket to Done on the kanban?" — wait for confirmation before moving

4. **If unchecked tasks exist** → suggest next without waiting for extra request

5. **If all plan tasks checked** → re-read kanbans and inbox, suggest new action or declare day wrapped

  

## Absolute rules

- **Write in daily note only** — never elsewhere
- **Don't overwrite existing content** — add to end if section exists
- **Hourly budget = main constraint** — fill available hours by context (frontmatter). Filter by duration per energy: ≤ 2 → 1h max/task, ≤ 3.5 → 2h max/task, > 3.5 → free. If energy < 2.5 → cap 5 tasks + note "on request". Refinement section outside quota.
- **Always prioritize WIP** before anything else
- **One task at a time** — no overload (ADHD profile)
- **Pair-programming validation** — Step 6: ask permission before moving ticket to Done (never autonomous)
