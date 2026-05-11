---
name: friction-scan
description: Detect friction patterns in Claude Code sessions — repeated corrections, CLAUDE.md rules violated, unused skills. Launch parallel Haiku agents on JSONL, consolidate with Sonnet. Integrated into /closeweek.
---

# Skill: /friction-scan

Analyze raw JSONL from `~/.claude/projects/` to detect recurring friction. Produce prioritized report + state update to Postgres.

## Step 0 — Verify Postgres

```powershell
docker ps --filter name=claude-postgres --filter status=running --format "{{.Names}}"
```

If missing: `docker compose -f ~/.claude/docker-compose.yml up -d` and wait 3s.

---

## Step 1 — Parse the JSONL

```bash
uv run ~/.claude/parse_jsonl_friction.py 2>/dev/null
```

- No argument: window since last scan (Postgres state)
- Returns JSON: `[{session_id, project, exchanges: [{user, assistant, has_correction, has_ack}]}]`
- If 0 sessions → display "No friction detected since last scan." and stop

**Mandatory upstream filter**: `parse_jsonl_friction.py` must exclude at parse time (not downstream) sessions that are automatic recap-hooks or `/clear` sessions. Exclusion criteria: sessions with single exchange from `C--Users-victo` folder (or `home-vico` on Linux) = almost exclusively auto-hooks. Real session threshold: **minimum 2 messages** — below that, ignore. Without this filter, 98% of dataset is noise to manually sort.

---

## Step 2 — Analysis by Haiku agents (parallel, batches of 5)

For each session in JSON (batch of 5 simultaneous) → launch a Haiku Agent with this prompt:

```
You analyze a Claude Code session to detect friction.

Here are the exchanges with friction signals (user → assistant):
[session exchanges]

Project: [project]

Identify:
1. Repeated corrections: same mistake made multiple times
2. CLAUDE.md rule violations: git touched, code without asking, response too verbose, etc.
3. Unused skills: situation that should have triggered /create-ticket, /harvest, etc.

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

## Step 3 — Consolidation Sonnet

Pass all Haiku results to a Sonnet Agent:

```
You consolidate friction detected by Haiku agents across [N] Claude Code sessions.

Here are all raw results:
[consolidated JSON]

Produce:
1. Top 10 global frictions (deduplicated, prioritized by frequency + severity) with corrective action
2. Detail by project (max 5 frictions per project)

Output format: Markdown structured, ready to copy into vault file.
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

## Detail by project
### [Project]
- [friction] → [action]
...
```

Create `Friction scans/` folder if it doesn't exist.

---

## Step 5 — Update Postgres state

```sql
UPDATE friction_scan_state SET last_scan = NOW(), updated_at = NOW() WHERE id = 1;

INSERT INTO friction_scan_runs (period_start, period_end, sessions_count, output_file, summary_md)
VALUES ('[start]', '[end]', [N], '99 - Claude Code/Friction scans/YYYY-MM-DD.md', '[top 10 in markdown]');
```

Via: `docker exec claude-postgres psql -U claude -d claude_sessions -c "..."`

---

## Step 6 — Update command-tracker

- Open `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- Line `/friction-scan` → replace date with today's date in `YYYY-MM-DD` format

---

## Conversational summary

Display after report:

```
Friction scan complete — [N] sessions analyzed over [X] days.
Report: 99 - Claude Code/Friction scans/YYYY-MM-DD.md
Top friction: [#1 from top 10]
```

---

## Absolute rules

- Never modify CLAUDE.md or skills directly — scan detects, {USER_NAME} decides
- If Postgres unavailable: signal and stop (no JSON file fallback — state must be reliable)
- Max 5 parallel agents per batch — don't overload shared quota {USER_NAME}+Jay
