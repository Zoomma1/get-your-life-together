---
name: friction-scan
description: Detects friction patterns in Claude Code sessions — repeated corrections, CLAUDE.md rules not respected, skills not invoked. Launches parallel Haiku agents on JSONL files, consolidates with Sonnet. Integrated in /closeweek.
---

# Skill: /friction-scan

Analyzes raw JSONL files from `~/.claude/projects/` to detect recurring friction patterns. Produces a prioritized report + updates state in Postgres.

## Step 0 — Verify Postgres

The Postgres `claude_sessions` runs in the **LXC `docker-host`** (Tailscale node, access via `ssh victor@docker-host`), Docker container named **`postgres`** (not `claude-postgres`).

```bash
ssh victor@docker-host 'docker exec postgres psql -U claude -d claude_sessions -t -A -c "SELECT 1"'
```

If it fails: verify that the container is running (`ssh victor@docker-host 'docker ps --format "{{.Names}}"'`) and start it on docker-host if needed. **Do not** attempt a local `docker compose up` or `localhost:5433` (obsolete post-Linux migration). The `parse_jsonl_friction.py` script already points to `host="docker-host" port=5432`.

---

## Step 1 — Parse JSONL

```bash
uv run ~/.claude/parse_jsonl_friction.py 2>/dev/null
```

- No argument: window since the last scan (Postgres state)
- Returns JSON: `[{session_id, project, cadrage, exchanges: [{user, assistant, has_correction, has_ack}]}]`
- `cadrage` = 1st non-hook user message of the session, truncated to 1000 chars, or `null`. Captured **before** the time window filter — for a session started before the window, the 1st message in the window is not the session's cadrage.
- If 0 sessions → display "No friction detected since last scan." and stop

**Mandatory upstream filter**: `parse_jsonl_friction.py` must exclude at parsing time (not downstream) sessions that are automatic recap-hooks or `/clear` sessions. **Content-based exclusion criterion** (since 2026-05-24): regex on the 1st message content — match on automatic hook markers (e.g., `Generate a session recap`, `UserPromptSubmit`, macOS/Linux signatures like `-Users-vico`/`home-vico`). Filter by folder name alone (`C--Users-victo` / `home-vico`) is not enough — you must detect the hook content itself. Real session threshold: **minimum 2 messages** — below that, ignore. Without this filter, 98% of the dataset is noise to manually sort.

> **Unproven Haiku calibration**: `cadrage` is injected in the payload since **2026-07-28**, in response to 3 false positives from the 2026-05-24 run — the agent judged fragments out of context. *(Implementation detail, internalized here from the original ticket now archived: `cadrage` = 1st non-hook user message, ≤ 1000 chars, `null` otherwise, captured **before** the time window filter — otherwise it's the 1st message in the window, not the session, i.e., exactly the out-of-context fragment the field exists to eliminate. The `CADRAGE_SKIP_RE` regex is **dedicated** and not added to `HOOK_TRIGGER_RE`, which is shared with exchange filtering — without it, 2 out of 3 cadrages were only the `<local-command-caveat>` wrapper. Verified over 60 days: 3/3 exploitable cadrages.)* The patch **reduces** false positives without guaranteeing their elimination, and its effect has not yet been observed: the scan of 28/07 returned no friction over 2 human sessions, so nothing to correct. As long as a scan has not produced verifiable frictions, manually cross-check `rule_violation` and `missed_skill` verdicts. If false positives persist despite cadrage → architecture issue (Haiku too permissive for the task), not a prompt to tweak.

---

## Step 2 — Analysis by Haiku agents (parallel, batches of 5)

> ⚠️ **The payload is not the session.** `parse_jsonl_friction.py` only returns exchanges that matched a regex, without tool calls, and truncates `user`/`assistant` to 500 characters. An agent that ignores this reasons over absences and fabricates frictions that don't exist. **Measured on 2026-08-20**: without the proof constraint below, 4 out of 5 verdicts returned a friction, 3 of them on an extraction artifact — a "not invoked" skill, a "not launched" command, an empty `assistant` field read as "the assistant did nothing." With the constraint, 15 sessions out of 108. **Factor 5.7 on the same corpus.** The constraint is part of the instrument: removing it changes the number, not the reality.

For each session in the JSON (batch of 5 simultaneous) → launch a Haiku Agent with this prompt (the ⚠️ block is not decorative, it carries the essential reminder):

```
You analyze a Claude Code session to detect friction patterns.

⚠️ PROOF CONSTRAINT — the payload does NOT contain the full session: only
exchanges that triggered a lexical signal appear in it, tool calls are NOT
THERE, and `user` and `assistant` fields are TRUNCATED TO 500 CHARACTERS.
Strict consequences:
- You CANNOT conclude anything from an absence. Never "skill not invoked",
  "command not launched", "Claude never says X", "X doesn't appear".
- An empty `assistant` = uncaptured tool call. NEVER a friction.
- Any verdict bearing on the END of a response (canary 🐙, signature, final
  summary) is invalid: the end is cut off by truncation.
- `has_correction` / `has_ack` are lexical regex flags set by the script, NOT
  judgments. `has_ack` detects "sorry", "you're right" — it has nothing to do
  with lessons acknowledgment. Never base a friction on their value: read the
  text.

Cadrage — {USER_NAME}'s first message in the session:
[cadrage]

Use this cadrage to distinguish expected behavior from friction: if {USER_NAME}
acted in it as agentic mode, gave an explicit instruction, or set the session
context, what follows is not a violation. If cadrage is `null`, ignore this
instruction.

Here are the exchanges with friction signals (user → assistant):
[session exchanges]

Project: [project]

Identify, only on positive proof and with citation:
1. Repeated corrections: same error made multiple times
2. CLAUDE.md rules visibly violated in the text provided
3. Explicit friction from {USER_NAME}: he rewrites, corrects, signals an error —
   ideally Claude recognizes it

False positives to exclude: trigger words from Claude's prose, from a filename
(`non-ignored files`, `stop.json`), or from normal delegation (`prends la main`
= agentic mode codified in CLAUDE.md, NOT a friction).

Return ONLY this strict JSON, nothing else:
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

**Re-read verdicts before consolidating.** Even with the constraint, about 1 in ~20 verdicts still passes through an absence. Manually exclude any verdict whose `evidence` takes the form "X doesn't appear" / "Claude never says X", or that cites a flag rather than text. Log what was excluded in the report — it's a measurement of the instrument, not noise to discard.

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

Create the `Friction scans/` folder if it doesn't exist.

---

## Step 5 — Update Postgres state

**Two counters, not one.** `sessions_count` = the sessions the parser **returned** (at least one lexical signal), those that go to fan-out. `sessions_read` = the **denominator**, sessions in the window actually parsed. Both come from the stderr of Step 1: `Sessions with friction: N` and `Sessions read: D (from F files found)`. An `N` without `D` is not a result — it's what the runs on 28/07 and 04/08 produced, credible because nothing indicated how many the zero was based on.

⚠️ **`sessions_count` does NOT count confirmed frictions.** Established from data on 2026-08-20: the run on 28/07 wrote `8` and the run on 04/08 wrote `2`, while **both concluded 0 real friction** — their `summary_md` says "6 sessions out of 8 are unfiltred noise" and "2 sessions returned, both lexical false positives". The count of confirmed frictions goes in `summary_md`, where those two runs put theirs. Writing the count of frictions there would break the series without anything signaling it.

*(This also resolves the gap "2 human sessions" vs "8 in base" from 28/07: no race between hook rename and scan — 8 returned with 6 of noise, so 2 human. Both numbers are correct, they measure two different things.)*

`instrument_version` marks the population read. Runs are **comparable only at equal version**: the glob fix on 19/08 raised the corpus from 213 to 871 files, a rise in `sessions_count` after that date is a denominator change before it's a rise in friction. Current value: `2026-08-19-glob-fix`. Change it as soon as the read scope of `parse_jsonl_friction.py` moves (glob, recursion, population filters) — not for a regex vocabulary change.

```sql
UPDATE friction_scan_state SET last_scan = NOW(), updated_at = NOW() WHERE id = 1;

INSERT INTO friction_scan_runs
    (period_start, period_end, sessions_count, sessions_read, instrument_version, output_file, summary_md)
VALUES ('[start]', '[end]', [N with friction], [D read], '2026-08-19-glob-fix',
        '99 - Claude Code/Friction scans/YYYY-MM-DD.md', '[top 10 in markdown]');
```

Via: `ssh victor@docker-host 'docker exec postgres psql -U claude -d claude_sessions -c "..."'` (one `-c` option per instruction — heredoc on stdin doesn't pass permission guards well).

---

## Step 6 — Update the command-tracker

- Open `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- Line `/friction-scan` → replace the date with today's date in `YYYY-MM-DD` format

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
- If Postgres unavailable (LXC `docker-host` unreachable / `postgres` container down): flag and stop (no JSON file fallback — state must be reliable)
- Max 5 agents in parallel batches — don't overload the shared quota {USER_NAME}+[partner]
