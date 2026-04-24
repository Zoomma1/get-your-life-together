---
name: gylt-update
description: Update GYLT vault from official GitHub repo. Compare local version with latest GitHub version, summarize what each change brings, and let the user choose what to apply. Recommended weekly. Invoke with `/gylt-update` or when manual update is desired.
---

# Skill: GYLT Update

Update your vault from the official GitHub repo — transparently and at your pace.

**Recommended frequency:** weekly (tracked in `command-tracker.md`).

---

## Prerequisites

- Git installed and configured (vault must be a git repo cloned from GitHub)
- Active internet connection

---

## Step 1 — Check for available updates

```bash
git fetch origin
git log HEAD..origin/master --oneline
```

**If no commits ahead** → display:
> "Your vault is up to date. No updates available."
Update `command-tracker.md` and stop.

**If commits exist** → continue.

---

## Step 2 — List modified files

```bash
git diff HEAD..origin/master --name-only
```

Categorize files:

| Category | Pattern |
|----------|---------|
| New skills | `99 - Claude Code/Skills/*.md` absent locally |
| Updated skills | `99 - Claude Code/Skills/*.md` present locally but different |
| Config | `99 - Claude Code/config/*.md` |
| Templates | `Ressources/Templates/*.md` |
| Hooks | `99 - Claude Code/hooks/*.js` |
| Other | README.md, LICENSE, etc. |

---

## Step 3 — Summarize each change

For each modified file, produce summary in **1-2 sentences**:

**New skill** → read frontmatter `description` from GitHub version:
```bash
git show origin/master:"99 - Claude Code/Skills/[name].md" | head -20
```
→ Display: `🆕 /[name] — [frontmatter description]`

**Updated skill** → read diff and produce human summary:
```bash
git diff HEAD..origin/master -- "99 - Claude Code/Skills/[name].md"
```
→ Read added/removed lines, summarize in 1-2 sentences what functionally changed (not technical details). Examples:
- *"Improves daily task selection: deterministic order and inactive project detection."*
- *"Adds automatic `/refine` invocation when refining ideas."*

**Config** → briefly describe change (ex: *"Adds `claude_code_folder` field for more flexibility."*)

**Template** → describe template update.

**Hooks** → signal hooks changed and recommend reinstalling manually (see Step 5).

---

## Step 4 — Present selection menu

Display complete summary before asking what to apply:

```
## GYLT updates available — [date]
[N commits since your last version]

### 🆕 New skills
- [ ] /dump — Mental dump → follow-up questions → dated note in daily journal
- [ ] /essay — Guided essay writing with questions (outline + Q&A + formatting)
... (complete list)

### 🔄 Updated skills
- [ ] /today — Deterministic task selection + inactive project detection + /refine invocation on refinement
- [ ] /workon — Semantic search in past sessions to load topic history
... (complete list)

### ⚙️ Config
- [ ] vault-settings.md — Adds claude_code_folder field

### 📄 Templates
- [ ] Daily notes template.md — Daily journal template (new)

### ⚠️ Hooks (manual action recommended)
- [ ] recap-session.js — [change summary]
     → To apply: copy manually to ~/.claude/hooks/

---
Which elements do you want to apply? (all / selection / none)
```

**If user replies "all"** → apply all non-hook elements.
**If selection** → apply only checked elements.
**If "none"** → stop, update tracker anyway.

---

## Step 5 — Apply selected updates

For each selected file (excluding hooks):

```bash
git checkout origin/master -- "[file/path]"
```

For **selected hooks**: don't apply automatically. Display instead:
```
To update recap-session.js:
cp "99 - Claude Code/hooks/recap-session.js" ~/.claude/hooks/
```
(or equivalent path for OS)

---

## Step 6 — Final report

Display:
```
✅ [N] files updated
⏭️  [N] files skipped

Next update recommended in 7 days.
```

Update `99 - Claude Code/command-tracker.md` — add or update `/gylt-update` line with today's date.

If `/gylt-update` line missing from command-tracker → add it:
```
| /gylt-update | [date] | 7 days |
```

---

## Absolute rules

- **Never run `git pull`** — apply file by file so user keeps control
- **Never overwrite personal note files** — only `99 - Claude Code/`, `Ressources/Templates/`, `README.md`, `LICENSE`
- **Hooks = mandatory manual** — never copy hook to `~/.claude/` without explicit confirmation
- **If conflict detected** (local file modified by user) → signal and skip, don't overwrite
