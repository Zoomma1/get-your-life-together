---
name: evaluateskills
description: Monthly maintenance of all skills — self-evaluation, sync with Anthropic's skill-creator, qualitative review and application of fixes. Trigger when the user says "evaluate the skills", "maintenance skills", "check the skills", "are the skills up to date?", or at the end of a skill creation session.
---

# Skill: Evaluate Skills

Monthly maintenance of all vault skills. This skill always begins by self-evaluating and syncing with Anthropic's skill-creator principles before analyzing other skills.

Each skill is evaluated, mutated if necessary, and the loop runs until convergence (stable or perfect score). Everything is logged in a log file. A backup is created before any modification.

## Triggering

- the user says "evaluate the skills", "maintenance skills", "/evaluateskills"
- Recommended frequency: once per month
- Optional: target a subset ("evaluate the dev skills", "evaluate only workon")

**Reduced scope mode (1 skill only)**: if {USER_NAME} asks to evaluate a single skill (e.g., "run evaluateskills on today"), **skip Step 0.5** (global skill-creator sync) and go directly to Step 1 (backup) then run the Haiku agent on the targeted file. Do not trigger mass self-evaluation on all skills.

---

## Step 0 — Backup

Before any modification, create a snapshot of the current state of skills.

1. Create the folder `99 - Claude Code/Skills/Archives/YYYY-MM-DD_HH-MM/` (current date and time)
2. Copy all `.md` files from `Skills/` into this folder (excluding `Archives/` itself)
3. Confirm the number of files copied before continuing

Confirm the number of files backed up. Do not continue to Step 1 unless the backup is completely created.

---

## Step 0.5 — Self-evaluation and skill-creator sync

Before evaluating other skills, this skill evaluates itself.

### Sync with Anthropic's skill-creator

Load `document-skills:skill-creator` and read its content entirely.

Look for principles or rules not yet reflected in Step 2 of this skill:
- New skill writing heuristics
- New evaluation patterns or problem categories
- Changes in structure recommendations

Identify any new elements discovered. Present {USER_NAME} with the proposed diff for Step 2. Wait for explicit validation from {USER_NAME} before continuing.

### Self-evaluation

Read this file with the same principles as Step 2. Identify all possible issues (wording, structure, edge cases) according to the 7 criteria.

Present the issues found to {USER_NAME}. Apply the validated fixes. Once complete, proceed to Step 1.

---

## Step 1 — Inventory

1. Read `99 - Claude Code/Skills/INDEX.md` — list of all active skills
2. Read `99 - Claude Code/skills-autoresearch-log.md` if it exists — to know the history of mutations per skill
3. Build the list of skills to evaluate:
   - If {USER_NAME} specifies a scope → limit to that scope
   - Without specification → all skills listed in INDEX.md

Present the list and confirm with {USER_NAME} before starting.

---

## Step 2 — Evaluation principles

For each skill, apply these principles as **analysis lenses** — understand why a problem exists rather than mechanically checking boxes.

### Scoring — 7 criteria (/7)

Each criterion is worth 1 point. The score is calculated by the agent at each cycle.

| # | Criterion | Question asked |
|---|-----------|----------------|
| 1 | **Description** | Does the description trigger the skill in the right contexts, with enough concrete formulations? |
| 2 | **Lean** | Does each instruction deserve its place? No duplicated rule, no unnecessary reading? |
| 3 | **Wording** | Are the instructions in imperative form, without ambiguity or vague conditionals? |
| 4 | **Edge cases** | Are realistic boundary scenarios covered (missing file, unexpected format, empty list)? |
| 5 | **Structure** | Is the logic in a single place? No fragmentation across steps? |
| 6 | **Pair-programming** | Does the skill involve no autonomous action without validation from {USER_NAME}? |
| 7 | **Output quality** | Does the skill produce output consistent with its declared intention? For skills marked `narrative_critical: true`, richness (grouping, multi-day reflection, open questions) takes priority over conciseness — a shorter version that removes it is a regression, not an improvement. |

> **Note for `narrative_critical: true` skills**: criterion 7 is prioritary. If a mutation improves criteria 2 (Lean) or 5 (Structure) but degrades criterion 7, it is a clear regression — do not apply it.

### Problem categories

Issues from static analysis:
- `[BUG]` — incorrect or broken behavior
- `[STRUCTURE]` — suboptimal organization
- `[LEAN]` — unnecessary or redundant content
- `[WORDING]` — ambiguous formulation
- `[LOGIC]` — incorrect rule or routing
- `[EDGE]` — uncovered boundary case

Issues from dry-run (autoresearch):
- `[DRIFT]` — the simulated skill diverges from its declared intention
- `[SILENT_FAIL]` — realistic scenario uncovered, the skill stops without signaling it
- `[ASSUMPTION]` — the skill assumes an external condition that may not hold

### Principles from Anthropic's skill-creator

**Lean** — Each instruction must deserve its place. If a rule or step has no observable impact on behavior, it should not be there.

**Why rather than how** — Instructions that explain *why* are more robust than those that say *what to do*. A MUST, ALWAYS, or NEVER in capitals is a red flag — can it be replaced with an explanation of the reasoning?

**Theory of mind** — The model is intelligent. Trust it to generalize from examples rather than prescribe everything. Overly rigid instructions produce rigid behaviors.

**Imperative form** — Instructions must be formulated imperatively ("Read the file", "Propose a fix"). Conditional or present participle is less clear — signal `[WORDING]`.

**Boundary cases** — Uncovered scenarios create unpredictable behaviors. Look for unhandled "what ifs".

**No surprises** — The skill does what its name and description promise, without hidden side effects.

### Principles specific to this vault

**Description quality** — The `description` in the frontmatter is the primary automatic triggering mechanism. Too vague a description = skill never triggered. Verify it includes multiple natural formulations and concrete situations.

Note: Claude tends to undertrigger — not using a skill even when it would be useful. A good description is slightly "pushy": it lists specific contexts and formulations {USER_NAME} would actually use. It targets complex/multi-step tasks — Claude does not trigger skills for simple requests it can handle directly.

**Valid YAML frontmatter** — No `##` before keys, no duplicate keys.

**Lazy loading** — Read only what is necessary for the current step.

**Routing logic** — Destinations (kanban, vault folder) must be correct for all content types.

**Structural coherence** — The logic of one section must be in a single place.

**Pair-programming compatibility** — No skill should imply that Claude takes initiative without validation from {USER_NAME}.

**Numbering and references** — No gaps in numbers, no `2b` in a numbered sequence.

**No redundancy** — A rule present in the Absolute Rules AND in the skill body is noise.

**Size limit** — An effective skill fits under 500 lines. Beyond that, signal `[LEAN]` to examine.

**Bundled resources** — If a skill regenerates the same boilerplate code at each run, signal `[EDGE]`: that content belongs in `scripts/` or `references/`.

---

## Step 3 — Batch evaluation (Haiku)

**BATCH_SIZE = 8** (adjustable based on observed token consumption).

For each batch:

1. Take the next N skills from the list
2. Spawn N **Haiku background agents** in parallel with the prompt below
3. Wait for all batch agents to complete
4. Display the batch recap (see Step 3.5)
5. Request confirmation: **"Batch [X/Y] complete ([N] skills processed, [M] remaining). Continue? [go / stop]"**
6. If go → next batch. If stop → save state and proceed to Step 4 with what has been processed.
7. If an agent returns nothing or fails → log `[FAILED] [skill name]` to the log and continue the batch without blocking.

**Agent prompt (model: Haiku):**

Never read skill files in the main context to build this prompt. Pass only the path — the agent reads it itself.

```
You are evaluating and improving the skill: [skill name]
File path: [complete absolute path]

Start by reading the file at that path.

If the frontmatter contains `narrative_critical: true`: protected mode activated.
- Any reduction targeting prescriptive narrative instructions (grouping, multi-day reflection, open questions, key moments) is a regression on criterion 7, even if it improves criterion 2 (Lean). The skill needs these instructions to produce its characteristic output — theory of mind does not compensate for their absence.
- Criterion 7 "Output quality" takes priority over criteria 2 and 5 for this skill.

INVOCATION SCENARIO TO SIMULATE:
Generate yourself a realistic scenario based on the skill's name and description.
Example: if the skill is called "workon", simulate {USER_NAME} saying "workon FSTG".

ABSOLUTE CONSTRAINT: Never modify file paths, tool names,
shell commands, or variable names in the skill. Modify only
the structure, clarity and formulation of instructions.

IMPROVEMENT CYCLE — run until convergence (max 5 iterations):

Iteration N:
1. Initial score — evaluate the skill on 7 criteria (/7) + identify all issues ([BUG], [LEAN], [WORDING], [LOGIC], [EDGE], [DRIFT], [SILENT_FAIL], [ASSUMPTION])
2. If score == 7 or no issues → STABLE, stop
3. Generate a mutated version: rewrite the skill targeting the issues found — keep frontmatter intact
4. Score the mutated version (/7)
5. If mutated score > initial score → write mutation to file (overwrite), log "improved run N: X→Y"
6. If mutated score <= initial score → STABLE, log "converged run N: score X unchanged", keep original
7. Continue to iteration N+1

LOG WRITING:
Append to the end of `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/skills-autoresearch-log.md` (never overwrite).
One entry per skill — initial/final score, iterations, status (improved/stable/converged/max_reached), issues, mutations.

RETURN FORMAT to main context (single line):
`[name]: X/7 → Y/7 improved [NC]` or `[name]: X/7 stable [NC]`  ← if narrative_critical: true detected
`[name]: X/7 → Y/7 improved` or `[name]: X/7 stable`            ← otherwise
```

---

## Step 3.5 — Batch recap

After each batch, display agent return lines (one line per skill):

```
workon: 5/7 → 6/7 improved
today: 2/7 stable
recapsession: 3/7 → 5/7 improved [NC]
...
```

Then ask: **"Batch [X/Y] complete. Continue? [go / stop]"**

Full details of each mutation are in the log — do not re-read them here.

---

## Step 3.6 — Validation dry-run (Sonnet)

Once all batches are complete, identify mutated skills with **delta ≥ 2 points OR whose return contains `[NC]`** (skills with `narrative_critical: true` — dry-run mandatory regardless of delta, because even a 1-point gain can mask a narrative regression).
Skills with delta < 2 without `[NC]` (minor tweaks on non-narrative skills) are considered low risk — no dry-run.

Reference the archive created in Step 0 for each potential restoration. **Archive path: `Skills/Archives/YYYY-MM-DD_HH-MM/`** — replace with the current run's date/time.

For each selected skill, spawn a **Sonnet background agent** with the prompt:

```
You are validating the mutated skill: [skill name]
Mutated file path: [absolute path]
Original path (archive): [absolute path in Archives/YYYY-MM-DD_HH-MM/]

Start by reading both files.

VALIDATION:
1. Simulate a realistic invocation of the mutated skill (generate your own realistic scenario)
2. Verify no regressions were introduced:
   - No file paths modified
   - No shell commands altered
   - Observable behavior remains consistent with the skill's description
3. Score the mutated skill on 7 criteria
4. Verdict: VALID (score ≥ Haiku score) | REVERT (regression detected or score < Haiku score)

Return one line: [name]: VALID X/7 | REVERT — [short reason]
```

Present verdicts to {USER_NAME}:
- **VALID** → mutation accepted, file stays modified
- **REVERT** → immediately restore from archive with `cp -r Skills/Archives/YYYY-MM-DD_HH-MM/[skill].md Skills/[skill].md`

Execute each validated restoration. Signal final status to {USER_NAME} before Step 4.

---

## Step 4 — Final collection and recurring patterns

Once all batches and dry-runs are complete, read `skills-autoresearch-log.md` once:

1. Build the final table from the log
2. Identify recurring patterns (same problem type on multiple skills → signal that the skill creation process needs improvement)

---

## Step 5 — Final review of mutations

Present to {USER_NAME}:
- The final recap table (all batches combined)
- For each validated mutated skill: the diff of applied changes (before/after)
- The recurring patterns identified (Step 4)

Wait for {USER_NAME}'s validation. If a mutated skill should be reverted → restore from `Skills/Archives/YYYY-MM-DD_HH-MM/`.

Once any potential reverts are applied, invoke `/evaluateskills-postmortem` with:
- `ARCHIVE_PATH` = `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/Archives/YYYY-MM-DD_HH-MM/` (Step 0 backup path)
- `MUTATED_SKILLS` = list of validated mutated skills (after potential reverts)

The postmortem is silent if no regression is detected. If it alerts, wait for {USER_NAME}'s decision before proceeding to Step 6.

---

## Step 5.5 — Sync stubs

Execute the sync script to create missing stubs:

```bash
VAULT_PATH=$(jq -r '.vaultPath' ~/.claude/vault-config.json)
if [[ "$OS" == "Windows_NT" ]]; then
  powershell -File "$VAULT_PATH\99 - Claude code\scripts\sync-skills.ps1"
else
  bash "$VAULT_PATH/99 - Claude code/scripts/sync-skills.sh"
fi
```

- If stubs were created: mention them in the final summary
- If everything is up to date: continue without comment

---

## Step 6 — Update autoresearch log

Write to `99 - Claude Code/skills-autoresearch-log.md` (create the file if it does not exist):

```markdown
## Run [YYYY-MM-DD HH:MM]

**Backup**: `Skills/Archives/YYYY-MM-DD_HH-MM/` — N files

| Skill | Initial score | Final score | Iterations | Status |
|-------|--------------|-------------|------------|--------|
| [name] | X/7 | Y/7 | N | improved / stable / converged / max_reached |

### Applied changes
- **[skill]** run 1: [WORDING] description rewritten → score 3→5
- **[skill]** run 2: converged at 5/7

### Recurring patterns
[Types of issues that appear on multiple skills — signal for improvement of the skill creation process]
```

Update `99 - Claude Code/command-tracker.md` with the date/time of the `/evaluateskills` run:
- Format: `| /evaluateskills | [YYYY-MM-DD HH:MM] |` — mark that maintenance was executed
