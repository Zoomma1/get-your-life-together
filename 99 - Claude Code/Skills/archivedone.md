---
name: archivedone
description: Archive Done tickets (with linked notes) to C:\Archive\ — all kanbans or a single one. Request confirmation before any physical action.
---

# Skill : Archive Done

## Invocation Parameters

```bash
/archivedone              # All kanbans
/archivedone [kanban]     # A specific kanban (filename or path portion)
```

## Step 1 — Discover kanbans

Read `{VAULT_PATH}\{PROJECTS_FOLDER}\INDEX.md` once.

Build the list of kanbans to process :

**Special kanbans** (always included unless kanban filter is applied) :
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Claude Code Kanban.md`

**Project kanbans** — for each project in the "Active projects" table :
- Ignore projects with "No kanban" mention
- Resolve the path (Obsidian link `[[...]]` or direct path)
- If path = folder → search for the `.md` kanban file (usually `Project management.md`)

If `[kanban]` parameter provided, filter the list (pattern matching on filename or path).

Read all discovered kanban files **in parallel** with Read.

## Step 2 — Extract Done Tickets

For each kanban read, extract all items from the `## Done` section.

Classify each item by type :
- **With linked note** : contains `[[FileName]]` or `[[FileName|alias]]` (Obsidian syntax)
- **Without linked note** : plain text, no `[[...]]`

Build two lists per kanban : tickets with link + tickets without link.

## Step 3 — Display Summary and Await Validation

If **all** Done columns are empty → stop, signal to {USER_NAME} and do nothing.

Otherwise, display what will be proposed for archiving :

**[Kanban Name 1]** — [X archivable tickets] + [Y without link]

Archivable (with linked note) :
- [[TicketName]] | Ticket Title
- _(repeat)_

Will remain in Done (without linked note) :
- Ticket title (plain text)
- _(repeat)_

_(repeat for each kanban with non-empty Done)_

---

Ask {USER_NAME} :
1. Confirm archiving of all listed tickets above ?
2. Any tickets to exclude ?
3. Any ADRs to handle separately (highlight in bold `**ADR-XXX**`) ?

Wait for explicit response before Step 4.

## Step 4 — Pre-archiving

Before any file movement :
- Verify `{VAULT_PATH}\Archive\` exists (create if missing via bash, signal to {USER_NAME})
- Verify each file to archive exists physically (display resolved paths)
- Report any broken links and ask {USER_NAME} : archive anyway or ignore ?

Wait for confirmation before Step 5.

## Step 5 — Execute Archiving

For each ticket validated in Step 3 :
1. Copy file to `{VAULT_PATH}\Archive\` via bash
2. Rename to `[TicketName].[ext]` if collision (add `_YYYYMMDD-HHMM` before ext)

For each kanban processed, empty only the archived tickets :
```markdown
## Done

```

For each successfully copied ticket, delete the original from source folder via bash.

Display to {USER_NAME} :
- List of archived and deleted files
- Ready for Step 6 (command-tracker update)

## Step 6 — Update command-tracker

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`.

Find the `/archivedone` line and update its date to `YYYY-MM-DD` format (today).

If file missing or line missing : signal to {USER_NAME}, do not create.

## Edge cases and alternative workflow

| Situation | Behavior |
|-----------|----------|
| Broken link (file doesn't exist) | Step 4 : display impossible path, ask {USER_NAME} : ignore or continue anyway |
| Ticket without linked note (plain text) | Display as "Will remain in Done", **never archive** |
| Empty kanban (0 items Done) | Include in report with count=0, no processing for that kanban |
| INDEX missing | Fatal error → stop, signal to {USER_NAME}, don't guess |
| `## Done` section missing or malformed | Signal to {USER_NAME}, ignore kanban, continue |
| user says "no" in Step 3 | Stop, do nothing, return without action |
| {USER_NAME} excludes certain tickets | Ignore excluded tickets, archive others |
| Collision in Archive (file already exists) | Add `_YYYYMMDD-HHMM` before extension |
| Archive/ doesn't exist | Step 4 : create via bash, signal to {USER_NAME} |

## Absolute rules (pair-programming)

- **No physical action without {USER_NAME} validation** — structured confirmations in Steps 3 and 4
- **Leave the `## Done` header** — just empty it, never delete the section
- **Tickets without link = never archived** — remain in Done
- **ADRs = request separate confirmation** before archiving (highlight in bold)
- **Broken link or missing file = block** — ask instead of assuming
- **{USER_NAME} chooses** total or partial archiving (which tickets, which kanbans)
