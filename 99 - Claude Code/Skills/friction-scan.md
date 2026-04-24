---
name: friction-scan
description: Detects friction patterns in Claude Code sessions — repeated corrections, CLAUDE.md rules not followed, skills not invoked. Runs parallel Haiku agents on JSONL files, consolidates with Sonnet. Integrated into /closeweek.
---

# Skill: /friction-scan

Analyses raw JSONL files from `~/.claude/projects/` to detect recurring frictions. Produces a prioritised report and updates state in Postgres.

## Step 0 — Check Postgres

```powershell
docker ps --filter name=claude-postgres --filter status=running --format "{{.Names}}"
```

If absent: `docker compose -f ~/.claude/docker-compose.yml up -d` and wait 3s.

---

## Step 1 — Parse JSONL files

```bash
uv run ~/.claude/parse_jsonl_friction.py --days 7 2>/dev/null
```

- Without argument: window since last scan (Postgres state)
- Returns JSON: `[{session_id, project, exchanges: [{user, assistant, has_correction, has_ack}]}]`
- If 0 sessions → display "No friction detected since last scan." and stop

---

## Step 2 — Analysis by Haiku agents (parallel, batches of 5)

For each session in the JSON (batches of 5 simultaneous) → launch a Haiku Agent with this prompt:

```
You are analysing a Claude Code session to detect frictions.

Here are the exchanges with friction signals (user → assistant):
[session exchanges]

Project: [project]

Identify:
1. Repeated corrections: same error made multiple times
2. CLAUDE.md rules violated: git touched, code without request, response too verbose, etc.
3. Skills not invoked: situation that should have triggered /create-ticket, /harvest, etc.

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
You are consolidating frictions detected by Haiku agents across [N] Claude Code sessions.

Here are all the raw results:
[consolidated JSON]

Produce:
1. Top 10 global frictions (deduplicated, prioritised by frequency + severity) with corrective action
2. Detail per project (max 5 frictions per project)

Output format: structured Markdown, ready to copy into a vault file.
```

---

## Step 4 — Write the report

Create `99 - Claude Code/Friction scans/YYYY-MM-DD.md`:

```markdown
# Friction scan — YYYY-MM-DD
Period: YYYY-MM-DD → YYYY-MM-DD
Sessions analysed: N (X projects)

## Top 10 global frictions
1. [friction] → [corrective action]
...

## Detail per project
### [Project]
- [friction] → [action]
...
```

Create the `Friction scans/` folder if it does not exist.

---

## Step 5 — Update Postgres state

```sql
UPDATE friction_scan_state SET last_scan = NOW(), updated_at = NOW() WHERE id = 1;

INSERT INTO friction_scan_runs (period_start, period_end, sessions_count, output_file, summary_md)
VALUES ('[start]', '[end]', [N], '99 - Claude Code/Friction scans/YYYY-MM-DD.md', '[top 10 in markdown]');
```

Via: `docker exec claude-postgres psql -U claude -d claude_sessions -c "..."`

---

## Conversational summary

Display after the report:

```
Friction scan complete — [N] sessions analysed over [X] days.
Report: 99 - Claude Code/Friction scans/YYYY-MM-DD.md
Top friction: [#1 from top 10]
```

---

## Absolute rules

- Never modify CLAUDE.md or skills directly — the scan detects, {USER_NAME} decides
- If Postgres unavailable: signal and stop (no JSON file fallback — state must be reliable)
- Batches of 5 agents max in parallel — do not overload the shared quota
