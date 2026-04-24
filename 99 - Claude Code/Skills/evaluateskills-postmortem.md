---
name: evaluateskills-postmortem
description: Automatic post-mortem after each /evaluateskills run — compares each mutated skill against the pre-run archive baseline to detect dormant narrative regressions. Invoke automatically from Step 5 of evaluateskills, with ARCHIVE_PATH and MUTATED_SKILLS as inputs. Do not invoke manually except to re-audit a past run.
narrative_critical: true
---

# Skill: Evaluateskills Postmortem

Third line of defence against narrative drift in skills. Compares each skill mutated during the current run against its state **before** the run (Step 0 archive), via read-only Haiku agents.

**Why this is necessary**: the dry-run (Step 3.6 of evaluateskills) compares the current original to the mutated version *during* the run — it does not see cumulative drift across multiple runs. This skill compares the pre-run archive to the final version *after* the run, from session memory. This is what detects dormant bugs like the closeday bug of 2026-04-15 (5 mutations shaving 1 point each time, below the dry-run radar).

## Required inputs

Invoked with:
- `ARCHIVE_PATH` — absolute path of the archive created in Step 0 (e.g. `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/Archives/2026-04-16_14-30/`)
- `MUTATED_SKILLS` — list of skills mutated during the run: names + absolute paths to the current versions

If `ARCHIVE_PATH` is absent or invalid: signal to {USER_NAME} and skip the postmortem without blocking Step 6.

---

## Step 1 — Parallel audit (Haiku, read-only)

For each skill in `MUTATED_SKILLS`, spawn a **background Haiku agent** in parallel. Agents must not modify any file.

**Agent prompt (model: Haiku):**

```
You are auditing the changes made to skill: [skill name]

Current file (post-run): [absolute current path]
Baseline file (pre-run): [ARCHIVE_PATH]/[skill-name].md

Start by reading both files.

MISSION: identify the differences between baseline and current, categorise each one.

Categories:
- BUG_FIX — correction of incorrect behaviour
- EDGE_CASE — coverage of a missing edge case
- REFACTOR — restructuring with no functional impact
- WORDING_NEUTRAL — rephrasing with no information loss
- NARRATIVE_REMOVAL — removal of instructions that condition the richness of the output (grouping, multi-day perspective, open questions, highlights, analytical dimensions)
- LEAN_AGGRESSIVE — reduction that removes functional content, not just noise
- UNCERTAIN — change with ambiguous impact on the output

If the frontmatter contains `narrative_critical: true`: lower detection threshold for NARRATIVE_REMOVAL — any removed prescriptive instruction must be flagged, even if it appears redundant on the surface. These instructions exist for a reason: they condition the output.

VERDICT per change: KEEP (improvement or neutral) | RESTORE (probable regression)

RETURN FORMAT (single line if CLEAN, structured block if ALERT):
[name]: [detected categories] | VERDICT: CLEAN
[name]: NARRATIVE_REMOVAL, LEAN_AGGRESSIVE | VERDICT: ALERT
  → RESTORE: [precise diff — removed lines, with sufficient context for surgical rollback]
```

If an agent fails or returns nothing: log `[postmortem FAILED] [skill name]` and continue without blocking.

---

## Step 2 — Aggregation and decision

Wait for all agents, then:

**If all verdicts are CLEAN**:
Display nothing to {USER_NAME}. Silently append to `skills-autoresearch-log.md`:
```
[postmortem] Run [date]: N skills audited — no regression detected.
```
Let evaluateskills continue to its Step 6.

**If ≥1 verdict is ALERT**:
Display to {USER_NAME} **before** proceeding to Step 6:

```
⚠️ Postmortem — regressions detected in this run

| Skill | Categories | Removed content |
|-------|-----------|----------------|
| [name] | NARRATIVE_REMOVAL | [precise diff] |

For each skill with ALERT:
- RESTORE → restore from archive: cp "[ARCHIVE_PATH]/[skill].md" "Skills/[skill].md"
- KEEP → accept the mutation despite the signal (justification required)
- INSPECT → display the full diff for manual decision
```

Wait for {USER_NAME}'s decision skill by skill. Do not proceed to Step 6 until each ALERT has received a response.
