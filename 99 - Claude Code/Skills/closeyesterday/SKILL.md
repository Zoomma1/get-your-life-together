---
name: closeyesterday
description: Close yesterday's day when /closeday wasn't launched — same logic as /closeday but applied to J-1. Invoke from /today when yesterday isn't closed.
---

# Skill : /closeyesterday

Applies the same logic as `/closeday` but to yesterday's daily note (`J-1`) instead of today.

## Prerequisite — Load vault parameters

Read `99 - Claude Code/config/vault-settings.md` → extract : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Trigger

- Auto-invoked from `/today` when yesterday isn't closed
- Manual invocation : `/closeyesterday`

## Steps

Apply exactly the same steps as `/closeday`, replacing :
- "daily note of day" → yesterday's daily note (`[NOTES_FOLDER]/[date J-1 per DATE_FORMAT].md`)
- "session of day" → last session existing before today in `99 - Claude Code/Sessions/`

Read the `/closeday` skill for step details.

## Absolute rule

Never modify today's daily note. Operate only on J-1.
