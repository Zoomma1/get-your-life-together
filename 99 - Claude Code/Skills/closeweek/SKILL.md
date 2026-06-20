---
name: closeweek
description: Weekly summary — synthesis of achievements, learnings (insight-oriented), detected patterns, recurring pattern capitalization in {USER_NAME}.md, revisit "To monitor" watchlist, and next week projection. Creates a note in Weekly/. Triggered when the user says "closeweek", "weekly summary", "let's wrap up the week" or via `/closeweek [YYYY-WXX]`.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected from aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preserving qualitative content takes priority over reducing lines.

# Skill: Close Week

The objective of this summary is not to recount the week but to detect patterns before they become drifts — prioritize what is actionable or revealing.

## ⚠️ Verbose feedback mandatory during execution

Announce **every step executed** as it runs — {USER_NAME} must see what's happening live, not wait for a black box:

```
→ Step 1/9: determine execution mode (final / draft)
→ Step 2/9: collect material (daily notes, sessions, spelling)
   ✓ 6 daily notes read
   ✓ 4 sessions found
   ⚠ Step 2.4 spelling: skip — Postgres unreachable
→ Step 3/9: analyze actual durations
   ✓ 18 tickets with ⏱→✅ extracted
   ✓ ticket-durations.md updated
→ Step 4/9: write the note
   ⚠ Section "Blockers & Patterns" omitted — no pattern detected
→ Step 5/9: pattern capitalization → {USER_NAME}.md
   ⚠ Skip — no qualifying recurring pattern
→ Step 6/9: revisit "To monitor" watchlist
   ✓ 2 watchlist patterns reread — 1 confirmed, 1 pending
→ Step 7/9: tracker + light CLAUDE.md review
→ Step 8/9: create note in Weekly/
→ Step 9/9: chat recap
```

**Rule**: every sub-step silently skipped (empty spelling collection, optional sections omitted, edge cases) must have an **explicit line** indicating why. A step that doesn't show up → we must see why, not guess.

## Triggering & Reminder

**Direct invocation (vocalized)**:
- {USER_NAME} says trigger: "closeweek", "weekly summary", "let's wrap up the week", "what's the summary"
- Claude Code detects and launches the skill automatically

**Manual invocation (command)**:
- `/closeweek` alone → processes current ISO week (calendar week of today)
- `/closeweek 2026-W14` → processes specific week (ex: previous week for catch-up)

**Automatic reminder**:
- During `/today`: check `command-tracker.md` → if gap > 7 days since last `/closeweek`, display message "Last closeweek: W##, N days ago. Restart?" (don't automatically trigger closeweek, just notify {USER_NAME})

---

## Step 1 — Determine execution mode

**Calculate target week**: argument YYYY-WXX passed or current ISO week by default. Deduce Monday (D0) and Sunday (D6) to delimit files to consult.

**Decide flow based on situation**:

| Condition                                                            | Action                                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Argument earlier than current week (ex: now W14, argument W12) | **Final mode**: create/overwrite `YYYY-WXX.md`                                                                                                                                        |
| Current week (today ∈ W) AND today = Sunday         | **Final mode**: create/overwrite `YYYY-WXX.md`                                                                                                                                        |
| Current week (today ∈ W) AND today ≠ Sunday         | **Draft mode**: create `YYYY-WXX-draft.md` with header "*(Partial summary — finalize on Sunday)*". Continue normally after creation.                                           |
| Note `YYYY-WXX.md` already exists (final mode)                          | Display existing content. Propose to {USER_NAME}: `[A] add missing elements`, `[R] replace completely`, `[C] create new version (YYYY-WXX-v2.md)`. Wait for response. |
| Missing weeks detected (between last closeweek and target)    | Display list in ascending order. Propose: `[T] process missing weeks first` or `[S] skip and process target week`. Wait for response.                             |

**In case of missing weeks validated `[T]`**: process the oldest first (call closeweek recursively on each), then return to target week.

---

## Step 2 — Collect material

**Sequential reader** (in this order):

1. Read last closeweek prior to target in `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\` → extract unclosed threads and recurring learnings
2. Read daily notes of the week in `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\` (files `YYYY-MM-DD.md` in target Monday-Sunday range)
   - Extract from each note's frontmatter: `energy`, `score`, `feeling` (if present) → store for Energy section (Step 4)
3. Read sessions of the week in `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` (files `YYYY-MM-DD.md` in target Monday-Sunday range)

**Edge case: 0 daily notes found**
- Display: "0 daily notes found for W##. Proceed?"
- Propose: `[P] proceed from sessions alone` or `[A] cancel summary`. Wait for response.
- If `[P]`: display "Lightweight summary (sources: sessions only)". Continue with Step 3 (duration analysis) then Step 4 (writing).

**Classify material by observable impact**:

| Level | Definition | Action |
|--------|-----------|--------|
| **1** | Structural decision (changes orientation/org/direction) | Always include |
| **2** | New pattern/workflow/habit detected | Always include |
| **3** | One-off achievement (contextual insight) | Include if relevant |
| **4** | Routine (no notable surprise) | Omittable |

**Unclosed threads** and **recurring** learnings surface at the top of the summary.

**Edge case: Empty week (no level 1-2 content)**
- Write short minimalist summary (3-4 items). Include line: "Stable week — few events or consolidated routines."

**If many sessions (3+ per day)**: synthesize by day or by project (ex: "Monday: Project A setup + tests", "Wednesday: Project B + meeting"). Don't enumerate every session.

### Spelling collection

In parallel with main material reading — result stored for Step 9.

**1. Sessions Postgres** — fetch sessions of the week:
```bash
psql postgresql://claude:claude@docker-host:5432/claude_sessions \
  -t -A -F'|||' \
  -c "SELECT date, title, raw_md FROM sessions WHERE date BETWEEN '[Monday YYYY-MM-DD]' AND '[Sunday YYYY-MM-DD]' ORDER BY date, time"
```
If 0 results → ignore, continue.

**2. Daily notes reflections** — extract `## 💡 Ideas & Reflections` sections from daily notes already read this week (exact title from {USER_NAME} template). Concatenate into single text block.

**3. Parallel Haiku agents** — launch 1 agent per session `raw_md` + 1 agent for aggregated Reflections block. Exact prompt:
> "Identify spelling mistakes, incorrect agreements or faulty turns of phrase in this French text. Return only a JSON list: [{\"erreur\": \"...\", \"correction\": \"...\", \"regle\": \"...\"}]. Maximum 5 items. If no mistakes detected → return []."

**4. Aggregate** — merge all JSON outputs, count occurrences of each mistake, retain 2-3 most frequent → variable `ortho_items`.
If `ortho_items` empty → silently omit in Step 9.

### Long-term recurrence detection (optional, silent fail)

For each **level 1-2 pattern** identified in material (Detected patterns, Blockers):
```bash
uv run ~/.claude/semantic_search.py "<pattern in 3-5 words>" --top-k 3 --since <Monday-4weeks>
```
If similarity ≥ 0.45 on sessions **prior** to target week → cross-week recurring pattern:
1. **Age**: date of first occurrence found
2. **What resulted**: rerun `--type completed --since <first occurrence date>` to see follow-ups
3. **Store** in variable `pattern_recurrents`: list of `{pattern, first_date, follow_up}`

If Postgres/Ollama unreachable → `pattern_recurrents = []`, non-blocking, display: `⚠️ Recurrence detection unavailable (Postgres/Ollama down) — patterns sourced from prior closeweek only.`

---

## Step 3 — Analyze actual durations

**Why**: since the `/workon` patch of 2026-05-03, each ticket carries `⏱ HH:mm→HH:mm ✅` in the daily note. These observed durations calibrate future `/today` estimates (which reads `ticket-durations.md` at every plan generation). Without this step, `/today` stays with rough estimates (45min default).

**Source**: the daily notes of the week already read in Step 2.2. Don't reload — reuse content in memory.

### 3.1 — Extract durations

For each daily note of the week, parse checked lines with start + end timestamps:

- **Pattern**: `- [x] ... ⏱ (\d{2}:\d{2})→(\d{2}:\d{2}) ✅`
- **Cross-midnight**: if end < start (ex: `⏱ 23:45→00:30`) → add 24h to end before subtraction. Duration = 45min, not -23h15.
- **Duration**: `(end - start)` in minutes.

Ignore lines without the arrow `→` (old formats `⏱ HH:mm` alone or `✅ HH:mm` separate) — no extractable duration, don't try to infer.

### 3.2 — Classify by type

For each extracted ticket, determine its type from the `[[TicketName]]` link and line context:

| Type | Detection signals |
|------|---------------------|
| **CC maintenance** | Ticket in `99 - Claude Code/Claude Code Kanban.md` — patch hook, config, lessons, cleanup |
| **CC skill** | Ticket in `99 - Claude Code/Claude Code Kanban.md` — skill creation or overhaul |
| **FSTG** | Ticket in `04 - Projects/From Sprue to Glory/` |
| **HUSKER** | Ticket in `04 - Projects/Husker/` or slug starts with `husker-` |
| **GYLT** | Ticket in `04 - Projects/Get Your Life Together/` or slug starts with `gylt-` |
| **Perso practical** | Section `### 🎯 Perso` outside dev projects (admin, courses, tidying) |
| **Hobby** | Section `### 🎨 Hobby` |
| **Vault maintenance** | Section `### 🔄 Vault maintenance` (vault commands `/harvest`, `/link`, etc.) |

If a ticket doesn't clearly match any category → type `Other`. Don't invent sub-types.

### 3.3 — Calculate stats by type

For each type represented this week:
- **Nb tickets**: number of entries
- **Average**: sum of durations / nb tickets
- **Median**: ascending sort + center value (or average of 2 centers if nb even)
- **Min / Max**: extremes observed this week

Format durations as `Xmin` if < 60min, else `XhYmin` (ex: `1h20`, `45min`, `2h`).

### 3.4 — Update `ticket-durations.md`

Path: `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ticket-durations.md`

**If file doesn't exist** → create it with header + initial table.

**If file exists** → don't overwrite. Merge:
1. Read existing table (historical types)
2. For each type present this week: recalculate **cumulative** stats (history + new tickets) — `ticket-durations.md` keeps individual tickets at end of file, reread them to recalculate.
3. For types untouched this week: keep as-is
4. Append section "Individual tickets (week WXX)" at end of file (raw history, never purged)

**Format**:
```markdown
# Real ticket durations

*Updated on YYYY-MM-DD (closeweek W##)*

Data calibrated from tickets `⏱→✅` in daily notes since 2026-05-03.

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

- **No ticket with `⏱→✅` this week**: don't touch `ticket-durations.md`. Log in verbose feedback: `⚠ No timestamped ticket this week — skip ticket-durations.md update`
- **Type with < 3 tickets in total**: keep line in table but it's `/today` that will detect insufficiency (signal "insufficient data for [type]" on `/today` side, not here)
- **File `ticket-durations.md` corrupted (parsing fail)**: don't overwrite. Log `⚠ ticket-durations.md unreadable — skip update. Manually rebuild.` Continue with rest of closeweek.

---

## Step 4 — Write the note

**Template**:

```markdown
# Week WXX — YYYY
*From [Monday DD/MM] to [Sunday DD/MM]*
*[Partial summary — finalize on Sunday]* ← add if draft mode

## Continuity from previous week
[Unclosed threads, recurring learnings from W-1]
← Omit this section if no thread to pursue

## ✅ Achieved
- ...

## 💡 Learnings
*Formulate as "X reveals that...", "X means that..." — not bare factual recap.*
- ...

## 🔁 Blockers & Patterns
*What worked, what blocked, emerging patterns.*
- Worked: ...
- Blocker: ...
- Pattern detected: ...
  *If recurring pattern (variable `pattern_recurrents`):*
  `→ Recurring since YYYY-MM-DD — follow-up observed: [what resulted, 1 sentence]`
← Omit entirely if no blocker/pattern this week

## 🔗 Connector theme
*Meta-pattern linking achievements/blockers in 1 sentence.*
← Omit if absent

## 🔋 Week energy
| Day | Energy | Score | Feeling |
|------|---------|-------|---------|
| Mon | [X]/5 | [X]/5 | *[feeling]* |
| Tue | ... | ... | ... |
| Wed | ... | ... | ... |
| Thu | ... | ... | ... |
| Fri | ... | ... | ... |
| Sat | ... | ... | ... |
| Sun | ... | ... | ... |
← Omit days with no daily note. Omit Score or Feeling column if no daily note this week contains that field.

## ➡️ Next week
- ...
← Omit if empty

← Omit entirely if level 0
```

**Writing rules**:
- Optional sections (Continuity, Blockers & Patterns, Connector theme, Next week): omit **silently** if empty — never leave section title empty
- Insight > recap: each point must imply something for what's next
- Little content (< 3 items total): short summary + explain why (ex: "Stable week — few events")

---

## Step 5 — Pattern capitalization → {USER_NAME}.md

**Objective**: anchor recurring patterns detected this week in `01 - Me/{USER_NAME}.md §Observed patterns` — without waiting for the monthly.

**Eligibility criterion**: a pattern is proposed for anchoring if **at least one** of these conditions is true:
- Present in `pattern_recurrents` (variable Step 2 — semantic recurrence across weeks with similarity ≥ 0.45)
- Mentioned in ≥ 2 distinct daily notes of the week (similar phrasings even if not identical)
- Linked to an unclosed thread resumed from W-1 or W-2 (continuity observed over 3 weeks)

**If no qualifying pattern** → skip silently, verbose line: `⚠ Skip — no qualifying recurring pattern`. Go to Step 6.

**If qualifying patterns**:

1. Read `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` — identify the most recent `### Observed patterns` section (by date).
2. Present to {USER_NAME}:

```
Recurring patterns qualified this week:

1. [Pattern short — 1 sentence]
   Occurrences: [daily YYYY-MM-DD, daily YYYY-MM-DD, pattern_recurrents since YYYY-MM-DD]
   Proposal for anchoring in {USER_NAME}.md §Observed patterns (current month):
   → "[Proposed formulation, 2-3 sentences with dated sources]"

2. [Pattern 2 — ...]
```

3. Wait for validation {USER_NAME} for each pattern. Accept: "1", "all", "1 and 3", "yes", "ok". Refuse: "no", "skip", silence/timeout (45s) → skip this pattern.
4. For each validated pattern:
   - If section `### Observed patterns ([current month])` exists → add bullet under that section
   - Otherwise → create section `### Observed patterns (closeweek W## — YYYY-MM)` at head of Patterns zone (before existing monthly sections)
   - Bullet format: `- **[Pattern short]** — [Description, 2-3 sentences with dated sources]. Pattern to monitor: [optional — falsification condition or next verification]`
5. **Always pair-programming**: no writing without explicit validation. Global refusal ("no", "skip all") → write nothing, verbose line `⚠ Proposed patterns refused — no {USER_NAME}.md anchoring`.

**If {USER_NAME}.md missing/unreadable** → display `⚠ {USER_NAME}.md inaccessible — pattern capitalization deferred`, don't block rest of skill.

---

## Step 6 — Revisit "To monitor" watchlist

**Objective**: revisit patterns marked `To monitor` in `{USER_NAME}.md` — confirm, refute, or leave pending. Prevents watchlist from bloating without ever being resolved.

**Source**: `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md`

**Detection**: grep bullets containing one of these phrasings:
- `Pattern to monitor`
- `To monitor:`
- `to monitor —`
- `To monitor post-`
- `To monitor on return`

(Case-insensitive. Capture variants while staying strict on the word "monitor".)

**If watchlist empty** → skip silently, verbose line: `⚠ Skip — watchlist empty`. Go to Step 7.

**If watchlist non-empty**:

1. For each watchlist pattern, present to {USER_NAME}:

```
Watchlist patterns "To monitor" — reread W## :

1. [Pattern short extracted from bullet]
   Source: {USER_NAME}.md §[section] (anchored YYYY-MM-DD or estimated from bullet context)
   Question: confirmed / refuted / still pending / already resolved elsewhere?

2. [...]
```

2. Wait for answer per pattern. Accept: "1 confirmed", "2 pending", "1 refuted, 2 resolved", "all pending". Refuse: silence/timeout (60s) → treat all non-responses as "pending".

3. Based on answer:
   - **Confirmed** → propose bullet modification: remove "To monitor" mention and add `Confirmed YYYY-MM-DD (closeweek W##)`. Wait for OK before edit.
   - **Refuted** → propose 2 options: `[R] remove bullet entirely` or `[A] archive pattern with note "Refuted YYYY-MM-DD (closeweek W##) — [short reason]"`. Wait for choice before edit.
   - **Pending** → do nothing. Bullet stays as-is, will be reproposed next closeweek.
   - **Already resolved elsewhere** → ask where (other essay, ADR, [[wiki link]]), propose removing "To monitor" mention + add `Resolved in [[link]] YYYY-MM-DD`. Wait for OK.

4. **Strict pair-programming**: each {USER_NAME}.md edit awaits explicit validation. Refusal → keep as-is, note in verbose `⚠ Pattern N: edit refused`.

**If {USER_NAME}.md missing/unreadable** → display `⚠ {USER_NAME}.md inaccessible — watchlist not revisited`, don't block.

---

## Step 7 — Tracker + light CLAUDE.md review

**Action 1: Update command-tracker.md BEFORE note creation**

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`. Add or update line:
```
/closeweek [YYYY-WXX] → executed [YYYY-MM-DD HH:MM]
```

**Action 2: Light review of global CLAUDE.md** *(advisory, weekly)*

Quickly reread `~/.claude/CLAUDE.md` (= `99 - Claude Code/CLAUDE.md`) + `99 - Claude Code/vault-context.md`. Spot any rule **obsolete, redundant or misplaced** per routing rule: stays in CLAUDE.md = always active all contexts; else → hook (event), skill (invocation) or project context.

- Nothing to report → verbose line `✓ CLAUDE.md reread — no issues`.
- Drift spotted → flag it to {USER_NAME} in Step 9 (recap), **modify nothing** (pair-programming). For deep pass, point to ticket `passe-claude-md-inspiration-karpathy-maintenance-reguliere`.
- **Deep pass cadence**: quarterly or after major model update — tracked in `command-tracker.md` (line `claude-md-pass`).

**Action 3: `lessons.md` distillation nudge** *(advisory, weekly)*

`lessons.md` is injected **at every prompt** by the `lessons-loader` hook; it's a gateway, not an archive. Count lessons: `grep -c '^- \*\*' "99 - Claude Code/lessons.md"`. If **> 20 lessons** (re-bloat threshold) → flag to {USER_NAME} in Step 9 (recap): *"`lessons.md` = N lessons, above threshold. Run `/lessons-distill` to route stabilized lessons to their home (SKILL.md / CLAUDE.md / ADR / Knowledge / prune)."* **Don't launch distillation during closeweek** (heavy pass) — just nudge. Below threshold → verbose line `✓ lessons.md below threshold (N lessons) — no nudge`. See [[passe-distillation-lessons-md-graduer-foyer]].

Implicit confirmation: if read + write succeed, continue to Step 8.

---

## Step 8 — Create the note

**Final path**: `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\YYYY-WXX.md` or `YYYY-WXX-draft.md` per mode (Step 1)

**Generate the note** with written content (Step 4).

**Success signal to {USER_NAME}**:
- Display direct link to created note
- Message: "Week W## summary created" (or "draft created — finalize on Sunday")

---

## Step 9 — Chat recap

After note creation, display directly in chat (not in note):

**1. Narrative recap of the week** — 3-5 lines max, oriented on meaning and movement, not task list. Include connector theme if present.

**2. W+1 priority table** — format:

| Priority | Subject |
|----------|-------|
| 🔴 Urgent/blocking | ... |
| 🟠 Important | ... |
| 🟡 To advance if possible | ... |

Source priorities from `➡️ Next week` section of note + unclosed threads detected in Step 2.

**4. Spelling** (if `ortho_items` non-empty):

```
### ✍️ Spelling — this week
- "observed mistake" → correction (rule in 1 sentence)
```

Maximum 3 items. Neutral, factual tone. Silently omit if `ortho_items` empty.

**Rule**: the chat recap is always displayed, even in draft mode.

---

## Draft → final conversion

**Sunday after 23:59** (or {USER_NAME} review earlier):

Run `/closeweek 2026-W14` on same week. System detects existing draft (Step 1, condition 4). {USER_NAME} chooses `[R] replace completely` → new draft replaced by fresh write.

Alternatively, {USER_NAME} can rerun Wednesday and choose `[A] add missing` to enrich draft then rerun Sunday `[R]`.

---

## Absolute rules

- **{USER_NAME}.md capitalization**: this skill proposes anchoring recurring patterns (Step 5) and watchlist review (Step 6). Monthly (`/closemonth`) remains responsible for deep consolidation (patterns ≥ 3 occurrences, section overhaul). Weekly capitalizes as-you-go, monthly synthesizes.
- No writing to `01 - Me/{USER_NAME}.md` without explicit {USER_NAME} validation — always present proposal before edit
- Process one week at a time if multiple weeks in arrears — propose order (Step 1, condition 5)
- Insight > recap: value = what the week implies, not what it contains

---

## Edge cases — Resolution

| Scenario | Response |
|----------|---------|
| Launched Monday–Saturday current week | Draft mode (Step 1). Note `YYYY-WXX-draft.md` created. Signal: "Finalize on Sunday: `/closeweek` or `/closeweek YYYY-WXX` → `[R]`". |
| 0 daily notes week | Step 2: display choice `[P]/[A]`. If `[P]`: message "Lightweight summary (sessions only)". Continue. |
| ISO calendar spanning 2 months (ex W13 = Mar-Apr) | Use ISO W13, mention date range in header (ex "From 24/03 to 30/03"). |
| Draft exists for target week | Step 1, condition 4: propose `[A]/[R]/[C]`. Wait for response before continuing. |
| command-tracker.md missing/broken | Infer from file creation dates: list all `YYYY-WXX.md` in `Weekly/`, extract MAX(mod date), deduce current W. Display "Tracker missing — rebuild from files. Continue?" Wait for confirmation. |
| ISO calc error (invalid dates) | Display: "Cannot calculate ISO week for [argument]. Verify format YYYY-WXX or date argument. Rerun?" Wait for new argument. |
| No level 1-2 content (empty week) | Write short minimalist summary (3-4 items) + line "Stable week — few events or consolidated routines." |

---

## Pair-programming

- No autonomous action: every decision (final/draft mode, missing weeks processing, 0 daily notes procedure) waits for explicit {USER_NAME} validation
- Tracker before note: `command-tracker.md` update happens first (Step 7), before note creation (Step 8)
- Proposed choices are clear and contextualized: never "Continue?" without explicit option
