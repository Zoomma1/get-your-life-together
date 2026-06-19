---
name: create-ticket
description: Single entry point to create a ticket — note file + kanban insertion. Reads `04 - Projects/INDEX.md` to resolve Kanban, tickets folder, and project slug. Auto-numbering by scanning tickets folder. Invoked by skills that generate tickets (drift, ideas, vault-harvest, today) and directly by {USER_NAME}. Ensures consistent format and unique position in kanban.
---

# Skill: Create Ticket

Middleware that centralizes ticket creation. Calling skills (`/drift`, `/ideas`, `/vault-harvest`, `/today`) delegate to this skill by passing title, type, project, column, context. Returns the created file path.

## Parameters

| Parameter | Required | Values                                       | Default               |
| --------- | -------- | -------------------------------------------- | --------------------- |
| `title`   | Yes      | Free text                                    | —                     |
| `type`    | Yes      | `💡 Idea` / `⏫ Improvement` / `🐛 Bug`      | —                     |
| `project` | No       | Project name (must be in INDEX.md)           | null (→ "Personal")   |
| `column`  | No       | `Idea` / `Blocked` / `Ready` / `WIP`         | `Idea`                |
| `context` | No       | Short phrase for kanban card                 | —                     |

## Step 1 — Resolve Destination via INDEX.md

Read `04 - Projects/INDEX.md`. Look in the "Active Projects" table for the row matching `project` (case-insensitive comparison, accepts full name or slug — e.g., `Husker` matches both the full name and the slug `HUSKER`).

**If `project` provided and found in INDEX.md** :
- Extract `kanban_path` from the "Kanban" column (Obsidian link `[[...]]`, or `—` if no kanban)
- Extract `tickets_folder` from the "Tickets" column (path in backticks, e.g., `04 - Projects/Husker/Tickets`)
- Extract `slug` from the "Slug" column (value in backticks, e.g., `HUSKER`)
- If `kanban_path` = `—` → alert {USER_NAME} "Project has no Kanban, cannot insert — create a Kanban first?" and wait for validation

**If `project` provided but missing from INDEX.md** :
- Alert: "Project `<name>` missing from INDEX.md, using Inbox fallback"
- `tickets_folder = 09 - Inbox/tickets`
- `kanban_path = 99 - Claude code/Claude Code Kanban`
- `slug = null`

**If `project` not provided** :
- `tickets_folder = 09 - Inbox/tickets`
- `kanban_path = 99 - Claude code/Claude Code Kanban`
- `slug = null`

## Step 2 — Auto-numbering (if slug defined)

**If `slug` is defined** :
- Glob `<tickets_folder>/<slug-lowercase>-*.md`
- For each file found, extract NN via regex: `^<slug-lowercase>-(\d{2})-`
- `max_nn` = max of NN found (or `0` if no match)
- `next_nn` = `max_nn + 1`, formatted as 2 digits zero-padded (`01`, `02`, …, `17`)

**If `slug` is null** : `next_nn = null` (no prefix, legacy format).

## Step 3 — Slugify Title + Calculate Filename

Slugify `title`: lowercase, spaces → dashes, remove accents and special characters.
Examples:
- "Refaire le bureau à Issy" → `refaire-bureau-issy`
- "Bug OAuth" → `bug-oauth`
- "Setup repo Cargo + structure src/" → `setup-repo-cargo-structure-src`

**Filename** :
- With slug: `<slug-lowercase>-<next_nn>-<slug-titre>.md` (e.g., `husker-01-setup-repo-cargo.md`)
- Without slug: `<slug-titre>.md` (e.g., `refaire-bureau-issy.md`)

**Frontmatter title** (`TITLE_FRONT`) :
- With slug: `<SLUG>-<NN> — <title>` (e.g., `HUSKER-01 — Setup repo Cargo`)
- Without slug: `<title>` (e.g., `Refaire le bureau à Issy`)

## Step 4 — Check for Duplicate

Glob `<tickets_folder>/*<slug-titre>*.md` — look for existing file with same title slug (title too similar).

**If duplicate detected** : alert {USER_NAME} and stop. Validate before continuing (might be same ticket already created, or title needs refinement).

## Step 5 — Create Note File

Write file `<tickets_folder>/<filename>` with this template:

````markdown
---
title: <TITLE_FRONT>
date: YYYY-MM-DD
type: <type>
project: <project or "Personal">
---

# <TITLE_FRONT>

## Summary

<!-- What it does in 2-3 sentences -->

## Context / Why

<!-- What problem it solves, why now -->

## Expected Behavior

## Out of Scope

## Technical Notes

<!-- Constraints, implementation ideas, dependencies -->

## Generated Specs

<!-- Filled by /refine (Adapter issue) -->
````

**Rules** :
- **Never** add `status` to frontmatter — kanban is the source of truth
- `project` = "Personal" if no project provided
- Date: `YYYY-MM-DD` in ISO format (current day)
- Create `<tickets_folder>` directory if it doesn't exist yet (first ticket of the project)

## Step 6 — Insert into Kanban

Read target Kanban file (`kanban_path`). Locate `## <column>` section (e.g., `## Idea`, `## Ready`).

**If section doesn't exist** : create the section before inserting.

Add **at the end of the section** (before next `##` or end of file):

```markdown
- [ ] [[<filename-without-extension>|<TITLE_FRONT>]]<optional-context>
```

Use short name (without path) — Obsidian resolves via global index. If possible name conflict (global duplicate), use full path `[[<tickets_folder>/<filename-without-extension>|<TITLE_FRONT>]]`.

**If `context` provided** : add ` — <context>` after the link.

## Expected Return

Always return:
```
Ticket created: <tickets_folder>/<filename>
Inserted in: <kanban_path> (column <column>)
```

## Absolute Rules

1. **Always create the file AND add to Kanban** — a ticket without kanban is born orphaned
2. **INDEX.md resolution first** — never hardcode paths or project slugs
3. **Check for duplicates in Step 4** — if duplicate found, alert {USER_NAME} and wait for validation
4. **Kanban is the sole source of truth for status** — no `status` in frontmatter
5. **Auto-numbering atomic by scan** — no external persistent counter
6. **Inbox fallback never silent** — always alert {USER_NAME} if project missing from INDEX.md

## Usage by Other Skills

Calling skills (`/drift`, `/ideas`, `/vault-harvest`, `/today`):

```
Apply create-ticket with:
- title: "<ticket-title>"
- type: "<type>"
- project: "<project-name or null>"
- column: "<Idea|Blocked|Ready|WIP>"
- context: "<optional-context>"
```

Single maintenance point for format and logic. Any evolution (new frontmatter field, new slug format) happens here and propagates to all calling skills.
