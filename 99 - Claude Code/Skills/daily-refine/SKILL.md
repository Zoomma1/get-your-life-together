---
name: daily-refine
description: Launches refinement of tickets listed in the 🗂️ Refinement section of today's daily note. Invoke when the user says "/daily-refine", "let's do today's refinement", "refinement from the daily", "launch the plan refines", or "we're taking the tickets through refinement". Automatically reads the current daily note, extracts unchecked tickets, and chains /refine on each in sequence — without {USER_NAME} having to specify everything manually.
---

# Skill: /daily-refine

Eliminates startup friction for daily refinement: rather than manually specifying each ticket for /refine, this skill reads today's daily note and orchestrates the refinement in sequence.

## Step 1 — Initialize variables

Read `~/.claude/vault-config.json` → extract `VAULT_PATH`.
Read `{VAULT_PATH}/99 - Claude Code/config/vault-settings.md` → extract `DAILY_NOTES_FOLDER`.

## Step 2 — Read today's daily note

Retrieve today's date: `date +"%Y-%m-%d"`.
Read `{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md`.

**If the daily note does not exist** → signal and stop: *"No daily note for today — launch /today first ?"*

## Step 3 — Extract Refinement tickets

Locate the `### 🗂️ Refinement` section in the daily note.

Extract all lines matching the pattern `- [ ] [[...]]` in this section.

**Ignore**:
- Lines `- [x]` — already processed in the current session or a previous session
- Lines without `[[]]` link (free text)
- Lines outside the Refinement section

**Items without `[[]]` (orphaned)**: do not skip silently. List them explicitly before Step 4 and ask {USER_NAME} for each one:
- *Move to Done directly* (item resolved/discarded on the fly — check in the daily)
- *Create a ticket* via `/create-ticket` (item that deserves to exist formally)
- *Skip this session* (leave as-is)

Format:
```
⚠️ Refinement items without [[]] detected:
- "Text of item 1" → Done / ticket / skip ?
- "Text of item 2" → Done / ticket / skip ?
```

Process {USER_NAME}'s choices before moving on to linked tickets.

**If no unchecked ticket found**:
- If the Refinement section is missing → *"No Refinement section in today's daily."*
- If all are checked → *"All Refinement tickets are already processed today ✅"*
- In both cases, stop.

## Step 4 — Present and confirm

Display the extracted list:

```
🗂️ Today's Refinement — X ticket(s) to process:
1. [[TicketName1|Title]] 
2. [[TicketName2|Title]]
...

Shall we start ?
```

Wait for {USER_NAME}'s confirmation. If the user says "no" or wants to remove tickets → adjust the list before starting.

## Step 5 — Launch /refine in sequence

For each ticket in order:

1. Announce: *"Ticket N/X — /refine [[TicketName]]*"
2. Invoke `/refine [[TicketName]]` — let /refine manage the entire discussion (exploratory or standard format depending on ticket type). `/refine` starts with a recap of the ticket (Step 1.5) before analysis — do not short-circuit it to go faster.
3. Wait for {USER_NAME} to provide a final outcome ("spec", "trash", "backlog V2", "blocker", "next", "following")
4. Move to the next ticket

**Do not chain without confirmation** — the pace is {USER_NAME}'s, not the skill's.

**Dev tickets — two stopping points, not one.** Since Step 5.6 of `/refine` (adversarial pass, 2026-08-04), a dev ticket imposes an additional wait: the file-to-charge is returned alone, {USER_NAME} reacts, *then* come the between-points and leads. Do not try to compress this wait to move forward in the queue — it's the mechanism, not a delay. A refinement of N dev tickets thus counts **2N stopping points**, to be taken into account when confirming the list at Step 4: better a short list completed than a long list abandoned halfway through.

If the user says "stop" or "let's stop there" along the way → stop cleanly without forcing what comes next.

## Step 6 — Closure

When all tickets are processed or {USER_NAME} stops:

```
✅ Refinement complete — X/Y tickets processed.
```

Unprocessed tickets remain unchecked in the daily note — they will resurface during the next /daily-refine or via /today.
