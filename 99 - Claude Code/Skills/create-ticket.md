---
name: create-ticket
description: Single entry point for creating a ticket — note file + kanban insertion. Reads `04 - Projects/INDEX.md` to resolve Kanban, tickets folder, and project slug. Auto-numbering via scan of tickets folder. Invoked by skills that generate tickets (drift, ideas, vault-harvest, today) and directly by {USER_NAME}. Guarantees consistent format and unique position in kanban.
---

# Skill: Create Ticket

Middleware that centralizes ticket creation. Calling skills (`/drift`, `/ideas`, `/vault-harvest`, `/today`) delegate to this skill by passing title, type, project, column, context. Returns the path of the created file.

## Parameters

| Parameter | Required | Values                                      | Default                |
| --------- | -------- | ------------------------------------------- | ---------------------- |
| `title`   | Yes      | Free text                                   | —                     |
| `type`    | Yes      | `💡 Idea` / `⏫ Improvement` / `🐛 Bug`      | —                     |
| `project` | No       | Project name (must be in INDEX.md)          | null (→ "Personal")    |
| `column`  | No       | `Idea` / `Blocked` / `Ready` / `WIP`         | `Idea`                 |
| `context` | No       | Short phrase for kanban card                | —                     |

## Step 1 — Resolve destination via INDEX.md

Read `04 - Projects/INDEX.md`. Search in the "Active Projects" table for the row matching `project` (case-insensitive comparison, accepts full name or slug — ex: `Husker` matches both the full name and slug `HUSKER`).

**If `project` provided and found in INDEX.md**:
- Extract `kanban_path` from the "Kanban" column (Obsidian link `[[...]]`, or `—` if no kanban)
- Extract `tickets_folder` from the "Tickets" column (path in backticks, ex: `04 - Projects/Husker/Tickets`)
- Extract `slug` from the "Slug" column (value in backticks, ex: `HUSKER`)
- If `kanban_path` = `—` → signal to {USER_NAME} "Project has no Kanban, can't insert — create a Kanban first?" and wait for validation

**If `project` provided but absent from INDEX.md**:
- Signal: "Project `<name>` absent from INDEX.md, using Inbox fallback"
- `tickets_folder = 09 - Inbox/tickets`
- `kanban_path = 99 - Claude code/Claude Code Kanban`
- `slug = null`

**If `project` not provided**:
- `tickets_folder = 09 - Inbox/tickets`
- `kanban_path = 99 - Claude code/Claude Code Kanban`
- `slug = null`

## Step 2 — Auto-numbering (if slug defined)

**If `slug` is defined**:
- Glob `<tickets_folder>/<slug-lowercase>-*.md`
- For each file found, extract NN via regex: `^<slug-lowercase>-(\d{2})-`
- `max_nn` = max of NN values found (or `0` if no match)
- `next_nn` = `max_nn + 1`, formatted on 2 digits zero-padded (`01`, `02`, …, `17`)

**If `slug` is null**: `next_nn = null` (no prefix, legacy format).

## Step 3 — Slugify title + calculate filename

Slugify `title`: lowercase, spaces → dashes, remove accents and special characters.
Examples:
- "Redo the desk at Issy" → `redo-desk-issy`
- "OAuth Bug" → `oauth-bug`
- "Setup repo Cargo + structure src/" → `setup-repo-cargo-structure-src`

**Filename**:
- With slug: `<slug-lowercase>-<next_nn>-<title-slug>.md` (ex: `husker-01-setup-repo-cargo.md`)
- Without slug: `<title-slug>.md` (ex: `redo-desk-issy.md`)

**Frontmatter title** (`TITLE_FRONT`):
- With slug: `<SLUG>-<NN> — <title>` (ex: `HUSKER-01 — Setup repo Cargo`)
- Without slug: `<title>` (ex: `Redo the desk at Issy`)

## Step 4 — Check for duplicates

Glob `<tickets_folder>/*<title-slug>*.md` — search for an existing file with the same title slug (very similar titles).

**If duplicate detected**: signal to {USER_NAME} and stop. Validate before continuing (maybe the same ticket already created, or title needs refinement).

## Step 5 — Create the note file

Write the file `<tickets_folder>/<filename>` with this template:

````markdown
---
title: <TITLE_FRONT>
date: YYYY-MM-DD
type: <type>
project: <project or "Personal">
---

# <TITLE_FRONT>

## Summary

<!-- What this does in 2-3 sentences -->

## Context / Why

<!-- What problem this solves, why now -->

## Expected behavior

## Out of scope

## Technical notes

<!-- Constraints, implementation ideas, dependencies -->

## Generated specs

<!-- Filled in by /specs -->
````

**Rules**:
- Never add `status` to frontmatter — the kanban is the source of truth
- `project` = "Personal" if no project provided
- Date: `YYYY-MM-DD` in ISO format (today)
- Create the `<tickets_folder>` directory if it doesn't exist yet (first ticket for the project)

## Step 6 — Insert into Kanban

Read the target Kanban file (`kanban_path`). Locate the `## <column>` section (ex: `## Idea`, `## Ready`).

**If the section doesn't exist**: create the section before inserting.

Add **at the end of the section** (before the next `##` or end of file):

```markdown
- [ ] [[<filename-without-extension>|<TITLE_FRONT>]]<optional-context>
```

Use the short name (without path) — Obsidian resolves via its global index. If name conflict is possible (global duplicate), use the full path `[[<tickets_folder>/<filename-without-extension>|<TITLE_FRONT>]]`.

**If `context` provided**: add ` — <context>` after the link.

## Expected return

Always return:
```
Ticket created: <tickets_folder>/<filename>
Inserted into: <kanban_path> (column <column>)
```

## Absolute rules

1. **Always create the file AND add it to Kanban** — a ticket without kanban is born orphaned
2. **INDEX.md resolution first** — never hardcode paths or slugs per project
3. **Check for duplicates in Step 4** — if duplicate found, signal to {USER_NAME} and wait for validation
4. **Kanban is the single source of truth for status** — no `status` in frontmatter
5. **Auto-numbering atomic via scan** — no persistent external counter
6. **Inbox fallback never silent** — always signal to {USER_NAME} if project is absent from INDEX.md

## Usage by other skills

Calling skills (`/drift`, `/ideas`, `/vault-harvest`, `/today`):

```
Apply create-ticket with:
- title: "<ticket title>"
- type: "<type>"
- project: "<project name or null>"
- column: "<Idea|Blocked|Ready|WIP>"
- context: "<optional context>"
```

Single point of maintenance for format and logic. Any evolution (new frontmatter field, new slug format) happens here and propagates to all calling skills.
