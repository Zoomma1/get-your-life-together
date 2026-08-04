---
name: archivedone
description: Archive Done tickets (with linked notes) to `{VAULT_PATH}/Archive/` — all kanbans or just one. Request confirmation before any physical action.
---

# Skill: Archive Done

## Invocation Parameters

```bash
/archivedone              # All kanbans
/archivedone [kanban]     # One specific kanban (filename or part of path)
```

## Step 1 — Discover Kanbans

Read `{VAULT_PATH}/{PROJECTS_FOLDER}/INDEX.md` only once.

> **Paths**: separator `/` (vault on macOS/Linux). Older versions of this skill used `\` and `C:\Archive\` — Windows legacy pre-migration, corrected on 2026-07-19.

Build the list of kanbans to process:

**Special kanbans** (always included unless kanban filter is applied):
- `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Claude Code Kanban.md`

**Project kanbans** — for each project in the "Active projects" table:
- Ignore projects with "No kanban" mention
- Resolve the path (Obsidian link `[[...]]` or direct path)
- If path = folder → search for `.md` kanban file (usually `Project management.md`)

If `[kanban]` parameter provided, filter the list (pattern matching on filename or path).

Read all discovered kanban files **in parallel** with Read.

## Step 2 — Extract Done Tickets

For each kanban read, extract all items from the `## Done` section.

Any item present under `## Done` counts as closed, whether checked `[x]` or not — manual movement in Obsidian Kanban does not check the box. Never ignore an unchecked item.

Classify each item by type:
- **With linked note**: contains `[[FileName]]` or `[[FileName|alias]]` (Obsidian syntax)
- **Without linked note**: plain text, no `[[...]]`

Build two lists per kanban: tickets with link + tickets without link.

## Step 3 — Display Summary and Wait for Validation

If **all** Done columns are empty → stop, report to {USER_NAME} and do nothing.

Otherwise, display what will be proposed for archiving:

**[Kanban name 1]** — [X with linked note] + [Y without link]

With linked note (file copied to Archive):
- [[TicketName]] | Ticket title
- _(repeat)_

Without linked note (plain text, removed from Done, no file to copy):
- Ticket title (plain text)
- _(repeat)_

_(repeat for each kanban with non-empty Done)_

---

Ask {USER_NAME}:
1. Do you confirm archiving of all tickets listed above?
2. Any tickets to exclude?
3. Any ADRs to handle separately (highlight in bold `**ADR-XXX**`)?

Wait for explicit response before Step 4.

## Step 4 — Pre-archiving

**Single destination: `{VAULT_PATH}/Archive/` (vault root), flat.** Never create subdirectory `Archive/` elsewhere (e.g. `09 - Inbox/tickets/Archive/`) — a second folder scatters the archive and reopens the destination question on each run. The vestige `09 - Inbox/tickets/Archive/` was eliminated on 2026-07-19.

Before any file movement:
- Verify that `{VAULT_PATH}/Archive/` exists (create if missing via bash, report to {USER_NAME})
- Verify each file to archive exists physically (display resolved paths). Wikilinks often lack path → locate via `find "{VAULT_PATH}" -name "<slug>.md" -not -path "*/Archive/*"`
- Report any broken link and ask {USER_NAME}: archive anyway or ignore?

### Backlinks pass (mandatory)

For each ticket to archive, search who still points to it:

```bash
grep -rl "<slug>" --include="*.md" "{VAULT_PATH}"
```

Classify results and display only those that matter:
- 🔴 **Blocking to report**: backlink from an **active ticket** (present in Idea/Blocked/Ready/WIP column of a kanban), an ADR, or a live measurement file
- ⚪ **Ignorable**: daily notes, `Sessions/`, `ticket-durations.md` — historical trace, a dead link there has no consequence

**Why this pass**: the 2026-05-13 run emptied Done without it → an already-completed ticket became orphaned, was re-injected in Ready by inbox triage, and survived until 2026-07-19. This pass makes that case visible before deletion.

**Important nuance**: flat archiving in `Archive/` does **not break** short wikilinks (`[[husker-17-...]]`) — Obsidian resolves them by filename, they follow the move. Only wikilinks with **explicit path** (`[[09 - Inbox/tickets/my-ticket|alias]]`) break → patch them in the process.

Wait for confirmation before Step 5.

## Step 5 — Execute Archiving

For each ticket validated in Step 3:
1. Copy the file to `{VAULT_PATH}/Archive/` via bash
2. Rename as `[TicketName].[ext]` if collision (add `_YYYYMMDD-HHMM` before ext)
3. **Verify copy before any deletion**: `cmp -s source dest` — delete original only if copy is byte-identical

For each kanban processed, fully empty the Done column — also remove plain-text items without linked note, not just copied files:
```markdown
## Done

```

For each successfully copied ticket, delete the original from source folder via bash.

Display to {USER_NAME}:
- List of archived and deleted files
- Ready for Step 6 (command-tracker update)

## Step 6 — Update command-tracker

Read `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/command-tracker.md`.

Find the `/archivedone` line and update its date to format `YYYY-MM-DD` (today).

If file missing or line missing: report to {USER_NAME}, don't create.

## Edge cases and Alternative Flow

| Situation | Behavior |
|-----------|----------|
| Broken link (file doesn't exist) | Step 4: display impossible path, ask {USER_NAME}: ignore or continue anyway |
| Ticket without linked note (plain text) | No file to copy, but **removed from Done** when emptying column |
| Unchecked item under `## Done` | Treated as closed — extracted and archived like others |
| Empty kanban (0 Done items) | Include in report with count=0, no processing for that kanban |
| INDEX missing | Fatal error → stop, report to {USER_NAME}, don't guess |
| `## Done` section absent or malformed | Report to {USER_NAME}, ignore kanban, continue |
| user says "no" in Step 3 | Stop, do nothing, return without action |
| {USER_NAME} excludes certain tickets | Ignore excluded tickets, archive others |
| Collision in Archive (file already exists) | Add `_YYYYMMDD-HHMM` before extension |
| Archive/ doesn't exist | Step 4: create via bash, report to {USER_NAME} |

## Absolute Rules (pair-programming)

- **No physical action without {USER_NAME} validation** — structured confirmations in Steps 3 and 4
- **Leave the `## Done` header** — just empty it, never delete the section
- **Fully empty the Done column** — also remove plain-text items without linked note, not just copied files ({USER_NAME} prefers emptying everything rather than keeping orphans)
- **All items under `## Done` = closed** — checked `[x]` or not, manual movement Obsidian doesn't check the box; treat as ready to archive
- **ADRs = request separate confirmation** before archiving (highlight in bold)
- **Broken link or missing file = block** — ask instead of assume
- **{USER_NAME} chooses** total or partial archiving (which tickets, which kanbans)
