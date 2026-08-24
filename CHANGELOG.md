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

## [1.3.2] — 2026-08-24

Hardening release: 13 skills updated with new safeguards — external-cause checks before pattern anchoring, safer kanban archiving, big cuts to friction-scan false positives, and a health-aware `/today` with goal tracking.

### Changed
- **skill:archivedone** — Adds a hard safeguard so emptying the Done column stops at the next section boundary, kanban-settings block, or archive separator instead of wiping through to the next heading, plus a mandatory before/after diff check and a scratchpad backup before any edit — preventing accidental loss of kanban plugin config or archive markers. _apply: overwrite_
- **skill:author-eval** — Adds a hard rule that the Ollama draft pass must always run on the Mac and never be pointed at the FW16, since the 14b model with its large context window exceeds that machine's VRAM and causes multi-hour silent hangs instead of a clean error. _apply: overwrite_
- **skill:closeday** — Adds a mandatory guard requiring an external-cause check (season, leave, workload) before labeling a recurring gap a "behavioral pattern," and now forbids ever pre-filling the day's score or feeling — both must always be asked and explicitly confirmed by the user, even in the /closeyesterday flow. _apply: overwrite_
- **skill:closemonth** — Adds a guard requiring the model to verify the full path of command-tracker.md (it lives under the Claude Code folder, never the vault root) before concluding it's a first run, preventing a false "no tracker" conclusion that had previously created a duplicate tracker file. _apply: overwrite_
- **skill:closeweek** — Adds the same "external cause" guard as closeday: before anchoring a recurring pattern into the user's profile note, the skill must check for a plausible external cause and, if one exists, rephrase the pattern with its retest condition instead of anchoring it as a stable trait. _apply: overwrite_
- **skill:create-ticket** — Auto-numbering now also scans the Archive folder (not just the live tickets folder) so archived or dropped tickets no longer cause number collisions, and duplicate-title detection now searches the whole vault instead of just the target project folder, catching tickets mistakenly created in the wrong project. _apply: overwrite_
- **skill:digest** — Adds a rule against pairing article titles and dates by list index when a source page yields them as two separate lists, requiring the date to be verified from the article's own page instead — a fix for items surfacing with wrong (including future) dates across several tech sources. _apply: overwrite_
- **skill:friction-scan** — Adds a strict "proof constraint" to the analysis prompt so agents can no longer flag friction based on absence (missing skill invocation, empty field, truncated text) — only positive, cited evidence counts — plus a manual re-check pass and separate counters for sessions-with-friction vs. sessions-actually-read, together cutting false-positive frictions roughly 5-6x. _apply: overwrite_
- **skill:link** — Adds a heuristic that stops proposing new INDEX.md files for folders already indexed by an existing hub note or kanban board (Tickets/, claude-code/, single-skill folders), which had been massively over-flagged as "missing index." _apply: overwrite_
- **skill:recapsession** — Adds a new step that detects when a session cites a CLAUDE.md/skill/ADR rule and then breaks it in the same turn, logging it as a "distillation signal" for /lessons-distill to review later instead of writing to lessons.md directly. _apply: overwrite_
- **skill:refine** — Exploratory tickets now get a quick (under 5 min) inventory check done immediately during refine itself rather than deferred, since refine can only clarify a ticket's initial framing and never correct it from the backlog; "Audit" was also added as a trigger keyword for exploratory tickets. _apply: overwrite_
- **skill:today** — Adds a health-aware veto that suppresses the /stranger reminder when recent daily scores or energy are low (surfacing a visible "hidden by health veto" note once suppressed past 15 days), a new daily "Big Thing" section that surfaces the week's most-neglected annual goal, and new budgeting rules preventing the plan from re-litigating hours the user already declared, allowing a wider task queue on light work days, and requiring tickets with shrinking repeated estimates to be split rather than re-quoted smaller. _apply: overwrite_
- **skill:workon** — Adds a guard that flags when a ticket's time estimate has dropped compared to earlier daily-note mentions of the same ticket, treating that as a sign the estimate was compressed to fit the slot rather than better understood, and proposing to re-break the ticket on its real unknowns before starting. _apply: overwrite_

## [1.3.1] — 2026-08-12

One fix, and it was destroying data silently. The `retention-purge` hook deleted **every** file older than its cutoff, with no exception for Claude Code's memory files — so memory you wrote and never re-edited aged out and vanished. If you use the memory feature, apply this one, then check what you already lost (see below).

### Manual
- **hook:retention-purge.js** — The purge walks `projects/`, `file-history/` and `paste-cache/` and deletes anything past the cutoff, whatever its type. That is intentional and is what bounds the footprint — but it had no exception, so durable agent memory under `~/.claude/projects/**/memory/` was treated as session scratch: any memory file left untouched for 30 days was deleted, silently. `MEMORY.md` itself usually survived, because it is rewritten on every new entry, which left an index pointing at files that no longer existed. Confirmed on two machines. Any directory named `memory/` is now skipped outright, at any depth and for every rule; nothing else about the purge changes. **After applying, check your index**: open each `~/.claude/projects/*/memory/MEMORY.md` and confirm every file it links to still exists — entries whose target is gone are the ones you lost, and only the index remembers them. _apply: manual-hook_

## [1.3.0] — 2026-08-04

Two new skills for backlog and session control — `exec-ready` (what to execute now, under a time constraint) and `handoff` (switch sessions mid-task without losing context) — plus a broad refresh of 29 skills. Three skills that shipped broken since 1.2.0 (`teach`, `improve-codebase-architecture`, `grill-with-docs` referenced companion files that were never published) are now complete. Recurring themes across the refresh: hardcoded IPs replaced by resolvable hostnames, `vault-config.json` used to resolve paths instead of hardcoding them, `command-tracker.md` read to date work instead of assuming a fixed cadence, and essays moved to their own kanban column.

### Added
- **skill:exec-ready** — Chooses what to execute now in the Ready column of the Claude Code Kanban, under a time constraint. Scores tickets by value = impact/effort, returns a top 3, recalls current WIP, and proposes durably weak tickets for purge (never automatic). _apply: new-skill_
- **skill:handoff** — Generates a chat-only session-handoff prompt so you can switch sessions mid-task without losing context: a 5-section prompt (state, next action, references, decisions, skills) to paste into a fresh session after `/clear` or compaction. _apply: new-skill_
- **file:99 - Claude Code/Skills/teach/MISSION-FORMAT.md** — Companion format file `teach` reads but that was never published. _apply: overwrite_
- **file:99 - Claude Code/Skills/teach/GLOSSARY-FORMAT.md** — Companion format file `teach` reads but that was never published. _apply: overwrite_
- **file:99 - Claude Code/Skills/teach/LEARNING-RECORD-FORMAT.md** — Companion format file `teach` reads but that was never published. _apply: overwrite_
- **file:99 - Claude Code/Skills/teach/RESOURCES-FORMAT.md** — Companion format file `teach` reads but that was never published. _apply: overwrite_
- **file:99 - Claude Code/Skills/improve-codebase-architecture/LANGUAGE.md** — Shared vocabulary the skill requires; previously missing. _apply: overwrite_
- **file:99 - Claude Code/Skills/improve-codebase-architecture/HTML-REPORT.md** — Report template the skill requires; previously missing. _apply: overwrite_
- **file:99 - Claude Code/Skills/improve-codebase-architecture/DEEPENING.md** — Deepening pass reference the skill requires; previously missing. _apply: overwrite_
- **file:99 - Claude Code/Skills/improve-codebase-architecture/INTERFACE-DESIGN.md** — Interface design reference the skill requires; previously missing. _apply: overwrite_
- **file:99 - Claude Code/Skills/grill-with-docs/ADR-FORMAT.md** — ADR format reference the skill requires; previously missing. _apply: overwrite_
- **file:99 - Claude Code/Skills/grill-with-docs/CONTEXT-FORMAT.md** — Context format reference the skill requires; previously missing. _apply: overwrite_

### Changed
- **skill:today** — Calendar reading now runs through a dedicated script instead of WebFetch parsing, which handles recurring events, timezones and deduplication properly; adds an exploration-overflow nudge toward `/triage-explo` past 12 items in Ready, and excludes background WIP from the personal time budget. _apply: overwrite_
- **skill:refine** — Adds a ticket recap gate before analysis (catches a misread framing early) and an adversarial pass run by a separate agent with a frozen hostile prompt, returned in two stages: the case against the ticket first, trade-offs only after you react. _apply: overwrite_
- **skill:commit** — Adds a code-review gate before anything else: `/code-review` runs on the uncommitted diff, sized to the diff, and you decide what to fix before the commit breakdown. Also fetches before reasoning about branches and checks the diff scope matches the branch's ticket. _apply: overwrite_
- **skill:closeday** — Reads `command-tracker.md` so work done in parallel Claude Code windows stops being under-reported, and the essay-check cadence becomes per-command (default 15 days) instead of a fixed 7-day threshold. _apply: overwrite_
- **skill:closeweek** — Counts oral-capture entries and flags when that habit dies out, surfaces "structuring projects" (threads with 2+ consecutive evening sessions) separately, and defers pattern anchoring when the week is closed late after a tiring day. _apply: overwrite_
- **skill:closemonth** — Updates the existing `command-tracker.md` line with today's date instead of appending a new one, and writes behavioural patterns to the personal folder rather than the Claude Code folder. _apply: overwrite_
- **skill:harvest** — Proposes "since the last harvest" as the default period, read from `command-tracker.md`, instead of always defaulting to the last 7 days. Mood tracking is removed entirely. _apply: overwrite_
- **skill:link** — Link-existence checks now match on wikilink form only (no substring matching), dead-end detection also counts markdown links and ADR slugs, orphan detection normalizes full-path links and aliases, and the skill refuses to write into kanban board notes. _apply: overwrite_
- **skill:workon** — Adds a real-state gate that checks a ticket's actual completion against its kanban column before working, caps validation tickets at 5 minutes, handles work spanning midnight without inventing wall-clock times, and on closure both moves the ticket and sweeps dependents from Blocked back to Ready. _apply: overwrite_
- **skill:trace** — Now read-only by default: traces are presented in conversation, and writing to the vault happens only if you ask, with a defined destination and frontmatter. _apply: overwrite_
- **skill:create-adr** — Resolves scope from two sources (the projects index plus a filesystem scan for existing ADR folders) instead of the index alone, so projects living outside the standard projects folder are found. _apply: overwrite_
- **skill:recapsession** — Delegates ADR creation and index updates to `/create-adr` after your validation instead of handling them itself, and files project investigation recaps in the project folder rather than in Sessions. _apply: overwrite_
- **skill:digest** — Batches extraction fetches (5 at a time) and adds a mandatory `curl` with HTTP-code inspection before falling back to search, so an extractor failure is no longer mistaken for an empty source. _apply: overwrite_
- **skill:research-scout** — Requires resolving vault paths through `vault-config.json`, adds evaluation rules (skip paid-training-only sources, map the existing setup before candidates, require two relevance indices rather than keyword hits), and reads a resolvable sidecar hostname instead of a hardcoded one. _apply: overwrite_
- **skill:pulse** — Adds a duplicate-run guard that asks before re-running within 48 hours, and stops treating a name-resolution failure as proof the service is down. _apply: overwrite_
- **skill:drift** — Routes essay-shaped drifts (intellectual tensions, opinions to write) to the Essays column instead of creating idea tickets. _apply: overwrite_
- **skill:emerge** — Places essays in their own kanban column rather than mixing them with projects in Idea. _apply: overwrite_
- **skill:ideas** — Routes essays to the dedicated Essays column instead of the Idea column. _apply: overwrite_
- **skill:create-ticket** — Supports an Essay ticket type routed to the Essays column and refined through `/essay`, plus a non-blocking check against dropped tickets that surfaces similar abandoned subjects as reusable material. _apply: overwrite_
- **skill:triage-explo** — Resolves the vault path from `vault-config.json` before launching agents, and renames the synthesis note and structured-output fields for consistency. _apply: overwrite_
- **skill:archivedone** — Counts unchecked Done items as archivable, adds a backlinks pass that checks whether active tickets still reference an item before deleting it, and fixes the archive destination to a vault-relative path. _apply: overwrite_
- **skill:security-audit** — Also audits overly broad allow rules that silently nullify deny rules, and checks that file-tool protection (Read/Edit/Write/Glob/Grep) exists alongside the Bash patterns. _apply: overwrite_
- **skill:lessons-distill** — Records each execution pass in `command-tracker.md`, and `/closeweek` now nudges on a 30-day cadence in addition to the size threshold. _apply: overwrite_
- **skill:friction-scan** — Passes the session's framing message to the analysis agent so expected behaviour stops being reported as friction, and filters automatic sessions by content rather than by folder name. _apply: overwrite_
- **skill:my-world** — Filters session files so proposal notes stop masking real session recaps, and reads a resolvable hostname for the local model instead of a hardcoded address. _apply: overwrite_
- **skill:grill-with-docs** — Reads project context from the agent context store populated at session start, with a fallback to the vault layout, and stops re-fetching context the session hook already injected. _apply: overwrite_
- **skill:process** — Uses a resolvable hostname for the fallback endpoint instead of a hardcoded address. _apply: overwrite_
- **skill:pair-coding** — Adds an explicit rule that "look at the code" means one or two signals to investigate, not a full review — a full review happens only on explicit request. _apply: overwrite_
- **skill:daily-refine** — Aligned with `/refine`'s new adversarial pass: dev tickets now have two stopping points instead of one, and the recap step is no longer skippable. _apply: overwrite_

### Manual
- **hook:secret-guard.js** — Extended from Bash-only to the file tools: `Read`, `Edit`, `Write` and `Grep` are now blocked on sensitive paths (`.env*`, `*.pem`, `*.key`, `id_rsa*`, `.aws/credentials`, `.netrc`, `.ssh/config`), since blocking `cat .env` was pointless while `Read(.env)` walked straight past. Templates (`.env.example`, `.sample`, `.template`, `.dist`) stay allowed. The `# FORCE: ` override remains Bash-only by design. _apply: manual-hook_

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
