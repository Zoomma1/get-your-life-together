---
name: resumelastsession
description: Resume the last work session — load the previous session, project context, and new data since yesterday.
---

# Skill: Session Resume

## Step 1 — Locate the most recent session file

Use Bash to list the `.md` files in the `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/` folder and **filter only files in the `YYYY-MM-DD.md` format** (pattern `^[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$`) — `proposals-*.md` files are excluded.

```bash
ls "{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/" | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$' | sort | tail -1
```

Extract the file with the highest date.

**If no file exists**: report and suggest {USER_NAME} start from today's daily note (`00 - Daily notes/YYYY-MM-DD.md`).

## Step 2 — Extract session context + project

Read the entire session file.
Identify the **latest section** `## Session [HH:MM]` (the most recent in the file).
- If no `## Session` section exists → report "Session file malformed" and suggest daily note fallback

Extract exactly in this order (and list the sections found):
1. **✅ Accomplished** — what was done (dedicated section or bullet points)
2. **⏭️ Next step / Next** — where to resume (section or list)
3. **🧭 {USER_NAME}'s state / Notes** — observations on their state at session end

**Note explicitly in the summary**: any section absent or empty.

In parallel, **identify the project** from the session content, or ask the user to specify.
- Look for the name explicitly in the latest session section, or in the accomplishments content
- If the name cannot be found → report and ask {USER_NAME} to clarify the project

## Step 3 — Load project context and new data

If the project could be identified:
- Look for its README: `{VAULT_PATH}\{PROJECTS_FOLDER}\[Project]\claude-code\README.md`
- If the file exists → read and memorize: stack, architecture, key files
- If absent → report "Project README not found" and ask whether to continue without, or specify another project

Check if the session is dated before today (time gap):
- If yes → read today's daily note (`00 - Daily notes/YYYY-MM-DD.md`)
- If the daily note exists and contains plans/notes → extract and mention
- If the daily note doesn't exist or is empty → report "no changes since last session"

## Step 4 — Display summary and load

Display in this format:

```
📂 Session from [date] at [HH:MM]

✅ Accomplished:
[chronological list of accomplishments, or "(none noted)"]

⏭️ Next step:
[defined action, or "(to be defined)"]

🧭 {USER_NAME}'s state:
[observation or "(no notes)"]

[If time gap and daily note with content]
📋 New context since yesterday:
[summary of today's daily note, or "no changes"]

---
Project identified: [project name] | Context loaded.
```

**Important**: At the end of the summary, {USER_NAME} must validate before proceeding. Ask "Ready to continue?" or wait for their next instruction.

## Absolute rules

- Never invent information missing from the session file
- If a section is empty or absent → mention it explicitly ("(none noted)", "(no notes)", etc.)
- If no session file exists → suggest fallback on today's daily note, wait for {USER_NAME}'s validation
- If project is undetermined → report and ask {USER_NAME} to specify it
- If project README is missing → report the issue, offer to continue without or clarify the project
- Don't load contexts from multiple projects if ambiguous — find the most relevant one or ask
