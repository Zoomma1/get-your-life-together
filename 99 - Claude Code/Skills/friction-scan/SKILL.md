---
name: friction-scan
description: Detects friction patterns in Claude Code sessions — repeated corrections, CLAUDE.md rules not followed, skills not invoked. Launches parallel Haiku agents on JSONL, consolidates with Sonnet. Integrated into /closeweek.
---

# Skill: /friction-scan

Analyzes raw JSONL from `~/.claude/projects/` to detect recurring friction patterns. Produces a prioritized report + state update in Postgres.

## Step 0 — Verify Postgres

The Postgres `claude_sessions` runs in the **LXC `docker-host`** (Tailscale node, access `ssh victor@docker-host`), Docker container named **`postgres`** (not `claude-postgres`).

```bash
ssh victor@docker-host 'docker exec postgres psql -U claude -d claude_sessions -t -A -c "SELECT 1"'
```

If failure: verify the container is running (`ssh victor@docker-host 'docker ps --format "{{.Names}}"'`) and start it on docker-host if needed. **Do not** attempt a local `docker compose up` or `localhost:5433` (obsolete post-Linux migration). The script `parse_jsonl_friction.py` already points to `host="docker-host" port=5432`.

---

## Step 1 — Parse JSONL

```bash
uv run ~/.claude/parse_jsonl_friction.py 2>/dev/null
```

- No argument: window since last scan (Postgres state)
- Returns JSON: `[{session_id, project, exchanges: [{user, assistant, has_correction, has_ack}]}]`
- If 0 sessions → display "No friction detected since last scan." and stop

**Mandatory upstream filter**: `parse_jsonl_friction.py` must exclude at parse time (not downstream) sessions that are automatic recap-hooks or `/clear` sessions. Exclusion criteria: sessions with single exchange from folder `C--Users-victo` (or `home-vico` on Linux) = almost exclusively automatic hooks. Real session threshold: **minimum 2 messages** — below that, ignore. Without this filter, 98% of the dataset is noise to sort manually.

---

## Step 2 — Analysis by Haiku agents (parallel, batches of 5)

For each session in the JSON (batch of 5 simultaneous) → launch a Haiku Agent with this prompt:

```
You analyze a Claude Code session to detect friction patterns.

Here are the exchanges with friction signals (user → assistant):
[session exchanges]

Project: [project]

Identify:
1. Repeated corrections: same error made multiple times
2. CLAUDE.md rules violated: git touched, code without request, response too verbose, etc.
3. Missed skills: situation that should have triggered /create-ticket, /harvest, etc.

Return strict JSON:
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

## Step 3 — Sonnet consolidation

Pass all Haiku results to a Sonnet Agent:

```
You consolidate friction patterns detected by Haiku agents across [N] Claude Code sessions.

Here are all raw results:
[consolidated JSON]

Produce:
1. Top 10 global frictions (deduplicated, prioritized by frequency + severity) with corrective action
2. Detail per project (max 5 frictions per project)

Output format: Structured Markdown, ready to copy into a vault file.
```

---

## Step 4 — Write the report

Create `99 - Claude Code/Friction scans/YYYY-MM-DD.md`:

```markdown
# Friction scan — YYYY-MM-DD
Period: YYYY-MM-DD → YYYY-MM-DD
Sessions analyzed: N (X projects)

## Top 10 global frictions
1. [friction] → [corrective action]
...

## Detail per project
### [Project]
- [friction] → [action]
...
```

Create the `Friction scans/` folder if it doesn't exist.

---

## Step 5 — Update Postgres state

```sql
UPDATE friction_scan_state SET last_scan = NOW(), updated_at = NOW() WHERE id = 1;

INSERT INTO friction_scan_runs (period_start, period_end, sessions_count, output_file, summary_md)
VALUES ('[start]', '[end]', [N], '99 - Claude Code/Friction scans/YYYY-MM-DD.md', '[top 10 in markdown]');
```

Via: `ssh victor@docker-host "docker exec -i postgres psql -U claude -d claude_sessions" <<'SQL' ... SQL` (heredoc for multi-line SQL).

---

## Step 6 — Update command-tracker

- Open `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- Line `/friction-scan` → replace date with today's date in `YYYY-MM-DD` format

---

## Conversational summary

Display after the report:

```
Friction scan complete — [N] sessions analyzed over [X] days.
Report: 99 - Claude Code/Friction scans/YYYY-MM-DD.md
Top friction: [#1 from top 10]
```

---

## Absolute rules

- Never modify CLAUDE.md or skills directly — the scan detects, {USER_NAME} decides
- If Postgres unavailable (LXC `docker-host` unreachable / `postgres` container down): report and stop (no fallback JSON file — state must be reliable)
- Batches of 5 agents max in parallel — do not overload {USER_NAME}+Jay's shared quota
