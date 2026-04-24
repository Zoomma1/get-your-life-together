---
name: inbox-sort
description: Scan 09 - Inbox/ and sort its content. Flow A: detect orphan tickets (not referenced in kanbans) and propose reattachment. Flow B: detect root files and move them to destination with wikilink patching.
---

Scan `09 - Inbox/` and propose structured sorting in two distinct flows.

## Scanned Kanbans

Always scan these files for Flow A:
- `04 - Projects/*/Project management.md` (all active projects)
- `02 - Hobbies/Hobby Kanban.md`
- `99 - Claude Code/Claude Code Kanban.md`

A ticket is **referenced** if its basename (without `.md`) appears in one of these files.
Daily notes and Sessions **don't count** as reference — kanban only.

---

## Flow A — `09 - Inbox/tickets/*` (no file moved)

### Step A1 — Scan

For each `.md` file in `09 - Inbox/tickets/`:
- Search basename in all kanbans (grep)
- Classify: **referenced** (source kanban) or **orphan**

### Step A2 — Orphan table

Display orphans only as numbered table:

```
| n | file | summary | proposed kanban | column | reason |
```

**Proposal rules:**
- `project: [X]` in frontmatter → project X's kanban
- `status: Done` → Done column + signal ("already finished, reattachment for traceability")
- `status: Ready` → Ready column
- `status: Idea / Backlog` or missing → Idea column
- If ticket describes vault/Claude Code task without explicit project → CC Kanban
- If same task exists in a kanban (without wikilink) → signal duplicate, propose Done with wikilink or skip

**Blocked case:** if ticket contains explicit blocking note (ex: "blocked: …"), indicate in reason column and propose adding this note in kanban line.

### Step A3 — Validation

Victor validates or corrects each line. Inverted batch allowed:
- `all` → validate all
- `all except 1,3` → validate all except
- `only 2,4` → validate only these

### Step A4 — Execution

For each validated ticket:
- Insert line in target column kanban, format:
  `- [ ] [[09 - Inbox/tickets/slug|Title]] — short description`
- If blocking note: add at end of line ` — blocked: "…"`
- **No ticket file moved or modified.**

---

## Flow B — Files at root of `09 - Inbox/` (move + patch)

### Step B1 — Scan

List all `.md` directly at root of `09 - Inbox/` (outside subdirectories).
Read first lines (frontmatter + title + first paragraphs) of each file.

### Step B2 — Destinations table

Display numbered table:

```
| n | file | detected type | proposed destination | reason |
```

**Destination heuristic (pattern matching on name + content):**

| signal | destination |
|--------|-------------|
| `rust` | `03 - Knowledge/Rust/` |
| `angular`, `theodo` | `03 - Knowledge/Dev/` |
| `fstg` | `04 - Projects/From sprue to glory/` |
| `warhammer`, `hobby` | `02 - Hobbies/Warhammer/` |
| tag `meeting-note` or `vut-*` | `04 - Projects/[detected project]/Meeting notes/` |
| tag `ludisep` or `partner` | `04 - Projects/Ludisep/` |
| tag `reading`, `book` | `03 - Knowledge/Lectures/` |
| tag `identity`, `vault`, `context` | `01 - Me/` |
| already processed / one-shot artifact | `Archive/` |

If destination ambiguous → propose 2-3 numbered options, Victor chooses.
If destination folder doesn't exist → signal ("will be created on execution").

### Step B3 — Free corrections

Victor can correct destinations in free language **before** validation:
> "3 goes to 03 - Knowledge/Dev/"

Skill updates table and redisplays it completely.

### Step B4 — Batch validation

- `all` → validate all
- `all except 1,3` → validate all except
- `only 2,4` → validate only these

### Step B5 — Dry-run mandatory

Before any execution, display:

**Moves:**
```
09 - Inbox/file.md  →  destination/file.md
```

**Wikilinks to patch** (citing files):
```
path/citing-file.md  :  [[09 - Inbox/file]] → [[destination/file]]
```

Wikilink detection rules:
- Search `[[09 - Inbox/file-name` everywhere in vault (glob `**/*.md`)
- Patch only `[[]]` (not backticks or plain text paths)
- Preserve aliases: `[[09 - Inbox/xxx|label]]` → `[[destination/xxx|label]]`
- Handle variants `.md` explicit and `#heading`

Ask explicit confirmation: **"Confirm to execute?"**

### Step B6 — Execution

For each validated file:
1. Create destination folder if missing
2. Move file (path rename)
3. Patch wikilinks in all citing files

---

## Associated actions (first successful execution)

Archive `09 - Inbox/tickets/triage-tickets-orphelins.md` with note in file:
> "Replaced by `/inbox-sort` skill — first successful execution on [date]"

---

## Absolute rules

- **Never move without validated dry-run** (Flow B only)
- **Flow A moves no files** — kanban insertions only
- **Don't modify ticket content** (Flow A) — kanban only
- **Dry-run → confirmation → execution**: strict order, never skip
- **Daily notes and Sessions ≠ kanban anchors**: don't count as reference for Flow A
