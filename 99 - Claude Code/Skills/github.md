---
name: github
description: Unified GitHub interface via `gh` CLI — select an active repo then execute actions (PRs, issues, CI, files, comments) without leaving Claude Code. All operations go through `gh` or `gh api`, with no MCP dependency.
---

# Skill: GitHub

Unified interface for GitHub operations. All commands use `gh` CLI or `gh api` — no MCP dependency.

**Prerequisites**: `gh` authenticated (`gh auth status` must return an active account).

## Invocation

`/github [action]`

If `$ARGUMENTS` is empty → **Repo selection mode** (Action 0).

---

## Action 0 — Repo selection (no argument or repo not defined in session)

1. Calculate the date 2 months ago (from today's date) in `YYYY-MM-DD` format
2. Run:
   ```bash
   gh repo list Zoomma1 --limit 30 --json name,updatedAt,defaultBranchRef \
     --jq '.[] | select(.updatedAt > "YYYY-MM-DD") | "\(.name) — \(.updatedAt[0:10]) — default: \(.defaultBranchRef.name)"'
   ```
3. Display:
   ```
   Ready to use GitHub. Active repos (last 2 months):
   1. FromSprueToGlory — 2026-04-14 — default: staging
   2. Waddle — 2026-04-12 — default: main
   ...
   Which repo are we working on?
   ```
4. {USER_NAME} replies with the number, a partial name, or a name not in the list
   - If not in list → resolve via `gh repo view Zoomma1/[name] --json name,defaultBranchRef`
5. Retain `owner/repo` and `default_branch` for the entire session
6. If an action was pending (e.g. `/github prs` before selection) → execute it now

**Repo retained in session** — do not ask again as long as {USER_NAME} does not explicitly change the repo.

---

## Available actions

### `/github help`

Display:
```
Available actions:
  (empty)                      Select the active repo
  prs                          List open PRs
  pr #123                      Read a PR
  issues                       List open issues
  issue #123                   Read an issue
  create issue [title]         Create an issue
  comment [#123] [text]        Comment on an issue or PR
  ci [branch?]                 CI status — optional branch (default: default_branch)
  listFiles [path?]            List files in a repo folder
  readFile [path]              Read the content of a repo file
  help                         This help
```

---

### `/github prs`

```bash
gh pr list --repo owner/repo --state open
```

Display: number, title, source branch, author, date.

---

### `/github pr #123`

```bash
gh pr view 123 --repo owner/repo
```

---

### `/github issues`

```bash
gh issue list --repo owner/repo --state open
```

---

### `/github issue #123`

```bash
gh issue view 123 --repo owner/repo
```

---

### `/github create issue [title]`

1. Ask for confirmation: "Create issue '[title]' on [owner/repo]?"
2. After confirmation:
   ```bash
   gh issue create --repo owner/repo --title "[title]" --body ""
   ```
3. Return the URL of the created issue

---

### `/github comment #123 [text]`

1. Detect whether #123 is an issue or PR:
   ```bash
   gh pr view 123 --repo owner/repo --json number 2>/dev/null || echo "issue"
   ```
   - If PR → `gh pr comment`
   - If issue → `gh issue comment`
2. Ask for confirmation: "Comment on #123 with: '[text]'?"
3. After confirmation:
   ```bash
   # PR
   gh pr comment 123 --repo owner/repo --body "[text]"
   # Issue
   gh issue comment 123 --repo owner/repo --body "[text]"
   ```

---

### `/github ci [branch?]`

If no branch specified → use `default_branch` retained in session.

1. List recent runs on the branch:
   ```bash
   gh run list --repo owner/repo --branch [branch] --limit 5
   ```
2. Display status: ✅ success / ❌ failure / ⏳ in_progress / 🔵 queued
3. **If the last run failed**:
   ```bash
   gh run view [run_id] --repo owner/repo --log-failed
   ```
   Display error logs directly in the transcript for investigation.
4. If no run found → "No CI workflow found on branch [branch]"

---

### `/github listFiles [path?]`

If no path specified → repo root (`/`).

```bash
gh api repos/owner/repo/contents/[path] --jq '[.[] | "\(.type) \(.name)"]'
```

Display as a simple tree:
```
📁 src/
📄 README.md
📄 package.json
```

---

### `/github readFile [path]`

```bash
gh api repos/owner/repo/contents/[path] --jq '.content' | base64 -d
```

Display content in a code block with the correct language based on the extension.

**If file is too large** (> 1 MB) → signal and propose reading a section via `--jq '.download_url'` then `gh api [url]`.

---

## Absolute rules

- **Confirmation required** before any write action (`create issue`, `comment`)
- **Repo and default_branch retained in session** — Action 0 selection done once per session unless explicitly changed
- **Encode paths** for `gh api`: spaces → `%20` (e.g. `99%20-%20Claude%20Code/Skills`)
- **Issue vs PR detection**: try `gh pr view` first, fallback to `gh issue view` on error
- **CI without branch**: always use `default_branch` — never hardcode `main` or `staging`
