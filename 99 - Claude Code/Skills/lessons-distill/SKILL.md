---
name: lessons-distill
description: Distills and routes the lessons.md file (injected with each prompt by the lessons-loader hook) to the correct home for each lesson — SKILL.md, CLAUDE.md, ADR, README, Knowledge note, ticket-hook, or prune. Launch when lessons.md has bloated (size/count threshold), when the user says "distill the lessons", "lessons-distill", "tidy up the lessons", "the lessons.md is too big", or when /closeweek nudges it. Runs in DRY-RUN mode by default (produces a routing plan, writes nothing). Actual routing only happens after explicit validation by {USER_NAME}, in batches.
---

# Skill: lessons-distill

`lessons.md` is not a permanent vault: it's a **gateway / incubator**. A lesson enters it when `/friction-scan` (or a correction by {USER_NAME}) detects it; it **exits** as soon as it's stable — toward the home suited to its type — or if it's outdated. The problem we're solving: the file is injected **in its entirety with each prompt** by `lessons-loader` (UserPromptSubmit), so every line that shouldn't live there permanently is a per-prompt cost for nothing (unreferenced infrastructure in a Theodo session, a skill's contract that doesn't run, a duplicate of a rule already in CLAUDE.md…).

**Guiding principle**: *a recurring lesson should graduate to its true home.* In steady-state, `lessons.md` keeps only **global behavioral patterns not yet stable enough to graduate**. See [[distillation-pass-lessons-md-graduate-home]] (source ticket) and its sibling [[pass-simplify-claude-md]] (same principle applied to CLAUDE.md).

## Non-negotiable safeguards

- **DRY-RUN by default.** The skill produces a *routing plan* and writes nothing until {USER_NAME} validates. Execution mode is explicit and separate.
- **Anti-loss atomicity.** In execution: remove a lesson from `lessons.md` **only after** confirmation that the destination received the content. Never an orphan — mirrors the `/create-ticket` rule ("file + kanban, or nothing").
- **Anti-re-bloat of destination.** Before appending to a `SKILL.md` / `CLAUDE.md` / README, check that the rule is **not already there**. If it is → it's a *prune*, not another duplicate. Same "one justified home" criterion as the sibling CLAUDE.md.
- **{USER_NAME} validation.** The skill proposes, {USER_NAME} disposes — in block or lesson by lesson. **Never** write to a `SKILL.md` / `CLAUDE.md` / ADR without explicit validation.
- **CLAUDE.md = true path.** Edit `99 - Claude Code/CLAUDE.md`, never through the symlink `~/.claude/CLAUDE.md` (Edit refuses to write through it).

## Routing grid

For each lesson, determine **one** destination:

| Lesson type | Destination | Action |
|---|---|---|
| Infra / environment reference (*a fact*, not a behavior) | dedicated Knowledge note, or project README (e.g. HomeLabServer, Waddle) | append (after anti-duplicate check) |
| Internal to a skill (contract of a specific skill) | the `SKILL.md` in question | skill edit (diff-review) |
| Decision / structural convention | project or cross-project ADR, via `/create-adr` | create the ADR |
| Global *discipline of judgment* | `99 - Claude Code/CLAUDE.md` | edit (diff-review) |
| Deterministic binary check (verifiable on an action) | a **hook** | **do not write the hook** → `/create-ticket` (implementation ticket) |
| Duplicate of a rule already present elsewhere | — | prune |
| Expired / obsolete | — | prune (note the reason) |
| Global + behavioral + still **unstable** | stays in `lessons.md` | keep |

**Sorting heuristic** — ask yourself, in order:
1. Is it a *fact* about the environment (machine, path, infra, tool gotcha)? → Knowledge/README.
2. Does it apply only to *one* skill? → that `SKILL.md`.
3. Is it already written elsewhere (CLAUDE.md, a skill, an ADR)? → prune.
4. Is it dated and possibly outdated? → re-challenge its freshness; prune if stale.
5. Is it a decision/convention that deserves a permanent record? → ADR.
6. Is it a discipline of judgment that applies to *all* sessions? → CLAUDE.md (if stable) or keep (if still unstable).
7. Is it a mechanically verifiable invariant on an action? → ticket-hook.

## Procedure

### DRY-RUN mode (default)

1. **Read** `99 - Claude Code/lessons.md` (number the lessons by order of appearance).
2. For each lesson, apply the grid → produce a line `# · short summary · destination · action · (note if freshness questionable)`.
3. **For destinations "prune duplicate" and "internal skill / CLAUDE.md"**: verify the target (grep the destination file) to confirm presence/absence before proposing — do not assume.
4. **Present the plan grouped by destination** (counts per bucket), then ask for validation: in block, by batch (e.g. "all prunes", "all infra → that Knowledge note"), or lesson by lesson.
5. **Write no files.** The dry-run stops at the validable plan.

### EXECUTION mode (after validation, in batches)

For each validated lesson, in order of least risky destinations first (prune duplicate → infra/Knowledge → skill → ADR → CLAUDE.md):
1. **Write to the destination** (append/edit/create per the grid), after anti-duplicate check.
2. **Verify** that the write succeeded and the content is present.
3. **Only then**, remove the lesson from `lessons.md`.
4. For routings → hook: create the ticket via `/create-ticket`, **do not** remove the lesson until the hook exists (the ticket takes over; note in the lesson "→ ticket [[…]]").
5. After each batch: summarize what moved, what remains.

### End of pass — log in the command-tracker

**Mandatory after any pass executed** (not after a dry-run): update the `/lessons-distill` line in `99 - Claude Code/command-tracker.md` with today's date.

| Command | Last executed | Recommended frequency |
| --- | --- | --- |
| /lessons-distill | YYYY-MM-DD | 30 days |

If the line doesn't exist yet → create it. Without this date, `/closeweek` can only nudge on raw count (size / number of lessons) and doesn't know if a pass just happened — it then re-nudges on a file already distilled.

### Maintenance (steady-state)

The skill is a heavy one-shot the first time. After that, `/closeweek` (or the command-tracker) *nudges* a new pass when `lessons.md` exceeds a threshold again (size / number of lessons) **or** when the date of last pass exceeds the cadence. `/closeweek` only does the nudge, never the pass.

## Positioning (no overlap)

- `/friction-scan` **creates** the lessons (input, pattern detection across sessions).
- `/closeweek` capitalizes the patterns *of {USER_NAME}* → `{USER_NAME}.md` (different target: who is {USER_NAME}, not how Claude operates).
- `/lessons-distill` **routes** existing CC lessons to their home (downstream step). Three tiers of the same lifecycle.

## Out of scope

- Writing the **target hooks** (always delegated to an implementation ticket).
- The CLAUDE.md simplification pass itself (sibling [[pass-simplify-claude-md]]) — `/lessons-distill` *feeds into* CLAUDE.md but does not de-duplicate it.
