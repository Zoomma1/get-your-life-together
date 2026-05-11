---
name: evaluateskills
description: Monthly maintenance of all skills — auto-evaluation, sync with Anthropic skill-creator, qualitative review and fix application. Trigger when user says "evaluate the skills", "skills maintenance", "check the skills", "are the skills up to date?", or at end of skill creation session.
---

# Skill: Evaluate Skills

Monthly maintenance of all vault skills. This skill always begins by evaluating itself and syncing principles from the Anthropic skill-creator before analyzing other skills.

Each skill is evaluated, mutated if needed, and the loop runs until convergence (stable or perfect score). Everything is tracked in a log file. A backup is created before any modification.

## Trigger

- User says "evaluate the skills", "skills maintenance", "/evaluateskills"
- Recommended frequency: once per month
- Optional: target a subset ("evaluate dev skills only", "evaluate only workon")

**Reduced scope mode (1 skill only)**: if {USER_NAME} asks to evaluate a single skill (ex: "run evaluateskills on today"), **skip Step 0.5** (global skill-creator sync) and go directly to Step 1 (backup) then the Haiku agent on the target file. Don't trigger mass auto-evaluation of all skills.

---

## Step 0 — Backup

Before any modification, create a snapshot of current skill state.

1. Create folder `99 - Claude Code/Skills/Archives/YYYY-MM-DD_HH-MM/` (current date and time)
2. Copy all `.md` files from `Skills/` into this folder (excluding `Archives/` itself)
3. Confirm the number of files copied before continuing

Confirm the number of backed-up files. Only continue to Step 1 if backup is completely created.

---

## Step 0.5 — Auto-evaluation and skill-creator sync

Before evaluating other skills, this skill evaluates itself.

### Sync with Anthropic skill-creator

Load `document-skills:skill-creator` and read its content in full.

Search for principles or rules not yet reflected in Step 2 of this skill:
- New skill writing heuristics
- New evaluation patterns or problem categories
- Changes in structure recommendations

Identify any newly discovered element. Present to {USER_NAME} the proposed diff for Step 2. Wait for explicit {USER_NAME} validation before continuing.

### Auto-evaluation

Read this file using the same principles from Step 2. Identify all possible issues (wording, structure, edge cases) per the 7 criteria.

Present found issues to {USER_NAME}. Apply validated fixes. Once complete, continue to Step 1.

---

## Step 1 — Inventory

1. Read `99 - Claude Code/Skills/INDEX.md` — list of all active skills
2. Read `99 - Claude Code/skills-autoresearch-log.md` if it exists — to know mutation history per skill
3. Build the list of skills to evaluate:
   - If {USER_NAME} specifies a scope → limit to that scope
   - Without specification → all skills listed in INDEX.md

Present the list and confirm with {USER_NAME} before starting.

---

## Step 2 — Evaluation principles

For each skill, apply these principles as **analysis lenses** — understand why a problem exists rather than mechanically checking boxes.

### Scoring — 7 criteria (/7)

Each criterion is worth 1 point. Score is calculated by the agent at each cycle.

| # | Criterion | Question asked |
|---|-----------|----------------|
| 1 | **Description** | Does the description trigger the skill in the right contexts, with enough concrete formulations? |
| 2 | **Lean** | Does each instruction deserve its place? No duplicated rules, no pointless reads? |
| 3 | **Wording** | Are instructions imperative, without ambiguity or fuzzy conditionals? |
| 4 | **Edge cases** | Are realistic edge scenarios covered (missing file, unexpected format, empty list)? |
| 5 | **Structure** | Is the logic in one place? No fragmentation across steps? |
| 6 | **Pair-programming** | Does the skill avoid any autonomous action without {USER_NAME} validation? |
| 7 | **Output quality** | Does the skill produce output conforming to its declared intent? For skills marked `narrative_critical: true`, richness (grouping, multi-day depth, open questions) takes priority over concision — a shorter version that eliminates it is a regression, not an improvement. |

> **Note for `narrative_critical: true` skills**: criterion 7 is priority. If a mutation improves criteria 2 (Lean) or 5 (Structure) but degrades criterion 7, it's a net regression — don't apply it.

### Problem categories

Issues from static analysis:
- `[BUG]` — incorrect or broken behavior
- `[STRUCTURE]` — suboptimal organization
- `[LEAN]` — unnecessary or redundant content
- `[WORDING]` — ambiguous formulation
- `[LOGIC]` — incorrect rule or routing
- `[EDGE]` — uncovered edge case

Issues from dry-run (autoresearch):
- `[DRIFT]` — simulated skill diverges from declared intent
- `[SILENT_FAIL]` — realistic scenario uncovered, skill stops without signaling
- `[ASSUMPTION]` — skill assumes external condition that may not hold

### Principles from Anthropic skill-creator

**Lean** — Each instruction must deserve its place. If a rule or step has no observable impact on behavior, it shouldn't be there.

**Why over how** — Instructions explaining *why* are more robust than those saying *what to do*. A MUST, ALWAYS, or NEVER in caps is an alert signal — can it be replaced with a reasoning explanation?

**Theory of mind** — The model is intelligent. Trust it to generalize from examples rather than prescribe everything hard. Overly rigid instructions produce rigid behavior.

**Imperative form** — Instructions should be imperative ("Read the file", "Propose a fix"). Conditional or participle is less clear — signal `[WORDING]`.

**Edge cases** — Uncovered scenarios create unpredictable behavior. Hunt for "what if" scenarios not addressed.

**No surprises** — The skill does what its name and description promise, without hidden side effects.

### Principles specific to this vault

**Description quality** — The `description` in frontmatter is the primary auto-trigger mechanism. Too vague = skill never invoked. Verify it includes multiple natural formulations and concrete situations.

Note: Claude tends to undertrigger — won't use a skill even when helpful. A good description is slightly "pushy": it lists specific contexts and formulations {USER_NAME} would actually use. It targets complex/multi-step tasks — Claude doesn't trigger skills for simple requests it can handle directly.

**Valid YAML frontmatter** — No `##` before keys, no duplicate keys.

**Lazy loading** — Only read what's necessary for the current step.

**Routing logic** — Destinations (kanban, vault folder) must be correct for all content types.

**Structural coherence** — A section's logic must be in one place.

**Pair-programming compatibility** — No skill should involve Claude taking initiative without {USER_NAME} validation.

**Numbering and references** — No gaps in numbers, no `2b` in a numbered sequence.

**No redundancy** — A rule present in both Absolute rules AND in the skill body is noise.

**Size limit** — An effective skill stays under 500 lines. Beyond that, signal `[LEAN]` for examination.

**Bundled resources** — If a skill regenerates the same boilerplate code each run, signal `[EDGE]`: that content belongs in `scripts/` or `references/`.

---

## Step 3 — Evaluation by batches (Haiku)

**BATCH_SIZE = 8** (adjustable per observed token consumption).

For each batch:

1. Take the next N skills from the list
2. Spawn N **background Haiku agents** in parallel with the prompt below
3. Wait for all agents in the batch to complete
4. Display batch recap (see Step 3.5)
5. Ask for confirmation: **"Batch [X/Y] complete ([N] skills processed, [M] remaining). Continue? [go / stop]"**
6. If go → next batch. If stop → save state and move to Step 4 with what was processed.
7. If an agent returns nothing or fails → log `[FAILED] [skill name]` in log and continue batch without blocking.

**Agent prompt (model: Haiku):**

Never read skill files in main context to build this prompt. Pass only the path — the agent reads itself.

```
You evaluate and improve the skill: [skill name]
File path: [absolute complete path]

Start by reading the file at that path.

If frontmatter contains `narrative_critical: true`: protected mode enabled.
- Any reduction targeting prescriptive narrative instructions (grouping, multi-day depth, open questions, key moments) is a criterion 7 regression, even if it improves criterion 2 (Lean) or 5 (Structure). The skill needs these instructions to produce its characteristic output — "theory of mind" doesn't compensate for their absence.
- Criterion 7 "Output quality" is priority over criteria 2 and 5 for this skill.

INVOCATION SCENARIO TO SIMULATE:
Generate yourself a realistic scenario based on the skill name and description.
Example: if the skill is named "workon", simulate {USER_NAME} saying "workon FSTG".

ABSOLUTE CONSTRAINT: Never modify file paths, tool names,
shell commands, or variable names in the skill. Modify only
structure, clarity, and instruction wording.

IMPROVEMENT CYCLE — loop until convergence (max 5 iterations):

Iteration N:
1. Initial score — evaluate the skill on 7 criteria (/7) + identify all issues ([BUG], [LEAN], [WORDING], [LOGIC], [EDGE], [DRIFT], [SILENT_FAIL], [ASSUMPTION])
2. If score == 7 or no issues → STABLE, stop
3. Generate a mutated version: rewrite the skill targeting found issues — keep frontmatter intact
4. Score the mutated version (/7)
5. If mutated score > initial score → write mutation to file (overwrite), log "improved run N: X→Y"
6. If mutated score <= initial score → STABLE, log "converged run N: score X unchanged", keep original
7. Continue to iteration N+1

LOG WRITING:
Append to end of `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/skills-autoresearch-log.md` (never overwrite).
One entry per skill — initial/final score, iterations, status (improved/stable/converged/max_reached), issues, mutations.

RETURN FORMAT toward main context (single line):
`[name]: X/7 → Y/7 improved [NC]` or `[name]: X/7 stable [NC]`  ← if narrative_critical: true detected
`[name]: X/7 → Y/7 improved` or `[name]: X/7 stable`            ← otherwise
```

---

## Step 3.5 — Batch recap

After each batch, display agent return lines (one per skill):

```
workon: 5/7 → 6/7 improved
today: 2/7 stable
recapsession: 3/7 → 5/7 improved [NC]
...
```

Then ask: **"Batch [X/Y] complete. Continue? [go / stop]"**

Full detail of each mutation is in the log — don't re-read here.

---

## Step 3.6 — Dry-run validation (Sonnet)

Once all batches are complete, identify mutated skills with **delta ≥ 2 points OR return contains `[NC]`** (narrative_critical: true skills — dry-run mandatory regardless of delta, because even a 1-point gain can mask narrative regression).
Skills with delta < 2 and no `[NC]` (minor tweaks on non-narrative skills) are low-risk — skip dry-run.

Reference the archive created in Step 0 for each potential restore. **Archive path: `Skills/Archives/YYYY-MM-DD_HH-MM/`** — replace with current run date/time.

For each selected skill, spawn a **background Sonnet agent** with the prompt:

```
You validate the mutated skill: [skill name]
Mutated file path: [absolute path]
Original file path (archive): [absolute path in Archives/YYYY-MM-DD_HH-MM/]

Start by reading both files.

VALIDATION:
1. Simulate a realistic skill invocation (generate yourself a realistic scenario)
2. Verify no regressions were introduced:
   - No file paths modified
   - No shell commands altered
   - Observable behavior remains consistent with skill description
3. Score the mutated skill on 7 criteria
4. Verdict: VALID (score ≥ Haiku score) | REVERT (regression detected or score < Haiku score)

Return one line: [name]: VALID X/7 | REVERT — [brief reason]
```

Present verdicts to {USER_NAME}:
- **VALID** → mutation accepted, file stays modified
- **REVERT** → restore immediately from archive with `cp -r Skills/Archives/YYYY-MM-DD_HH-MM/[skill].md Skills/[skill].md`

Execute each validated restore. Signal final state to {USER_NAME} before Step 4.

---

## Step 4 — Final collection and recurring patterns

Once all batches and dry-runs are complete, read `skills-autoresearch-log.md` once:

1. Build final table from log
2. Identify recurring patterns (same problem type across multiple skills → signal that skill creation process needs improvement)

---

## Step 5 — Final mutation review

Present to {USER_NAME}:
- Final recap table (all batches combined)
- For each validated mutated skill: diff of changes applied (before/after)
- Recurring patterns identified (Step 4)

Wait for {USER_NAME} validation. If a mutated skill must be reverted → restore from `Skills/Archives/YYYY-MM-DD_HH-MM/`.

Once any reverts are applied, invoke `/evaluateskills-postmortem` with:
- `ARCHIVE_PATH` = `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/Archives/YYYY-MM-DD_HH-MM/` (path of backup from Step 0)
- `MUTATED_SKILLS` = list of validated mutated skills (after any reverts)

Postmortem is silent if no regressions detected. If it alerts, wait for {USER_NAME}'s decision before moving to Step 6.

---

## Step 5.5 — Sync stubs

Run the sync script to create missing stubs:

```bash
if [[ "$OS" == "Windows_NT" ]]; then
  powershell -File "$env:USERPROFILE\.claude\sync-skills.ps1"
else
  bash ~/.claude/sync-skills.sh
fi
```

- If stubs were created: mention them in final summary
- If all up to date: continue without comment

---

## Step 6 — Update autoresearch log

Write to `99 - Claude Code/skills-autoresearch-log.md` (create if missing):

```markdown
## Run [YYYY-MM-DD HH:MM]

**Backup**: `Skills/Archives/YYYY-MM-DD_HH-MM/` — N files

| Skill | Initial score | Final score | Iterations | Status |
|-------|--------------|-------------|------------|--------|
| [name] | X/7 | Y/7 | N | improved / stable / converged / max_reached |

### Changes applied
- **[skill]** run 1: [WORDING] description rewritten → score 3→5
- **[skill]** run 2: converged at 5/7

### Recurring patterns
[Types of issues recurring across multiple skills — signal for process improvement]
```

Update `99 - Claude Code/command-tracker.md` with current run date/time:
- Format: `| /evaluateskills | [YYYY-MM-DD HH:MM] |` — mark that maintenance was executed
