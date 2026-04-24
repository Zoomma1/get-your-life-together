---
name: archivedone
description: Archive Done tickets (with linked notes) to C:\Archive\ — all kanbans or just one. Ask confirmation before any physical action.
---

# Skill: Archive Done

## Invocation parameters

```bash
/archivedone              # All kanbans
/archivedone [kanban]     # One specific kanban (filename or path part)
```

## Step 1 — Discover kanbans

Read `{VAULT_PATH}\{PROJECTS_FOLDER}\INDEX.md` once.

Build list of kanbans to process:

**Special kanbans** (always included unless kanban filter applied):
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Claude Code Kanban.md`

**Project kanbans** — for each project in "Active projects" table:
- Ignore projects with "No kanban" mention
- Resolve path (Obsidian link `[[...]]` or direct path)
- If path = folder → search for kanban `.md` file (usually `Project management.md`)

If `[kanban]` parameter provided, filter list (pattern matching on filename or path).

Read all discovered kanban files **in parallel** with Read.

## Step 2 — Extract Done tickets

For each kanban read, extract all items from `## Done` section.

Classify each item by type:
- **With linked note**: contains `[[FileName]]` or `[[FileName|alias]]` (Obsidian syntax)
- **Without linked note**: plain text, no `[[...]]`

Build two lists per kanban: tickets with link + tickets without link.

## Step 3 — Display summary and wait for validation

If **all** Done columns are empty → stop, signal Victor, do nothing.

Otherwise, display what will be proposed for archival:

**[Kanban name 1]** — [X archivable tickets] + [Y without link]

Archivable (with linked note):
- [[TicketName]] | Ticket title
- _(repeat)_

Will stay in Done (without linked note):
- Ticket title (plain text)
- _(repeat)_

_(repeat for each kanban with non-empty Done)_

---

Ask Victor:
1. Confirm archival of all listed tickets above?
2. Any tickets to exclude?
3. Any ADRs to handle separately (highlight bold `**ADR-XXX**`)?

Wait for explicit response before Step 4.

## Step 4 — Pre-archival

Before any file move:
- Verify `{VAULT_PATH}\Archive\` exists (create via bash if missing, signal Victor)
- Verify each file to archive physically exists (display resolved paths)
- Signal any broken link and ask Victor: archive anyway or skip?

Wait for confirmation before Step 5.

## Step 5 — Execute archival

For each validated ticket in Step 3:
1. Copy file to `{VAULT_PATH}\Archive\` via bash
2. Rename to `[TicketName].[ext]` if collision (add `_YYYYMMDD-HHMM` before ext)

For each processed kanban, clear only archived tickets:
```markdown
## Done

```

For each successfully copied ticket, delete original from source folder via bash.

Display to Victor:
- List of archived and deleted files
- Ready for Step 6 (command-tracker update)

## Step 6 — Update command-tracker

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`.

Search for `/archivedone` line and update its date to `YYYY-MM-DD` format (today).

If file missing or line missing: signal Victor, don't create.

## Edge cases and alternate flow

| Situation | Behavior |
|-----------|----------|
| Broken link (file doesn't exist) | Step 4: display impossible path, ask Victor: ignore or continue anyway |
| Ticket without linked note (plain text) | Display as "Will stay in Done", **never archive** |
| Empty kanban (0 Done items) | Include in report with count=0, no processing for this kanban |
| Missing INDEX | Fatal error → stop, signal Victor, don't guess |
| `## Done` section missing or malformed | Signal Victor, skip kanban, continue |
| Victor says "no" in Step 3 | Stop, do nothing, return without action |
| Victor excludes certain tickets | Skip excluded tickets, archive others |
| Collision in Archive (file exists) | Add `_YYYYMMDD-HHMM` before extension |
| Archive/ doesn't exist | Step 4: create via bash, signal Victor |

## Absolute rules (pair-programming)

- **No physical action without Victor validation** — structured confirmations in Steps 3 and 4
- **Leave header `## Done`** — just empty it, never delete section
- **Tickets without link = never archived** — stay in Done
- **ADRs = ask confirmation separately** before archiving (highlight bold)
- **Broken link or missing file = block** — ask instead of assume
- **Victor chooses** total or partial archival (which tickets, which kanbans)
