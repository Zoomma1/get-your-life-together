---
name: evaluateskills
description: Monthly maintenance of all skills — self-evaluation, sync with Anthropic skill-creator, qualitative review and fix application. Trigger when {USER_NAME} says "evaluate skills", "skills maintenance", "check skills", "are skills up to date?", or at the end of a skill creation session.
---

# Skill: Evaluate Skills

Monthly maintenance of the entire vault skill set. This skill always begins by evaluating itself and synchronising Anthropic's skill-creator principles before analysing other skills.

Each skill is evaluated, mutated if necessary, and the loop runs until convergence (stable score or perfect). Everything is logged in a log file. A backup is created before any modification.

## Trigger

- {USER_NAME} says "evaluate skills", "skills maintenance", "/evaluateskills"
- Recommended frequency: once a month
- Optional: target a subset ("evaluate dev skills", "evaluate workon only")

---

## Step 0 — Backup

Before any modification, create a snapshot of the current state of skills.

1. Create the folder `99 - Claude Code/Skills/Archives/YYYY-MM-DD_HH-MM/` (current date and time)
2. Copy all `.md` files from `Skills/` into this folder (excluding `Archives/` itself)
3. Confirm the number of files copied before continuing

Confirm the number of saved files. Only continue to Step 1 if the backup is completely created.

---

## Step 0.5 — Self-evaluation and skill-creator sync

Before evaluating other skills, this skill evaluates itself.

### Sync with Anthropic skill-creator

Load `document-skills:skill-creator` and read its content in full.

Look for principles or rules not yet reflected in Step 2 of this skill:
- New skill writing heuristics
- New evaluation patterns or problem categories
- Changes in structure recommendations

Identify any newly discovered element. Present the proposed diff for Step 2 to {USER_NAME}. Wait for explicit {USER_NAME} validation before continuing.

### Self-evaluation

Read this file using the same principles from Step 2. Identify all possible issues (wording, structure, edge cases) according to the 7 criteria.

Present found issues to {USER_NAME}. Apply validated fixes. Once complete, continue to Step 1.

---

## Step 1 — Inventory

1. Read `99 - Claude Code/Skills/INDEX.md` — list of all active skills
2. Read `99 - Claude Code/skills-autoresearch-log.md` if it exists — to know the mutation history per skill
3. Build the list of skills to evaluate:
   - If {USER_NAME} specifies a scope → limit to that scope
   - Without specification → all skills listed in INDEX.md

Present the list and confirm with {USER_NAME} before starting.

---

## Step 2 — Evaluation principles

For each skill, apply these principles as **analysis lenses** — understand why a problem exists rather than mechanically ticking boxes.

### Scoring — 7 criteria (/7)

Each criterion is worth 1 point. The score is calculated by the agent at each cycle.

| # | Criterion | Question asked |
|---|---------|----------------|
| 1 | **Description** | Does the description trigger the skill in the right contexts, with enough concrete formulations? |
| 2 | **Lean** | Does each instruction deserve its place? No duplicated rules, no unnecessary reads? |
| 3 | **Wording** | Are instructions in the imperative, without ambiguity or vague conditionals? |
| 4 | **Edge cases** | Are realistic edge scenarios covered (missing file, unexpected format, empty list)? |
| 5 | **Structure** | Is logic in one place? No fragmentation between steps? |
| 6 | **Pair-programming** | Does the skill imply no autonomous action without {USER_NAME} validation? |
| 7 | **Output quality** | Does the skill produce output consistent with its declared intent? For skills marked `narrative_critical: true`, richness (grouping, multi-day perspective, open questions) takes priority over conciseness — a shorter version that eliminates it is a regression, not an improvement. |

> **Note for `narrative_critical: true` skills**: criterion 7 is priority. If a mutation improves criteria 2 (Lean) or 5 (Structure) but degrades criterion 7, it is a clear regression — do not apply it.

### Problem categories

Issues from static analysis:
- `[BUG]` — incorrect or broken behaviour
- `[STRUCTURE]` — suboptimal organisation
- `[LEAN]` — unnecessary or redundant content
- `[WORDING]` — ambiguous formulation
- `[LOGIC]` — incorrect rule or routing
- `[EDGE]` — uncovered edge case

Issues from dry-run (autoresearch):
- `[DRIFT]` — simulated skill diverges from its declared intent
- `[SILENT_FAIL]` — realistic scenario not covered, skill stops without signalling it
- `[ASSUMPTION]` — skill assumes an external condition that may not hold

### Principles from Anthropic's skill-creator

**Lean** — Each instruction must deserve its place. If a rule or step has no observable impact on behaviour, it should not be there.

**Why rather than how** — Instructions that explain *why* are more robust than those that say *what to do*. A MUST, ALWAYS, or NEVER in capitals is a warning signal — can it be replaced with an explanation of the reasoning?

**Theory of mind** — The model is intelligent. Trust it to generalise from examples rather than prescribing everything rigidly. Overly rigid instructions produce rigid behaviours.

**Imperative form** — Instructions must be formulated in the imperative ("Read the file", "Propose a fix"). Conditional or present participle is less clear — `[WORDING]` signal.

**Edge cases** — Uncovered scenarios create unpredictable behaviours. Look for unhandled "what ifs".

**No surprise** — The skill does what its name and description promise, without hidden side effects.

### Principles specific to this vault

**Description quality** — The `description` in the frontmatter is the primary automatic trigger mechanism. Too vague a description = skill never triggered. Verify it includes multiple natural formulations and concrete situations.

Note: Claude tends towards under-triggering — not using a skill even when it would be useful. A good description is slightly "pushy": it lists precise contexts and formulations {USER_NAME} would actually use. It targets complex/multi-step tasks — Claude does not trigger skills for simple requests it can handle directly.

**Valid frontmatter YAML** — No `##` before keys, no duplicate key.

**Lazy loading** — Only read what is needed for the current step.

**Routing logic** — Destinations (kanban, vault folder) must be correct for all content types.

**Structural consistency** — A section's logic must be in one place.

**Pair-programming compatibility** — No skill should imply Claude takes initiative without {USER_NAME} validation.

**Numbering and references** — No gaps in numbers, no `2b` in a numbered sequence.

**No redundancy** — A rule present in both Absolute rules and the skill body is noise.

**Size limit** — An effective skill fits under 500 lines. Beyond that, `[LEAN]` signal to examine.

**Bundled resources** — If a skill regenerates the same boilerplate code every run, `[EDGE]` signal: this content belongs in `scripts/` or `references/`.

---

## Step 3 — Batch evaluation (Haiku)

**BATCH_SIZE = 8** (adjustable based on observed token consumption).

For each batch:

1. Take the next N skills from the list
2. Spawn N **background Haiku agents** in parallel with the prompt below
3. Wait for all agents in the batch to finish
4. Display the batch recap (see Step 3.5)
5. Ask for confirmation: **"Batch [X/Y] complete ([N] skills processed, [M] remaining). Continue? [go / stop]"**
6. If go → next batch. If stop → save state and move to Step 4 with what has been processed.
7. If an agent returns nothing or fails → log `[FAILED] [skill name]` in the log and continue the batch without blocking.

**Agent prompt (model: Haiku):**

Never read skill files in the main context to build this prompt. Pass only the path — the agent reads it itself.

```
You are evaluating and improving the skill: [skill name]
File path: [absolute full path]

Start by reading the file at this path.

If the frontmatter contains `narrative_critical: true`: protected mode activated.
- Any reduction targeting prescriptive narrative instructions (grouping, multi-day perspective, open questions, highlights) is a regression on criterion 7, even if it improves criterion 2 (Lean). The skill needs these instructions to produce its characteristic output — "theory of mind" does not compensate for their absence.
- Criterion 7 "Output quality" takes priority over criteria 2 and 5 for this skill.

INVOCATION SCENARIO TO SIMULATE:
Generate yourself a realistic scenario based on the skill's name and description.
Example: if the skill is called "workon", simulate {USER_NAME} saying "workon FSTG".

ABSOLUTE CONSTRAINT: Never modify file paths, tool names,
shell commands, or variable names in the skill. Modify only
structure, clarity and instruction wording.

IMPROVEMENT CYCLE — run until convergence (max 5 iterations):

Iteration N:
1. Initial score — evaluate the skill on the 7 criteria (/7) + identify all issues ([BUG], [LEAN], [WORDING], [LOGIC], [EDGE], [DRIFT], [SILENT_FAIL], [ASSUMPTION])
2. If score == 7 or no issues → STABLE, stop
3. Generate a mutated version: rewrite the skill targeting found issues — keep frontmatter intact
4. Score the mutated version (/7)
5. If mutated score > initial score → write the mutation to the file (overwrite), log "improved run N: X→Y"
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

After each batch, display the agent return lines (one line per skill):

```
workon: 5/7 → 6/7 improved
today: 2/7 stable
recapsession: 3/7 → 5/7 improved [NC]
...
```

Then ask: **"Batch [X/Y] complete. Continue? [go / stop]"**

The full detail of each mutation is in the log — do not re-read it here.

---

## Step 3.6 — Validation dry-run (Sonnet)

Once all batches are complete, identify mutated skills with a **delta ≥ 2 points OR whose return contains `[NC]`** (skills `narrative_critical: true` — dry-run mandatory regardless of delta, as even a 1-point gain can mask a narrative regression).
Skills with delta < 2 without `[NC]` (minor tweaks on non-narrative skills) are considered low risk — no dry-run.

Reference the archive created in Step 0 for each potential restoration. **Archive path: `Skills/Archives/YYYY-MM-DD_HH-MM/`** — replace with current run's date/time.

For each selected skill, spawn a **background Sonnet agent** with the prompt:

```
You are validating the mutated skill: [skill name]
Mutated file path: [absolute path]
Original path (archive): [absolute path in Archives/YYYY-MM-DD_HH-MM/]

Start by reading both files.

VALIDATION:
1. Simulate a realistic skill invocation (generate yourself a realistic scenario)
2. Verify no regression has been introduced:
   - No file path modified
   - No shell command altered
   - Observable behaviour remains consistent with the skill description
3. Score the mutated skill on the 7 criteria
4. Verdict: VALID (score ≥ Haiku score) | REVERT (regression detected or score < Haiku score)

Return one line: [name]: VALID X/7 | REVERT — [short reason]
```

Present verdicts to {USER_NAME}:
- **VALID** → mutation accepted, file remains modified
- **REVERT** → immediately restore from archive with `cp -r Skills/Archives/YYYY-MM-DD_HH-MM/[skill].md Skills/[skill].md`

Execute each validated restoration. Report final state to {USER_NAME} before Step 4.

---

## Step 4 — Final collection and recurring patterns

Once all batches and dry-runs are complete, read `skills-autoresearch-log.md` once:

1. Build the final table from the log
2. Identify recurring patterns (same type of problem across multiple skills → signal that the skill creation process needs improvement)

---

## Step 5 — Final mutation review

Present to {USER_NAME}:
- The final summary table (all batches combined)
- For each validated mutated skill: the diff of applied changes (before/after)
- Recurring patterns identified (Step 4)

Wait for {USER_NAME} validation. If a mutated skill must be reverted → restore from `Skills/Archives/YYYY-MM-DD_HH-MM/`.

Once any reverts are applied, invoke `/evaluateskills-postmortem` with:
- `ARCHIVE_PATH` = `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/Archives/YYYY-MM-DD_HH-MM/` (path from Step 0 backup)
- `MUTATED_SKILLS` = list of validated mutated skills (after any reverts)

The postmortem is silent if no regression is detected. If it alerts, wait for {USER_NAME}'s decision before moving to Step 6.

---

## Step 5.5 — Sync stubs

Run the sync script to create missing stubs:

```powershell
& "$env:USERPROFILE\.claude\sync-skills.ps1"
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
[Types of problems that recur across multiple skills — signal to improve the creation process]
```

Update `99 - Claude Code/command-tracker.md` with the date/time of the `/evaluateskills` run:
- Format: `| /evaluateskills | [YYYY-MM-DD HH:MM] |` — mark that maintenance was executed
