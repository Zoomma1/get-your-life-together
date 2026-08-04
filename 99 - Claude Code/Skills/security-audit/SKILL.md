---
name: security-audit
description: Claude Code security audit — checks version, permissions (missing deny rules AND overly broad allows in settings.json + settings.local.json), secret-guard.js patterns, and creates a summary Knowledge note. Rerun after each major Claude Code update or security incident. Trigger with /security-audit.
---

# Skill: /security-audit

Complete security setup audit for Claude Code in 5 steps. Produces a report + dated Knowledge note.

---

## Step 1 — Claude Code Version

```bash
claude --version
```

Extract the version number (e.g., `2.1.119`).

**Minimum reference version**: `2.1.90`
(Adversa AI bug fix — bypass deny rules if >50 subcommands)

- If version ≥ 2.1.90 → ✅ SAFE
- If version < 2.1.90 → 🔴 **CRITICAL** — update immediately (`npm update -g @anthropic-ai/claude-code`)

---

## Step 2 — Permissions: deny **and** allow

> ⚠️ Read both sections together, never the denylist alone. A broad allow bypasses deny rules: matching is done on the **prefix** of the command, so `Bash(bash *)` auto-approves `bash -c 'rm -rf ~'` — which doesn't start with `rm`, and which `Bash(rm -rf*)` therefore never matches. An audit that only looks at `deny` renders a verdict of « 9/9 ✅ » on an open setup. (Cause: audit 2026-07-27.)

**Files to read — both**:
- `~/.claude/settings.json` → `permissions.deny` + `permissions.allow`
- `~/.claude/settings.local.json` → `permissions.allow` ← **this is where allows accumulate across sessions**, and it's the file that was overlooked on 2026-07-27

### 2A — Deny rules

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

For each rule in the reference list:
- ✅ Present in `permissions.deny`
- ⚠️ Absent → list as missing

If rules are missing → propose the JSON block to add to `settings.json` and wait for {USER_NAME}'s validation before writing.

### 2B — Broad Allows

Flag any `allow` rule that grants an **interpreter, executor, or generic network channel**. Patterns to flag:

| Pattern | Why |
|---|---|
| `Bash(bash *)`, `Bash(sh *)`, `Bash(zsh *)` | `-c 'anything'` — nullifies all deny rules |
| `Bash(python *)`, `Bash(python3 *)`, `Bash(node *)`, `Bash(uv run *)` | `-c` / `-e` = arbitrary execution |
| `Bash(awk *)`, `Bash(perl *)`, `Bash(find *)` | `system()`, `-exec` — diverted execution |
| `Bash(ssh *)`, `Bash(ssh)`, `Bash(scp *)` | arbitrary command on a remote machine |
| `Bash(curl *)`, `Bash(wget *)` | exfiltration + `\| bash` |
| `Bash(git *)`, `Bash(npm *)`, `Bash(docker *)` | destructive subcommands or arbitrary hooks |

Sorting rule: a **broad** allow (bare verb + `*`) can be replaced by the **specific** entries already present further down in the file — they almost always exist, accumulated session after session.

Before proposing a deletion, map the actual consumers:
- **Hooks** (`settings.json` → `hooks`) do not pass through the Bash tool → never impacted by an allow deletion.
- Skills that launch commands (`/waddle-check`, `/digest`, `/graph`…) will re-prompt only on **new** variants, not on commands already listed specifically.

Announce this cost to {USER_NAME}, then wait for explicit validation before writing. After writing, **validate the JSON** and confirm the rule count before/after.

---

## Step 3 — secret-guard.js Coverage

### 3A — Bash Patterns (`DANGER_PATTERNS`)

Read `~/.claude/hooks/secret-guard.js` → array `DANGER_PATTERNS`.

**Expected reference patterns** (at minimum):
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

List reference patterns absent from the current file. Propose additions if missing — wait for validation before writing.

### 3B — File-tools Coverage (Read/Edit/Write/Glob/Grep)

Since 2026-07-28, `secret-guard.js` no longer guards only `Bash`: a **`file-tools`** branch blocks in `deny` the tools **Read / Edit / Write / Glob / Grep** on sensitive paths. An audit that only checks 3A therefore declares the hook compliant while **half its scope can be disconnected** without anything flagging it.

Verify both **sides** independently:

1. **The wiring** — `~/.claude/settings.json` must contain a **second dedicated `PreToolUse` block**, matching `Read|Edit|Write|Glob|Grep`, **distinct** from the `Bash` block. If the block disappeared → the hook branch is dead, the code may be intact. If the two matchers have been **merged** → flag that too: the separation is deliberate (a single matcher reintroduces a Node spawn on each Read/Grep, the most frequent calls).
2. **The paths** — the `file-tools` branch list must cover at minimum: `.env*`, `*.pem`, `*.key`, `id_rsa` / `id_ed25519`, `.aws/credentials`, `.docker/config`, `.netrc`. Verify that **wildcards are stripped before comparison** on the code side (`*.env*` → `.env`) — without that, silent false negatives on every glob call.

⚠️ **Never conclude « file-tools covered ✅ » based solely on the presence of the block.** A block present with an empty or outdated list protects exactly as much as an absent block, and it reassures — that's worse. Apply here the general rule from Step 2B: first seek **what bypasses** the safeguard rather than verify its completeness in isolation (a broad `allow` in `settings.local.json` nullifies a perfect denylist).

---

## Step 4 — Fetch Security Sources (optional, on request)

If {USER_NAME} asks "check the latest vulnerabilities" or "fetch the sources":

Sources to consult:
- Adversa AI blog (search "Claude Code security")
- Recent HN discussions on Claude Code (WebSearch "Claude Code security site:news.ycombinator.com")

Extract only actionable findings (new vulnerabilities, new patterns to block, new version bugs).

By default (without explicit request): **skip this step** — too slow for a routine audit.

---

## Step 5 — Create the Knowledge Note

Create `{VAULT_PATH}\{KNOWLEDGE_FOLDER}\Claude code\security-audit-YYYY-MM-DD.md`:

```markdown
---
date: YYYY-MM-DD
type: Security Audit
claude_version: [version]
---

# Claude Code Security Audit — YYYY-MM-DD

## Version
- Installed: [version] ✅/🔴
- Minimum required: 2.1.90

## Deny rules
[summary: X/9 present — list of missing or "All present"]

## Broad Allows
[list of broad allows found in settings.json + settings.local.json, or "None"]
[if deletion: rule count before → after, + JSON validation]

## secret-guard.js
[summary: X/14 patterns present — list of missing or "All present"]

## Actions Applied
[list of modifications made this run, or "No modifications necessary"]

## To Rerun
- After each major Claude Code update
- After any security incident
- Next scheduled date: [suggested date]
```

---

## Step 6 — Update the Command-Tracker

- Open `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- Line `/security-audit` → replace the date with today's date (`YYYY-MM-DD`)

---

## Absolute Rules

- Never modify `settings.json` or `secret-guard.js` without explicit validation from {USER_NAME}
- Always create the Knowledge note even if no modifications are necessary (traceability)
- Recommended frequency: after each major Claude Code update, or at least monthly
