---
name: inbox-sort
description: Scan 09 - Inbox/ and sort its content. Flow A: detects orphan tickets (not referenced in kanbans) and proposes attachment. Flow B: detects root-level files and moves them to their destination with wikilink patching.
---

Scans `09 - Inbox/` and proposes structured sorting in two distinct flows.

## Kanbans scanned

Always scan these files for Flow A:
- `04 - Projects/*/Project management.md` (all active projects)
- `02 - Hobbies/Hobby Kanban.md`
- `99 - Claude Code/Claude Code Kanban.md`

A ticket is **referenced** if its basename (without `.md`) appears in one of these files.
Daily notes and Sessions **do not count** as references — only kanbans.

---

## Flow A — `09 - Inbox/tickets/*` (no files moved)

### Step A1 — Scan

For each `.md` file in `09 - Inbox/tickets/`:
- Search for the basename in all kanbans (grep)
- Classify: **referenced** (kanban source) or **orphan**

### Step A2 — Orphans table

Display only orphans as a numbered table:

```
| n | file | summary | proposed kanban | column | reason |
```

**Proposal rules:**
- `project: [X]` in frontmatter → kanban of project X
- `status: Done` → Done column + signal ("already complete, attachment for traceability")
- `status: Ready` → Ready column
- `status: Idea / Backlog` or absent → Idea column
- If ticket describes a vault/Claude Code task without explicit project → CC Kanban
- If the same task exists in a kanban (without wikilink) → signal duplicate, propose moving to Done with wikilink or skip

**Blocked case:** if a ticket contains an explicit blocking note (e.g., "blocked: …"), indicate it in the reason column and propose adding that note in the kanban line.

### Step A3 — Validation

{USER_NAME} validates or corrects each line. Inverse batching allowed:
- `all` → validate all
- `all except 1,3` → validate all except
- `only 2,4` → validate only these

### Step A4 — Execution

For each validated ticket:
- Insert a line in the target kanban column, format:
  `- [ ] [[09 - Inbox/tickets/slug|Title]] — short description`
- If blocking note: add at end of line ` — blocked: "…"`
- **No ticket files are moved or modified.**

---

## Flow B — Root-level files in `09 - Inbox/` (move + patch)

### Step B1 — Scan

List all `.md` files directly at the root of `09 - Inbox/` (outside subdirectories).
Read first lines (frontmatter + title + opening paragraphs) of each file.

### Step B2 — Destinations table

Display a numbered table:

```
| n | file | detected type | proposed destination | reason |
```

**Destination heuristic (pattern matching on name + content):**

| signal | destination |
|--------|-------------|
| `rust` | `03 - Knowledge/Rust/` |
| `angular` | `03 - Knowledge/Dev/` |
| tag `meeting-note` or `vut-*` | `04 - Projects/[detected project]/Meeting notes/` |
| tag `lecture`, `book` | `03 - Knowledge/Lectures/` |
| tag `identity`, `vault`, `context` | `01 - Me/` |
| already processed / one-shot artifact | `Archive/` |

If destination is ambiguous → propose 2-3 numbered options, {USER_NAME} chooses.
If destination folder doesn't exist → signal it ("will be created at execution").

### Step B3 — Free corrections

{USER_NAME} can correct destinations in natural language **before** validation:
> "3 goes in 03 - Knowledge/Dev/"

The skill updates the table and redisplays it fully.

### Step B4 — Batch validation

- `all` → validate all
- `all except 1,3` → validate all except
- `only 2,4` → validate only these

### Step B5 — Mandatory dry-run

Before any execution, display:

**Moves:**
```
09 - Inbox/file.md  →  destination/file.md
```

**Wikilinks to patch** (citing files):
```
path/citingfile.md  :  [[09 - Inbox/file]] → [[destination/file]]
```

Wikilink detection rules:
- Search for `[[09 - Inbox/filename` across the entire vault (glob `**/*.md`)
- Patch only `[[]]` (not backticks or plain-text paths)
- Preserve aliases: `[[09 - Inbox/xxx|label]]` → `[[destination/xxx|label]]`
- Handle variants with explicit `.md` and `#heading`

Request explicit confirmation: **"Confirm to execute?"**

### Step B6 — Execution

For each validated file:
1. Create destination folder if absent
2. Move the file (rename path)
3. Patch wikilinks in all citing files

---

## Associated actions (first successful execution)

Archive `09 - Inbox/tickets/triage-tickets-orphelins.md` with a note in the file:
> "Replaced by the `/inbox-sort` skill — first successful execution on [date]"

---

## Absolute rules

- **Never move without validated dry-run** (Flow B only)
- **Flow A moves no files** — only kanban insertions
- **No content modification of tickets** (Flow A) — only kanbans
- **Dry-run → confirmation → execution**: strict order, never skip a step
- **Daily notes and Sessions ≠ kanban anchors**: don't count as references for Flow A
