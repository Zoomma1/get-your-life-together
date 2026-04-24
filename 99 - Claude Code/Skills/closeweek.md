---
name: closeweek
description: Weekly summary — synthesis of accomplishments, learnings (insight-focused), detected patterns and next week's outlook. Creates a note in Weekly/. Triggered when Victor says "closeweek", "week summary", "wrap up the week" or via `/closeweek [YYYY-WXX]`.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected from aggressive optimization**
>
> This skill produces **narrative qualitative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). The preservation of qualitative content takes priority over line reduction.

# Skill : Close Week

The objective of this summary is not to recount the week but to detect patterns before they become drifts — prioritize what's actionable or revealing.

## Trigger & Reminder

**Direct invocation (vocalized)** :
- Victor says trigger : "closeweek", "week summary", "wrap up the week", "what's the summary"
- Claude Code detects and launches the skill automatically

**Manual invocation (command)** :
- `/closeweek` alone → processes current ISO week (calendar week of today)
- `/closeweek 2026-W14` → processes specific week (ex: previous week for catch-up)

**Automatic reminder** :
- During `/today` : check `command-tracker.md` → if gap > 7 days since last `/closeweek`, display message "Last closeweek : W##, N days ago. Re-launch?" (don't auto-trigger closeweek, just notify Victor)

---

## Step 1 — Determine execution mode

**Calculate target week** : passed YYYY-WXX argument or current ISO week by default. Deduce Monday (J0) and Sunday (J6) to delimit files to consult.

**Decide workflow by situation** :

| Condition                                                            | Action                                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Argument earlier than current week (ex: current is W14, argument W12) | **Final mode** : create/overwrite `YYYY-WXX.md`                                                                                                                                        |
| Current week (today ∈ W) AND today = Sunday         | **Final mode** : create/overwrite `YYYY-WXX.md`                                                                                                                                        |
| Current week (today ∈ W) AND today ≠ Sunday         | **Draft mode** : create `YYYY-WXX-draft.md` with header "*(Partial summary — finalize Sunday)*". Continue normally after creation.                                           |
| Note `YYYY-WXX.md` already exists (final mode)                          | Display existing content. Propose to Victor : `[A] add missing elements`, `[R] replace completely`, `[C] create new version (YYYY-WXX-v2.md)`. Wait for response. |
| Missing weeks detected (between last closeweek and target)    | Display list in ascending order. Propose : `[T] process missing weeks first` or `[S] skip and process target week`. Wait for response.                             |

**In case of missing weeks validated `[T]`** : process oldest first (call closeweek recursively on each), then return to target week.

---

## Step 2 — Collect material

**Sequential reader** (in this order) :

1. Read latest closeweek before target in `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\` → extract unclosed threads and recurring learnings
2. Read daily notes of week in `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\` (files `YYYY-MM-DD.md` in Monday-Sunday range)
3. Read sessions of week in `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` (files `YYYY-MM-DD.md` in Monday-Sunday range)

**Edge case : 0 daily notes found**
- Display : "0 daily notes found for W##. Proceed?"
- Propose : `[P] proceed from sessions only` or `[A] cancel summary`. Wait for response.
- If `[P]` : display "Streamlined summary (sources : sessions only)". Continue with Step 3.

**Classify material by observable impact** :

| Level | Definition | Action |
|--------|-----------|--------|
| **1** | Structuring decision (changes direction/org/orientation) | Always include |
| **2** | New pattern/workflow/habit detected | Always include |
| **3** | Isolated realization (contextual insight) | Include if relevant |
| **4** | Routine (no notable surprise) | Omissible |

**Unclosed threads** and **recurring** learnings surface at top of summary.

**Edge case : Empty week (no level 1-2 content)**
- Write short minimalist summary (3-4 items). Include line : "Stable week — few events or consolidated routines."

**Work mental health check** (active if `work_hours > 5` at least 3 days in week) :
Evaluate 10 signals from `06 - Work/Theodo Extend/anti-kshuttle-signals.md` over the week. Mark each flagged signal. If ≥ 1 flag → include dedicated section in note (Step 3). If no flag → omit silently.

**If many sessions (3+ per day)** : synthesize by day or project (ex: "Monday : FSTG setup + tests", "Wednesday : Ludisep + meeting"). Don't enumerate each session.

### Parallel data collection

In parallel with main material reading — result stored for Step 6.

**1. Sessions Postgres** — retrieve week's sessions :
```bash
psql postgresql://claude:claude@localhost:5433/claude_sessions \
  -t -A -F'|||' \
  -c "SELECT date, title, raw_md FROM sessions WHERE date BETWEEN '[Monday YYYY-MM-DD]' AND '[Sunday YYYY-MM-DD]' ORDER BY date, time"
```
If 0 results → ignore, continue.

**2. Daily notes Reflections** — extract `## 📝 Reflections` sections from daily notes already read this week. Concatenate into single text block.

**3. Parallel Haiku agents** — launch 1 agent per session's `raw_md` + 1 agent for aggregated Reflections block. Exact prompt :
> "Identify spelling errors, incorrect agreement or faulty phrasing in French in this text. Return only JSON list : [{\"error\": \"...\", \"correction\": \"...\", \"rule\": \"...\"}]. Max 5 items. If no errors detected → return []."

**4. Aggregate** — merge all JSON outputs, count occurrence of each error, retain 2-3 most frequent → variable `ortho_items`.
If `ortho_items` empty → omit silently in Step 6.

### Long-term recurrence detection (optional, fail silently)

For each **level 1-2 pattern** identified in material (Detected patterns, Blockers) :
```bash
uv run ~/.claude/semantic_search.py "<pattern in 3-5 words>" --top-k 3 --since <Monday-4weeks>
```
If similarity ≥ 0.45 on sessions **before** target week → pattern recurs across weeks :
1. **Age** : date of first occurrence found
2. **What followed** : re-launch `--type accomplished --since <first occurrence date>` to see follow-ups
3. **Store** in variable `pattern_recurrents` : list of `{pattern, first_date, follow-up}`

If Postgres/Ollama inaccessible → `pattern_recurrents = []`, non-blocking, display : `⚠️ Recurrence detection unavailable (Postgres/Ollama down) — patterns sourced from last closeweek only.`

---

## Step 3 — Write the note

**Template** :

```markdown
# Week WXX — YYYY
*From [Monday DD/MM] to [Sunday DD/MM]*
*[Partial summary — finalize Sunday]* ← add if draft mode

## Continuity from last week
[Unclosed threads, recurring learnings from W-1]
← Omit this section if no threads to pursue

## ✅ Accomplished
- ...

## 💡 Learnings
*Phrase as "X reveals that...", "X means that..." — not raw factual recap.*
- ...

## 🔁 Blockers & Patterns
*What worked, what blocked, emerging patterns.*
- Worked : ...
- Blocker : ...
- Pattern detected : ...
  *If pattern recurs (variable `pattern_recurrents`) :*
  `→ Recurs since YYYY-MM-DD — follow-up observed : [what followed, 1 sentence]`
← Omit entirely if no blockers/patterns this week

## 🔗 Connecting theme
*Meta-pattern linking accomplishments/blockers in 1 sentence.*
← Omit if absent

## ➡️ Next week
- ...
← Omit if empty

## 🚨 Work mental health check
← Include only if ≥ 1 signal flagged AND `work_hours > 5` at least 3 days this week

| Signal | Level | Status |
|--------|--------|--------|
| ... | 🟡/🔴 | Flagged |

→ Action : [Dump Telegram] or [Check-in Jay if 🔴 or 2+ flags over 2+ consecutive weeks]
← Omit entirely if no signal flagged
```

**Writing rules** :
- Optional sections (Continuity, Blockers & Patterns, Connecting theme, Next week) : omit **silently** if empty — never leave section title empty
- Insight > recap : each point must imply something for next steps
- Light content (< 3 items total) : short summary + explain why (ex: "Stable week — few events")

---

## Step 4 — Update tracker

**Action 1 : Update command-tracker.md BEFORE note creation**

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`. Add or update line :
```
/closeweek [YYYY-WXX] → executed [YYYY-MM-DD HH:MM]
```

Implicit confirmation : if read + write succeed, continue to Step 5.

---

## Step 5 — Create note

**Final path** : `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\YYYY-WXX.md` or `YYYY-WXX-draft.md` depending on mode (Step 1)

**Generate note** with content drafted (Step 3).

**Success signal to Victor** :
- Display direct link to created note
- Message : "Week W## summary created" (or "draft created — finalize Sunday")

---

## Step 6 — Chat recap

After note creation, display directly in chat (not in note) :

**1. Week's narrative recap** — 3-5 lines max, focused on meaning and movement, not task list. Include connecting theme if present.

**2. W+1 Priority table** — format :

| Priority | Subject |
|----------|-------|
| 🔴 Urgent/blocking | ... |
| 🟠 Important | ... |
| 🟡 Advance if possible | ... |

Source priorities from `➡️ Next week` section of note + unclosed threads detected in Step 2.

**3. Work mental health check** (if `work_hours > 5` at least 3 days this week) — display only if ≥ 1 signal flagged : list of flags + recommended action (Dump Telegram / check-in Jay).

**4. Spelling** (if `ortho_items` non-empty) :

```
### ✍️ Spelling — this week
- "observed error" → correction (rule in 1 sentence)
```

Max 3 items. Neutral, factual tone. Omit silently if `ortho_items` empty.

**Rule** : the chat recap is always displayed, even in draft mode.

---

## Draft → final conversion

**Sunday after 11:59pm** (or Victor's earlier review) :

Launch `/closeweek 2026-W14` on same week. System detects existing draft (Step 1, condition 4). Victor chooses `[R] replace completely` → new writing replaces draft.

Alternatively, Victor can re-launch Wednesday and choose `[A] add missing elements` to enrich draft, then re-launch Sunday `[R]`.

---

## Absolute rules

- Behavioral updates to `{USER_NAME}.md` are role of `/closemonth`, not this skill
- Process one week at a time if multiple weeks behind — propose order (Step 1, condition 5)
- Insight > recap : value = what the week implies, not what it contains

---

## Edge cases — Resolution

| Scenario | Response |
|----------|---------|
| Launched Monday–Saturday of current week | Draft mode (Step 1). Note `YYYY-WXX-draft.md` created. Signal : "To finalize Sunday : `/closeweek` or `/closeweek YYYY-WXX` → `[R]`". |
| 0 daily notes for week | Step 2 : display choice `[P]/[A]`. If `[P]` : message "Streamlined summary (sessions only)". Continue. |
| Calendar ISO spanning 2 months (ex W13 = Mar-Apr) | Use ISO W13, mention date range in header (ex "From 24/03 to 30/03"). |
| Draft exists for target week | Step 1, condition 4 : propose `[A]/[R]/[C]`. Wait for response before continuing. |
| command-tracker.md absent/broken | Infer from file creation dates : list all `YYYY-WXX.md` in `Weekly/`, extract MAX(mod date), deduce current W. Display "Tracker absent — reconstruction from files. Continue?" Wait for confirmation. |
| ISO calculation error (invalid dates) | Display : "Cannot calculate ISO week for [argument]. Verify YYYY-WXX format or date argument. Re-launch?" Wait for new argument. |
| No level 1-2 content (empty week) | Write short minimalist summary (3-4 items) + line "Stable week — few events or consolidated routines." |

---

## Pair-programming

- No autonomous action : all decisions (final/draft mode, missing week processing, 0 daily notes procedure) await explicit Victor validation
- Tracker before note : `command-tracker.md` update happens first (Step 4), before note creation (Step 5)
- Proposed choices are clear and contextualized : never "Continue?" without explicit options
