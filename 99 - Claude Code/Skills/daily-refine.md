---
name: daily-refine
description: Launch refinement of tickets listed in the 🗂️ Refinement section of today's daily note. Invoke when the user says "/daily-refine", "let's do today's refinement", "refinement from the daily", "launch the plan's refines", or "we run the tickets through refinement". Automatically reads the current daily note, extracts unchecked tickets, and chains /refine on each sequentially — without {USER_NAME} having to specify everything manually.
---

# Skill: /daily-refine

Eliminate the friction of starting daily refinement: instead of manually specifying each ticket to /refine, this skill reads the daily note and orchestrates refinement sequentially.

## Step 1 — Initialize variables

Read `/home/vico/.claude/vault-config.json` → extract `VAULT_PATH`.
Read `{VAULT_PATH}/99 - Claude code/config/vault-settings.md` → extract `DAILY_NOTES_FOLDER`.

## Step 2 — Read today's daily note

Get today's date: `date +"%Y-%m-%d"`.
Read `{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md`.

**If the daily note doesn't exist** → signal and stop: *"No daily note for today — run /today first?"*

## Step 3 — Extract Refinement tickets

Locate the `### 🗂️ Refinement` section in the daily note.

Extract all lines matching the pattern `- [ ] [[...]]` in that section.

**Ignore**:
- Lines `- [x]` — already processed in the current session or a previous one
- Lines without `[[]]` links (free text)
- Lines outside the Refinement section

**If no unchecked tickets found**:
- If the Refinement section is absent → *"No Refinement section in today's daily note."*
- If all are checked → *"All Refinement tickets are already processed today ✅"*
- In both cases, stop.

## Step 4 — Present and confirm

Display the extracted list:

```
🗂️ Refinement for today — X ticket(s) to process:
1. [[TicketName1|Title]] 
2. [[TicketName2|Title]]
...

Ready to start?
```

Wait for {USER_NAME}'s confirmation. If the user says "no" or wants to remove tickets → adjust the list before starting.

## Step 5 — Launch /refine sequentially

For each ticket in order:

1. Announce: *"Ticket N/X — /refine [[TicketName]]"*
2. Invoke `/refine [[TicketName]]` — let /refine handle the entire discussion (exploratory or standard format depending on ticket type)
3. Wait for {USER_NAME} to give a final decision ("spec", "delete", "backlog V2", "blocker", "next", "on to next")
4. Move to the next ticket

**Don't chain without confirmation** — the pace is {USER_NAME}'s, not the skill's.

If the user says "stop" or "we're done" mid-way → stop cleanly without forcing the rest.

## Step 6 — Closure

When all tickets are processed or {USER_NAME} stops:

```
✅ Refinement complete — X/Y tickets processed.
```

Unprocessed tickets stay unchecked in the daily note — they'll surface again in the next /daily-refine or via /today.
