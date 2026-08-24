---
name: recapsession
description: Create a recap of the current work session and propose capitalizations (ADR/Skills) if applicable. Use when the user says "recap session", "we're done", "that's good for today", "I'm stopping" or via /recapsession.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **narrative qualitative** output. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, highlights, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Session Recap + Capitalization

## What it's for

A recap creates a persistent trace of what was accomplished, what decisions were made, and what blocks for tomorrow. It's the only place where Claude documents what it **saw**, not what {USER_NAME} **changed** (that's git's job).

## Trigger

- the user says "recap session", "we're done", "that's good for today", "I'm stopping"
- Command `/recapsession`

## Step 1 — Identify the context

1. Get the exact local time via bash:
   ```bash
   date +%H:%M
   ```
   Use this time in the section title. Never invent a time.
2. **Target date** : if `time < 04:00` → date = yesterday, otherwise date = today. All sessions are written to `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[target date].md`, regardless of project.
3. If a session note for the day already exists → add a new section `## Session [HH:MM]` rather than overwriting.

## Step 2 — Build the recap

Summarize the session covering these 4 sections:

### What was accomplished
Concise list of tasks completed, decisions made.

### Files discussed or consulted
Files addressed during the session (not a git truth — Claude doesn't see {USER_NAME}'s diff).
**If no files were consulted**, note "None — discussion/reflection session".

### Technical decisions or direction changes
If decisions were recorded, highlight their characteristics:
- **Nature** : does it span multiple projects, a specific project, or a technical domain?
- **Scope** : does it affect code, infrastructure, daily workflow, skills?
**If no notable decisions**, note "None — exploratory session".

### State at the end
What remains, next logical step, resume command if applicable.

> ⏱ **Time range = effective work only** : if a notable break (meal, absence > 15min) is noted during a ticket, the `⏱ HH:mm→HH:mm` range in the daily note must not include it. Close the range before the break, reopen after. Never write a range that silently includes a break.

### Session observation
Note honestly based on what happened during the session, without inventing:
- **Flow** : {USER_NAME} was advancing fast, few blockers, direct responses
- **Focused** : making good progress but with effort
- **Blocked** : technical difficulties, multiple attempts
- **Frustrated** : frustration signals detected (reformulations, corrections, "it doesn't work")
- **Tired** : short responses, less engagement, frequent breaks
- **Satisfied** : objective reached, good progress

If no clear signal → note "Neutral / no particular signal".

## Step 3 — Write the note

Write the recap to `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[target date].md` by adding a section.

Section title based on context:
- Normal hours: `## Session [HH:MM] — [short title]`
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
[Flow / Focused / Blocked / Frustrated / Tired / Satisfied] — [one sentence of context]
```

Use Write or MCP if available, fallback to Read + Write manual if MCP fails.

## Step 3.5 — Postgres Sync

After writing the `.md` file, run:

```bash
uv run ~/.claude/ingest_sessions.py
```

**Non-blocking** : if the command fails (Docker down, script missing, etc.), note `[Postgres sync skipped]` in the confirmation and continue without interrupting the recap. This step feeds the `recap_md` source in Postgres, complementary to raw JSONL ingested by `/friction-scan`.

## Step 4 — Propose capitalizations (if applicable)

**Only if technical decisions or ADR were identified in Step 2** :

### ADR Proposal
- Propose to {USER_NAME} the title + scope (transverse or project X) + context in 1 sentence, **wait for validation**.
- **If {USER_NAME} validates immediately** → invoke `/create-adr` with `scope` (`transverse` or project name) + the title. `/create-adr` is the unique entry point: it drafts the full ADR, detects the folder naming convention, numbers, handles overlaps/supersedes and **updates the INDEX itself**. Never draft an ADR by hand in this skill.
- **If {USER_NAME} defers or doesn't validate** → don't create anything, the proposal is saved in the proposals file (below) and will be picked up by `/closeday` Step 5 (which also invokes `/create-adr`).

### INDEX update proposal (skills only)
- The ADR INDEX is managed by `/create-adr` — don't touch it here.
- If skill created/modified → propose updating `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/INDEX.md` (with {USER_NAME} validation).

**Wait for validation before executing**.

### Save to proposals file (always)

After the interactive proposal (whether {USER_NAME} validates or not), write proposals to `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/proposals-YYYY-MM-DD.md` :

- If the file doesn't exist → create with frontmatter `processed: false`
- If the file exists → append with `---` between sessions
- Format :

```markdown
---
date: YYYY-MM-DD
processed: false
---

## Session [HH:MM]

### ADRs to create
- **ADR** : [Title] — [Scope: transverse | project X] — [Context in 1 sentence]

### Skills to update
- **Skill** : [name] — [Action: create | update] — [Context in 1 sentence]
```

Omit the ADR or Skills section if none in that category. This save ensures that `/closeday` finds proposals even if the session was recapped manually (not via hook).

## Step 4.5 — Knowledge notes proposal (if applicable)

**Only if a substantial synthesis was produced during the session** (analysis, comparison, documented decision in depth, exploration of a tool or concept) :

Ask {USER_NAME} : *"Does a synthesis produced in this session deserve a Knowledge note?"*

If yes → propose title + target folder in `03 - Knowledge/` :
```
→ [[note-name]] — 03 - Knowledge/[subfolder]/
   One-line summary of what it would contain
```

Add the proposal to the `proposals-YYYY-MM-DD.md` file (same mechanics as ADR proposals, section `### Knowledge notes to create`).

**Do not create the note without {USER_NAME} validation.** If {USER_NAME} refuses or doesn't respond → skip silently.

## Step 4.6 — Distillation signal (if applicable)

Some patterns are neither an ADR nor a skill update: these are **lessons candidates**, to be routed by `/lessons-distill`. Surfacing them here prevents them from dissolving in the recap.

**The pattern to watch for as priority** — *"rule cited then broken in the same response"* : the session cites a rule from `CLAUDE.md`, a skill or an ADR, then acts against it in the same turn. This is the **dominant** pattern from the first complete `/friction-scan` report (08/20/2026, 437 sessions read, 15 frictions confirmed) — it's not visible when reviewing a single session, only in series.

If the pattern is present → add it to the proposals file under a dedicated section, without treating it:

```markdown
### Distillation signal
- **Pattern** : [short pattern name] — [where it occurred in the session, in 1 sentence]
```

**Don't write anything to `lessons.md` from this skill.** The file is injected entirely at each prompt: it only hosts still-unstable global behavioral content, and it's `/lessons-distill` that arbitrates entry and graduation.

## Absolute rules

- Never type `/clear` — that's for {USER_NAME} to do after reading the recap
- Don't overwrite an existing session from the same day — add a section
- Observations must be factual, not flattering
- **Never create ADR autonomously or modify INDEX without {USER_NAME} validation**
- If a session note already exists and you're creating a new section, leave previous sections untouched
- If MCP fails → fallback to Read + Write manual without blocking the process
- **A "recap note" from a project investigation is not a `/recapsession`.** When {USER_NAME} asks to note a diagnosis or investigation *for a project*, create a **dedicated note in the project's vault folder** (eg. `06 - Work/…/Projects/<project>/`) and enter it in its `INDEX.md`. This skill is reserved for **session** recap (folder `Sessions/`). Don't file a project investigation in `Sessions/` just because the word "recap" was mentioned. *(Validated {USER_NAME} 2026-06-22.)*

---

## Technical note — SessionEnd hook (ADR-055)

The `recap-session.js` hook that triggers this skill at session end is protected by two guards:

1. **Guard `entrypoint`** : `entrypoint: sdk-cli` → skip (subagents + `claude --print`). Only `entrypoint: cli` = interactive session.
2. **Deduplication by `transcript_path`** : marker file in `~/.claude/cache/recap-done/` (mode `wx`, race-condition-safe). Prevents double-fire on compaction + exit.

Do **not** use `last-prompt` as a discriminator — it also appears in sessions resumed after compaction (false positives).
