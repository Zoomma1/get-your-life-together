---
name: addevent
description: When {USER_NAME} wants to add a time block to their daily note to visualize it in Full Calendar. Triggered via /addevent with or without arguments — e.g., /addevent 11:30 12:30 Revision ibP
---

## Arguments

`$ARGUMENTS` accepts 0 to 3 elements, in order: `[startTime] [endTime] [title]`
- Format HH:mm : hours 00:00 to 23:59 (24h)
- Complete example : `/addevent 11:30 12:30 Revision ibP`
- Partial example (startTime + title) : `/addevent 14:30 Dentist`
- Minimal example : `/addevent 14:00`

## Behavior

1. Parse `$ARGUMENTS` into components [startTime] [endTime] [title] :
   - Identify tokens in HH:mm format
   - Remaining text = title
   - Case 1 : three valid elements (HH:mm HH:mm text) → continue
   - Case 2 : two HH:mm + title → continue
   - Case 3 : one HH:mm + title (no second HH:mm) → ask for endTime
   - Case 4 : two HH:mm (no title) → ask for title
   - Case 5 : one HH:mm (no title) → ask for endTime and title
   - Case 6 : text only (no HH:mm) → ask for startTime and endTime
   - Case 7 : empty → ask for startTime, endTime and title

2. Validate times :
   - Format HH:mm : reject if MM >= 60 or HH >= 24, re-ask
   - Logic : reject if startTime >= endTime, re-ask

3. Read (or create) the daily note : `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\YYYY-MM-DD.md` (current date)
   - If file doesn't exist, create it using the template `{VAULT_PATH}\Resources\Templates\Daily notes template.md` :
     - Read the template
     - Resolve all Templater placeholders `<% tp.date.now(...) %>` with current date (e.g., `<% tp.date.now("YYYY-MM-DD") %>` → `2026-04-02`)
     - Create the note with resolved content (full frontmatter + all sections)

4. Locate the `### 📅 Agenda` section :
   - If it exists → insert at the end (at the last checked item or text before blank lines)
   - If missing, but `## 📅 Plan du jour` exists → add `### 📅 Agenda` below
   - If both absent → create `### 📅 Agenda` at end of note

5. Add the line :
   ```
   - [ ] [title] [startTime:: HH:mm] [endTime:: HH:mm]
   ```
   Note : `startTime::` and `endTime::` are DataView properties for Full Calendar tracking.

6. Confirm : "Event added : [title] from HH:mm to HH:mm"

## Rules

- Time format : HH:mm (24h), range 00:00-23:59
- Time validation : reject invalid formats (MM >= 60, HH >= 24) and startTime >= endTime, re-ask
- Insertion : end of Agenda section, before blank lines if present
- Note creation : from template with Templater placeholders resolved to current date
- Confirmation : display added event with formatted times
