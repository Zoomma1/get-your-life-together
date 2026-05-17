---
name: recapsession
description: Create a recap of the current work session and propose capitalizations (ADR/Skills) if applicable. Use when the user says "recap session", "on s'arrête", "c'est bon pour aujourd'hui", "je coupe" or via /recapsession.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **narrative qualitative** output. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, highlights, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Session Recap + Capitalization

## What it does

A recap creates a persistent trace of what was accomplished, what decisions were made, and what is blocking for tomorrow. It is the only place where Claude documents what it **saw**, not what {USER_NAME} **changed** (that is git's job).

## Triggering

- the user says "recap session", "on s'arrête", "c'est bon pour aujourd'hui", "je coupe"
- Command `/recapsession`

## Step 1 — Identify context

1. Get the exact local time via bash:
   ```bash
   date +%H:%M
   ```
   Use this time in the section title. Never invent a time.
2. **Target date** : if `time < 04:00` → date = previous day, otherwise date = today. All sessions are written to `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[target date].md`, regardless of project.
3. If a session note for today already exists → add a new section `## Session [HH:MM]` rather than overwrite.

## Step 2 — Build the recap

Summarize the session by covering these 4 sections:

### What was accomplished
Concise list of completed tasks, decisions made.

### Files discussed or consulted
Files addressed during the session (not a git truth — Claude does not see {USER_NAME}'s diff).
**If no files were consulted**, note "None — discussion/reflection session".

### Technical decisions or changes in direction
If decisions were noted, identify their characteristics:
- **Nature** : does it span multiple projects, a specific project, or a technical domain?
- **Scope** : does it affect code, infrastructure, daily workflow, skills?
**If no notable decision**, note "None — exploratory session".

### State at the end
What remains, next logical step, resume command if applicable.

> ⏱ **Time range = effective work only** : if a notable break (meal, absence > 15min) is reported during a ticket, the `⏱ HH:mm→HH:mm` range in the daily note must not encompass it. Close the range before the break, reopen after. Never write a range that silently includes a break.

### Session observation
Note honestly according to what happened during the session, without inventing:
- **Flow** : {USER_NAME} was advancing fast, few blockers, direct responses
- **Focused** : progressing well but with effort
- **Blocked** : technical difficulties, multiple attempts
- **Frustrated** : frustration signals detected (reformulations, corrections, "ça marche pas")
- **Tired** : short responses, less engagement, frequent breaks
- **Satisfied** : objective reached, good progress

If no clear signal → note "Neutral / no particular signal".

## Step 3 — Write the note

Write the recap in `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[target date].md` by adding a section.

Section title based on context:
- Normal hours : `## Session [HH:MM] — [short title]`
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
[Flow / Focused / Blocked / Frustrated / Tired / Satisfied] — [one sentence of context]
```

Use Write or MCP if available, fallback to manual Read + Write if MCP fails.

## Step 3.5 — Sync Postgres

After writing the `.md` file, run:

```bash
uv run ~/.claude/ingest_sessions.py
```

**Non-blocking** : if the command fails (Docker down, script absent, etc.), note `[Postgres sync skipped]` in the confirmation and continue without interrupting the recap. This step feeds the `recap_md` source in Postgres, complementary to raw JSONL ingested by `/friction-scan`.

## Step 4 — Propose capitalizations (if applicable)

**Only if technical decisions or ADR were identified in Step 2** :

### ADR Proposal
- **If transverse decision** (affects multiple projects or technical domain) → propose ADR in `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ADR/`
- **If project-specific decision** → propose ADR in `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/claude-code/ADR/`
- **Do not create the ADR** — propose it to {USER_NAME} with a title and brief description, wait for validation

### Propose INDEX update
- If ADR created → update the INDEX of the corresponding ADR directory (with {USER_NAME} validation)
- If skill created/modified → update `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/INDEX.md`

**Wait for validation before executing**.

### Save in proposals file (always)

After interactive proposal ({USER_NAME} validates or not), write proposals to `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/proposals-YYYY-MM-DD.md` :

- If the file does not exist → create with frontmatter `processed: false`
- If the file exists → append with `---` between sessions
- Format :

```markdown
---
date: YYYY-MM-DD
processed: false
---

## Session [HH:MM]

### ADR to create
- **ADR** : [Title] — [Scope : transverse | project X] — [Context in 1 sentence]

### Skills to update
- **Skill** : [name] — [Action : create | update] — [Context in 1 sentence]
```

Omit the ADR or Skills section if none in that category. This save guarantees that `/closeday` will find proposals even if the session was recapped manually (not via hook).

## Step 4.5 — Propose Knowledge notes (if applicable)

**Only if substantial synthesis was produced during the session** (analysis, comparison, documented decision in depth, exploration of a tool or concept) :

Ask {USER_NAME} : *"Does a synthesis produced in this session deserve a Knowledge note ?"*

If yes → propose title + target folder in `03 - Knowledge/` :
```
→ [[note-name]] — 03 - Knowledge/[sub-folder]/
   One-line summary of what it would contain
```

Add the proposal to the `proposals-YYYY-MM-DD.md` file (same mechanism as ADR proposals, section `### Knowledge notes to create`).

**Do not create the note without {USER_NAME} validation.** If {USER_NAME} refuses or does not respond → skip silently.

## Absolute rules

- Never type `/clear` — that is {USER_NAME} who does it after reading the recap
- Do not overwrite an existing session from the same day — add a section
- Observations must be factual, not flattering
- **Never autonomously create ADR or modify INDEX without {USER_NAME} validation**
- If a session note already exists and you create a new section, leave previous sections intact
- If MCP fails → fallback to manual Read + Write without blocking the process

---

## Technical note — SessionEnd hook (ADR-055)

The `recap-session.js` hook that triggers this skill at session end is protected by two guards:

1. **Guard `entrypoint`** : `entrypoint: sdk-cli` → skip (subagents + `claude --print`). Only `entrypoint: cli` = interactive session.
2. **Deduplication by `transcript_path`** : marker file in `~/.claude/cache/recap-done/` (mode `wx`, race-condition-safe). Prevents double-fire on compaction + exit.

Do **not** use `last-prompt` as a discriminator — it also appears in sessions resumed after compaction (false positives).
