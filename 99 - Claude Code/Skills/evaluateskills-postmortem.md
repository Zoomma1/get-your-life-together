---
name: evaluateskills-postmortem
description: Automatic post-mortem after each /evaluateskills run — compares each mutated skill to the baseline archive pre-run to detect dormant narrative regressions. Invoke automatically from Step 5 of evaluateskills, with ARCHIVE_PATH and MUTATED_SKILLS as inputs. Do not invoke manually except to re-audit a past run.
narrative_critical: true
---

# Skill: Evaluateskills Postmortem

3rd line of defense against narrative drift in skills. Compares each skill mutated during the current run to its state **before** the run (Step 0 archive), via read-only Haiku agents.

**Why this is necessary**: the dry-run (Step 3.6 of evaluateskills) compares the current original to the mutated version *during* the run — it does not see cumulative drift over multiple runs. This skill compares the pre-run archive to the final version *after* the run, from session memory. This is what detects dormant bugs like the closeday bug of 2026-04-15 (5 mutations each scraping 1 point, below the dry-run's radar).

## Required Inputs

Invoked with:
- `ARCHIVE_PATH` — absolute path of the archive created at Step 0 (e.g., `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/Archives/2026-04-16_14-30/`)
- `MUTATED_SKILLS` — list of skills mutated during the run: names + absolute paths to current versions

If `ARCHIVE_PATH` is missing or invalid: notify {USER_NAME} and skip the postmortem without blocking Step 6.

---

## Step 1 — Parallel Audit (Haiku, read-only)

For each skill in `MUTATED_SKILLS`, spawn a **background Haiku agent** in parallel. Agents do not modify any files.

**Agent prompt (model: Haiku):**

```
You audit the changes made to the skill: [skill name]

Current file (post-run): [absolute path current]
Baseline file (pre-run): [ARCHIVE_PATH]/[skill-name].md

Begin by reading both files.

MISSION: identify differences between baseline and current, categorize each one.

Categories:
- BUG_FIX — correction of incorrect behavior
- EDGE_CASE — coverage of missing edge case scenario
- REFACTOR — restructuring without functional impact
- WORDING_NEUTRE — reformulation without loss of information
- NARRATIVE_REMOVAL — removal of instructions that condition output richness (grouping, multi-day retrospective, open questions, pivotal moments, analytical dimensions)
- LEAN_AGGRESSIF — reduction that removes functional content, not just noise
- UNCERTAIN — change with ambiguous impact on output

If frontmatter contains `narrative_critical: true`: lower detection threshold for NARRATIVE_REMOVAL — any prescriptive instruction removed is to be flagged, even if it seems redundant on the surface. These instructions exist for a reason: they condition the output.

VERDICT per change: KEEP (improvement or neutral) | RESTORE (probable regression)

RETURN FORMAT (single line if CLEAN, structured block if ALERT):
[name]: [categories detected] | VERDICT: CLEAN
[name]: NARRATIVE_REMOVAL, LEAN_AGGRESSIF | VERDICT: ALERT
  → RESTORE: [precise diff — removed lines, with sufficient context for surgical rollback]
```

If an agent fails or returns nothing: log `[postmortem FAILED] [skill name]` and continue without blocking.

---

## Step 2 — Aggregation and Decision

Wait for all agents, then:

**If all verdicts are CLEAN**:
Nothing to display to {USER_NAME}. Silently append to `skills-autoresearch-log.md`:
```
[postmortem] Run [date] : N skills audited — no regression detected.
```
Let evaluateskills continue to its Step 6.

**If ≥1 verdict ALERT**:
Display to {USER_NAME} **before** moving to Step 6:

```
⚠️ Postmortem — regressions detected in this run

| Skill | Categories | Content Removed |
|-------|-----------|-----------------|
| [name] | NARRATIVE_REMOVAL | [precise diff] |

For each skill in ALERT:
- RESTORE → restore from archive: cp "[ARCHIVE_PATH]/[skill].md" "Skills/[skill].md"
- KEEP → accept the mutation despite the signal (to justify)
- INSPECT → display full diff for manual decision
```

Wait for {USER_NAME}'s decision skill by skill. Do not move to Step 6 until each ALERT has received a response.
