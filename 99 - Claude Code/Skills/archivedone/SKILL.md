---
name: archivedone
description: Archive Done tickets (with related notes) in `{VAULT_PATH}/Archive/` — all kanbans or just one. Request confirmation before any physical action.
---

# Skill: Archive Done

## Invocation Parameters

```bash
/archivedone              # All kanbans
/archivedone [kanban]     # One specific kanban (filename or part of path)
```

## Step 1 — Discover kanbans

Read `{VAULT_PATH}/{PROJECTS_FOLDER}/INDEX.md` once only.

> **Paths**: forward slash `/` separator (vault on macOS/Linux). Old versions of this skill used `\` and `C:\Archive\` — pre-migration Windows remnant, fixed on 2026-07-19.

Build the list of kanbans to process:

**Special kanbans** (always included unless kanban filter applied):
- `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Claude Code Kanban.md`

**Project kanbans** — for each project in the "Active Projects" table:
- Ignore projects with "No kanban" mention
- Resolve the path (Obsidian link `[[...]]` or direct path)
- If path = folder → search for kanban `.md` file (usually `Project management.md`)

If `[kanban]` parameter provided, filter the list (pattern matching on filename or path).

Read all discovered kanban files **in parallel** with Read.

## Step 2 — Extract Done tickets

For each kanban read, extract all items from the `## Done` section.

Any item present under `## Done` counts as closed, whether checked `[x]` or not — manual movement in Obsidian Kanban doesn't check the box. Never ignore an unchecked item.

Classify each item by type:
- **With linked note**: contains `[[FileName]]` or `[[FileName|alias]]` (Obsidian syntax)
- **Without linked note**: plain text, no `[[...]]`

Build two lists per kanban: tickets with link + tickets without link.

## Step 3 — Display summary and await validation

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
1. Do you confirm archiving all tickets listed above?
2. Any tickets to exclude?
3. Any ADRs to handle separately (highlight in bold `**ADR-XXX**`)?

Await explicit response before Step 4.

## Step 4 — Pre-archiving

**Single destination: `{VAULT_PATH}/Archive/` (vault root), flat.** Never create sub-folder `Archive/` elsewhere (e.g. `09 - Inbox/tickets/Archive/`) — a second folder scatters the archive and reopens the destination question at each run. The leftover `09 - Inbox/tickets/Archive/` was cleaned up on 2026-07-19.

Before any file move:
- Verify `{VAULT_PATH}/Archive/` exists (create via bash if absent, report to {USER_NAME})
- Verify each file to archive exists physically (display resolved paths). Wikilinks often have no path → locate via `find "{VAULT_PATH}" -name "<slug>.md" -not -path "*/Archive/*"`
- Report any broken link and ask {USER_NAME}: archive anyway or ignore?

### Backlinks pass (mandatory)

For each ticket to archive, find who still points to it:

```bash
grep -rl "<slug>" --include="*.md" "{VAULT_PATH}"
```

Classify results and display only those that matter:
- 🔴 **Blocking to report**: backlink from an **active ticket** (present in Idea/Blocked/Ready/WIP column of a kanban), an ADR, or a live measurement file
- ⚪ **Ignorable**: daily notes, `Sessions/`, `ticket-durations.md` — historical trace, a dead link there has no consequence

**Why this pass**: the run on 2026-05-13 emptied Done without it → an already-done ticket became orphaned, was reinjected to Ready by inbox triage, and survived until 2026-07-19. The pass makes this case visible before deletion.

**Important nuance**: flat archiving in `Archive/` does **not break** short wikilinks (`[[husker-17-...]]`) — Obsidian resolves them by filename, they follow the move. Only wikilinks with **explicit path** (`[[09 - Inbox/tickets/my-ticket|alias]]`) break → patch them on the fly.

Await confirmation before Step 5.

## Step 5 — Execute archiving

For each ticket validated in Step 3:
1. Copy file to `{VAULT_PATH}/Archive/` via bash
2. Rename to `[TicketName].[ext]` if collision (add `_YYYYMMDD-HHMM` before ext)
3. **Verify copy before any deletion**: `cmp -s source dest` — delete original only if copy is byte-identical

For each processed kanban, fully empty the Done column — also remove plain text items without linked note, not just copied files:
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

If file absent or line absent: report to {USER_NAME}, don't create.

## Edge cases and alternative flow

| Situation | Behavior |
|-----------|----------|
| Broken link (file doesn't exist) | Step 4: display impossible path, ask {USER_NAME}: ignore or proceed anyway |
| Ticket without linked note (plain text) | No file to copy, but **removed from Done** when clearing the column |
| Unchecked item under `## Done` | Treated as closed — extracted and archived like others |
| Empty kanban (0 items Done) | Include in report with count=0, no processing for that kanban |
| INDEX absent | Fatal error → stop, report to {USER_NAME}, don't guess |
| `## Done` section absent or malformed | Report to {USER_NAME}, ignore kanban, continue |
| the user says "no" in Step 3 | Stop, do nothing, return with no action |
| {USER_NAME} excludes certain tickets | Ignore excluded tickets, archive others |
| Collision in Archive (file already exists) | Add `_YYYYMMDD-HHMM` before extension |
| Archive/ doesn't exist | Step 4: create via bash, report to {USER_NAME} |

## Absolute rules (pair-programming)

- **No physical action without {USER_NAME} validation** — structured confirmations in Steps 3 and 4
- **Leave the `## Done` header** — just empty it, never delete the section
- **Emptying `## Done` stops at the first of**: next `##` header, `***` separator, **or** `%% kanban:settings %%` block. The last two are **not** sections: when `Done` is the last column in the file, a "up to next `##`" boundary silently carries away the Obsidian Kanban plugin config (`new-note-folder`, `new-note-template`, `list-collapse`) and **breaks `/create-ticket` on that board**. The `***` is the plugin's archive delimiter — removing it can reinterpret `## Archive` as a regular column. *(Cause: 2026-08-22, run on 4 kanbans — 2 `kanban:settings` blocks and 1 `***` deleted, recovered from backups.)*
- **Verify clearing by diff, not by eye** — before/after on lines not starting with `- [`: the result must be **empty**. A non-item line that disappeared is collateral damage, never a card.
- **Back up before writing** — vault is not versioned, so no git safety net: copy each kanban and patched file to session scratchpad before modification.
- **Empty Done column fully** — also remove plain text items without linked note, not just copied files ({USER_NAME} prefers to empty everything rather than keep orphans)
- **Any item under `## Done` = closed** — checked `[x]` or not, manual Obsidian movement doesn't check the box; treat as to-archive
- **ADRs = request separate confirmation** before archiving (highlight in bold)
- **Broken link or missing file = block** — ask instead of assume
- **{USER_NAME} chooses** full or partial archiving (which tickets, which kanbans)
