---
name: resumelastsession
description: Resume the last work session — loads the previous session, project context, and new data since yesterday.
---

# Skill: Session resumption

## Step 1 — Locate the most recent session file

Use Glob on `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` with the pattern `**/*.md` to list all `.md` files.
Sort by filename (format `YYYY-MM-DD.md`) and extract the file with the highest date.

**If no file exists**: signal and propose {USER_NAME} to start from today's daily note (`00 - Daily notes/YYYY-MM-DD.md`).

## Step 2 — Extract session context + project

Read the session file in full.
Identify the **last section** `## Session [HH:MM]` (the most recent in the file).
- If no `## Session` section exists → signal "Session file malformed" and propose fallback to daily note

Extract exactly in this order (and list the sections found):
1. **✅ Accomplished** — what was done (dedicated section or bullet points)
2. **⏭️ Next step / Next** — where to resume (section or list)
3. **🧭 {USER_NAME}'s state / Notes** — observations about their state at session end

**Explicitly note**: any section absent or empty.

In parallel, **identify the project** from session content, or ask the user to specify.
- Look for the name explicitly in the last session section, or in accomplishment content
- If the name is not findable → signal and ask {USER_NAME} to specify the project

## Step 3 — Load project context and new data

If the project could be identified:
- Look for its README: `{VAULT_PATH}\{PROJECTS_FOLDER}\[Project]\claude-code\README.md`
- If the file exists → read and memorize: stack, architecture, key files
- If absent → signal "Project README not found" and ask if to continue without, or specify another project

Check if the session dates before today (time offset):
- If yes → read today's daily note (`00 - Daily notes/YYYY-MM-DD.md`)
- If the daily note exists and contains plans/notes → extract and mention
- If the daily note doesn't exist or is empty → signal "no changes since last session"

## Step 4 — Display the summary and load

Display in this format:

```
📂 Session from [date] at [HH:MM]

✅ Accomplished:
[chronological list of accomplishments, or "(none noted)"]

⏭️ Next step:
[defined action, or "(to be defined)"]

🧭 {USER_NAME}'s state:
[observation or "(no notes)"]

[If time offset and daily note with content]
📋 New context since yesterday:
[summary of today's daily note, or "no changes"]

---
Project identified: [project name] | Context loaded.
```

**Important**: At the end of the summary, {USER_NAME} must validate before continuing. Ask "Ready to continue?" or wait for their next instruction.

## Absolute rules

- Never invent information absent from the session file
- If a section is empty or absent → mention it explicitly ("(none noted)", "(no notes)", etc.)
- If no session file exists → propose fallback to today's daily note, await {USER_NAME} validation
- If project is undetermined → signal and ask {USER_NAME} to specify
- If the project README is absent → signal the problem, propose to continue without or clarify the project
- Do not load contexts from multiple projects if ambiguous — find the most relevant or ask
