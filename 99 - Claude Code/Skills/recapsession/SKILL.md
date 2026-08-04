---
name: recapsession
description: Create a recap of the current work session and propose capitalizations (ADR/Skills) if applicable. Use when the user says "recap session", "stopping", "that's good for today", "I'm cutting" or via /recapsession.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **narrative qualitative** output. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). The preservation of qualitative content takes priority over line reduction.

# Skill: Session Recap + Capitalization

## What it's for

A recap creates a persistent trace of what was accomplished, what decisions were made, and what's blocking for tomorrow. It's the only place where Claude documents what it has **seen**, not what {USER_NAME} has **changed** (that's git's job).

## Trigger

- the user says "recap session", "stopping", "that's good for today", "I'm cutting"
- Command `/recapsession`

## Step 1 — Identify context

1. Retrieve the exact local time via bash:
   ```bash
   date +%H:%M
   ```
   Use this time in the section title. Never invent a time.
2. **Target date**: if `time < 04:00` → date = yesterday, otherwise date = today. All sessions are written in `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[target date].md`, regardless of the project.
3. If a session note for the day already exists → add a new section `## Session [HH:MM]` instead of overwriting.

## Step 2 — Build the recap

Summarize the session covering these 4 sections:

### What was done
Concise list of tasks completed, decisions made.

### Files discussed or consulted
Files addressed during the session (not git truth — Claude does not see {USER_NAME}'s diff).
**If no files were consulted**, note "None — discussion/reflection session".

### Technical decisions or changes in direction
If decisions were documented, highlight their characteristics:
- **Nature**: does it affect multiple projects, a specific project, or a technical domain?
- **Scope**: does it affect code, infrastructure, daily workflow, skills?
**If no notable decision**, note "None — exploratory session".

### State at the end
What remains, logical next step, resume command if applicable.

> ⏱ **Time range = effective work only**: if a notable pause (meal, absence > 15min) is reported during a ticket, the time range `⏱ HH:mm→HH:mm` in the daily note should not include it. Close the range before the pause, reopen after. Never write a range that silently includes a pause.

### Session observation
Note honestly based on what happened during the session, without inventing:
- **Flow**: {USER_NAME} was moving fast, few blockers, direct responses
- **Focused**: progressing well but with effort
- **Blocked**: technical difficulties, multiple attempts
- **Frustrated**: frustration signals detected (reformulations, corrections, "it's not working")
- **Tired**: short responses, less engagement, frequent pauses
- **Satisfied**: objective reached, good progress

If no clear signal → note "Neutral / no particular signal".

## Step 3 — Write the note

Write the recap in `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[target date].md` by adding a section.

Section title depending on context:
- Normal time: `## Session [HH:MM] — [short title]`
- After midnight: `## Session [HH:MM] 🌙 (after midnight) — [short title]`

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

After writing the `.md` file, run:

```bash
uv run ~/.claude/ingest_sessions.py
```

**Non-blocking**: if the command fails (Docker down, missing script, etc.), note `[Postgres sync skipped]` in the confirmation and continue without interrupting the recap. This step feeds the `recap_md` source in Postgres, complementary to raw JSONL ingested by `/friction-scan`.

## Step 4 — Propose capitalizations (if applicable)

**Only if technical decisions or ADRs were identified in Step 2**:

### ADR proposal
- Propose to {USER_NAME} the title + scope (transverse or project X) + context in 1 sentence, **wait for validation**.
- **If {USER_NAME} validates on the spot** → invoke `/create-adr` with `scope` (`transverse` or project name) + title. `/create-adr` is the unique entry point: it drafts the complete ADR, detects the folder naming convention, numbers, manages overlaps/supersedes and **updates the INDEX itself**. Never draft an ADR manually in this skill.
- **If {USER_NAME} defers or does not validate** → create nothing, the proposal is saved in the proposals file (below) and will be taken up by `/closeday` Step 5 (which also invokes `/create-adr`).

### Proposal to update INDEX (skills only)
- The ADR INDEX is managed by `/create-adr` — do not touch it here.
- If skill created/modified → propose updating `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/INDEX.md` (with {USER_NAME} validation).

**Wait for validation before executing**.

### Saving in the proposals file (always)

After interactive proposal (whether {USER_NAME} validates or not), write proposals to `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/proposals-YYYY-MM-DD.md`:

- If the file does not exist → create with frontmatter `processed: false`
- If the file exists → append with `---` between sessions
- Format:

```markdown
---
date: YYYY-MM-DD
processed: false
---

## Session [HH:MM]

### ADRs to create
- **ADR**: [Title] — [Scope: transverse | project X] — [Context in 1 sentence]

### Skills to update
- **Skill**: [name] — [Action: create | update] — [Context in 1 sentence]
```

Omit the ADR or Skills section if none in this category. This save guarantees that `/closeday` will find proposals even if the session was recapped manually (and not via hook).

## Step 4.5 — Propose Knowledge notes (if applicable)

**Only if substantial synthesis was produced during the session** (analysis, comparison, documented decision in depth, exploration of a tool or concept):

Ask {USER_NAME}: *"Does a synthesis produced in this session deserve a Knowledge note?"*

If yes → propose title + target folder in `03 - Knowledge/`:
```
→ [[note-name]] — 03 - Knowledge/[subfolder]/
   One-line summary of what it would contain
```

Add the proposal to the file `proposals-YYYY-MM-DD.md` (same mechanism as ADR proposals, section `### Knowledge notes to create`).

**Do not create the note without {USER_NAME} validation.** If {USER_NAME} declines or does not respond → silent skip.

## Absolute rules

- Never type `/clear` — it's {USER_NAME} who does it after reading the recap
- Do not overwrite an existing session from the same day — add a section
- Observations must be factual, not flattering
- **Never create an ADR autonomously or modify INDEX without {USER_NAME} validation**
- If a session note already exists and you create a new section, leave previous sections intact
- If MCP fails → fallback to Read + Write manual without blocking the process
- **A "recap note" of a project investigation is not a `/recapsession`.** When {USER_NAME} asks to document a diagnosis or investigation *for a project*, create a **dedicated note in the project vault folder** (e.g., `06 - Work/…/Projects/<project>/`) and enter it in its `INDEX.md`. This skill is reserved for the **session** summary (folder `Sessions/`). Do not file a project investigation in `Sessions/` on the pretext that the word "recap" was mentioned. *(Validated {USER_NAME} 2026-06-22.)*

---

## Technical note — SessionEnd hook (ADR-055)

The `recap-session.js` hook that triggers this skill at session end is protected by two guards:

1. **`entrypoint` guard**: `entrypoint: sdk-cli` → skip (subagents + `claude --print`). Only `entrypoint: cli` = interactive session.
2. **Deduplication by `transcript_path`**: file marker in `~/.claude/cache/recap-done/` (mode `wx`, race-condition-safe). Prevents double-fire on compaction + exit.

Do **not** use `last-prompt` as a discriminator — it also appears in sessions resumed after compaction (false positives).
