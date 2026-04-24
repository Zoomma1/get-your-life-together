---
name: recapsession
description: Create a recap of current work session and propose capitalizations (ADR/Skills) if applicable. Use when Victor says "recap session", "we're stopping", "that's good for today", "I'm cutting off" or via /recapsession.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected from aggressive optimization**
>
> This skill produces **narrative qualitative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). The preservation of qualitative content takes priority over line reduction.

# Skill : Session recap + Capitalization

## Purpose

A recap creates a persistent trace of what was accomplished, what decisions were made, and what blocks tomorrow. It's the only place Claude documents what he **saw**, not what Victor **changed** (that's git's job).

## Trigger

- Victor says "recap session", "we're stopping", "that's good for today", "I'm cutting off"
- Command `/recapsession`

## Step 1 — Identify context

1. Get exact local time via bash :
   ```bash
   date +%H:%M
   ```
   Use this time in section title. Never invent a time.
2. **Target date** : if `time < 04:00` → date = yesterday, else date = today. All sessions written to `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[target date].md`, regardless of project.
3. If a session note for day already exists → add new section `## Session [HH:MM]` rather than overwriting.

## Step 2 — Build the recap

Summarize the session covering these 4 sections :

### What was accomplished
Concise list of tasks completed, decisions made.

### Files discussed or consulted
Files addressed during session (not a git truth — Claude doesn't see Victor's diff).
**If no files consulted**, note "None — discussion/reflection session".

### Technical decisions or direction changes
If decisions were noted, note their characteristics :
- **Nature** : does it span multiple projects, one specific project, or a technical domain ?
- **Scope** : does it affect code, infrastructure, daily workflow, skills ?
**If no notable decision**, note "None — exploratory session".

### State at the end
What remains, logical next step, resume command if applicable.

### Session observation
Note honestly based on what happened during session, don't invent :
- **Flow** : Victor progressing fast, few blockers, direct responses
- **Focused** : advancing well but with effort
- **Blocked** : technical difficulties, multiple attempts
- **Frustrated** : frustration signals detected (reformulations, corrections, "doesn't work")
- **Tired** : short responses, less engagement, frequent pauses
- **Satisfied** : goal reached, good progress

If no clear signal → note "Neutral / no particular signal".

## Step 3 — Write the note

Write recap to `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[target date].md` by adding a section.

Section title based on context :
- Normal time : `## Session [HH:MM] — [short title]`
- After midnight : `## Session [HH:MM] 🌙 (after midnight) — [short title]`

```markdown
## Session [HH:MM] — [short title]

### ✅ Accomplished
- ...
- ...

### 🔧 Files discussed / consulted
- ...

### 🧠 Decisions made
- ...

### ⏭️ Next step
...

### 🧭 Observation
[Flow / Focused / Blocked / Frustrated / Tired / Satisfied] — [one sentence context]
```

Use Write or MCP if available, fallback to Read + Write manual if MCP fails.

## Step 3.5 — Sync Postgres

After file writing, launch :

```bash
uv run ~/.claude/ingest_sessions.py
```

**Non-blocking** : if command fails (Docker down, script absent, etc.), note `[Postgres sync skipped]` in confirmation and continue without interrupting recap. This step feeds `recap_md` source in Postgres, complementary to raw JSONL ingested by `/friction-scan`.

## Step 4 — Propose capitalizations (if applicable)

**Only if technical decisions or ADRs identified in Step 2** :

### ADR Proposal
- **If transverse decision** (affects multiple projects or technical domain) → propose ADR in `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ADR/`
- **If project-specific decision** → propose ADR in `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/claude-code/ADR/`
- **Don't create the ADR** — propose it to Victor with title and brief description, wait for validation

### Proposed INDEX update
- If ADR created → update corresponding ADR directory INDEX (with Victor validation)
- If skill created/modified → update `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/INDEX.md`

**Wait for validation before executing**.

### Save to proposals file (always)

After interactive proposal (whether Victor validates or not), write proposals to `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\proposals-YYYY-MM-DD.md` :

- If file doesn't exist → create with frontmatter `processed: false`
- If file exists → append with `---` between sessions
- Format :

```markdown
---
date: YYYY-MM-DD
processed: false
---

## Session [HH:MM]

### ADR to create
- **ADR** : [Title] — [Scope : transverse | project X] — [1-sentence context]

### Skills to update
- **Skill** : [name] — [Action : create | update] — [1-sentence context]
```

Omit ADR or Skills section if none in that category. This save guarantees `/closeday` finds proposals even if session was recapped manually (not via hook).

## Absolute rules

- Never type `/clear` — that's Victor's choice after reading recap
- Don't overwrite existing session from same day — add a section
- Observations must be factual, not flattering
- **Never create ADR autonomously or modify INDEX without Victor validation**
- If session note already exists and creating new section, leave previous sections intact
- If MCP fails → fallback to Read + Write manual without blocking process
