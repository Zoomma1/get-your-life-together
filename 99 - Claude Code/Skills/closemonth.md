---
name: closemonth
description: Monthly summary — project progress, energy/score trends, stabilized behavioral patterns (≥ 3 occurrences, e.g., "architecture decision procrastination"), next month objectives and proposed {USER_NAME}.md update if patterns confirm. Use when user says "closemonth", "month summary", "wrap up the month" or via /closemonth.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of output produced**, not structural compactness.
>
> **For `/evaluateskills`** : if mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill : Close Month

## Triggering

- user says "closemonth", "month summary", "wrap up the month"
- Command `/closemonth [YYYY-MM]` (optional argument)
- Reminder from `/today` : if on 1st of month and `/closemonth` in `command-tracker.md` dated more than 30 days ago

## Step 1 — Determine Target Month and Check for Delays

**Selection algorithm (priority order) :**
1. If `YYYY-MM` passed as argument → use that argument (case : manual catchup or retroactive close)
2. Otherwise, if on **1st of month** → close **previous month** (case : automatic close on 1st)
3. Otherwise → close **current month** (case : voluntary close mid-month)

Example : If today = 2026-04-01 and no argument → close March (2026-03). If `/closemonth 2026-02` as argument → close February even if in April.

**Detect missing months :**
1. Read `command-tracker.md` and find last occurrence of `/closemonth`
2. If missing or date > 30 days before today → months are missing
3. Enumerate all non-covered months between last `/closemonth` and target month (inclusive) in chronological order
4. **Ask {USER_NAME}** : "Missing months detected : [list]. Process in order (Y/N) ?" — don't continue without explicit agreement
5. If agreement : process oldest first. After current month end, relaunch Step 1 for next month (unless user says no)

**If `command-tracker.md` missing :** assume first run, determine target month and continue normally.

## Step 2 — Collect Material

**Search order (cascade) :**

1. **Search for target month's weeklies** (priority source) :
   - Read `00 - Daily notes/Weekly/YYYY-W{nn}.md`
   - Identify which weeks W{nn} overlap target month
   - **If ≥ 1 weekly found and non-empty** → use THESE (stop search)

2. **Fallback : search target month's dailies** (secondary source) :
   - Read `00 - Daily notes/YYYY-MM-*.md` (all days of month)
   - **If ≥ 1 daily found and non-empty** → use THESE (stop search)

3. **No source found** :
   - Signal to {USER_NAME} : "No weekly or daily for [YYYY-MM]. Options : (1) write from memory (disclaimer: undocumented), (2) cancel and relaunch end of month, (3) search alternate directory."
   - **Wait for explicit {USER_NAME} decision** — never hallucinate summary without source
   - **Edge case : if {USER_NAME} chooses (1)**, add "⚠️ Undocumented" block at start indicating content comes from memory, not weeklies/dailies

## Step 3 — Build Summary

Extract from sources (Step 2) and fill this template :

```markdown
# Summary — [Month YYYY]

## 📊 Projects
### [Project Name]
- Progress : [end-of-month state]
- Notable points : [decisions, milestones, blockers, key commits if applicable]

### [Project Name] (repeat for each project)
- ...

### (If 0 projects this month)
- Note : No active projects this month

## 🔋 Energy & Score
- Average energy : [X]/5 | Min : [X] | Max : [X]
- Average score : [X]/5
- Representative feelings : [2-3 examples from daily notes — e.g., *"hard morning, good afternoon (D-12)"*, *"smooth throughout (D-24)"*, *"draining but satisfied (D-28)"*]
- Observation : [if notable trend — e.g., "Stable weeks 1-2, drop weeks 3-4 (ISEP overload). Score recovering end of month."]

## 🔁 Behavioral Patterns
- Detected patterns (≥ 3 occurrences) :
  - [Pattern 1 : short description + count]
  - [Pattern 2 : ...]
- (If 0 pattern ≥ 3 : "No behavioral pattern repeated ≥ 3 times this month.")

## 🎯 Next Month's Objectives
- [Intention 1 : concrete action from summary]
- [Intention 2 : ...]
- [1-3 minimum intentions]
```

**Extraction rule :** A pattern appears in this section only if mentioned **≥ 3 separate times** in sources. Otherwise → note it but omit from synthesis.

## Step 4 — Post-mortem & Proposals

### A. Behavioral Patterns → {USER_NAME}.md Update

If patterns detected ≥ 3 times :
1. Present to {USER_NAME} exact pattern (count + source citations)
2. Propose **targeted and minimal** modification of `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\{USER_NAME}.md`, section "Observed Patterns"
3. **Wait for explicit {USER_NAME} validation** before modification
4. Valid examples :
   - "Architecture decision paralysis without pair review (detected 4x) → add : 'Request review before dev on structural decisions' ?"
   - "Week-end procrastination pattern (5x) → add : 'Limit empty tasks after 5pm ?' "

If 0 pattern ≥ 3 : don't touch {USER_NAME}.md, note "No modification proposed."

### B. Suggested Analytical Skills

Based on summary insights, propose optional skills (user decides) :

- **Always propose** : `/trace [key month idea]` — to trace evolution of important concept or decision that marked the month
- **If recurring unactioned ideas detected** : `/ideas` — to turn month patterns into concrete action list
- **If connections between two domains emerged** : `/connect [domain A] [domain B]`
- **If significant life, career or project change this month** : `/compound [strategic question]` — to measure how vault changed the answer
- **If `/stranger` more than 30 days old** (check `command-tracker.md`) : `/stranger` — external portrait to recalibrate end of month

Present like this :
```
💡 Skills to consider this month :
- /trace [subject] — [1 sentence reason]
- /ideas — [what justifies running it]
[...depending on context]
```

## Step 5 — Write and Finalize

1. **Create** monthly summary :
   - Folder `00 - Daily notes/Monthly/` (create if doesn't exist)
   - File : `YYYY-MM.md` with content from Step 3
2. **Update** `{VAULT_PATH}\command-tracker.md` :
   - New line : `/closemonth` today's date (format : YYYY-MM-DD HH:MM)
3. **If months in backlog remain** (Step 1) :
   - Ask {USER_NAME} : "Next month (YYYY-MM) to wrap too ? (Y/N)"
   - If yes → relaunch Step 1 on next month
   - If no → stop

## Rules

- **One month at a time** — never wrap 2 months in parallel
- **No source** = explicit {USER_NAME} request before fallback (no hallucination)
- **Patterns < 3 times** = ignore them, note "no stabilized pattern"
- **0 projects this month** = acceptable, note in Projects
- **Double close** : if month already closed, ask {USER_NAME} "Month already closed. Rewrite ? (Y/N)"
- **Project stopped mid-month** : include in Projects as "Status : stopped at [week N]"
- **{USER_NAME} validation mandatory for** :
  - Months in backlog (Step 1, point 4)
  - {USER_NAME}.md modification (Step 4A)
  - Refusal to validate patterns → omit from {USER_NAME}.md, note "Not validated, no modification"
  - Relaunch on next month (Step 5, point 3)
