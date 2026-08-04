---
name: friction-scan
description: Detects friction patterns in Claude Code sessions — repeated corrections, CLAUDE.md rules not followed, skills not invoked. Launches parallel Haiku agents on JSONL, consolidates with Sonnet. Integrated into /closeweek.
---

# Skill: /friction-scan

Analyzes raw JSONL from `~/.claude/projects/` to detect recurring frictions. Produces a prioritized report + state update in Postgres.

## Step 0 — Verify Postgres

The Postgres `claude_sessions` runs in the **LXC `docker-host`** (Tailscale node, access via `ssh victor@docker-host`), Docker container named **`postgres`** (not `claude-postgres`).

```bash
ssh victor@docker-host 'docker exec postgres psql -U claude -d claude_sessions -t -A -c "SELECT 1"'
```

If failed: verify the container is running (`ssh victor@docker-host 'docker ps --format "{{.Names}}"'`) and start it on the docker-host side if needed. **Do not** attempt a local `docker compose up` or `localhost:5433` (obsolete post-Linux migration). The `parse_jsonl_friction.py` script already points to `host="docker-host" port=5432`.

---

## Step 1 — Parse the JSONL

```bash
uv run ~/.claude/parse_jsonl_friction.py 2>/dev/null
```

- Without argument: window since last scan (Postgres state)
- Returns JSON: `[{session_id, project, cadrage, exchanges: [{user, assistant, has_correction, has_ack}]}]`
- `cadrage` = first non-hook user message in the session, truncated to 1000 chars, or `null`. Captured **before** the time window filter — for a session started before the window, the first message in the window is not the session's framing.
- If 0 sessions → display "No friction detected since last scan." and stop

**Mandatory upstream filter**: `parse_jsonl_friction.py` must exclude from parsing (not downstream) sessions that are automatic recap-hooks or `/clear` sessions. **Content-based exclusion criterion** (since 2026-05-24): regex on the first message content — match on automatic hook markers (e.g., `Generate a session recap`, `UserPromptSubmit`, macOS/Linux signatures like `-Users-vico`/`home-vico`). Filter by folder name alone (`C--Users-victo` / `home-vico`) is not enough — you must detect the hook content itself. Real session threshold: **minimum 2 messages** — below that, ignore. Without this filter, 98% of the dataset is noise to manually sort.

> **Unproven Haiku calibration**: `cadrage` has been injected into the payload since **2026-07-28**, in response to 3 false positives from the 2026-05-24 run — the agent was judging fragments out of context. *(Implementation detail, internalized here from the original ticket now archived: `cadrage` = first non-hook user message, ≤ 1000 chars, `null` otherwise, captured **before** the time window filter — otherwise it's the first message of the window, not of the session, which is exactly the out-of-context fragment that the field exists to eliminate. The regex `CADRAGE_SKIP_RE` is **dedicated** and not added to `HOOK_TRIGGER_RE`, which is shared with exchange filtering — without it, 2 out of 3 framings were just the wrapper `<local-command-caveat>`. Verified over 60 days: 3/3 usable framings.)* The patch **reduces** false positives without guaranteeing their elimination, and its effect has not yet been observed: the 28/07 scan found no friction on 2 human sessions, so nothing to correct. As long as a scan has not produced verifiable frictions, manually cross-check `rule_violation` and `missed_skill` verdicts. If false positives persist despite framing → architecture problem (Haiku too permissive for the task), not a prompt to tweak.

---

## Step 2 — Analysis by Haiku agents (parallel, batches of 5)

For each session in the JSON (batch of 5 simultaneous) → launch a Haiku Agent with this prompt:

```
You analyze a Claude Code session to detect frictions.

Framing — 1st message by {USER_NAME} in the session:
[cadrage]

Use this framing to distinguish expected behavior from friction: if
{USER_NAME} activated agentic mode there, gave an explicit instruction, or set the session's context,
what follows is not a violation. If the framing is `null`,
ignore this instruction.

Here are the exchanges with friction signals (user → assistant):
[session exchanges]

Project: [project]

Identify:
1. Repeated corrections: same error made multiple times
2. CLAUDE.md rules violated: git touched, code without request, overly verbose response, etc.
3. Skills not invoked: situation that should have triggered /create-ticket, /harvest, etc.

Return a strict JSON:
{
  "session_id": "...",
  "project": "...",
  "frictions": [
    {"type": "correction|rule_violation|missed_skill", "description": "...", "evidence": "...", "severity": "low|medium|high"}
  ]
}
Return [] if no real friction detected. Maximum 5 frictions per session.
```

Collect all returned JSON.

---

## Step 3 — Sonnet Consolidation

Pass all Haiku results to a Sonnet Agent:

```
You consolidate frictions detected by Haiku agents on [N] Claude Code sessions.

Here are all raw results:
[consolidated JSON]

Produce:
1. Top 10 global frictions (deduplicated, prioritized by frequency + severity) with corrective action
2. Detail by project (max 5 frictions per project)

Output format: Structured Markdown, ready to copy into a vault file.
```

---

## Step 4 — Write the Report

Create `99 - Claude Code/Friction scans/YYYY-MM-DD.md`:

```markdown
# Friction scan — YYYY-MM-DD
Period: YYYY-MM-DD → YYYY-MM-DD
Sessions analyzed: N (X projects)

## Top 10 global frictions
1. [friction] → [corrective action]
...

## Detail by project
### [Project]
- [friction] → [action]
...
```

Create the `Friction scans/` folder if it doesn't exist.

---

## Step 5 — Update Postgres State

```sql
UPDATE friction_scan_state SET last_scan = NOW(), updated_at = NOW() WHERE id = 1;

INSERT INTO friction_scan_runs (period_start, period_end, sessions_count, output_file, summary_md)
VALUES ('[start]', '[end]', [N], '99 - Claude Code/Friction scans/YYYY-MM-DD.md', '[top 10 in markdown]');
```

Via: `ssh victor@docker-host "docker exec -i postgres psql -U claude -d claude_sessions" <<'SQL' ... SQL` (heredoc for multi-line SQL).

---

## Step 6 — Update the command-tracker

- Open `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- Line `/friction-scan` → replace the date with today's date in `YYYY-MM-DD` format

---

## Conversational Summary

Display after the report:

```
Friction scan completed — [N] sessions analyzed over [X] days.
Report: 99 - Claude Code/Friction scans/YYYY-MM-DD.md
Top friction: [#1 of top 10]
```

---

## Absolute Rules

- Never modify CLAUDE.md or skills directly — the scan detects, {USER_NAME} decides
- If Postgres unavailable (LXC `docker-host` unreachable / `postgres` container down): report and stop (no JSON file fallback — state must be reliable)
- Max 5 agents in parallel batches — don't overload the shared quota {USER_NAME}+Jay
