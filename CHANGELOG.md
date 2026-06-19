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
