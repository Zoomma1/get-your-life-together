---
name: closeweek
description: Weekly review — summary of achievements, learnings (insight-oriented), detected patterns and next week projection. Creates a note in Weekly/. Triggered when the user says "closeweek", "weekly review", "let's wrap up the week" or via `/closeweek [YYYY-WXX]`.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Close Week

The objective of this review is not to recount the week but to detect patterns before they become drifts — prioritize what is actionable or revealing.

## ⚠️ Verbose feedback mandatory during execution

Announce **each step executed** as the run progresses — {USER_NAME} must see what's happening in real-time, not wait for a black box:

```
→ Step 1/7: determine execution mode (final / draft)
→ Step 2/7: collect material (daily notes, sessions, spelling)
   ✓ 6 daily notes read
   ✓ 4 sessions found
   ⚠ Step 2.4 spelling: skip — Postgres unreachable
→ Step 3/7: analyze actual durations
   ✓ 18 tickets with ⏱→✅ extracted
   ✓ ticket-durations.md updated
→ Step 4/7: write the note
   ⚠ "Blockers & Patterns" section omitted — no pattern detected
→ Step 5/7: update command-tracker.md
→ Step 6/7: create note in Weekly/
→ Step 7/7: recap chat
```

**Rule**: each sub-step skipped silently (empty spelling collection, optional sections omitted, edge cases) must have an **explicit line** indicating why. A step that doesn't pop up → we must see why, not guess.

## Triggering & Reminder

**Direct invocation (vocalized)**:
- {USER_NAME} pronounces trigger: "closeweek", "weekly review", "let's wrap up the week", "what's the review"
- Claude Code detects and launches the skill automatically

**Manual invocation (command)**:
- `/closeweek` alone → processes current ISO week (calendar week of today)
- `/closeweek 2026-W14` → processes specific week (e.g. previous week for catch-up)

**Automatic reminder**:
- During `/today`: check `command-tracker.md` → if gap > 7 days since last `/closeweek`, display message "Last closeweek: W##, N days ago. Relaunch?" (do not trigger closeweek automatically, just notify {USER_NAME})

---

## Step 1 — Determine execution mode

**Calculate target week**: YYYY-WXX argument passed or current ISO week by default. Deduce Monday (D0) and Sunday (D6) to delimit files to consult.

**Decide flow based on situation**:

| Condition                                                            | Action                                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Argument prior to current week (e.g. we're W14, argument W12) | **Final mode**: create/overwrite `YYYY-WXX.md`                                                                                                                                        |
| Current week (today ∈ W) AND today = Sunday         | **Final mode**: create/overwrite `YYYY-WXX.md`                                                                                                                                        |
| Current week (today ∈ W) AND today ≠ Sunday         | **Draft mode**: create `YYYY-WXX-draft.md` with header "*(Partial review — to finalize Sunday)*". Continue normally after creation.                                           |
| Note `YYYY-WXX.md` already exists (final mode)                          | Display existing content. Propose to {USER_NAME}: `[A] add missing elements`, `[R] replace completely`, `[C] create new version (YYYY-WXX-v2.md)`. Wait for response. |
| Missing weeks detected (between last closeweek and target)    | Display list in ascending order. Propose: `[T] treat missing weeks first` or `[S] skip and treat target week`. Wait for response.                             |

**In case of missing weeks validated `[T]`**: treat the oldest first (call closeweek recursively on each), then return to target week.

---

## Step 2 — Collect material

**Sequential reader** (in this order):

1. Read last closeweek prior to target in `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\` → extract unclosed threads and recurring learnings
2. Read daily notes from the week in `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\` (files `YYYY-MM-DD.md` in Monday-Sunday target range)
   - Extract from frontmatter of each note: `energy`, `score`, `ressenti` (if present) → store for Energy section (Step 4)
3. Read sessions from the week in `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` (files `YYYY-MM-DD.md` in Monday-Sunday target range)

**Edge case: 0 daily notes found**
- Display: "0 daily notes found for W##. Proceed?"
- Propose: `[P] proceed from sessions alone` or `[A] cancel review`. Wait for response.
- If `[P]`: display "Lightweight review (sources: sessions only)". Continue with Step 3 (duration analysis) then Step 4 (writing).

**Classify material by observable impact**:

| Level | Definition | Action |
|--------|-----------|--------|
| **1** | Structuring decision (changes orientation/org/direction) | Always include |
| **2** | New pattern/workflow/habit detected | Always include |
| **3** | Isolated achievement (contextual insight) | Include if relevant |
| **4** | Routine (no notable surprise) | Omissible |

**Unclosed threads** and **recurring** learnings rise to the top of the review.

**Edge case: Empty week (no level 1-2 content)**
- Write short minimalist review (3-4 items). Include line: "Stable week — few events or consolidated routines."

**If many sessions (3+ per day)**: synthesize by day or project (e.g. "Monday: Project A setup + tests", "Wednesday: Project B + meeting"). Do not enumerate each session.

### Spelling collection

In parallel with main material reading — result stored for Step 7.

**1. Postgres Sessions** — retrieve sessions from the week:
```bash
psql postgresql://claude:claude@docker-host:5432/claude_sessions \
  -t -A -F'|||' \
  -c "SELECT date, title, raw_md FROM sessions WHERE date BETWEEN '[Monday YYYY-MM-DD]' AND '[Sunday YYYY-MM-DD]' ORDER BY date, time"
```
If 0 results → ignore, continue.

**2. Daily notes reflections** — extract `## 💡 Ideas & Reflections` sections from daily notes already read this week (exact title in {USER_NAME}'s template). Concatenate into single text block.

**3. Haiku Agents in parallel** — launch 1 agent per session `raw_md` + 1 agent for aggregated Reflections block. Exact prompt:
> "Identify spelling errors, incorrect agreements or faulty turns of phrase in this French text. Return only a JSON list: [{\"error\": \"...\", \"correction\": \"...\", \"rule\": \"...\"}]. Maximum 5 items. If no errors detected → return []."

**4. Aggregate** — merge all JSON outputs, count occurrences of each error, retain 2-3 most frequent → variable `ortho_items`.
If `ortho_items` empty → omit silently in Step 7.

### Long-term recurrence detection (optional, fail silent)

For each **level 1-2 pattern** identified in material (Detected Patterns, Blockers):
```bash
uv run ~/.claude/semantic_search.py "<pattern in 3-5 words>" --top-k 3 --since <Monday-4weeks>
```
If similarity ≥ 0.45 on sessions **prior** to target week → recurring inter-week pattern:
1. **Age**: date of first occurrence found
2. **What resulted from it**: relaunch `--type accomplished --since <date first occurrence>` to see outcomes
3. **Store** in variable `pattern_recurrents`: list of `{pattern, first_date, outcome}`

If Postgres/Ollama unreachable → `pattern_recurrents = []`, non-blocking, display: `⚠️ Recurrence detection unavailable (Postgres/Ollama down) — patterns sourced from previous closeweek only.`

---

## Step 3 — Analyze actual durations

**Why**: since the `/workon` patch of 2026-05-03, each ticket carries `⏱ HH:mm→HH:mm ✅` in the daily note. These observed durations calibrate future estimates for `/today` (which reads `ticket-durations.md` each plan generation). Without this step, `/today` remains on rough estimates (45min default).

**Source**: the week's daily notes already read in Step 2.2. Do not reload — reuse content in memory.

### 3.1 — Extract durations

For each daily note of the week, parse checked lines with start + end timestamps:

- **Pattern**: `- [x] ... ⏱ (\d{2}:\d{2})→(\d{2}:\d{2}) ✅`
- **Cross-midnight**: if end < start (e.g. `⏱ 23:45→00:30`) → add 24h to end before subtraction. Duration = 45min, not -23h15.
- **Duration**: `(end - start)` in minutes.

Ignore lines without the arrow `→` (old formats `⏱ HH:mm` alone or `✅ HH:mm` separate) — no extractible duration, do not attempt to infer.

### 3.2 — Classify by type

For each extracted ticket, determine its type from the `[[TicketName]]` link and line context:

| Type | Detection signals |
|------|---------------------|
| **CC maintenance** | Ticket in `99 - Claude code/Claude Code Kanban.md` — hook patch, config, lessons, cleanup |
| **CC skill** | Ticket in `99 - Claude code/Claude Code Kanban.md` — skill creation or refactor |
| **FSTG** | Ticket in `04 - Projects/From Sprue to Glory/` |
| **HUSKER** | Ticket in `04 - Projects/Husker/` or slug begins with `husker-` |
| **GYLT** | Ticket in `04 - Projects/Get Your Life Together/` or slug begins with `gylt-` |
| **Perso practical** | `### 🎯 Perso` section outside dev projects (admin, errands, tidying) |
| **Hobby** | `### 🎨 Hobby` section |
| **Vault maintenance** | `### 🔄 Vault maintenance` section (vault commands `/harvest`, `/link`, etc.) |

If a ticket doesn't match any category clearly → type `Other`. Do not invent sub-types.

### 3.3 — Calculate stats by type

For each type represented this week:
- **Nb tickets**: number of entries
- **Average**: sum of durations / nb tickets
- **Median**: ascending sort + central value (or average of 2 central if nb even)
- **Min / Max**: extremes observed this week

Format durations as `Xmin` if < 60min, else `XhYmin` (e.g. `1h20`, `45min`, `2h`).

### 3.4 — Update `ticket-durations.md`

Path: `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ticket-durations.md`

**If file doesn't exist** → create it with header + initial table.

**If file exists** → do not overwrite. Merge:
1. Read existing table (historical types)
2. For each type present this week: recalculate **cumulative** stats (history + new tickets) — `ticket-durations.md` preserves individual tickets at end of file, reread them to recalculate.
3. For types not touched this week: preserve as-is
4. Append "Individual tickets (week WXX)" section at end of file (raw history, never purged)

**Format**:
```markdown
# Actual ticket durations

*Updated YYYY-MM-DD (closeweek W##)*

Data calibrated from `⏱→✅` tickets in daily notes since 2026-05-03.

| Type | Nb tickets | Average | Median | Min | Max |
|------|-----------|---------|---------|-----|-----|
| CC maintenance | 12 | 28min | 25min | 10min | 45min |
| CC skill | 5 | 52min | 45min | 30min | 1h20 |
| Perso practical | 4 | 1h45 | 1h45 | 1h30 | 2h |
| ...

## Individual tickets

### Week W18 (2026-04-27 → 2026-05-03)
- 2026-04-28 — [[ticket-x]] — 32min — CC maintenance
- ...

### Week W19 (2026-05-04 → 2026-05-10)
- ...
```

### 3.5 — Edge cases

- **No ticket with `⏱→✅` this week**: do not touch `ticket-durations.md`. Log in verbose feedback: `⚠ No timestamped ticket this week — skip ticket-durations.md update`
- **Type with < 3 tickets cumulative**: preserve line in table but it's `/today` that will detect insufficiency (signal "insufficient data for [type]" on `/today` side, not here)
- **File `ticket-durations.md` corrupted (parsing fail)**: do not overwrite. Log `⚠ ticket-durations.md unreadable — skip update. To be manually rebuilt.` Continue with rest of closeweek.

---

## Step 4 — Write the note

**Template**:

```markdown
# Week WXX — YYYY
*From [Monday DD/MM] to [Sunday DD/MM]*
*[Partial review — to finalize Sunday]* ← add if draft mode

## Continuity from previous week
[Unclosed threads, recurring learnings from W-1]
← Omit this section if no threads to follow

## ✅ Accomplished
- ...

## 💡 Learnings
*Formulate as "X reveals that...", "X means that..." — not raw factual recap.*
- ...

## 🔁 Blockers & Patterns
*What worked, what blocked, emerging patterns.*
- Working: ...
- Blocker: ...
- Pattern detected: ...
  *If recurring pattern (variable `pattern_recurrents`):*
  `→ Recurring since YYYY-MM-DD — observed outcome: [what resulted, 1 sentence]`
← Omit entirely if no blockers/patterns this week

## 🔗 Connector theme
*Meta-pattern linking achievements/blockers in 1 sentence.*
← Omit if absent

## 🔋 Week's energy
| Day | Energy | Score | Feel |
|------|---------|-------|---------|
| Mon | [X]/5 | [X]/5 | *[ressenti]* |
| Tue | ... | ... | ... |
| Wed | ... | ... | ... |
| Thu | ... | ... | ... |
| Fri | ... | ... | ... |
| Sat | ... | ... | ... |
| Sun | ... | ... | ... |
← Omit days without daily note. Omit Score or Feel column if no daily note this week contains that field.

## ➡️ Next week
- ...
← Omit if empty

← Omit entirely if level 0
```

**Writing rules**:
- Optional sections (Continuity, Blockers & Patterns, Connector theme, Next week): omit **silently** if empty — never leave section title empty
- Insight > recap: each point must imply something for what follows
- Little content (< 3 items total): short review + explicit why (e.g. "Stable week — few events")

---

## Step 5 — Update the tracker

**Action 1: Update command-tracker.md BEFORE note creation**

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`. Add or update line:
```
/closeweek [YYYY-WXX] → executed [YYYY-MM-DD HH:MM]
```

Implicit confirmation: if read + write succeed, continue to Step 6.

---

## Step 6 — Create the note

**Final path**: `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\YYYY-WXX.md` or `YYYY-WXX-draft.md` depending on mode (Step 1)

**Generate the note** with written content (Step 4).

**Signal success to {USER_NAME}**:
- Display direct link to created note
- Message: "Week W## review created" (or "draft created — to finalize Sunday")

---

## Step 7 — Recap chat

After note creation, display directly in chat (not in note):

**1. Narrative recap of the week** — 3-5 lines max, oriented toward meaning and movement, not task list. Include connector theme if present.

**2. Next week priorities table** — format:

| Priority | Subject |
|----------|-------|
| 🔴 Urgent/blocking | ... |
| 🟠 Important | ... |
| 🟡 To advance if possible | ... |

Source priorities from note's `➡️ Next week` section + unclosed threads detected in Step 2.

**4. Spelling** (if `ortho_items` non-empty):

```
### ✍️ Spelling — this week
- "observed error" → correction (rule in 1 sentence)
```

Maximum 3 items. Neutral, factual tone. Omit silently if `ortho_items` empty.

**Rule**: the recap chat is always displayed, even in draft mode.

---

## Draft → Final conversion

**Sunday after 23:59** (or {USER_NAME}'s earlier review):

Launch `/closeweek 2026-W14` on same week. System detects existing draft (Step 1, condition 4). {USER_NAME} chooses `[R] replace completely` → new writing replaces the draft.

Alternatively, {USER_NAME} can relaunch Wednesday and choose `[A] add missing` to enrich draft then relaunch Sunday `[R]`.

---

## Absolute rules

- Behavioral update of `{USER_NAME}.md` is the role of `/closemonth`, not this skill
- Process one week at a time if multiple weeks behind — propose order (Step 1, condition 5)
- Insight > recap: value = what the week implies, not what it contains

---

## Edge cases — Resolution

| Scenario | Response |
|----------|---------|
| Launched Monday–Saturday current week | Draft mode (Step 1). Note `YYYY-WXX-draft.md` created. Signal: "To finalize Sunday: `/closeweek` or `/closeweek YYYY-WXX` → `[R]`". |
| 0 daily notes week | Step 2: display choice `[P]/[A]`. If `[P]`: message "Lightweight review (sessions only)". Continue. |
| ISO calendar spanning 2 months (e.g W13 = Mar-Apr) | Use ISO W13, mention date range in header (e.g "From 24/03 to 30/03"). |
| Draft exists for target week | Step 1, condition 4: propose `[A]/[R]/[C]`. Wait for response before continuing. |
| command-tracker.md missing/broken | Infer from file creation dates: list all `YYYY-WXX.md` in `Weekly/`, extract MAX(mod date), deduce current W. Display "Tracker missing — reconstruction from files. Continue?" Wait for confirmation. |
| ISO calculation error (invalid dates) | Display: "Cannot calculate ISO week for [argument]. Check YYYY-WXX format or argument date. Relaunch?" Wait for new argument. |
| No level 1-2 content (empty week) | Write short minimalist review (3-4 items) + line "Stable week — few events or consolidated routines." |

---

## Pair-programming

- No autonomous action: any decision (final/draft mode, missing weeks processing, 0 daily notes procedure) waits for explicit validation from {USER_NAME}
- Tracker before note: update `command-tracker.md` happens first (Step 5), before note creation (Step 6)
- Proposed choices are clear and contextualized: never "Continue?" without explicit option
