---
name: closemonth
description: Monthly summary — project progress, energy/score trends, stabilized behavioral patterns (≥ 3 occurrences, ex : "decision paralysis on architecture"), next month's objectives and proposed update to {USER_NAME}.md if patterns confirm. Use when Victor says "closemonth", "month summary", "wrap up the month" or via /closemonth.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected from aggressive optimization**
>
> This skill produces **narrative qualitative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). The preservation of qualitative content takes priority over line reduction.

# Skill : Close Month

## Trigger

- Victor says "closemonth", "month summary", "wrap up the month"
- Command `/closemonth [YYYY-MM]` (argument optional)
- Reminder from `/today` : if it's 1st of month and `/closemonth` in `command-tracker.md` is dated 30+ days ago

## Step 1 — Determine target month and check for missed months

**Selection algorithm (priority order) :**
1. If `YYYY-MM` passed as argument → use that argument (case : manual catch-up or retroactive closure)
2. Otherwise, if it's the **1st of month** → close the **previous month** (case : automatic closure on 1st)
3. Otherwise → close the **current month** (case : voluntary closure mid-month)

Example : If today = 2026-04-01 and no argument → close March (2026-03). If `/closemonth 2026-02` as argument → close February even if current is April.

**Detect missed months :**
1. Read `command-tracker.md` and find latest `/closemonth` occurrence
2. If absent or date > 30 days before today → months are missing
3. Enumerate all uncovered months between last `/closemonth` and target month (inclusive) in chronological order
4. **Ask Victor** : "Missed months detected : [list]. Process in chronological order (Y/N)?" — don't continue without explicit agreement
5. If agreement : process oldest first. After current month ends, re-launch Step 1 for next month (unless Victor says no)

**If `command-tracker.md` absent :** assume first run, determine target month and continue normally.

## Step 2 — Collect material

**Search order (cascade) :**

1. **Search target month's weeklies** (primary source) :
   - Read `00 - Daily notes/Weekly/YYYY-W{nn}.md`
   - Identify which weeks W{nn} span target month
   - **If ≥ 1 weekly found and non-empty** → use THESE (stop search)

2. **Fallback : search target month's dailies** (secondary source) :
   - Read `00 - Daily notes/YYYY-MM-*.md` (all days of month)
   - **If ≥ 1 daily found and non-empty** → use THESE (stop search)

3. **No source found** :
   - Signal to Victor : "No weekly or daily for [YYYY-MM]. Options : (1) write from memory (disclaimer: undocumented), (2) cancel and re-launch end of month, (3) search alternate directory."
   - **Wait for explicit Victor decision** — never hallucinate summary without source
   - **Edge case : if Victor chooses (1)**, add block "⚠️ Undocumented" at start of summary indicating content comes from memory, not weeklies/dailies

## Step 3 — Build summary

Extract from sources (Step 2) and fill this template :

```markdown
# Summary — [Month YYYY]

## 📊 Projects
### [Project name]
- Progress : [end-of-month state]
- Notable points : [decisions, milestones, blockers, key commits if applicable]

### [Project name] (repeat for each project)
- ...

### (If 0 projects this month)
- Note : No active projects this month

## 🔋 Energy & score
- Average energy : [X]/5 | Min : [X] | Max : [X]
- Average score : [X]/5
- Observation : [if notable trend — ex: "Stable energy weeks 1-2, dip weeks 3-4 (ISEP overload). Score recovering end of month."]

## 🔁 Behavioral patterns
- Patterns detected (≥ 3 occurrences) :
  - [Pattern 1 : brief description + count]
  - [Pattern 2 : ...]
- (If 0 pattern ≥ 3 : "No behavioral pattern repeated ≥ 3 times this month.")

## 🎯 Next month's objectives
- [Intention 1 : concrete action from summary]
- [Intention 2 : ...]
- [1-3 intentions minimum]
```

**Extraction rule :** A pattern appears in this section only if mentioned **≥ 3 times distinctly** in sources. Otherwise → note it but omit from synthesis.

## Step 4 — Post-mortem & Proposals

### A. Behavioral patterns → {USER_NAME}.md update

If patterns detected ≥ 3 times :
1. Present exact pattern to Victor (count + source citations)
2. Propose **targeted, minimal** modification of `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\{USER_NAME}.md`, section "Observed patterns"
3. **Wait for explicit Victor validation** before modifying
4. Valid examples :
   - "Decision paralysis on architecture without pair review (detected 4x) → add : 'Request review before dev on structuring decisions' ?"
   - "End-of-week procrastination pattern (5x) → add : 'Limit empty tasks after 5pm ?' "

If 0 pattern ≥ 3 : don't touch {USER_NAME}.md, note "No modifications proposed."

### B. Suggested analytical skills

Based on month's highlights, propose relevant skills as optional suggestions (Victor decides) :

- **Always propose** : `/trace [key month idea]` — to retrace evolution of important concept or decision that marked month
- **If recurring unconsidered ideas identified** : `/ideas` — to turn month's patterns into concrete action list
- **If connections between two domains emerged** : `/connect [domain A] [domain B]`
- **If significant life, career or project shift this month** : `/compound [strategic question]` — to measure how vault changed the answer
- **If `/stranger` is 30+ days old** (check `command-tracker.md`) : `/stranger` — outside portrait for end-of-month recalibration

Present as :
```
💡 Skills to consider this month :
- /trace [subject] — [1-sentence reason]
- /ideas — [what justifies launch]
[...based on context]
```

## Step 5 — Write and finalize

1. **Create** monthly summary :
   - Folder `00 - Daily notes/Monthly/` (create if absent)
   - File : `YYYY-MM.md` with content from Step 3
2. **Update** `{VAULT_PATH}\command-tracker.md` :
   - New line : `/closemonth` today's date (format : YYYY-MM-DD HH:MM)
3. **If remaining missed months** (Step 1) :
   - Ask Victor : "Next month (YYYY-MM) to close too? (Y/N)"
   - If yes → re-launch Step 1 on next month
   - If no → stop

## Rules

- **One month at a time** — never close 2 months in parallel
- **No source** = explicit Victor request before fallback (no hallucination)
- **Patterns < 3 times** = ignore, note "no stabilized patterns"
- **0 projects this month** = acceptable, note in Projects
- **Double closure** : if month already closed, ask Victor "Month already closed. Rewrite? (Y/N)"
- **Project stopped mid-month** : include in Projects as "Status : stopped at [week N]"
- **Victor validation required for** :
  - Missed months (Step 1, point 4)
  - {USER_NAME}.md modification (Step 4A)
  - Refusing pattern validation → omit from {USER_NAME}.md, note "Not validated, no modifications"
  - Re-launch on next month (Step 5, point 3)
