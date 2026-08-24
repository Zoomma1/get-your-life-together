---
name: closemonth
description: "Monthly summary — project progress, energy/score trends, stabilized behavioral patterns (≥ 3 occurrences, e.g., \"procrastination on architecture decisions\"), next month's objectives and proposed update to {USER_NAME}.md if patterns are confirmed. Use when the user says \"closemonth\", \"monthly summary\", \"we're wrapping up the month\" or via /closemonth."
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips down narrative instructions (regrouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Close Month

## Triggering

- the user says "closemonth", "monthly summary", "we're wrapping up the month"
- Command `/closemonth [YYYY-MM]` (optional argument)
- Reminder from `/today` : if it's the 1st of the month and `/closemonth` in `command-tracker.md` is dated more than 30 days ago

## Step 1 — Determine target month and check for backlogs

**Selection algorithm (priority order) :**
1. If `YYYY-MM` passed as argument → use that argument (case: manual catch-up or retroactive close)
2. Otherwise, if it's the **1st of the month** → close the **previous month** (case: automatic close on the 1st)
3. Otherwise → close the **current month** (case: voluntary close mid-month)

Example: If today = 2026-04-01 and no argument → close March (2026-03). If `/closemonth 2026-02` as argument → close February even if we're in April.

**Detect missing months :**
1. Read `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/command-tracker.md` and search for the last occurrence of `/closemonth`
2. If absent or dated > 30 days before today → months are missing
3. Enumerate all months not covered between the last `/closemonth` and the target month (inclusive) in chronological order
4. **Ask {USER_NAME}** : "Missing months detected: [list]. Proceed in chronological order (Y/N)?" — do not continue without explicit agreement
5. If agreed: process the oldest first. After finishing the current month, restart Step 1 for the next month (unless the user says no)

**If `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/command-tracker.md` is absent :** assume first run, determine target month and continue normally. ⚠️ **Verify the full path before concluding it's absent** — the tracker lives in `{CLAUDE_CODE_FOLDER}`, never at the vault root. Root cause 2026-08-02: an unqualified read concluded "first run" when the tracker had existed since April, and created a 5-line duplicate at the root (deleted on 17/08).

## Step 2 — Gather materials

**Search order (cascade) :**

1. **Search for weeklies in the target month** (primary source) :
   - Read `00 - Daily notes/Weekly/YYYY-W{nn}.md`
   - Identify which weeks W{nn} overlap the target month
   - **If ≥ 1 weekly found and non-empty** → use THESE (stop search)

2. **Fallback: search for dailies in the target month** (secondary source) :
   - Read `00 - Daily notes/YYYY-MM-*.md` (all days of the month)
   - **If ≥ 1 daily found and non-empty** → use THESE (stop search)

3. **No source found** :
   - Alert {USER_NAME} : "No weekly or daily for [YYYY-MM]. Options: (1) draft from memory (disclaimer: undocumented), (2) cancel and relaunch at month's end, (3) search in alternate directory."
   - **Await {USER_NAME}'s explicit decision** — never hallucinate a summary without source
   - **Edge case: if {USER_NAME} chooses (1)**, add a "⚠️ Undocumented" block at the start of the summary indicating content comes from memory, not weeklies/dailies

## Step 3 — Build the summary

Extract from sources (Step 2) and fill this template :

```markdown
# Summary — [Month YYYY]

## 📊 Projects
### [Project Name]
- Progress: [status at month's end]
- Notable points: [decisions, milestones, blockers, key commits if applicable]

### [Project Name] (repeat for each project)
- ...

### (If 0 projects this month)
- Note: No active projects this month

## 🔋 Energy & score
- Average energy: [X]/5 | Min: [X] | Max: [X]
- Average score: [X]/5
- Representative feelings: [2-3 examples from daily notes — e.g., *"difficult in the morning, good in the evening (D-12)"*, *"smooth but short (D-24)"*, *"exhausting but satisfied (D-28)"*]
- Observation: [if notable trend — e.g., "Stable energy weeks 1-2, drops weeks 3-4 (ISEP overload). Score rebounding end of month."]

## 🔁 Behavioral patterns
- Patterns detected (≥ 3 occurrences) :
  - [Pattern 1 : brief description + count]
  - [Pattern 2 : ...]
- (If 0 pattern ≥ 3 : "No behavioral pattern repeated ≥ 3 times this month.")

## 🎯 Next month's objectives
- [Intention 1 : concrete action resulting from the summary]
- [Intention 2 : ...]
- [Minimum 1-3 intentions]
```

**Extraction rule :** A pattern appears in this section only if mentioned **≥ 3 times distinctly** in the sources. Otherwise → note it but omit from the synthesis.

## Step 4 — Post-mortem & Suggestions

### A. Behavioral patterns → update {USER_NAME}.md

If patterns detected ≥ 3 times :
1. Present to {USER_NAME} the exact pattern (count + source citations)
2. Propose a **targeted and minimal modification** to `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md`, section "Observed patterns"
3. **Await {USER_NAME}'s explicit validation** before making changes
4. Valid examples :
   - "Architecture decision paralysis blocker without pair review (detected 4x) → add: 'Request review before dev on structural decisions'?"
   - "Weekend procrastination pattern (5x) → add: 'Limit empty tasks after 5pm?'"

If 0 pattern ≥ 3 : do not modify {USER_NAME}.md, note "No modification proposed."

### B. Suggested analytical skills

Based on what emerges from the month's summary, propose relevant skills as optional suggestions ({USER_NAME} decides) :

- **Always propose** : `/trace [key idea of the month]` — to retrace the evolution of an important concept or decision that marked the month
- **If recurring unactionable ideas have been identified** : `/ideas` — to transform the month's patterns into concrete action list
- **If connections between two domains have emerged** : `/connect [domain A] [domain B]`
- **If a significant change in life, career or project over the month** : `/compound [strategic question]` — to measure how the vault has shifted the answer
- **If `/stranger` is more than 30 days old** (check `command-tracker.md`) : `/stranger` — outside portrait for recalibration at month's end

Present in this form :
```
💡 Skills to consider this month :
- /trace [subject] — [reason in 1 sentence]
- /ideas — [what justifies launching it]
[...according to context]
```

## Step 5 — Write and finalize

1. **Create** the monthly summary :
   - Folder `00 - Daily notes/Monthly/` (create if it doesn't exist)
   - File : `YYYY-MM.md` with content from Step 3
2. **Update** `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/command-tracker.md` :
   - **Update the existing line** `/closemonth` with today's date (format : YYYY-MM-DD) in the "Last execution" column. Do NOT add a new line — the tracker is a table with one line per command. If the `/closemonth` line is absent, create it.
3. **If remaining backlog months** (Step 1) :
   - Ask {USER_NAME} : "Next month (YYYY-MM) to close too? (Y/N)"
   - If yes → restart Step 1 on the next month
   - If no → stop

## Rules

- **One month at a time** — never close 2 months in parallel
- **No source** = explicit {USER_NAME} request before fallback (no hallucination)
- **Patterns < 3 times** = ignore them, note "no stabilized pattern"
- **0 projects this month** = acceptable, note in Projects
- **Double close** : if month already closed, ask {USER_NAME} "This month is already closed. Rewrite? (Y/N)"
- **Project stopped mid-month** : include in Projects as "Status: stopped at week N"
- **Validation {USER_NAME} mandatory for** :
  - Backlog months (Step 1, point 4)
  - Modification {USER_NAME}.md (Step 4A)
  - Refusal to validate patterns → omit from {USER_NAME}.md, note "Not validated, no modification"
  - Relaunching on next month (Step 5, point 3)
