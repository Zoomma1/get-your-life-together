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

## Step 0 — Read LANGUE

Read `99 - Claude Code/config/vault-settings.md` and extract the `langue:` field value. Store as `LANGUE`.

- If field is missing or empty → `LANGUE = EN`
- If `LANGUE = EN` → all steps proceed as before (no translation)
- If `LANGUE ≠ EN` → translation will be applied in Step 5

---

## Step 0.5 — Protected files & last-synced reference

Some files in a GYLT vault belong to **you**, not to the upstream repo. They live inside synced
folders, but their content is your own configuration, your customizations, or your local tracking
state. Blindly overwriting them with `git checkout` destroys your data silently — exactly the kind
of trust-breaking bug we refuse to ship.

**`PROTECTED` — the user-owned file list:**

| File / glob | Why it's yours |
|-------------|----------------|
| `99 - Claude Code/config/vault-settings.md` | Your local config: folder names, paths, `langue:`, preferences |
| `Ressources/Templates/**` | Templates you may have personalized (daily note, etc.) |
| `99 - Claude Code/command-tracker.md` | Your personal command cadence |

These files are **never** applied via `git checkout`. When they change upstream you get notified
and offered a **line-by-line merge** where you decide what to keep (Step 5, protected branch).

**Last-synced reference (protected files only):**

Read the local state file `99 - Claude Code/config/.gylt-sync-state`. It contains a single line:
the `origin/master` commit SHA recorded the last time `/gylt-update` ran to completion. Store as
`LAST_SYNCED_SHA`.

- If the file is missing or empty → `LAST_SYNCED_SHA` is unset (first run, or pre-fix vault).
- This SHA is the reference point for "what changed in *your* protected files since you last
  updated" — so the notification shows only genuinely new upstream changes, not the entire history.
- Non-protected files keep using the simpler `HEAD..origin/master` range (Step 1). The known
  caveat — already-applied non-protected changes may be re-listed — is cosmetic and non-destructive,
  and intentionally left out of scope here.

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

Categorize files. **Check `PROTECTED` (Step 0.5) first** — a file matching `PROTECTED` always
goes to the Protected category regardless of which folder it sits in:

| Category | Pattern |
|----------|---------|
| 🔒 Protected (user-owned) | Any file matching `PROTECTED` (Step 0.5) |
| New skills | `99 - Claude Code/Skills/*.md` absent locally |
| Updated skills | `99 - Claude Code/Skills/*.md` present locally but different |
| Config | `99 - Claude Code/config/*.md` **not** in `PROTECTED` |
| Templates | `Ressources/Templates/*.md` **not** in `PROTECTED` |
| Hooks | `99 - Claude Code/hooks/*.js` |
| Other | README.md, LICENSE, etc. |

For the Protected category, the relevant changes are those between `LAST_SYNCED_SHA` and
`origin/master` (not `HEAD..origin/master`):

```bash
# only if LAST_SYNCED_SHA is set; otherwise compare against HEAD
git diff ${LAST_SYNCED_SHA:-HEAD}..origin/master --name-only -- \
  "99 - Claude Code/config/vault-settings.md" \
  "Ressources/Templates/" \
  "99 - Claude Code/command-tracker.md"
```

If a protected file has no changes in that range → it's untouched upstream, don't list it.

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

**Config** (non-protected) → briefly describe change (ex: *"Adds `claude_code_folder` field for more flexibility."*)

**Template** (non-protected) → describe template update.

**🔒 Protected (user-owned)** → this file holds *your* data, so the framing is a **notification**,
not an offer to apply. Read the upstream change to explain what the project changed and why it
might matter to the user — but make clear nothing will be overwritten:
```bash
git diff ${LAST_SYNCED_SHA:-HEAD}..origin/master -- "[protected/file/path]"
```
→ Display: `🔒 [file] — changed upstream: [1-2 sentence summary]. Your version is safe; you'll
review and merge line by line (Step 5).`

Example: *"🔒 vault-settings.md — upstream added a `claude_code_folder` field and renamed
`hobbies_dir` → `hobbies_folder`. Your values are kept; you'll choose per line what to adopt."*

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

### 🔒 Protected — your files changed upstream (review & merge, never auto-applied)
- 🔒 vault-settings.md — upstream added `claude_code_folder`, renamed `hobbies_dir`
     → You'll go through the diff line by line and choose what to adopt (Step 5)

---
Which elements do you want to apply? (all / selection / none)
```

**Protected files are never an "apply" checkbox.** They are listed only so the user knows their
files moved upstream. `all` applies all non-hook **non-protected** elements — it never touches a
protected file. After the apply phase, if any protected file changed upstream, ask separately:
> "Your protected files [list] changed upstream. Want to review and merge them now, line by line? (yes / later)"

**If user replies "all"** → apply all non-hook, non-protected elements.
**If selection** → apply only checked elements (protected files cannot be checked).
**If "none"** → skip applies, but still offer the protected review, then update tracker.

---

## Step 5 — Apply selected updates

⚠️ **Never run `git checkout` on a file matching `PROTECTED` (Step 0.5)** — even if it somehow got
selected. Protected files only ever go through the line-by-line merge below.

For each selected **non-protected** file (excluding hooks):

**If `LANGUE = EN`** → apply directly:
```bash
git checkout origin/master -- "[file/path]"
```

**If `LANGUE ≠ EN`** → translate then write:

1. Read EN content from GitHub:
```bash
git show origin/master:"[file/path]"
```

2. Translate EN→LANGUE using Claude with this prompt:
> *"Translate the following file from English to [LANGUE]. Rules: (1) preserve all code blocks (bash, python, yaml, js…) exactly as-is, (2) preserve all `{VARIABLE}` patterns unchanged, (3) in YAML frontmatter, translate the `description:` value but never the `name:` value, (4) preserve all markdown structure and Obsidian links `[[…]]`, (5) do not add explanations — return only the translated file."*

3. Write the translated content directly to disk (do not use `git checkout`).

For **selected hooks**: don't apply automatically. Display instead:
```
To update recap-session.js:
cp "99 - Claude Code/hooks/recap-session.js" ~/.claude/hooks/
```
(or equivalent path for OS)

### Step 5b — Protected files: line-by-line merge

Run this only if the user accepted the protected review (Step 4) and there are protected files
changed upstream. The goal: let the upstream improvements reach the user **without ever silently
losing their local values**. The user is in control of every divergent line.

For each protected file changed between `LAST_SYNCED_SHA` and `origin/master`:

1. Get the local content (what the user has now) and the upstream content:
```bash
git show origin/master:"[protected/file/path]"   # upstream version
# local version = the file on disk as-is
```

2. Compute the line-level differences. A line is **divergent** if it differs between local and
   upstream — this covers both *new lines added upstream* and *lines whose value upstream differs
   from the user's local value*.

3. Walk through divergent lines **in order**. For each one, show the user clearly:
```
[file] — line N
  Your version  : hobbies_dir: 02 - Loisirs
  Upstream      : hobbies_folder: 02 - Hobbies
Keep yours / take upstream / skip? (k / u / s)
```
   - `k` keep yours → local line unchanged
   - `u` take upstream → adopt the upstream line as-is
   - `s` skip → same as keep, move on
   - For a **purely new** upstream line (no local counterpart, e.g. a brand-new config field):
     present it as `Add this new line? (y / n)` — default suggestion `y`, since new fields are
     usually the whole point of updating, but never assume.

   Batch sensibly: if many contiguous lines are an obviously cohesive new block (e.g. a new
   documented section in a template), present the block as one unit rather than line by line.

4. Apply the user's choices to produce the merged content and write it directly to disk
   (**never** `git checkout`). For `LANGUE ≠ EN`, translate only the lines the user chose to
   adopt from upstream, following the same translation rules as the non-protected path; lines the
   user kept are left exactly as they are.

5. Confirm: `🔒 [file] merged — [X] lines adopted, [Y] kept.`

If `LAST_SYNCED_SHA` was unset (first run post-fix), there's no reliable "since last update"
reference — tell the user plainly: *"First protected sync on this vault — I'll show the full
current difference vs upstream so you can establish your baseline."* and run the same line-by-line
flow against `HEAD` (or the repo's initial commit) instead.

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

**Record the synced SHA** so the next run knows what your protected files looked like at this
point. Write the current `origin/master` SHA into `99 - Claude Code/config/.gylt-sync-state`
(overwrite, single line):
```bash
git rev-parse origin/master > "99 - Claude Code/config/.gylt-sync-state"
```
This file is local state, not repo content — it is itself protected (never `git checkout`-ed) and
should not be committed back to the GYLT repo.

**When to advance the SHA** — the SHA is the "I've seen my protected files up to here" marker, so
only advance it if every protected change has actually been put in front of the user:

- No protected files changed this run, **or** the user went through the line-by-line merge for
  all of them (adopting or declining each line is a decision — that counts as handled) → write the
  new SHA.
- The user chose **"later"** (deferred the protected review) → **do not** write the new SHA. Leave
  `.gylt-sync-state` unchanged so next week re-notifies about the same pending protected changes.
  The user explicitly hasn't seen them yet; suppressing that would be the exact silent-loss bug in
  a slower form.

Skip the write entirely if the run aborted on an error.

---

## Absolute rules

- **Never run `git pull`** — apply file by file so user keeps control
- **Protected files are never `git checkout`-ed.** `PROTECTED` (Step 0.5) =
  `99 - Claude Code/config/vault-settings.md`, `Ressources/Templates/**`,
  `99 - Claude Code/command-tracker.md`, plus the local state file
  `99 - Claude Code/config/.gylt-sync-state`. These hold the user's own data and only ever change
  through the Step 5b line-by-line merge where the user decides each line. Overwriting them
  silently is the trust-breaking bug this skill exists to prevent.
- **Only these are safe to `git checkout`**: `99 - Claude Code/` *minus* protected paths,
  `Ressources/Templates/` *minus* protected paths, `README.md`, `LICENSE`. Never any personal
  note, daily note, or ticket.
- **Hooks = mandatory manual** — never copy hook to `~/.claude/` without explicit confirmation
- **If conflict detected** (non-protected local file modified by user) → signal and skip, don't
  overwrite. (Protected files don't need this rule — the merge already hands every divergent line
  to the user.)
- **A deferred protected review must survive to the next run** — never advance
  `.gylt-sync-state` when the user said "later" (Step 6).
