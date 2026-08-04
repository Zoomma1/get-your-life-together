---
name: create-ticket
description: Single entry point for creating a ticket — note file + kanban insertion. Reads `04 - Projects/INDEX.md` to resolve the Kanban, tickets folder, and project slug. Auto-numbering by scanning the tickets folder. Invoked by skills that generate tickets (drift, ideas, vault-harvest, today) and directly by {USER_NAME}. Guarantees consistent formatting and unique positioning in the kanban.
---

# Skill: Create Ticket

Middleware that centralizes ticket creation. Calling skills (`/drift`, `/ideas`, `/vault-harvest`, `/today`) delegate to this skill by passing title, type, project, column, context. Returns the path of the created file.

## Parameters

| Parameter | Required | Values                                      | Default                |
| --------- | -------- | -------------------------------------------- | --------------------- |
| `title`   | Yes      | Free text                                  | —                     |
| `type`    | Yes      | `💡 Idea` / `⏫ Improvement` / `🐛 Bug` / `📝 Essay` | —             |
| `project` | No       | Project name (must be in INDEX.md)         | null (→ "Personal")   |
| `column`  | No       | `Idea` / `Blocked` / `Essays` / `Ready` / `WIP` | `Idea`             |
| `context` | No       | Short phrase for the kanban card           | —                     |

## Step 1 — Resolve destination via INDEX.md

Read `04 - Projects/INDEX.md`. Search in the "Active Projects" table for the row matching `project` (case-insensitive comparison, accepts full name or slug — e.g., `Husker` matches both the full name and the slug `HUSKER`).

**If `project` provided and found in INDEX.md**:
- Extract `kanban_path` from the "Kanban" column (Obsidian link `[[...]]`, or `—` if no kanban)
- Extract `tickets_folder` from the "Tickets" column (path in backticks, e.g., `04 - Projects/Husker/Tickets`)
- Extract `slug` from the "Slug" column (value in backticks, e.g., `HUSKER`)
- If `kanban_path` = `—` → notify {USER_NAME} "Project has no Kanban, impossible to insert — create a Kanban first?" and wait for validation

**If `project` provided but absent from INDEX.md**:
- Notify: "Project `<name>` missing from INDEX.md, using Inbox fallback"
- `tickets_folder = 09 - Inbox/tickets`
- `kanban_path = 99 - Claude Code/Claude Code Kanban`
- `slug = null`

**If `project` not provided**:
- `tickets_folder = 09 - Inbox/tickets`
- `kanban_path = 99 - Claude Code/Claude Code Kanban`
- `slug = null`

## Step 2 — Auto-numbering (if slug defined)

**If `slug` is defined**:
- Glob `<tickets_folder>/<slug-lowercase>-*.md`
- For each found file, extract NN via regex: `^<slug-lowercase>-(\d{2})-`
- `max_nn` = max of NN found (or `0` if no match)
- `next_nn` = `max_nn + 1`, formatted as 2 digits zero-padded (`01`, `02`, …, `17`)

**If `slug` is null**: `next_nn = null` (no prefix, legacy format).

## Step 3 — Slugify title + calculate filename

Slugify `title`: lowercase, spaces → hyphens, remove accents and special characters.
Examples:
- "Refaire le bureau à Issy" → `refaire-bureau-issy`
- "Bug OAuth" → `bug-oauth`
- "Setup repo Cargo + structure src/" → `setup-repo-cargo-structure-src`

**Filename**:
- With slug: `<slug-lowercase>-<next_nn>-<slug-titre>.md` (e.g., `husker-01-setup-repo-cargo.md`)
- Without slug: `<slug-titre>.md` (e.g., `refaire-bureau-issy.md`)

**Frontmatter title** (`TITLE_FRONT`):
- With slug: `<SLUG>-<NN> — <title>` (e.g., `HUSKER-01 — Setup repo Cargo`)
- Without slug: `<title>` (e.g., `Refaire le bureau à Issy`)

## Step 4 — Check for duplicate absence

Glob `<tickets_folder>/*<slug-titre>*.md` — search for existing file with similar title slug (title too close).

**If duplicate detected**: notify {USER_NAME} and stop. Validate before continuing (may be the same ticket already created, or title to be refined).

### Cemetery check (optional, non-blocking)

Read `Archive/Tickets droppés/dropped-tickets.md` if it exists and search for an entry close to the subject.

**If a dropped ticket matches**: do **not** block creation — notify {USER_NAME}:

> ℹ️ Subject already dropped on YYYY-MM-DD — reason: *<reason>*. Past refinement is reusable as material.

Then propose reusing the approach/refinement coverage from the dropped entry in the new ticket. The cemetery is **refinement material**, not a list of prohibitions: a dropped subject can legitimately return in a different context — the value is not re-refining from zero.

**If the file doesn't exist** → skip silently.

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

<!-- Filled by /refine (Adapter issue) -->
````

**Rules**:
- **Never** add `status` to frontmatter — the kanban is the source of truth
- `project` = "Personal" if no project provided
- Date: `YYYY-MM-DD` in ISO format (current day)
- Create `<tickets_folder>` if it doesn't exist yet (first ticket of the project)

## Step 6 — Insert into Kanban

**Essays rule**: if `type` = `📝 Essay` → force `column = Essays`, regardless of the `column` parameter received. Essays never go through Idea/Ready or `/refine` — refinement is done *with* {USER_NAME} via `/essay`. If the `## Essays` section doesn't exist in the kanban, create it (behavior below).

Read target Kanban file (`kanban_path`). Locate `## <column>` section (e.g., `## Idea`, `## Ready`).

**If the section doesn't exist**: create the section before inserting into it.

Add **at the end of the section** (before the next `##` or end of file):

```markdown
- [ ] [[<filename-without-extension>|<TITLE_FRONT>]]<optional context>
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

1. **Always create the file AND add it to the Kanban** — a ticket without kanban is born orphaned
2. **INDEX.md resolution first** — never hardcode paths or slugs per project
3. **Check for duplicate absence in Step 4** — if duplicate, notify {USER_NAME} and wait for validation
4. **The Kanban is the only source of truth for status** — no `status` in frontmatter
5. **Auto-numbering atomic by scan** — no external persistent counter
6. **Inbox fallback never silent** — always notify {USER_NAME} if project is missing from INDEX.md

## Usage by other skills

Calling skills (`/drift`, `/ideas`, `/vault-harvest`, `/today`):

```
Apply create-ticket with:
- title: "<ticket title>"
- type: "<type>"
- project: "<project name or null>"
- column: "<Idea|Blocked|Essays|Ready|WIP>"   # essay → pass type="📝 Essay", create-ticket forces Essays column
- context: "<optional context>"
```

Single point of maintenance for format and logic. Any evolution (new frontmatter field, new slug format) happens here and propagates to all calling skills.
