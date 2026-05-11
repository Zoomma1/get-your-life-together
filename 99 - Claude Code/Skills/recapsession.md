---
name: recapsession
description: Create a recap of the current work session and propose capitalizations (ADR/Skills) if applicable. Use when the user says "recap session", "we're done", "that's it for today", "I'm out" or via /recapsession.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured by the **richness of output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet required even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in ways that strip narrative instructions (grouping, context, key moments, open questions, tone, narration). Qualitative content preservation takes priority over line reduction.

# Skill: Session Recap + Capitalization

## Purpose

A recap creates a persistent trace of what was accomplished, what decisions were made, and what blocks for tomorrow. It's the only place where Claude documents what it **saw**, not what {USER_NAME} **changed** (that's git's job).

## Triggering

- the user says "recap session", "we're done", "that's it for today", "I'm out"
- Command `/recapsession`

## Step 1 — Identify Context

1. Get exact local time via bash:
   ```bash
   date +%H:%M
   ```
   Use this time in section title. Never make up a time.
2. **Target date**: if `time < 04:00` → date = yesterday, else date = today. All sessions are written to `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[target_date].md`, regardless of project.
3. If session note already exists for the day → add a new section `## Session [HH:MM]` rather than overwriting.

## Step 2 — Build the Recap

Summarize the session covering these 4 sections:

### What Was Done
Concise list of tasks completed, decisions made.

### Files Discussed or Consulted
Files addressed during the session (not git truth — Claude doesn't see {USER_NAME}'s diff).
**If no files were consulted**, note "None — discussion/reflection session".

### Technical Decisions or Directional Changes
If decisions were noted, highlight their characteristics:
- **Nature**: does it affect multiple projects, a specific project, or a technical domain?
- **Scope**: does it affect code, infrastructure, daily workflow, skills?
**If no notable decisions**, note "None — exploratory session".

### State at End
What remains, next logical step, resume command if applicable.

### Session Observation
Note honestly based on what happened during the session, without making things up:
- **Flow**: {USER_NAME} advanced quickly, few blockers, direct answers
- **Focused**: progressed well but with effort
- **Blocked**: technical difficulties, multiple attempts
- **Frustrated**: frustration signals detected (rephrasing, corrections, "it's not working")
- **Tired**: short answers, less engagement, frequent pauses
- **Satisfied**: objective achieved, good progress

If no clear signal → note "Neutral / no particular signal".

## Step 3 — Write the Note

Write the recap in `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[target_date].md` by adding a section.

Section title based on context:
- Normal time: `## Session [HH:MM] — [short title]`
- After midnight: `## Session [HH:MM] 🌙 (after midnight) — [short title]`

```markdown
## Session [HH:MM] — [short title]

### ✅ Completed
- ...
- ...

### 🔧 Files Discussed / Consulted
- ...

### 🧠 Decisions Made
- ...

### ⏭️ Next Step
...

### 🧭 Observation
[Flow / Focused / Blocked / Frustrated / Tired / Satisfied] — [one sentence of context]
```

Use Write or MCP if available, fallback to manual Read + Write if MCP fails.

## Step 3.5 — Postgres Sync

After writing the `.md` file, launch:

```bash
uv run ~/.claude/ingest_sessions.py
```

**Non-blocking**: if command fails (Docker down, script absent, etc.), note `[Postgres sync skipped]` in confirmation and continue without interrupting recap. This step feeds the `recap_md` source in Postgres, complementary to raw JSONL ingested by `/friction-scan`.

## Step 4 — Propose Capitalizations (if applicable)

**Only if technical decisions or ADR were identified in Step 2**:

### ADR Proposal
- **If transverse decision** (affects multiple projects or technical domain) → propose ADR in `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ADR/`
- **If project-specific decision** → propose ADR in `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/claude-code/ADR/`
- **Don't create the ADR** — propose it to {USER_NAME} with title and brief description, wait for validation

### INDEX Update Proposal
- If ADR created → update INDEX of corresponding ADR directory (with {USER_NAME} validation)
- If skill created/modified → update `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/INDEX.md`

**Wait for validation before executing**.

### Save to Proposals File (always)

After the interactive proposal (whether {USER_NAME} validates or not), write proposals to `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/proposals-YYYY-MM-DD.md`:

- If file doesn't exist → create with frontmatter `processed: false`
- If file exists → append with `---` between sessions
- Format:

```markdown
---
date: YYYY-MM-DD
processed: false
---

## Session [HH:MM]

### ADR to Create
- **ADR**: [Title] — [Scope: transverse | project X] — [Context in 1 sentence]

### Skills to Update
- **Skill**: [name] — [Action: create | update] — [Context in 1 sentence]
```

Omit ADR or Skills section if none in that category. This save guarantees `/closeday` finds proposals even if session was recapped manually (not via hook).

## Step 4.5 — Propose Knowledge Notes (if applicable)

**Only if substantial synthesis was produced during the session** (analysis, comparison, documented decision in depth, exploration of tool or concept):

Ask {USER_NAME}: *"Does a synthesis produced in this session deserve a Knowledge note?"*

If yes → propose title + target folder in `03 - Knowledge/`:
```
→ [[note-name]] — 03 - Knowledge/[subfolder]/
   Summary in 1 line of what it would contain
```

Add proposal to `proposals-YYYY-MM-DD.md` file (same mechanism as ADR proposals, section `### Knowledge Notes to Create`).

**Don't create the note without {USER_NAME} validation.** If {USER_NAME} refuses or doesn't respond → skip silently.

## Absolute Rules

- Never run `/clear` — {USER_NAME} does that after reading recap
- Don't overwrite existing session from same day — add a section
- Observations must be factual, not flattering
- **Never autonomously create ADR or modify INDEX without {USER_NAME} validation**
- If a session note exists and you create a new section, leave previous sections intact
- If MCP fails → fallback to manual Read + Write without blocking

---

## Technical Note — SessionEnd Hook (ADR-055)

The `recap-session.js` hook that triggers this skill at session end is protected by two guards:

1. **Guard `entrypoint`**: `entrypoint: sdk-cli` → skip (subagents + `claude --print`). Only `entrypoint: cli` = interactive session.
2. **Deduplication by `transcript_path`**: marker file in `~/.claude/cache/recap-done/` (mode `wx`, race-condition-safe). Prevents double-fire on compaction + exit.

Do **not** use `last-prompt` as discriminator — it also appears in sessions resumed after compaction (false positives).
