---
name: create-ticket
description: Single entry point for creating a ticket — note file + kanban insertion. Reads `04 - Projects/INDEX.md` to resolve the Kanban, tickets folder and project slug. Auto-numbering by scanning the tickets folder. Invoked by skills that generate tickets (drift, ideas, vault-harvest, today) and directly by {USER_NAME}. Guarantees consistent format and unique position in the kanban.
---

# Skill: Create Ticket

Middleware that centralizes ticket creation. Calling skills (`/drift`, `/ideas`, `/vault-harvest`, `/today`) delegate to this skill by passing title, type, project, column, context. Returns the path of the created file.

## Parameters

| Parameter | Required | Values                                      | Default                |
| --------- | ------ | -------------------------------------------- | --------------------- |
| `title`   | Yes    | Free text                                  | —                     |
| `type`    | Yes    | `💡 Idea` / `⏫ Improvement` / `🐛 Bug` / `📝 Essay` | —             |
| `project` | No    | Project name (must be in INDEX.md)      | null (→ "Personal")  |
| `column`  | No    | `Idea` / `Blocked` / `Essays` / `Ready` / `WIP` | `Idea`             |
| `context` | No    | Short phrase for the kanban card           | —                     |

## Step 1 — Resolve destination via INDEX.md

Read `04 - Projects/INDEX.md`. Search in the "Active Projects" table for the row matching `project` (case-insensitive comparison, accepts full name or slug — e.g., `Husker` matches both the full name and the slug `[example-project]`).

**If `project` is provided and found in INDEX.md**:
- Extract `kanban_path` from the "Kanban" column (Obsidian link `[[...]]`, or `—` if no kanban)
- Extract `tickets_folder` from the "Tickets" column (path in backticks, e.g., `04 - Projects/Husker/Tickets`)
- Extract `slug` from the "Slug" column (value in backticks, e.g., `[example-project]`)
- If `kanban_path` = `—` → signal to {USER_NAME} "Project has no Kanban, cannot insert — create a Kanban first?" and wait for validation

**If `project` is provided but missing from INDEX.md**:
- Signal: "Project `<name>` missing from INDEX.md, using Inbox fallback"
- `tickets_folder = 09 - Inbox/tickets`
- `kanban_path = 99 - Claude Code/Claude Code Kanban`
- `slug = null`

**If `project` is not provided**:
- `tickets_folder = 09 - Inbox/tickets`
- `kanban_path = 99 - Claude Code/Claude Code Kanban`
- `slug = null`

## Step 2 — Auto-numbering (if slug is defined)

**If `slug` is defined**:
- Glob `<tickets_folder>/<slug-lowercase>-*.md` **AND** `Archive/**/<slug-lowercase>-*.md` — ⚠️ **the Tickets folder is not the entire population**: an archived ticket (Done, dropped) keeps its number, scanning only the target folder gives a false `max_nn` and creates a collision. *(Cause: 2026-08-23, [project-B] — scanning Tickets alone returned 61 as max while hls-62/63/64 lived in `Archive/`; number 65 was caught up manually.)*
- For each file found, extract NN via regex: `^<slug-lowercase>-(\d{2})-`
- `max_nn` = max of NN found (or `0` if no match)
- `next_nn` = `max_nn + 1`, formatted as 2 digits zero-padded (`01`, `02`, …, `17`)

**If `slug` is null**: `next_nn = null` (no prefix, old format).

## Step 3 — Slugify the title + calculate the filename

Slugify `title`: lowercase, spaces → dashes, remove accents and special characters.
Examples:
- "Refaire le bureau à Issy" → `refaire-bureau-issy`
- "Bug OAuth" → `bug-oauth`
- "Setup repo Cargo + structure src/" → `setup-repo-cargo-structure-src`

**Filename**:
- With slug: `<slug-lowercase>-<next_nn>-<slug-titre>.md` (e.g., `husker-01-setup-repo-cargo.md`)
- Without slug: `<slug-titre>.md` (e.g., `refaire-bureau-issy.md`)

**Frontmatter title** (`TITLE_FRONT`):
- With slug: `<SLUG>-<NN> — <title>` (e.g., `[example-project]-01 — Setup repo Cargo`)
- Without slug: `<title>` (e.g., `Refaire le bureau à Issy`)

## Step 4 — Check for no duplicates

Search for an existing file with a slug too close to the title — **across the entire vault, not just the target folder**:

```bash
find "{VAULT_PATH}" -path '*/Tickets/*.md' -o -path '*/tickets/*.md' -o -path '*/Features/*.md' | grep -i '<fragment-du-slug>'
```

⚠️ **Globbing on `<tickets_folder>` alone is not enough.** A ticket may have been created in one project's folder while you're about to write it in `09 - Inbox/tickets/` (or vice versa) — the duplicate is then invisible and the skill returns a false "never ticketed". *(Cause: 2026-08-10, `/harvest` — T1 "heartbeat SSD probe" proposed as new while [project-B]-60 existed since 06/08 in `04 - Projects/HomeLabServeur/Tickets/`. Caught in session, not by the skill.)*

**If duplicate is detected**: signal to {USER_NAME} and stop. Validate before continuing (perhaps the same ticket already created, or title to refine).

### Cemetery check (optional, non-blocking)

Read `Archive/Tickets droppés/dropped-tickets.md` if it exists and search for an entry close to the topic.

**If a dropped ticket matches**: do **not** block creation — signal to {USER_NAME}:

> ℹ️ Topic already dropped on YYYY-MM-DD — reason: *<reason>*. Past refinement is reusable as material.

Then propose to reuse the approach/refinement coverage of the dropped entry in the new ticket. The cemetery is **refinement material**, not a list of prohibitions: a dropped topic can legitimately return in a different context — the interest is not to re-refine from scratch.

**If the file doesn't exist** → silent skip.

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

**Rules**:
- **Never** add `status` to the frontmatter — the kanban is the source of truth
- `project` = "Personal" if no project provided
- Date: `YYYY-MM-DD` in ISO format (current day)
- Create the folder `<tickets_folder>` if it doesn't exist yet (first ticket of the project)

## Step 6 — Insert into the Kanban

**Essays rule**: if `type` = `📝 Essay` → force `column = Essays`, regardless of the `column` parameter received. Essays never go through Idea/Ready or `/refine` — refinement is done *with* {USER_NAME} via `/essay`. If the `## Essays` section doesn't exist in the kanban, create it (behavior below).

Read the target Kanban file (`kanban_path`). Locate the `## <column>` section (e.g., `## Idea`, `## Ready`).

**If the section doesn't exist**: create the section before inserting into it.

Add **at the end of the section** (before the next `##` or end of file):

```markdown
- [ ] [[<filename-without-extension>|<TITLE_FRONT>]]<optional-context>
```

Use the short name (without path) — Obsidian resolves via its global index. If a possible name conflict (global duplicate), use the full path `[[<tickets_folder>/<filename-without-extension>|<TITLE_FRONT>]]`.

**If `context` is provided**: add ` — <context>` after the link.

## Expected Return

Always return:
```
Ticket created: <tickets_folder>/<filename>
Inserted in: <kanban_path> (column <column>)
```

## Absolute Rules

1. **Always create the file AND add it to the Kanban** — a ticket without kanban is born orphaned
2. **INDEX.md resolution first** — never hardcode paths or slugs per project
3. **Check for duplicates in Step 4** — if duplicate, signal to {USER_NAME} and wait for validation
4. **Kanban is the only source of truth for status** — no `status` in frontmatter
5. **Atomic auto-numbering by scan** — no external persistent counter
6. **Inbox fallback never silent** — always signal to {USER_NAME} if the project is missing from INDEX.md

## Usage by Other Skills

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
