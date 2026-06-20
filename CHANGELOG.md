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
