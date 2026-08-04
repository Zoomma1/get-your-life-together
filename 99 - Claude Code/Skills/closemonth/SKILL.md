---
name: closemonth
description: "Monthly review — project progression, energy/score trends, stabilized behavioral patterns (≥ 3 occurrences, ex: \"procrastination on architecture decisions\"), next month's objectives and proposed update to {USER_NAME}.md if patterns are confirmed. Use when the user says \"closemonth\", \"month wrap-up\", \"let's close the month\" or via /closemonth."
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips out narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Close Month

## Triggering

- the user says "closemonth", "month wrap-up", "let's close the month"
- Command `/closemonth [YYYY-MM]` (optional argument)
- Reminder from `/today`: if it's the 1st of the month and `/closemonth` in `command-tracker.md` dates back more than 30 days

## Step 1 — Determine target month and check for delays

**Selection algorithm (priority order):**
1. If `YYYY-MM` passed as argument → use that argument (case: manual catch-up or retroactive closure)
2. Otherwise, if it's the **1st of the month** → close the **previous month** (case: automatic closure on the 1st)
3. Otherwise → close the **current month** (case: voluntary closure mid-month)

Example: If today = 2026-04-01 and no argument → close March (2026-03). If `/closemonth 2026-02` as argument → close February even if we're in April.

**Detect missing months:**
1. Read `command-tracker.md` and find the last occurrence of `/closemonth`
2. If absent or date > 30 days before today → months are missing
3. Enumerate all uncovered months between the last `/closemonth` and the target month (inclusive) in chronological order
4. **Ask {USER_NAME}**: "Missing months detected: [list]. Proceed in chronological order (Y/N)?" — do not continue without explicit agreement
5. If agreed: process the oldest first. After finishing the current month, relaunch Step 1 for the next month (unless the user says no)

**If `command-tracker.md` is missing:** assume first run, determine target month and continue normally.

## Step 2 — Gather material

**Search order (cascade):**

1. **Search for weeklies of the target month** (priority source):
   - Read `00 - Daily notes/Weekly/YYYY-W{nn}.md`
   - Identify which weeks W{nn} overlap the target month
   - **If ≥ 1 weekly found and non-empty** → use THESE (stop search)

2. **Fallback: search for dailies of the target month** (secondary source):
   - Read `00 - Daily notes/YYYY-MM-*.md` (all days of the month)
   - **If ≥ 1 daily found and non-empty** → use THESE (stop search)

3. **No source found**:
   - Report to {USER_NAME}: "No weekly or daily for [YYYY-MM]. Options: (1) draft from memory (disclaimer: undocumented), (2) cancel and relaunch end of month, (3) search in alternate directory."
   - **Await explicit decision from {USER_NAME}** — never hallucinate a review without source
   - **Edge case: if {USER_NAME} chooses (1)**, add a "⚠️ Undocumented" block at the start of the review indicating that content comes from memory, not weeklies/dailies

## Step 3 — Build the review

Extract from sources (Step 2) and fill this template:

```markdown
# Review — [Month YYYY]

## 📊 Projects
### [Project Name]
- Progress: [state at end of month]
- Notable points: [decisions, milestones, blockers, key commits if applicable]

### [Project Name] (repeat for each project)
- ...

### (If 0 projects this month)
- Note: No active projects this month

## 🔋 Energy & score
- Average energy: [X]/5 | Min: [X] | Max: [X]
- Average score: [X]/5
- Representative feelings: [2-3 examples from daily notes — ex: *"difficult in the morning, good in the evening (D-12)"*, *"smooth but short (D-24)"*, *"exhausting but satisfied (D-28)"*]
- Observation: [if notable trend — ex: "Energy stable weeks 1-2, decline weeks 3-4 (ISEP overload). Score rising back up end of month."]

## 🔁 Behavioral patterns
- Detected patterns (≥ 3 occurrences):
  - [Pattern 1: short description + count]
  - [Pattern 2: ...]
- (If 0 patterns ≥ 3: "No behavioral pattern repeated ≥ 3 times this month.")

## 🎯 Next month's objectives
- [Intention 1: concrete action from the review]
- [Intention 2: ...]
- [Minimum 1-3 intentions]
```

**Extraction rule:** A pattern only appears in this section if mentioned **≥ 3 times distinctly** in sources. Otherwise → note it but omit from summary.

## Step 4 — Post-mortem & Suggestions

### A. Behavioral patterns → update {USER_NAME}.md

If patterns detected ≥ 3 times:
1. Present to {USER_NAME} the exact pattern (count + source citations)
2. Propose a **targeted and minimal modification** to `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md`, section "Observed patterns"
3. **Await explicit validation from {USER_NAME}** before modification
4. Valid examples:
   - "Architecture decision paralysis blocker without pair review (detected 4x) → add: 'Request review before dev on structural decisions' ?"
   - "End-of-week procrastination pattern (5x) → add: 'Limit empty tasks after 5pm ?' "

If 0 patterns ≥ 3: do not touch {USER_NAME}.md, note "No modification proposed."

### B. Suggested analytical skills

Based on what emerges from the month's review, suggest relevant skills as optional suggestions ({USER_NAME} decides):

- **Always suggest**: `/trace [key idea from the month]` — to trace the evolution of a concept or important decision that marked the month
- **If recurring unactioned ideas were identified**: `/ideas` — to transform the month's patterns into concrete action list
- **If connections between two domains emerged**: `/connect [domain A] [domain B]`
- **If a significant life, career, or project change occurred during the month**: `/compound [strategic question]` — to measure how the vault has changed the answer
- **If `/stranger` dates back more than 30 days** (check `command-tracker.md`): `/stranger` — external portrait to recalibrate end of month

Present in this form:
```
💡 Skills to consider this month:
- /trace [subject] — [reason in 1 sentence]
- /ideas — [what justifies launching it]
[...according to context]
```

## Step 5 — Write and finalize

1. **Create** the monthly review:
   - Folder `00 - Daily notes/Monthly/` (create if it doesn't exist)
   - File: `YYYY-MM.md` with content from Step 3
2. **Update** `{VAULT_PATH}\command-tracker.md`:
   - **Update the existing line** for `/closemonth` with today's date (format: YYYY-MM-DD) in the "Last run" column. Do NOT add a new line — the tracker is a one-line-per-command table. If the `/closemonth` line is missing, create it.
3. **If remaining months in backlog** (Step 1):
   - Ask {USER_NAME}: "Next month (YYYY-MM) to close as well? (Y/N)"
   - If yes → relaunch Step 1 on next month
   - If no → stop

## Rules

- **One month at a time** — never close 2 months in parallel
- **No source** = explicit {USER_NAME} request before fallback (no hallucination)
- **Patterns < 3 times** = ignore them, note "no stabilized pattern"
- **0 projects this month** = acceptable, note in Projects
- **Double closure**: if month already closed, ask {USER_NAME} "This month is already closed. Rewrite? (Y/N)"
- **Project stopped mid-month**: include in Projects as "Status: stopped at [week N]"
- **Mandatory {USER_NAME} validation for**:
  - Backlog months (Step 1, point 4)
  - {USER_NAME}.md modification (Step 4A)
  - Refusal to validate patterns → omit from {USER_NAME}.md, note "Not validated, no modification"
  - Relaunch on next month (Step 5, point 3)
