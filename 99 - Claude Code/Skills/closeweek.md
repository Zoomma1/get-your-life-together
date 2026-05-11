---
name: closeweek
description: Weekly summary — synthesis of achievements, learnings (insight-oriented), detected patterns and next week projection. Creates note in Weekly/. Triggered when user says "closeweek", "week summary", "wrap up the week" or via `/closeweek [YYYY-WXX]`.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of output produced**, not structural compactness.
>
> **For `/evaluateskills`** : if mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill : Close Week

This summary's goal is not to recount the week but to detect patterns before they become drifts — prioritize what's actionable or revealing.

## ⚠️ Verbose feedback mandatory during execution

Announce **each step executed** as it runs — {USER_NAME} must see what's happening live, not wait for black box :

```
→ Step 1/6 : determine execution mode (final / draft)
→ Step 2/6 : collect material (daily notes, sessions, spelling)
   ✓ 6 daily notes read
   ✓ 4 sessions found
   ⚠ Step 2.4 spelling : skip — Postgres unreachable
→ Step 3/6 : write note
   ⚠ Section "Blockers & Patterns" omitted — no patterns detected
→ Step 4/6 : update command-tracker.md
→ Step 5/6 : create note in Weekly/
→ Step 6/6 : chat recap
```

**Rule** : each silently-skipped sub-step (empty ortho collection, optional sections omitted, edge cases) must have **explicit line** explaining why. A step that doesn't show up → we must see why, not guess.

## Triggering & Reminder

**Direct invocation (vocalized)** :
- {USER_NAME} says trigger : "closeweek", "week summary", "wrap up the week", "what's the summary"
- Claude Code detects and launches skill automatically

**Manual invocation (command)** :
- `/closeweek` alone → process current ISO week (calendar week of today)
- `/closeweek 2026-W14` → process specific week (e.g., earlier week for catchup)

**Automatic reminder** :
- During `/today` : check `command-tracker.md` → if > 7 days since last `/closeweek`, display "Last closeweek : W##, N days ago. Relaunch?" (don't auto-trigger closeweek, just notify {USER_NAME})

---

## Step 1 — Determine Execution Mode

**Calculate target week** : YYYY-WXX argument passed or current ISO week by default. Deduce Monday (D0) and Sunday (D6) to delimit files to consult.

**Decide workflow based on situation** :

| Condition                                                            | Action                                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Argument earlier than current week (e.g., in W14, argument W12) | **Final mode** : create/overwrite `YYYY-WXX.md`                                                                                                                                        |
| Current week (today ∈ W) AND today = Sunday         | **Final mode** : create/overwrite `YYYY-WXX.md`                                                                                                                                        |
| Current week (today ∈ W) AND today ≠ Sunday         | **Draft mode** : create `YYYY-WXX-draft.md` with header "*(Partial summary — to finalize Sunday)*". Continue normally after creation.                                           |
| Note `YYYY-WXX.md` already exists (final mode)                          | Display existing content. Propose to {USER_NAME} : `[A] add missing elements`, `[R] replace entirely`, `[C] create new version (YYYY-WXX-v2.md)`. Wait for response. |
| Missing weeks detected (between last closeweek and target)    | Display list in ascending order. Propose : `[T] handle missing weeks first` or `[S] skip and handle target week`. Wait for response.                             |

**If missing weeks validated `[T]`** : handle oldest first (recursively call closeweek on each), then return to target week.

---

## Step 2 — Collect Material

**Sequential reader** (in this order) :

1. Read last closeweek before target in `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\` → extract unclosed threads and recurring learnings
2. Read week's daily notes in `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\` (files `YYYY-MM-DD.md` in Monday-Sunday range)
   - Extract from each note's frontmatter : `energy`, `score`, `ressenti` (if present) → store for Energy section (Step 3)
3. Read week's sessions in `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` (files `YYYY-MM-DD.md` in Monday-Sunday range)

**Edge case : 0 daily notes found**
- Display : "0 daily notes found for W##. Continue?"
- Propose : `[P] proceed from sessions only` or `[A] cancel summary`. Wait for response.
- If `[P]` : display "Lean summary (sources : sessions only)". Continue to Step 3.

**Classify material by observable impact** :

| Level | Definition | Action |
|--------|-----------|--------|
| **1** | Structural decision (changes direction/org/orientation) | Always include |
| **2** | New pattern/workflow/habit detected | Always include |
| **3** | Isolated realization (contextual insight) | Include if relevant |
| **4** | Routine (no notable surprise) | Omittable |

**Unclosed threads** and **recurring learnings** surface at top of summary.

**Edge case : Empty week (< 3 level 1-2 items)**
- Write short minimal summary (3-4 items). Include line : "Stable week — few events or consolidated routines."

**If numerous sessions (3+ per day)** : synthesize by day or project (e.g., "Monday: Project A setup + tests", "Wednesday: Project B + meeting"). Don't enumerate each session.

### Spelling Collection

In parallel with main material reading — result stored for Step 6.

**1. Sessions Postgres** — fetch week's sessions :
```bash
psql postgresql://claude:claude@localhost:5433/claude_sessions \
  -t -A -F'|||' \
  -c "SELECT date, title, raw_md FROM sessions WHERE date BETWEEN '[Monday YYYY-MM-DD]' AND '[Sunday YYYY-MM-DD]' ORDER BY date, time"
```
If 0 results → ignore, continue.

**2. Daily notes reflections** — extract `## 💡 Ideas & Reflections` sections from dailies already read this week (exact section name in {USER_NAME}'s template). Concatenate into single text block.

**3. Haiku agents in parallel** — launch 1 agent per session `raw_md` + 1 agent for aggregated Reflections block. Exact prompt :
> "Identify spelling mistakes, incorrect agreements or faulty French turns in this text. Return only JSON list : [{\"error\": \"...\", \"correction\": \"...\", \"rule\": \"...\"}]. Max 5 items. If no mistakes → return []."

**4. Aggregate** — merge all JSON outputs, count each error occurrence, keep 2-3 most frequent → variable `ortho_items`.
If `ortho_items` empty → silently omit in Step 6.

### Long-term Recurrence Detection (optional, fail silent)

For each **level 1-2 pattern** identified in material (Patterns Detected, Blockers) :
```bash
uv run ~/.claude/semantic_search.py "<pattern in 3-5 words>" --top-k 3 --since <Monday-4weeks>
```
If similarity ≥ 0.45 on sessions **before** target week → pattern is recurring across weeks :
1. **Age** : first occurrence date from found session
2. **What came from it** : rerun `--type accomplished --since <first occurrence date>` to see followups
3. **Store** in variable `pattern_recurrents` : list of `{pattern, first_date, followup}`

If Postgres/Ollama unreachable → `pattern_recurrents = []`, non-blocking, display : `⚠️ Recurrence detection unavailable (Postgres/Ollama down) — patterns sourced from previous closeweek only.`

---

## Step 3 — Write Note

**Template** :

```markdown
# Week WXX — YYYY
*From [Monday DD/MM] to [Sunday DD/MM]*
*[Partial summary — to finalize Sunday]* ← add if draft mode

## Continuity from Previous Week
[Unclosed threads, recurring learnings from W-1]
← Omit section if no threads to continue

## ✅ Achieved
- ...

## 💡 Learnings
*Formulate as "X reveals that...", "X means that..." — not bare factual recap.*
- ...

## 🔁 Blockers & Patterns
*What worked, what blocked, emerging patterns.*
- Working : ...
- Blocker : ...
- Pattern detected : ...
  *If pattern recurrent (from `pattern_recurrents` variable) :*
  `→ Recurring since YYYY-MM-DD — followup observed : [what came from it, 1 sentence]`
← Omit entirely if no blockers/patterns this week

## 🔗 Connecting Theme
*Meta-pattern linking achievements/blockers in 1 sentence.*
← Omit if absent

## 🔋 Week's Energy
| Day | Energy | Score | Feeling |
|------|---------|-------|---------|
| Mon | [X]/5 | [X]/5 | *[feeling]* |
| Tue | ... | ... | ... |
| Wed | ... | ... | ... |
| Thu | ... | ... | ... |
| Fri | ... | ... | ... |
| Sat | ... | ... | ... |
| Sun | ... | ... | ... |
← Omit days without daily note. Omit Score or Feeling column if no daily notes this week contain those fields.

## ➡️ Next Week
- ...
← Omit if empty

← Omit entirely if level 0
```

**Writing rules** :
- Optional sections (Continuity, Blockers & Patterns, Connecting Theme, Next Week) : silently omit if empty — never leave section title with no content
- Insight > recap : each point should imply something for next steps
- Sparse content (< 3 items total) : short summary + explain why (e.g., "Stable week — few events")

---

## Step 4 — Update Tracker

**Action 1 : Update command-tracker.md BEFORE creating note**

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`. Add or update line :
```
/closeweek [YYYY-WXX] → executed [YYYY-MM-DD HH:MM]
```

Implicit confirmation : if read + write succeed, continue to Step 5.

---

## Step 5 — Create Note

**Final path** : `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\YYYY-WXX.md` or `YYYY-WXX-draft.md` depending on mode (Step 1)

**Generate note** with content from Step 3.

**Success signal to {USER_NAME}** :
- Display direct link to created note
- Message : "Week W## summary created" (or "draft created — to finalize Sunday")

---

## Step 6 — Chat Recap

After note creation, display directly in chat (not in note) :

**1. Week narrative recap** — 3-5 lines max, insight and movement oriented, not task list. Include connecting theme if present.

**2. W+1 priority table** — format :

| Priority | Subject |
|----------|-------|
| 🔴 Urgent/blocking | ... |
| 🟠 Important | ... |
| 🟡 To advance if possible | ... |

Source priorities from note's `➡️ Next Week` section + unclosed threads from Step 2.

**3. Spelling** (if `ortho_items` non-empty) :

```
### ✍️ Spelling — this week
- "observed error" → correction (rule in 1 sentence)
```

Max 3 items. Neutral, factual tone. Silently omit if `ortho_items` empty.

**Rule** : chat recap always displayed, even in draft mode.

---

## Draft → Final Conversion

**Sunday after 11:59pm** (or {USER_NAME} review earlier) :

Launch `/closeweek 2026-W14` on same week. System detects existing draft (Step 1, condition 4). {USER_NAME} chooses `[R] replace entirely` → new write replaces draft.

Alternatively, {USER_NAME} can relaunch Wednesday and choose `[A] add missing` to enrich draft, then relaunch Sunday `[R]`.

---

## Absolute Rules

- Behavioral update of `{USER_NAME}.md` is `/closemonth` role, not this skill
- Handle one week at a time if multiple weeks in backlog — propose order (Step 1, condition 5)
- Insight > recap : value = what week implies, not what it contains

---

## Edge Cases — Resolution

| Scenario | Response |
|----------|---------|
| Launched Mon–Sat current week | Draft mode (Step 1). Note `YYYY-WXX-draft.md` created. Signal : "To finalize Sunday : `/closeweek` or `/closeweek YYYY-WXX` → `[R]`". |
| 0 daily notes week | Step 2 : display choice `[P]/[A]`. If `[P]` : "Lean summary (sessions only)". Continue. |
| ISO calendar spanning 2 months (e.g., W13 = Mar-Apr) | Use ISO W13, mention date range in header (e.g., "From 24/03 to 30/03"). |
| Draft exists for target week | Step 1, condition 4 : propose `[A]/[R]/[C]`. Wait for response before continuing. |
| command-tracker.md missing/broken | Infer from file dates : list all `YYYY-WXX.md` in `Weekly/`, extract MAX(mod date), deduce current W. Display "Tracker missing — reconstruction from files. Continue?" Wait for confirmation. |
| ISO calculation error (invalid dates) | Display : "Can't calculate ISO week for [argument]. Check YYYY-WXX format or argument date. Relaunch?" Wait for new argument. |
| No level 1-2 content (empty week) | Write minimal lean summary (3-4 items) + line "Stable week — few events or consolidated routines." |

---

## Pair-programming

- No autonomous actions : every decision (final/draft mode, missing weeks handling, 0-daily-notes procedure) waits for explicit {USER_NAME} validation
- Tracker before note : `command-tracker.md` update happens first (Step 4), before note creation (Step 5)
- Proposed choices are clear and contextualized : never "Continue?" without explicit option
