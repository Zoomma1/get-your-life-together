---
name: lessons-distill
description: Distills and routes the lessons.md file (injected with each prompt by the lessons-loader hook) to the true home of each lesson — SKILL.md, CLAUDE.md, ADR, README, Knowledge note, ticket-hook, or prune. Launch when lessons.md has bloated (size/count threshold), when the user says "distille les lessons", "lessons-distill", "range les lessons", "le lessons.md est trop gros", or when /closeweek nudges it. Runs in DRY-RUN mode by default (produces a routing plan, writes nothing). Real routing only happens after explicit validation by {USER_NAME}, in batches.
---

# Skill: lessons-distill

`lessons.md` is not a permanent vault: it's an **airlock / incubator**. A lesson enters it when `/friction-scan` (or a correction by {USER_NAME}) detects it; it **exits** as soon as it stabilizes — toward the home suited to its type — or becomes stale. The problem we solve: the file is injected **in its entirety with each prompt** by `lessons-loader` (UserPromptSubmit), so every line that shouldn't live there permanently is a per-prompt cost for nothing (unnecessary infrastructure reference in a Theodo session, contract of a skill that doesn't run, duplicate of a rule already in CLAUDE.md…).

**Guiding principle**: *a recurring lesson must graduate to its true home.* In steady-state, `lessons.md` keeps only the **behavioral-global not yet stable enough to graduate**. See [[passe-distillation-lessons-md-graduer-foyer]] (source ticket) and its sibling [[passe-simplicite-claude-md]] (same principle applied to CLAUDE.md).

## Non-negotiable safeguards

- **DRY-RUN by default.** The skill produces a *routing plan* and writes nothing until {USER_NAME} has validated. Execution mode is explicit and separate.
- **Loss-prevention atomicity.** In execution: remove a lesson from `lessons.md` **only after** confirming the destination has received the content. Never an orphan — mirrors the `/create-ticket` rule ("file + kanban, or nothing").
- **Anti-bloat of the destination.** Before appending to a `SKILL.md` / `CLAUDE.md` / README, verify the rule is **not already there**. If it is → it's a *prune*, not another duplicate. Same "one justified home" criterion as the sibling CLAUDE.md.
- **{USER_NAME} validation.** The skill proposes, {USER_NAME} disposes — in bulk or lesson by lesson. **Never** write to a `SKILL.md` / `CLAUDE.md` / ADR without explicit validation.
- **CLAUDE.md = real path.** Edit `99 - Claude Code/CLAUDE.md`, never via the symlink `~/.claude/CLAUDE.md` (Edit refuses to write through it).

## Routing grid

For each lesson, determine **one** destination:

| Lesson type | Destination | Action |
|---|---|---|
| Infra ref / environment (a *fact*, not a behavior) | dedicated Knowledge note, or project README (e.g. HomeLabServeur, Waddle) | append (after anti-duplicate check) |
| Internal to a skill (contract of a specific skill) | the relevant `SKILL.md` | skill edit (diff-review) |
| Decision / structural convention | project or transverse ADR, via `/create-adr` | create the ADR |
| *Global* judgment discipline | `99 - Claude Code/CLAUDE.md` | edit (diff-review) |
| Deterministic binary check (verifiable on an action) | a **hook** | **don't write the hook** → `/create-ticket` (implementation ticket) |
| Duplicate of a rule already present elsewhere | — | prune |
| Stale / obsolete | — | prune (note the reason) |
| Global + behavioral + still **unstable** | stays in `lessons.md` | keep |

**Sort heuristic** — ask yourself, in order:
1. Is it a *fact* about the environment (machine, path, infra, tool gotcha)? → Knowledge/README.
2. Does it apply only to *one* skill? → that `SKILL.md`.
3. Is it already written elsewhere (CLAUDE.md, a skill, an ADR)? → prune.
4. Is it dated and possibly outdated? → re-challenge freshness; prune if stale.
5. Is it a decision/convention that deserves a lasting record? → ADR.
6. Is it a judgment discipline that applies to *all* sessions? → CLAUDE.md (if stable) or keep (if still unstable).
7. Is it a mechanically verifiable invariant on an action? → ticket-hook.

## Procedure

### DRY-RUN mode (default)

1. **Read** `99 - Claude Code/lessons.md` (number the lessons by order of appearance).
2. For each lesson, apply the grid → produce a line `# · short summary · destination · action · (note if freshness doubtful)`.
3. **For destinations "prune duplicate" and "internal skill / CLAUDE.md"**: check the target (grep the destination file) to confirm presence/absence before proposing — don't assume.
4. **Present the plan grouped by destination** (counters per bucket), then ask for validation: in bulk, by batch (e.g. "all prunes", "all infra → such Knowledge note"), or lesson by lesson.
5. **Write no files.** The dry-run stops at the validatable plan.

### EXECUTION mode (after validation, by batch)

For each validated lesson, in order of least risky destinations first (prune duplicate → infra/Knowledge → skill → ADR → CLAUDE.md):
1. **Write to the destination** (append/edit/create per the grid), after anti-duplicate check.
2. **Verify** the write succeeded and content is present.
3. **Only then** remove the lesson from `lessons.md`.
4. For routings → hook: create the ticket via `/create-ticket`, **do not** remove the lesson until the hook exists (the ticket takes over; note in the lesson "→ ticket [[…]]").
5. After each batch: recap what moved, what stays.

### Maintenance (steady-state)

The skill is heavy one-shot the first time. After, `/closeweek` (or the command-tracker) *nudges* a new pass when `lessons.md` crosses a threshold again (size / lesson count). `/closeweek` only nudges, never runs the pass itself.

## Positioning (no overlap)

- `/friction-scan` **creates** lessons (input, pattern detection in sessions).
- `/closeweek` capitalizes {USER_NAME}'s *patterns* → `{USER_NAME}.md` (different target: who {USER_NAME} is, not how Claude operates).
- `/lessons-distill` **routes** existing CC lessons to their home (downstream step). Three stages of the same lifecycle.

## Out of scope

- Writing the **target hooks** (always delegated to an implementation ticket).
- The CLAUDE.md simplification pass itself (sibling [[passe-simplicite-claude-md]]) — `/lessons-distill` *feeds* CLAUDE.md but does not de-duplicate it.
