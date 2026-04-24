---
name: create-ticket
description: Single entry point to create a ticket — note file + kanban insertion. Reads `04 - Projects/INDEX.md` to resolve Kanban, tickets folder, and project slug. Auto-numbering by scanning tickets folder. Invoked by skills that generate tickets (drift, ideas, vault-harvest, today) and directly by Victor. Guarantees consistent format and unique position in kanban.
---

# Skill: Create Ticket

Middleware that centralizes ticket creation. Calling skills (`/drift`, `/ideas`, `/vault-harvest`, `/today`) delegate to this skill by passing title, type, project, column, context. Returns the path of created file.

## Parameters

| Parameter | Required | Values                                      | Default                |
| --------- | -------- | -------------------------------------------- | --------------------- |
| `title`   | Yes      | Free text                                    | —                     |
| `type`    | Yes      | `💡 Idea` / `⏫ Improvement` / `🐛 Bug`      | —                     |
| `project` | No       | Project name (must be in INDEX.md)           | null (→ "Personal")    |
| `column`  | No       | `Idea` / `Blocked` / `Ready` / `WIP`         | `Idea`                |
| `context` | No       | Short phrase for kanban card                 | —                     |

## Step 1 — Resolve destination via INDEX.md

Read `04 - Projects/INDEX.md`. Search in "Active projects" table for line matching `project` (case-insensitive comparison, accepts full name or slug in parentheses — ex: `Rust deploy tool (Husker)` matches both `Rust deploy tool` and `Husker`).

**If `project` provided and found in INDEX.md**:
- Extract `kanban_path` from "Kanban" column (Obsidian link `[[...]]`, or `—` if no kanban)
- Extract `tickets_folder` from "Tickets" column (path in backticks, ex: `04 - Projects/Rust - Deploy Tool/Tickets`)
- Extract `slug` from "Slug" column (value in backticks, ex: `HUSKER`)
- If `kanban_path` = `—` → signal to Victor "Project without Kanban, cannot insert — create Kanban first?" and wait for validation

**If `project` provided but absent from INDEX.md**:
- Signal: "Project `<name>` missing from INDEX.md, using Inbox fallback"
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
- `max_nn` = max of NN found (or `0` if no match)
- `next_nn` = `max_nn + 1`, formatted on 2 digits zero-padded (`01`, `02`, …, `17`)

**If `slug` is null**: `next_nn = null` (no prefix, old format).

## Step 3 — Slugify title + calculate filename

Slugify `title`: lowercase, spaces → dashes, remove accents and special characters.
Examples:
- "Refaire le bureau à Issy" → `refaire-bureau-issy`
- "Bug OAuth" → `bug-oauth`
- "Setup repo Cargo + structure src/" → `setup-repo-cargo-structure-src`

**Filename**:
- With slug: `<slug-lowercase>-<next_nn>-<slug-title>.md` (ex: `husker-01-setup-repo-cargo.md`)
- Without slug: `<slug-title>.md` (ex: `refaire-bureau-issy.md`)

**Frontmatter title** (`TITLE_FRONT`):
- With slug: `<SLUG>-<NN> — <title>` (ex: `HUSKER-01 — Setup repo Cargo`)
- Without slug: `<title>` (ex: `Refaire le bureau à Issy`)

## Step 4 — Check for duplicate

Glob `<tickets_folder>/*<slug-title>*.md` — search for existing file with similar title slug (title too close).

**If duplicate detected**: signal to Victor and stop. Validate before continuing (maybe same ticket already created, or title needs nuance).

## Step 5 — Create note file

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

## Expected behavior

## Out of scope

## Technical notes

<!-- Constraints, implementation ideas, dependencies -->

## Generated specs

<!-- Filled by /specs -->
````

**Rules**:
- **Never** add `status` to frontmatter — kanban is the source of truth
- `project` = "Personal" if no project provided
- Date: `YYYY-MM-DD` ISO format (today)
- Create `<tickets_folder>` directory if it doesn't exist yet (first project ticket)

## Step 6 — Insert into Kanban

Read target Kanban file (`kanban_path`). Locate `## <column>` section (ex: `## Idea`, `## Ready`).

**If section doesn't exist**: create section before inserting.

Add **at end of section** (before next `##` or end of file):

```markdown
- [ ] [[<filename-without-extension>|<TITLE_FRONT>]]<optional context>
```

Use short name (no path) — Obsidian resolves via global index. If possible name conflict (global duplicate), use full path `[[<tickets_folder>/<filename-without-extension>|<TITLE_FRONT>]]`.

**If `context` provided**: add ` — <context>` after link.

## Expected return

Always return:
```
Ticket created: <tickets_folder>/<filename>
Inserted in: <kanban_path> (column <column>)
```

## Absolute rules

1. **Always create file AND add to Kanban** — ticket without kanban is born orphaned
2. **INDEX.md resolution first** — never hardcode paths or slugs per project
3. **Check for duplicate in Step 4** — if duplicate, signal to Victor and wait for validation
4. **Kanban is sole source of truth for status** — no `status` in frontmatter
5. **Atomic auto-numbering by scan** — no persistent external counter
6. **Inbox fallback never silent** — always signal to Victor if project missing from INDEX.md

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
