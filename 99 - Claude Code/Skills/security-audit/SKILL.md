---
name: security-audit
description: Claude Code security audit — verifies version, missing deny rules, secret-guard.js patterns, and creates a Knowledge note summary. Rerun after each major Claude Code update or security incident. Trigger with /security-audit.
---

# Skill: /security-audit

Complete Claude Code security setup audit in 5 steps. Produces a report + dated Knowledge note.

---

## Step 1 — Claude Code version

```bash
claude --version
```

Extract the version number (ex: `2.1.119`).

**Minimum reference version**: `2.1.90`
(Adversa AI bug fix — deny rules bypass if >50 subcommands)

- If version ≥ 2.1.90 → ✅ SAFE
- If version < 2.1.90 → 🔴 **CRITICAL** — update immediately (`npm update -g @anthropic-ai/claude-code`)

---

## Step 2 — Deny rules in settings.json

Read `~/.claude/settings.json` → section `permissions.deny`.

**Reference list** (expected deny rules):
```
Bash(rm -rf*)
Bash(sudo rm*)
Bash(git push *--force*)
Bash(git push *-f *)
Bash(git reset --hard*)
Bash(git stash drop*)
Bash(git stash clear)
Bash(git branch -D*)
Bash(chmod -R 777*)
```

For each rule from the reference list:
- ✅ Present in `permissions.deny`
- ⚠️ Absent → list as missing

If rules are missing → propose the JSON block to add to `settings.json` and await {USER_NAME} validation before writing.

---

## Step 3 — secret-guard.js patterns

Read `~/.claude/hooks/secret-guard.js` → array `DANGER_PATTERNS`.

**Expected reference patterns** (minimum):
- `.env` files (cat/less/more/head/tail)
- `.pem` / `.key` files
- SSH private keys (`id_rsa`, `id_ed25519`…)
- `.aws/credentials`
- `.docker/config`
- `printenv` (bare)
- `env` (bare)
- `export VAR_SECRET=literal`
- `Authorization: Bearer <token>`
- `--user user:pass`
- `git remote -v`
- `echo $VAR_SECRET`
- `history`
- `cat ~/.netrc`

List the reference patterns absent from the current file. Propose additions if missing — await validation before writing.

---

## Step 4 — Fetch security sources (optional, on request)

If {USER_NAME} asks "check latest vulnerabilities" or "fetch sources":

Sources to consult:
- Adversa AI blog (search "Claude Code security")
- HN recent discussions on Claude Code (WebSearch "Claude Code security site:news.ycombinator.com")

Extract only actionable findings (new vulnerabilities, new patterns to block, new version bugs).

By default (without explicit request): **skip this step** — too slow for routine audit.

---

## Step 5 — Create the Knowledge note

Create `{VAULT_PATH}\{KNOWLEDGE_FOLDER}\Claude code\security-audit-YYYY-MM-DD.md`:

```markdown
---
date: YYYY-MM-DD
type: Security Audit
claude_version: [version]
---

# Claude Code security audit — YYYY-MM-DD

## Version
- Installed: [version] ✅/🔴
- Minimum required: 2.1.90

## Deny rules
[summary: X/9 present — list of missing or "All present"]

## secret-guard.js
[summary: X/14 patterns present — list of missing or "All present"]

## Actions applied
[list of modifications made this run, or "No modifications needed"]

## To rerun
- After each major Claude Code update
- After any security incident
- Next scheduled: [suggested date]
```

---

## Step 6 — Update the command-tracker

- Open `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- Line `/security-audit` → replace the date with today's date (`YYYY-MM-DD`)

---

## Absolute rules

- Never modify `settings.json` or `secret-guard.js` without explicit {USER_NAME} validation
- Always create the Knowledge note even if no modifications are needed (traceability)
- Recommended frequency: after each major Claude Code update, or at minimum monthly
