---
name: today
description: Generate or update the day's plan — schedule adapted to energy, calendar constraints, work/personal/hobby hours and recent feedback. Reads daily notes, sessions, project kanbans, mood tracker, ICS calendar and mail webhook. Trigger when {USER_NAME} says "today", "/today", "day plan", "what do I do today", "generate my plan", "what do I start with", or at the start of the day. Automatically adapts based on time (morning = full plan, afternoon = refocused, evening = lighter).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimisation**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips the narrative instructions (grouping, context, highlights, open questions, tone, narration). Preserving qualitative content takes priority over reducing line count.

**Triggers the day's plan** — Generates a schedule adapted to energy, constraints and priorities.

**Invocation**: `/today` at any time of day (before 12h = full plan, 12h-17h = refocused plan, after 17h = lighter plan).

**Example scenario**: {USER_NAME} calls `/today` at 14h45, they have a meeting at 15h30 (45 min away). The skill detects the short window, displays "⚡ Micro-session (< 0.5h)", proposes 1 light task + the current WIP, then asks about the next action after the meeting.

  

## Preamble — Initialise variables

Before any step, initialise these control variables to avoid undefined values at read time:

```
LAUNCH_TIME = null
WINDOW_MIN = Infinity  
SHORT_WINDOW = false
CALENDAR_FAILED = false
MAIL_FAILED = false
FIRST_SESSION_TODAY = false
```

---

## Step 0 — Tech digest (conditional, non-blocking)

Check whether today's daily note already contains a `## 📰 Digest` section:
- If **yes** → skip (digest already collected)
- If **no** → invite Claude to launch `/digest` with instruction "continue without waiting for the response if it takes > 5s, the digest will be added to the note afterwards"
  - This is not a blocking step — planning continues in parallel
  - No timeout on the skill side, the digest runs independently

---

## Step 1 — Launch time + Day focus

**Get current time**: run `date +"%H:%M"` (bash). Store as `LAUNCH_TIME` (e.g. "09:15").

Use `LAUNCH_TIME` to adapt the plan:
- **Morning (before 12h)** → full plan, normal windows
- **Afternoon (12h–17h)** → flag morning tasks as missed if they no longer make sense later, refocus on what is still feasible today
- **Evening (after 17h)** → light plan, prioritise short or hobby tasks, no deep work — signal *"Evening — lighter plan"*

Display `LAUNCH_TIME` in the header of the final plan (Step 5 template).

---

**Day focus**

If today's daily note already exists with a `## 📅 Day plan` section **and this section contains checkable tasks** (at least one checkbox `- [ ]` in a subsection other than `### 📅 Agenda`, e.g. `### 💼 Work`) → use the implicit focus from the existing plan, go directly to Step 6 for tracking.

Otherwise (section absent or containing only the agenda), ask {USER_NAME}: *"Is there something specific you want to work on today?"* — wait for their response with a short timeout.
- If response received → use as constraint, integrate as priority 1 of suggestions (Step 4)
- If silence (timeout ~5s) → continue without explicit focus (fallback: propose WIP items and let {USER_NAME} validate in Step 5)

---

## Step 2 — Read context

Steps 2.0 to 2.12 are run **in parallel** (no inter-step dependencies). Launch 2.0 (Calendar) and 2.12 (Mails) in the background if their sources are remote/slow. Steps 2.1–2.11 (local vault reading) wait for nothing — launch immediately. Finish all readings before Step 2.13.

**2.0 — Calendar** — Check that `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\config\calendar-url.md` exists. If yes, fetch the ICS URL via WebFetch, otherwise note "Calendar not configured" and continue without blocking.
   
   **If fetch successful**:
   - Parse the ICS content. Each event starts with `BEGIN:VEVENT` and ends with `END:VEVENT`
   - Extract `SUMMARY` (title), `DTSTART`, `DTEND`, `DESCRIPTION` (optional)
   - DTSTART format (3 cases):
     * `DTSTART;TZID=Europe/Prague:20260321T140000` → local Prague time, extract timestamp `20260321T140000` → convert to `21/03 14h00` (already local timezone, do not transform)
     * `DTSTART;VALUE=DATE:20260321` → all-day event (no time) → convert to `21/03 (all day)`
     * `DTSTART:20260321T140000Z` → UTC with `Z`, transform to {USER_NAME}'s local timezone (Brno = UTC+1 winter, UTC+2 summer) → convert to `21/03 15h00 (or 16h00)` depending on season
   - Extract events for **today** and the **next 7 days** (use YYYY-MM-DD date to filter)
   - Store events in two lists: `EVENTS_TODAY` (for the day), `EVENTS_FUTURE` (for 7 days)
   - If `EVENTS_TODAY` is empty → do not signal "empty agenda", continue normally (full day possible)
   - **Calculate `WINDOW_MIN`**: for each fixed-time event today not yet past (event time > LAUNCH_TIME), calculate available time before it: `window_minutes = (event_time - LAUNCH_TIME) in minutes`. Store the minimum in `WINDOW_MIN` (remains `Infinity` if no future events).
   - **Decode imminent messages**:
     * If event in the next 3 days contains `deadline|submission|deliverable|folder|exam|defence` → store as `DEADLINE_SIGNALED = true`
     * If event today or tomorrow contains `meeting|presentation|interview|defence` → plan a "Prepare summary" context task
   
   **If fetch fails or ICS invalid** → mark `CALENDAR_FAILED = true`, leave `EVENTS_TODAY` and `EVENTS_FUTURE` empty, `WINDOW_MIN` at `Infinity`. Signal to {USER_NAME} in Step 5 template.

**2.1 — Today's daily note**

Read `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\YYYY-MM-DD.md` (today's date). If it does not exist → create with this minimal template (do not write beyond the frontmatter):
```yaml
---
date: YYYY-MM-DD
energy: 
work_hours: 
personal_hours: 
hobby_hours: 
---
```
Memorise the frontmatter content for Step 3 (extract energy, hours).

**2.2 — Yesterday's daily note**

Look for the `## 🌙 Day review` section in yesterday's note. If absent → signal at the top of the plan: `⚠️ Yesterday not closed — run \`/closeyesterday\` before starting`

**2.3 — Commitment scan**

Look for patterns in daily notes (today, yesterday, day before if available) that indicate an unresolved commitment:
- Patterns: lines containing `(I will|I said|to do|I must|promised)` in lowercase, NOT preceded by `[x]` (checked) and NOT mentioned in a kanban in WIP/Done
- For each match → extract the full text (the line up to `\n`)
- Classify as Personal (personal/hobby/dev mentions) or Work (professional/projects mentions)
- Carry forward as a task in Step 4 with source = origin note

**2.4 — Last session**

List all files in `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` and sort by descending date.
- If the most recent file has a date < today → mark `FIRST_SESSION_TODAY = true`
- If the most recent file is dated today → read to know the next step and state at the end of the previous session

**2.5 — Inbox**

Read `{VAULT_PATH}\{INBOX_FOLDER}\` — list present notes

**2.6 — Active projects**

Read `{VAULT_PATH}\{PROJECTS_FOLDER}\INDEX.md` for active projects

**2.7 — Project kanbans**

For each active project, read its Kanban. Note **WIP**, **Ready**, **Blocked** and **Idea** tickets.
- For each **Ready** or **Idea** ticket with an associated note (`[[TicketName]]`) → read the note
- **Dependency rule**: before suggesting a ticket, check its `### Dependencies` section — if "Blocked by: [[X]]" and X is not Done → suggest X instead

**2.8 — Hobby Kanban**

Read `{VAULT_PATH}\{HOBBIES_FOLDER}\Hobby Kanban.md` — note **WIP** and **Ready** tickets. Categories ignored (#warhammer, #guitar, #3d, #jdr) since they reside in ticket notes, not the kanban.

**2.9 — Special Kanbans**

Read and note **WIP**, **Ready**, **Blocked** and **Idea** in:
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Claude Code Kanban.md`

For each **Idea** ticket with a note → read the note.

**2.10 — ADHD profile**

Read `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` — markdown section "Working mode and energy" to extract suggested adaptations (e.g. "one task at a time", "no context switch"). Use these preferences to adapt the pool composition in Step 4.

**2.11 — Vault maintenance**

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md` if it exists. For each command, compare `last_run + frequency` vs today's date:
- If overdue → note for Step 4 (🔄 Vault maintenance section)
- Automatically exclude: `/essay-check` (post-session hook, managed by `/closeday`), `/my-world` (already integrated in Step 4.0)
- Special context: propose `/closeweek` if day = Sunday or Monday, `/closemonth` if day = 1st of month
- Missing file → continue without signal (new vault)

**2.12 — Mails (n8n)**

**If `{N8N_WEBHOOK_URL}` is empty in vault-settings.md** → `MAIL_SECTION = ""`, silently skip this entire step (optional feature).

Check n8n and mail-analysis webhook (bash/WSL2) — initialise `MAIL_SECTION = ""` before starting:
- Check container: run `docker ps --filter "name=n8n" --filter "status=running" --format "{{.Names}}"`
- If empty → start: run `docker start n8n && sleep 5`
- Call webhook with timeout (10s): run `curl -s -m 10 "{N8N_WEBHOOK_URL}/webhook/mail-analysis"`
- Parse response:
  * If response is JSON with non-empty `.markdown` key → store text content in `MAIL_SECTION`
  * If JSON response but `.markdown` absent or empty → `MAIL_SECTION = ""` (no mails to display, no error)
  * If invalid response (malformed JSON or curl fails) → mark `MAIL_FAILED = true`, `MAIL_SECTION = ""`. Signal to {USER_NAME} in Step 5 template.
  * If curl timeout (> 10s) or container down → `MAIL_FAILED = true`, continue without mails

---

## Step 2.13 — Check available window

After reading all context (Steps 2.0–2.12):

Use `WINDOW_MIN` calculated in Step 2.0:
- If `WINDOW_MIN` < 90 minutes (1.5h) AND `CALENDAR_FAILED` = false (i.e. calendar operational AND event found) → store `SHORT_WINDOW = true` for Step 4 (surfacing quick tickets before the event)
- Otherwise → `SHORT_WINDOW = false`

Reminder: `CALENDAR_FAILED` and `MAIL_FAILED` initialised in Preamble, updated in Steps 2.0/2.12.

## Step 3 — Calibrate pool + budgets

**Extract frontmatter** (already memorised in 2.1):
- `energy:` — energy level (1-5, default 3)
- `work_hours:`, `personal_hours:`, `hobby_hours:` — hours (default 0 each)

**If energy ≤ 2** — before generating the pool, ask the question:
> Low energy detected — are you going with:
> A) Mechanical tasks (refinement, maintenance, quick tickets)
> B) Normal lighter plan (usual mix, reduced pool given energy)

Wait for the response to orient selection in Step 4. If silence → continue in mode B.

**Calculate `pool_max`**:

`pool_max = energy × 2` (total across all sections)

Default: if energy not filled or non-numeric → use `energy = 3`, so `pool_max = 6`.

The pool_max is the absolute cap on the number of tasks proposed in the main plan (all sections combined, excl. Refinement).

**Calculate budgets per context**:

```
personal_budget  = personal_hours
hobby_budget     = hobby_hours
work_budget      = work_hours
```

For each selected task, infer an estimated duration in minutes (e.g. "refine spec" = 45min, "review PR" = 30min). If duration cannot be determined → fallback 45min.

**Selection stop rule**: stop at the first cap reached:
1. Context budget exhausted (work/personal/hobby > entered hours), OR
2. Global pool `pool_max` reached (all sections combined), OR
3. No more available candidates

The Refinement section is outside the quota and is always added.

**Work/personal/hobby split**:

- Include a block only if it has > 0h
- If all = 0 → signal in Step 5: `⚠️ No hours entered — prioritise WIP`
- Never mix the 3 blocks in a suggestion
- Travel noted in frontmatter → exclude PC-bound tasks, adapt for mobile

**Detect overload** (read last 2-3 daily notes):
- If patterns "too much", "exhausted" → ask in Step 5: *"I detect overload. Would you like to reduce the plan by 20-30%?"*
- Otherwise continue normally

  

## Step 4 — Generate suggestions

  

Draw from these sources in priority order:

0. **First session of the day** (if `FIRST_SESSION_TODAY = true`) → include at the top of the plan, before any other suggestion: `💡 Start of day — run \`/my-world\` to load your context before starting`. This task disappears from the plan once the 2nd non-/my-world action is launched or checked

1. **WIP tickets** — finish what is in progress before starting something new. If WIP is empty but {USER_NAME} has expressed a focus (Step 1) → the focus becomes the 1st suggestion (replaces WIP as starting point)

2. **Overdue vault commands** — signal in `🔄 Vault maintenance` section (separate from plan) the overdue commands identified in Step 2.11

3. **Ready features** — ready to dev, not yet started

4. **Inbox** — notes to file, develop or archive

5. **Recurring ideas** — subjects that keep coming up in recent daily notes without being capitalised

**Pool composition rules (normal mode only)**:

- **Identify priority project**: apply in order — (1) count project name mentions (slug or exact name) in the last 3 daily notes — the most mentioned wins; (2) tie: project with most WIP tickets; (3) final tie: take the first in `04 - Projects/INDEX.md` order → allocate 2-3 suggestions with priority. Deterministic rule: never judge "perceived activity".
- **Selection order within a kanban**: within a kanban, tickets are taken in **order of appearance in the file** (top = priority). Never reorder by judgement — the order in the kanban is {USER_NAME}'s decided priority order. WIP before Ready, Ready before Idea.
- **Mandatory coverage of all kanbans**: every active kanban (active projects + Claude Code Kanban + Hobby Kanban) must contribute at least 1 suggestion if WIP or Ready tickets are available and unblocked (unless pool_max already reached)
- **Short window**: if `SHORT_WINDOW = true`, identify tickets estimated at less than 30min in the pool and reserve them for the `⚡ Before [event]` section of Step 5 — they are part of the pool but presented separately
- **Work / Personal / Hobby balance**: respect the frontmatter hours split. If budget = 0 for a section → omit from pool.
- **Empty pool**: if no candidates (all WIP/Ready empty, inbox empty) → do not generate an empty section, simply signal "No tasks in stock, this is a good day for refinement!" and display only Refinement if Idea tickets exist.
- **Present pool as a choice list**: display all suggestions, then ask {USER_NAME} to select which ones to keep for their plan. Do not pre-select on their behalf.
- **Daily note is only written after validation**: only write the tasks {USER_NAME} has retained (context budget + pool_max, first cap wins). Refinement section is outside the quota.

**`🗂️ Refinement` section — generation logic:**

The section is **independent** from the main plan — it is always generated when there are Idea tickets in any kanban, regardless of main plan load.

Count total Idea tickets across all kanbans (active projects + Claude Code Kanban + Hobby Kanban):
- If total = 0 → omit Refinement section
- If total ∈ [1, 9] → propose 2-3 tickets
- If total ≥ 10 → propose up to 5 tickets

Selection order (apply in this order):
- **Priority 1**: tickets proposed in yesterday's daily note `🗂️ Refinement` section but unchecked → carry forward at the top ({USER_NAME} has fresh context)
- **Priority 2**: tickets whose associated note appears in daily notes or sessions from the last 3 days (context resonance)
- **Priority 3**: tickets without notes or detached notes — taken in order of appearance in the kanban (top = priority). No judgement on thematic relevance.

For each ticket: `[[TicketName]]` (or plain text if no note) + 1-sentence context + action: **→ spec** or **→ trash**

**After plan validation (Step 5)**: for each ticket {USER_NAME} marks **spec** → immediately invoke `/refine [[TicketName]]`. Do not write the daily note before the end of each `/refine`. If {USER_NAME} marks multiple tickets as spec, process them sequentially (one `/refine` at a time).

The `🗂️ Refinement` section **does not count** against `pool_max` and context budget limits. Always displayed if ≥ 1 ticket.

  

**Dormancy safeguard (mandatory before dry-run)**:

For each active project in `04 - Projects/INDEX.md`:
1. Scan daily notes from the **last 7 days** — look for the project slug or exact name
2. If **0 mentions** in these 7 days AND the project has at least 1 Ready ticket → project is **dormant**
3. For each dormant project (order of appearance in INDEX.md): take its **1st Ready ticket** (kanban appearance order) and insert it at **position 3 in the Personal section** — after WIP and 1st suggestion from the priority project, before normal suggestions
4. If multiple dormant projects → they insert in sequence (positions 3, 4, …)
5. A project already present in the pool (via mandatory coverage or priority project) is not considered dormant even if not mentioned

**Rationale**: 7 days without mention = real drift risk. 1 ticket forced into a visible position = progress slows but the project stays alive.

---

**Dry-run verification (mandatory before Step 5)**:

Before presenting anything, mechanically verify:
1. Count main plan tasks (excluding Refinement) → if > `pool_max`: remove the last ones from the list until compliant
2. For each context (Work / Personal / Hobby): sum estimated durations → if **strictly greater than** the context budget (residual budget < 0): remove the last added task and try the next one. Budget = 0 after addition = exact fit, keep.
3. If a task has no estimated duration → assign 45min before summing
4. **Never present a non-compliant plan** — truncate first, present after

This dry-run is silent (not displayed to {USER_NAME}). Its result is the definitive list sent to Step 5.

---

Each suggestion must be:

- **Concrete** — a precise action, not "work on a project"

- **Realistic** — doable in one session or less (one task = one session)

- **Useful** — brings something tangible

- **One at a time** — do not propose tasks that require context switching

- **Linked to its source** — always include an Obsidian `[[]]` link to the origin note or ticket so {USER_NAME} can find context without searching

  

## Step 5 — Present the plan to {USER_NAME} and write it to the daily note

  

Present the plan to {USER_NAME}:

**Template and display order**:

Display in this order. Omit sections with indication in parentheses.

```
## 📅 Plan for [date]

> ⚠️ Yesterday not closed — run `/closeyesterday` before starting
(Omit if closed)

> 🔴 Calendar unavailable — no events retrieved
(Omit if CALENDAR_FAILED = false)

> 🔴 Mail webhook down — check n8n
(Omit if MAIL_FAILED = false)

*Plan generated at [LAUNCH_TIME]*

> OPTIONAL: If overload detected in Step 3, add
> I detect overload these 2-3 days. Would you like to reduce the plan by 20-30%?

**Today: [day's intention in one sentence]**

Energy: [X/5] | Work: [X]h | Personal: [X]h | Hobby: [X]h | Total: [X]h/10h max

### 📅 Agenda
- [time] — [event title]
- [short date] [time] — [event title]
(Omit if no event found)

### ⚡ Before [event] at [time]
- [ ] [quick ticket estimated <30min] — (~Xmin)
(Omit if SHORT_WINDOW = false)

### 💼 Work
- [ ] [Concrete work action] — [short reason] — (~Xh / ~Xmin)
(Omit if work_hours = 0)

### 🎯 Personal
- [ ] [Concrete personal action] — [short reason] — (~Xh / ~Xmin)
(Omit if personal_hours = 0)

### 🎨 Hobby
- [ ] [Concrete hobby suggestion] — (~Xh / ~Xmin)
(Omit if hobby_hours = 0)

### 🔄 Vault maintenance
- [ ] /harvest — last: [date] (+[X]d)
- [ ] /link — last: [date] (+[X]d)
(Omit if no overdue command)

### 📬 Mails
[MAIL_SECTION]
(Omit if MAIL_SECTION empty)

### 🗂️ Refinement — [X] Ideas total
- [ ] [[TicketName]] — [1-sentence context] — **spec** / **trash**

---

**You can validate, ignore, or ask me to revise priorities.**
```

  

- Omit a section if its hours are 0 or empty

- Never exceed 10h total even if entered hours exceed this threshold

- For hobby suggestions: draw on recent daily note mentions (mentioned hobby activities: painting, guitar, 3D, tabletop RPG, etc.)

Once validated by {USER_NAME}, write the plan to the `## 📅 Day plan` section of today's daily note as checkboxes with Obsidian links to the source note:

  

```markdown

## 📅 Day plan

### 📅 Agenda
- [time] — [event title]
- [date] [time] — [event title]

### ⚡ Before [event] at [time]
- [ ] [quick ticket estimated <30min]
(Omit if SHORT_WINDOW = false)

### 💼 Work

- [ ] [Work action] — [[path/to/note-or-ticket]]
  

### 🎯 Personal
- [ ] [Concrete personal action] — [[04 - Projects/[Project]/Kanban]]
- [ ] File the claude-mem note — [[09 - Inbox/claude-mem]]


### 🎨 Hobby
- [ ] [Concrete hobby action] — [[02 - Hobbies/[Concerned Kanban]]]

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

  

Rules for links:

- Kanban ticket with its own note `[[TicketName]]` → direct link to the ticket note

- Kanban ticket without a dedicated note (plain text in kanban) → link to the project kanban

- Inbox note → direct link to the inbox note

- Knowledge/Hobbies note → direct link to the note

- Task without associated note → no link, just the text

- Omit sections whose hours are 0

  

If the section does not exist in the daily note → create it. If it already exists → do not overwrite, append new actions below.

  

## Step 6 — Intraday tracking

  

When {USER_NAME} says "done", "finished", "next", "what do I have to do":

1. Read the `## 📅 Day plan` section of today's daily note

2. Check the completed task: `- [x] [Action] ✅ HH:mm` (example: `- [x] Refine FSTG spec ✅ 10:47`)

3. If the task corresponds to a kanban ticket → **ask {USER_NAME}**: "Can I move this ticket to Done on the kanban?" — wait for confirmation before moving it

4. **If unchecked tasks remain** → suggest the next one without waiting for an additional request

5. **If all plan tasks are checked** → re-read kanbans and inbox, suggest a new action or declare the day complete

  

## Absolute rules

- **Write to daily note only** — never elsewhere
- **Do not overwrite existing content** — append below if section already exists
- **Pool energy × 2** — total pool across all sections = `energy × 2` candidates (default 6 if energy not provided). Context budget per context = frontmatter hours. First cap reached (pool_max or budget exhausted) stops selection. Refinement section is outside the quota.
- **Always prioritise WIP** over everything else
- **One task at a time** — do not overload (ADHD profile)
- **Pair-programming validation** — Step 6: ask permission before moving a ticket to Done (never autonomous)
