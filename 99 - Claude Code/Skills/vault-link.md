---
name: vault-link
description: Analyse the vault and create [[]] links between notes. Trigger this skill when {USER_NAME} says "/link", "do the linking", "connect my notes" or "vault link".
---
# Skill: Vault Link

This skill analyses the vault and proposes Obsidian `[[]]` links between notes that cover the same subjects. It never modifies a note without explicit validation from {USER_NAME}.

Anchoring philosophy: the role is to make the graph traversable, not to generate understanding. Claude connects. {USER_NAME} thinks. A well-traversable graph allows other commands like `/emerge`, `/trace` or `/connect` to function correctly — that is the real stake of linking.

## Trigger

- {USER_NAME} says "/link", "do the linking", "connect my notes"
- {USER_NAME} specifies a folder: "/link my Warhammer notes"
- Without specification → analyse the entire vault

## Learned heuristics — {USER_NAME}'s rejections

These rules apply from the moment suggestions are generated, not after.

### Prefer the specific over the general
Do not link to an aggregate/tracking note when a specific note on the subject exists. Example: a note on Drukhari should point to `[[Drukhari - Squidmar colour scheme]]`, not to `[[army-tracking]]` (too generic).

### Do not link two distinct projects that share a common subject
Warhammer (hobby) and FSTG (software project) both talk about miniatures, but they are two independent projects in the vault. Do not create cross-links between them — the common subject is not enough, the notes must functionally complement each other.

### Do not link the organisation of one project with the personal notes of another domain
The note `Event warhammer.md` (Ludisep organisation) should not point to `army-tracking.md` (personal hobby). Associative management and personal collection are two separate contexts, even if the subject (Warhammer) is the same.

### Check link existence before proposing
Read the full content of the source note (body text, "See also", "Connections" sections, inline links `→ [[...]]`) before suggesting a link. Never propose a link already present, regardless of its form in the note.

### If {USER_NAME} rejects the entire result
Do not re-run a similar session without an explicit signal. Note the context of the rejection (note type, scope, theme) to improve future detection.

## Step 1 — Scope and minimal validation

If {USER_NAME} specifies a folder or note → limit to that scope. Without specification → scan all folders except `00 - Daily notes/` (too much volume, ephemeral links), including obligatorily `99 - Claude Code/Sessions/`.

List the folders that will be analysed and wait for {USER_NAME}'s confirmation.

**Minimal validation before continuing:**
- If scope < 5 notes: propose broadening ("Insufficient scope — also analyse [folder]?")
- If scope > 200 notes: propose subdivision ("Scope too large — prioritise [folder] first?")

---

## Step 2 — Structural inventory

Before reading note content, do a structural scan to prioritise reading. Orphans and deadends are the priority candidates — they benefit most from linking.

### 2a. Enumerate and detect orphans / deadends

For each folder to analyse:
- Use Glob to enumerate all `.md` files (pattern: `folder/**/*.md`)
- For each file, use Grep to look for `\[\[`: 0 results → deadend (note with no outgoing links)
- For each file X, use Grep to look for `\[\[X(\|[^\]]+)?\]\]` in the analysed scope (replace X with the file slug without .md, accept aliases via `|`): 0 results → orphan (note with no incoming links)

Prioritise notes that are both orphans AND deadends (complete isolation).

Expected result: list of orphans, deadends, and hubs (notes with 5+ incoming references).

### 2b. Detect unresolved links

Use Grep with pattern `\[\[([^\]]+)\]\]` on the scope to extract all links. For each found link (without the alias suffix `|...`), use Glob to verify that the target file `target-link.md` exists. List links that correspond to no file.

**If broken links exist:** present to {USER_NAME} with supposed reason ("note to create" vs "malformed link"). Wait for instruction before acting.

## Step 3 — Connection analysis

Read the priority notes identified in Step 2 in this order:
1. Notes that are both orphans and deadends (complete isolation)
2. Orphans only, then deadends only
3. Notes in active folders (`03 - Knowledge/`, `04 - Projects/`, `99 - Claude Code/`) — these folders contain the most recently modified notes by default
4. Hubs (notes with 5+ references)

If scope exceeds 30 notes, launch several passes with parallel Read (10-12 notes per pass). For each note:
- Read its full content with Read
- Identify key subjects and concepts
- Use Grep to search for these terms in the scope
- Return candidate note pairs

Also identify **missing bridges between clusters**: two groups of notes that revolve around the same subject without crossing. Propose 1-2 bridge links per identified cluster pair.

Limit to 30-40 suggestions max per session — quality > quantity.

### Reciprocal links rule

If note A proposes a link to B, do not automatically propose link B → A. Evaluate each direction separately based on the source note content: does A talk about B functionally? Does the A → B link bring value to the reader of A?

## Step 4 — Scoring and link presentation

For each candidate link, evaluate on 2 dimensions:
- **Conceptual strength** (1-5): is the link real and non-trivial?
  - 1 = vague or tangential
  - 3 = common subject, clear but basic connection
  - 5 = deep or complementary connection
- **Structural impact** (1-5): does this link improve graph traversability?
  - 1 = links two already well-connected hubs
  - 3 = creates a minor bridge between two clusters
  - 5 = brings an orphan/deadend out of isolation or creates a key bridge

Score = Strength × Impact (max 25).

- Score > 15 → present as priority
- Score 5-15 → present if quota not yet reached
- Score < 5 → silently reject

**"No relevant link" case:** if no candidate link reaches score 5, indicate to {USER_NAME} "no links proposed for this scope — notes too isolated or already well connected" and stop (do not continue to Step 5).

**Present retained links as a table:**

```
### Suggested links

| Source note | Link to add | Target note | Reason | Score |
|-------------|------------|------------|--------|-------|
| vault-second-brain.md | [[{USER_NAME}]] | {USER_NAME}.md | Personal context directly linked | 20 |
| NMM.md | [[Balthasar-Gold]] | Balthasar-Gold.md | Paint mentioned in the technique | 16 |
```

**Wait for {USER_NAME}'s validation before adding anything.** {USER_NAME} can reject individual links or all suggestions.

## Step 5 — Link addition and cleanup

For each link validated by {USER_NAME}, use Edit to add `[[note-name]]` at the relevant location in the source note — at the end of the note in a `## See also` section if no natural location exists.

```markdown
## See also
- [[{USER_NAME}]]
- [[vault-second-brain]]
```

**After adding all links:** continue to Step 6 — do not stop here.

## Step 6 — Update INDEX.md files

**Scope:** revisit all folders defined in Step 1 — not only those where links were validated. A folder without an added link may still lack an INDEX.md or have missing entries.

Only process folders with a real delta — ignore folders already up to date.

### 6a. Change detection

For each folder in the Step 1 scope:
- Glob `folder/*.md` → list of notes (exclude `INDEX.md` itself and subfolders)
- **If `INDEX.md` absent** → folder candidate for creation
- **If `INDEX.md` present** → read its content, extract already listed slugs, compare with Glob → note missing entries
- **If no delta** → silently ignore this folder

### 6b. New entry generation

For each note absent from the index (or for all if creating):
- Read frontmatter: extract `title` (or `name`) and `tags`
- If no usable frontmatter → use the first H1 line or the file slug
- Build the line: `| [[slug]] | 1-line description | #tag1 #tag2 |`
- If note has no title, H1 or tags: leave Description and Tags empty rather than inventing

### 6c. Presentation and validation

Display concerned folders and new entries:

```
### INDEX.md to update

**03 - Knowledge/** — creation
| Note | Description | Tags |
...

**02 - Hobbies/** — 2 entries added
| [[new-note]] | ... | ... |
```

**Wait for {USER_NAME}'s validation before writing.** {USER_NAME} can validate in bulk or adjust entries.

### 6d. Writing

- **Creation**: Write `INDEX.md` with header `# Index — [Folder name]` + complete table
- **Addition**: Edit `INDEX.md` — append new lines to the existing table (do not rewrite already present entries)

**After writing all INDEX.md files:** update tracker (`99 - Claude Code/command-tracker.md`) if the file exists — `/link` line → replace date with today's date in `YYYY-MM-DD` format. Do not block if tracker does not exist.

## Step 7 — Rejection capitalisation (optional)

Each time {USER_NAME} rejects a link (or all suggestions) with an explanation, propose capitalising: add the heuristic in the "Learned heuristics" section with the general pattern (not the specific example) so the rule applies to future sessions.

**If {USER_NAME} rejects the entire result:** note the context (note type, scope, theme, rejection reason) — do not re-run a similar session without an explicit signal.
