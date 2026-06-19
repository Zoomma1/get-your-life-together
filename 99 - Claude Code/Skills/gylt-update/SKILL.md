---
name: gylt-update
description: Update GYLT vault from the official GitHub repo, driven by versioned patchnotes. Reads the upstream VERSION and CHANGELOG.md, lists every release newer than your installed version, and applies each change exactly as its `_apply:_` action prescribes (new skill, overwrite, protected line-by-line merge, manual hook, or one-time migration). Recommended weekly. Invoke with `/gylt-update`.
---

# Skill: GYLT Update

Update your vault from the official GitHub repo — transparently, at your pace, **driven by
patchnotes**. The upstream `CHANGELOG.md` is the source of truth for *what* changed and *how* to
apply it; git is only the transport that carries the file content.

**Recommended frequency:** weekly (tracked in `command-tracker.md`).

---

## Prerequisites

- Git installed and configured (vault must be a git repo cloned from GitHub)
- Active internet connection

---

## Step 0 — Read LANGUE

Read `99 - Claude Code/config/vault-settings.md`, extract the `langue:` field. Store as `LANGUE`.

- Missing/empty → `LANGUE = EN`
- `LANGUE = EN` → no translation
- `LANGUE ≠ EN` → translation applied when writing files (Step 4)

---

## Step 0.5 — Installed version, protected files & last-synced reference

**Installed version.** Read `99 - Claude Code/config/.gylt-version` (single line, e.g. `1.0.0`).
Store as `INSTALLED`. If missing or empty → `INSTALLED = 0.0.0` (first patchnote-driven run).

**`PROTECTED` — the user-owned file list** (never `git checkout`-ed):

| File / glob | Why it's yours |
|-------------|----------------|
| `99 - Claude Code/config/vault-settings.md` | Your local config: folder names, paths, `langue:`, preferences |
| `Ressources/Templates/**` | Templates you may have personalized |
| `99 - Claude Code/command-tracker.md` | Your personal command cadence |
| `99 - Claude Code/config/.gylt-version`, `99 - Claude Code/config/.gylt-sync-state` | Local state |

**Last-synced reference (for protected merges).** Read `99 - Claude Code/config/.gylt-sync-state`
(single line: the `origin/master` SHA recorded last completed run). Store as `LAST_SYNCED_SHA`.
Missing/empty → unset (first run). This is the baseline for the line-by-line protected merge (Step 4,
`protected-merge`).

---

## Step 1 — Fetch and compare versions

```bash
git fetch origin
git show origin/master:VERSION
```

Store the upstream value as `LATEST`.

- **If `LATEST == INSTALLED`** → display *"Your vault is up to date (vX.Y.Z)."*, update `command-tracker.md`, stop.
- **If `LATEST < INSTALLED`** (local ahead — unusual) → tell the user and stop; don't downgrade.
- **If `LATEST > INSTALLED`** → continue.

Compare versions as SemVer: split on `.`, compare MAJOR then MINOR then PATCH numerically.

---

## Step 2 — Read the patchnotes since INSTALLED

```bash
git show origin/master:CHANGELOG.md
```

Collect every `## [version] — date` release section whose **version > INSTALLED** (SemVer compare).
These are the releases to apply, oldest first.

Within those sections, parse every entry of the form:

```
**<id>** — <summary>. _apply: <action>_   [optional: — steps: <migration steps>]
```

Resolve each **id** to a path:

| id | path |
|----|------|
| `skill:<name>` | `99 - Claude Code/Skills/<name>/SKILL.md` |
| `hook:<name>` | `99 - Claude Code/hooks/<name>` (name includes extension) |
| `config:<name>` | `99 - Claude Code/config/<name>.md` |
| `template:<name>` | `Ressources/Templates/<name>.md` |
| `file:<path>` | the literal path |

Group entries by **action**: `new-skill`, `overwrite`, `protected-merge`, `manual-hook`, `migration`.

> Sanity check: if a `_apply: overwrite_` or `new-skill` entry resolves to a `PROTECTED` path, treat it
> as `protected-merge` instead — patchnotes never override the protected guarantee.

---

## Step 3 — Present the selection menu

Show everything before asking, using the patchnote summaries verbatim:

```
## GYLT updates available — [date]
vINSTALLED → vLATEST   ([N] releases)

### 🆕 New skills            (_apply: new-skill_)
- [ ] /gylt-new-addon — Scaffold a new GYLT addon from templates

### 🔄 Updated               (_apply: overwrite_)
- [ ] install.sh — Bootstrap globs Skills/*/SKILL.md

### 🧭 Migrations            (_apply: migration_ — one-time steps)
- [ ] Skills flat → folder — reorganize Skills/<name>.md into <name>/SKILL.md

### ⚠️ Hooks (manual)        (_apply: manual-hook_)
- [ ] recap-session.js — [summary]  → you'll copy it manually

### 🔒 Protected — your files changed upstream (_apply: protected-merge_, never auto-applied)
- 🔒 vault-settings.md — [summary]  → reviewed line by line, you decide each line

---
Which do you want to apply? (all / selection / none)
```

**Rules for the menu:**
- `all` applies every `new-skill`, `overwrite` and `migration` item. It **never** touches a
  protected file and **never** auto-copies a hook.
- Protected (`protected-merge`) items are notifications, not checkboxes. After the apply phase, ask
  separately: *"Your protected files [list] changed upstream. Review & merge now, line by line? (yes / later)"*
- Migrations are checkboxes but, being one-time and potentially structural, always show their `steps`
  and ask for explicit confirmation before running (Step 4).

---

## Step 4 — Apply

Process selected items by action.

### `new-skill` / `overwrite`

⚠️ Never on a `PROTECTED` path.

**If `LANGUE = EN`:**
```bash
git checkout origin/master -- "<resolved/path>"
```

**If `LANGUE ≠ EN`:**
1. `git show origin/master:"<resolved/path>"`
2. Translate EN→LANGUE: *"Translate this file from English to [LANGUE]. (1) preserve code blocks exactly, (2) preserve `{VARIABLE}` patterns, (3) translate the `description:` value but never `name:`, (4) preserve markdown structure and `[[…]]` links, (5) return only the translated file."*
3. Write the translated content directly to disk (not via `git checkout`).

### `migration`

Show the entry's `steps`. Confirm with the user. Then perform them — prefer doing them yourself
(file moves, etc.) over asking the user to run shell, but show exactly what you did. A migration is
idempotent-friendly: skip a step whose end-state already holds (e.g. a skill already in folder form).

### `manual-hook`

Never auto-copy. First fetch the upstream version into the repo so the copy source is current
(hooks live in the repo, not in `PROTECTED`):
```bash
git checkout origin/master -- "99 - Claude Code/hooks/<hook>"
```
Then display:
```
To update <hook>:
cp "99 - Claude Code/hooks/<hook>" ~/.claude/hooks/
```

### `protected-merge` — line-by-line

Run only if the user accepted the protected review (Step 3). For each `protected-merge` entry whose
file changed between `LAST_SYNCED_SHA` and `origin/master`:

1. Upstream content: `git show origin/master:"<path>"`. Local content: the file on disk.
2. Compute line-level differences (new upstream lines + lines whose value differs from yours).
3. Walk divergent lines in order:
   ```
   <file> — line N
     Your version : hobbies_dir: 02 - Loisirs
     Upstream     : hobbies_folder: 02 - Hobbies
   Keep yours / take upstream / skip? (k / u / s)
   ```
   A purely new upstream line → `Add this new line? (y / n)` (suggest `y`). Batch obviously-cohesive
   new blocks as one unit.
4. Write the merged content directly to disk (**never** `git checkout`). For `LANGUE ≠ EN`, translate
   only the lines adopted from upstream.
5. Confirm: `🔒 <file> merged — X adopted, Y kept.`

If `LAST_SYNCED_SHA` is unset: tell the user it's the first protected sync, show the full current
diff vs upstream as the baseline, run the same flow.

---

## Step 5 — Final report & state

```
✅ [N] items applied   ⏭️ [N] skipped   🔒 [N] protected merged/deferred
Now on vLATEST.
Next update recommended in 7 days.
```

Update `99 - Claude Code/command-tracker.md` — set/add the `/gylt-update` line with today's date.

**Version state.** Write `LATEST` into `99 - Claude Code/config/.gylt-version` (overwrite, single line)
— **but only if every selected non-deferred item was applied**. If the user deferred protected files
or skipped migrations that carry required changes, keep `.gylt-version` at the highest fully-applied
version and say so, so the next run re-offers what's left.

**Protected SHA.** Write the current `origin/master` SHA into `.gylt-sync-state`:
```bash
git rev-parse origin/master > "99 - Claude Code/config/.gylt-sync-state"
```
Advance it **only** if no protected file changed this run, or the user merged all of them. If the user
chose "later", leave `.gylt-sync-state` unchanged so next run re-notifies. Skip both writes if the run
aborted on error.

---

## Absolute rules

- **Patchnote-driven.** Never guess from git diffs — read `CHANGELOG.md`. If `CHANGELOG.md` or
  `VERSION` is missing upstream, tell the user the repo predates patchnotes and stop (don't fall back
  to blind diffing).
- **Never `git pull`** — apply item by item so the user keeps control.
- **Protected files are never `git checkout`-ed** — only the Step 4 `protected-merge` line-by-line flow
  touches them, with the user deciding each line.
- **Only safe to `git checkout`**: non-protected paths under `99 - Claude Code/`, `Ressources/Templates/`
  (non-protected), `README.md`, `LICENSE`, `VERSION`, `CHANGELOG.md`.
- **Hooks = mandatory manual** — never copy a hook to `~/.claude/` without explicit confirmation.
- **A deferred protected review must survive to the next run** — never advance `.gylt-sync-state` when
  the user said "later".
