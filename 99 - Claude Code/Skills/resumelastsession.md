---
name: resumelastsession
description: Resume last work session — loads previous session, project context, and new data since yesterday.
---

# Skill : Session resume

## Step 1 — Locate most recent session file

Use Glob on `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` with pattern `**/*.md` to list all `.md` files.
Sort by filename (format `YYYY-MM-DD.md`) and extract file with highest date.

**If no file exists**: signal and propose Victor start from today's daily note (`00 - Daily notes/YYYY-MM-DD.md`).

## Step 2 — Extract session context + project

Read entire session file.
Identify the **last section** `## Session [HH:MM]` (most recent in file).
- If no `## Session` section exists → signal "Session file malformed" and propose fallback daily note

Extract exactly in this order (and list found sections):
1. **✅ Accomplished** — what was done (dedicated section or bullet points)
2. **⏭️ Next step / Next** — where to resume (section or list)
3. **🧭 Victor's state / Notes** — observations on his condition at session end

**Explicitly note in summary**: any missing or empty section.

In parallel, **identify the project** among: FSTG, ML VUT, HomeLabServeur, Rust Deploy Tool, Ludisep, AirBnBoat, CryptoBot, Vault, or other.
- Search name explicitly in last session section, or in accomplishment content
- If name not findable → signal and ask Victor to clarify project

## Step 3 — Load project context and new data

If project could be identified:
- Search its README: `{VAULT_PATH}\{PROJECTS_FOLDER}\[Project]\claude-code\README.md`
- If file exists → read and memorize: stack, architecture, key files
- If missing → signal "Project README not found" and ask to continue without, or specify another project

Check if session is dated before today (time gap):
- If yes → read today's daily note (`00 - Daily notes/YYYY-MM-DD.md`)
- If daily note exists and contains plans/notes → extract and mention
- If daily note doesn't exist or empty → signal "no changes since last session"

## Step 4 — Display summary and load

Display in this format:

```
📂 Session from [date] at [HH:MM]

✅ Accomplished :
[chronological list of accomplishments, or "(none noted)"]

⏭️ Next step :
[defined action, or "(to define)"]

🧭 Victor's state :
[observation or "(no notes)"]

[If time gap and daily note with content]
📋 New context since yesterday :
[summary of today's daily, or "no changes"]

---
Identified project: [project name] | Context loaded.
```

**Important**: Before continuing, Victor must validate. Ask "Ready to continue?" or wait for next instruction.

## Absolute rules

- Never invent information absent from session file
- If a section is empty or missing → mention it explicitly ("(none noted)", "(no notes)", etc.)
- If no session file exists → propose fallback on today's daily note, wait for Victor validation
- If project undetermined → signal and ask Victor to specify
- If project README is missing → signal the issue, propose continue without or clarify project
- Don't load contexts from multiple projects if ambiguous — find most relevant or ask
