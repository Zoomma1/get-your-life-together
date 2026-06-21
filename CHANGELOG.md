# Changelog

All notable changes to GYLT. `/gylt-update` reads this file to know **what** changed and
**how** to apply each item — the `_apply: <action>_` tag on every entry is the instruction.

Format: [Keep a Changelog](https://keepachangelog.com) + per-entry `_apply:_` action.
Versioning: [SemVer](https://semver.org) — MAJOR (migration/breaking), MINOR (new skill/feature), PATCH (fix).

## How to read an entry

Each entry is `**<id>** — <summary>. _apply: <action>_`

- **id** — logical, resolved to a path by `/gylt-update`:
  `skill:<name>` → `99 - Claude Code/Skills/<name>/SKILL.md` ·
  `hook:<name>` → `99 - Claude Code/hooks/<name>` ·
  `config:<name>` → `99 - Claude Code/config/<name>.md` ·
  `template:<name>` → `Ressources/Templates/<name>.md` ·
  `file:<path>` → literal path.
- **action** — how `/gylt-update` applies it:
  `new-skill` (add a skill) · `overwrite` (replace, never a protected file) ·
  `protected-merge` (line-by-line, user decides each line) · `manual-hook` (print copy instructions) ·
  `migration` (one-time step; the entry carries `— steps: …`).

---

## [1.2.0] — 2026-06-21

Eleven new skills — a git/dev toolbelt (`commit`, `git-guardrails-claude-code`, `setup-pre-commit`), plan-stressing (`grill-me`, `grill-with-docs`, `spec-challenger`), codebase work (`improve-codebase-architecture`), skill tooling (`author-eval`), and vault flows (`harvest`, `harvestdeep`, `triage-explo`) — plus a `closeday` refresh. `harvest`/`harvestdeep` replace the old `vault-harvest`/`vault-harvest-deep` names.

### Added
- **skill:author-eval** — Generates a complete eval.json for a Claude Code skill via 2-pass pipeline — local draft with Ollama then Sonnet refinement, with a final verify-eval. Use to cover a skill that has no eval.json yet, solo or in batch. _apply: new-skill_
- **skill:commit** — Guided commit on explicit /commit — breaks changes into atomic commits ordered by layer, two validations (files, then message), handles branch creation/switch with stash, then git add + commit. Never pushes, merges, rebases or resets. _apply: new-skill_
- **skill:git-guardrails-claude-code** — Sets up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute. _apply: new-skill_
- **skill:grill-me** — Interviews the user relentlessly about a plan or design until shared understanding, resolving each branch of the decision tree. Use to stress-test a plan. _apply: new-skill_
- **skill:grill-with-docs** — Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates docs (CONTEXT.md, ADRs) inline as decisions crystallise. _apply: new-skill_
- **skill:harvest** — Scans daily notes to extract ideas to capitalize on and links to process. (Replaces `vault-harvest`.) _apply: new-skill_
- **skill:harvestdeep** — Complete vault scan over an extended period to detect emerging patterns, cross-context recurring ideas, and deep connections. Use monthly. (Replaces `vault-harvest-deep`.) _apply: new-skill_
- **skill:improve-codebase-architecture** — Finds deepening opportunities in a codebase, informed by the project's CONTEXT.md domain language and ADRs. Use to improve architecture, find refactors, make a codebase more testable and AI-navigable. _apply: new-skill_
- **skill:setup-pre-commit** — Sets up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. _apply: new-skill_
- **skill:spec-challenger** — Critical audit of a specs or architectural decision document by a jaded but constructive staff engineer — challenges everything, identifies blind spots, proposes alternatives. Invoke before implementation. _apply: new-skill_
- **skill:triage-explo** — Sorts exploration tickets in the Ready column via read-only agents, classifying each as Knowledge note, implementation ticket, or keep-as-exploration. Stops at a verdict table for user validation. _apply: new-skill_
### Changed
- **skill:closeday** — End-of-day wrap-up refreshed: generalized hobby WIP detection and minor wording. _apply: overwrite_
### Migration
- **Renamed skills** — `vault-harvest`→`harvest`, `vault-harvest-deep`→`harvestdeep`; `vault-link` dropped (already superseded by `link`). _apply: migration_ — steps: delete folders `99 - Claude Code/Skills/vault-harvest`, `99 - Claude Code/Skills/vault-harvest-deep`, and `99 - Claude Code/Skills/vault-link` if present — they are replaced by `harvest`, `harvestdeep`, and `link` respectively.

## [1.1.0] — 2026-06-20

Three new skills (`/lessons-distill`, `/link`, `/teach`), refreshed `closeweek` / `create-adr` / `today` / `resumelastsession`, and a `recap-session` hook fix.

### Added
- **skill:lessons-distill** — Distills and routes a bloated `lessons.md` to each lesson's true home (SKILL.md, CLAUDE.md, ADR, README, Knowledge note, ticket-hook, or prune). Dry-run by default; real routing only after explicit validation, in batches. _apply: new-skill_
- **skill:link** — Analyzes the vault and creates `[[]]` links between related notes. Trigger with "/link", "do the linking", "link my notes". _apply: new-skill_
- **skill:teach** — Teaches you a new skill or concept within the workspace, step by step. _apply: new-skill_

### Changed
- **skill:create-adr** — Scope clarified to project/transverse vault ADRs, distinct from the dev-addon's `create-context-adr`; resolves scope + target-folder naming convention and updates the right INDEX.md. _apply: overwrite_
- **skill:closeweek** — Refreshed weekly-summary flow (accomplishments, insight-oriented learnings, recurring-pattern capitalization, watchlist revisit, next-week projection). _apply: overwrite_
- **skill:today** — Refreshed day-planning flow: energy-adapted agenda from daily notes, sessions, project kanbans, mood tracker and calendar; adapts to the time of day. _apply: overwrite_
- **skill:resumelastsession** — Refreshed "resume last work session" flow: reloads the previous session, project context, and what changed since. _apply: overwrite_

### Manual
- **hook:recap-session.js** — Fix: only recap on a genuine session-end reason; reason-less spurious/duplicate fires no longer burn the dedup marker. _apply: manual-hook_

## [1.0.0] — 2026-06-19

First versioned release. GYLT now ships a `VERSION` file and these patchnotes; `/gylt-update`
is patchnote-driven from here on (it reads this file instead of guessing from git diffs).

### Added
- **skill:gylt-new-addon** — Scaffold a new GYLT addon (skills/hooks/installer) from templates, so anyone can package and share a set of skills on top of GYLT. _apply: new-skill_

### Changed
- **file:install.sh** — Bootstrap now globs `Skills/*/SKILL.md` (folder-per-skill). _apply: overwrite_
- **file:install.ps1** — Same, PowerShell side. _apply: overwrite_

### Migration
- Skills moved from flat `Skills/<name>.md` to folder `Skills/<name>/SKILL.md`, so each skill can carry sibling templates. _apply: migration_ — steps: for each `99 - Claude Code/Skills/<name>.md` (a plain file, not already a folder), create `99 - Claude Code/Skills/<name>/` and move the file to `<name>/SKILL.md`. Re-run `install.sh` afterwards to refresh the command stubs.
