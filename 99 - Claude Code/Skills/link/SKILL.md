---
name: link
description: Analyze the vault and create [[]] links between notes. Triggers this skill when the user says "/link", "do the linking", "link my notes" or "vault link".
---
# Skill: Vault Link

This skill analyzes the vault and proposes Obsidian `[[]]` links between notes that discuss the same subjects. It never modifies a note without explicit validation from {USER_NAME}.

Anchoring philosophy: the role is to make the graph traversable, not to generate understanding. Claude connects. {USER_NAME} thinks. A well-traversable graph allows other commands like `/emerge`, `/trace` or `/connect` to work correctly — that is the real goal of linking.

## Triggering

- the user says "/link", "do the linking", "link my notes"
- {USER_NAME} specifies a folder: "/link my Warhammer notes"
- Without specification → analyze the entire vault

## Learned heuristics — refusals from {USER_NAME}

These rules apply from the moment suggestions are generated, not after.

### Prefer specific over general
Do not link to an aggregate/tracking note when a specific note on the subject exists. Example: a note about Drukhari should point to `[[Drukhari - Squidmar Color Scheme]]`, not to `[[tracking-armies]]` (too generic).

### Do not link two distinct projects that share a common subject
[Hobby-project] and [Work-project] may share a topic but are independent projects in the vault. Do not create cross-links between them — the common subject is not enough, the notes must complement each other functionally.

### Do not link a project's organization with personal notes from another domain
A note from [Organization-project] should not link to personal collection notes. The two contexts are separate even if the topic overlaps.

### Verify the link exists before proposing it
Read the complete content of the source note (body text, "See also" sections, "Connections", inline links `→ [[...]]`) before suggesting a link. Never propose a link that already exists, regardless of its form in the note.

### Do not link a project technical resource to its vision hub/ecosystem
A note that documents a tool for a specific project (ex: UX analytics for [project-name]) should point to the project directly, not to the note that aggregates the vision or ecosystem. The resource is operational — the hub is strategic. The common subject is not enough: there must be functional complementarity between the two notes.

### Broken link detection — exclude 2 artifacts
Ignore the `[[ ... ]]` syntax in bash code blocks (ex: `[[ $EUID -ne 0 ]]`), and do not break the link at `|` when it is `\|` (escaped pipe in Obsidian table = valid link with alias, not a malformed link). Verify by actual `grep '\]]'` that corruption truly exists before proposing a "cleanup" — a destructive edit on a false positive breaks table rendering.

### If {USER_NAME} refuses the entire result
Do not launch a similar session without explicit signal. Note the context of the refusal (type of notes, scope, theme) to improve future detection.

## Step 1 — Scope and minimal validation

If {USER_NAME} specifies a folder or note → limit to that scope. Without specification → scan all folders except `00 - Daily notes/` (too much volume, ephemeral links), including mandatory `99 - Claude Code/Sessions/`.

List the folders that will be analyzed and wait for confirmation from {USER_NAME}.

**Minimal validation before continuing:**
- If scope < 5 notes: propose enlargement ("Insufficient scope — analyze [folder] as well?")
- If scope > 200 notes: propose subdivision ("Scope too large — prioritize [folder] first?")
  - **If {USER_NAME} explicitly authorizes the volume override** (they ask to exceed the limit and process the entire scope) → do not link on volume: **prioritize orphans and deadends** (notes without incoming/outgoing links, identified in Step 2). The scoring from Step 4 remains applied, but the selection of notes to analyze targets isolation first — removing isolated notes from the graph takes priority over exhaustive coverage.

---

## Step 2 — Structural inventory

Before reading note content, perform a structural scan to prioritize reading. Orphans and deadends are the priority candidates — they benefit most from linking.

> ⚙️ **Harness trap — bash scan backgrounded too early** (capitalized 2026-06-01): if structural scan goes through a bash script (faster than Glob/Grep on large scope), the harness may background the command before the process finishes → file reads arrive on incomplete results. **Validated workaround**: a **single script with end marker** (ex: `/tmp/linkscan.sh` that writes a sentinel on last line), read as one block after marker confirmation — never separate bash commands + `sleep`.

### 2a. Enumerate and detect orphans / deadends

For each folder to analyze:
- Use Glob to enumerate all `.md` files (pattern: `folder/**/*.md`)
- For each file, use Grep to search for `\[\[`: 0 result → deadend (note without outgoing link)
- For each file X, use Grep to search for `\[\[X(\|[^\]]+)?\]\]` in the analyzed scope (replace X with the file slug without .md, accept aliases via `|`): 0 result → orphan (note without incoming link)

Prioritize notes that are both orphans AND deadends (complete isolation).

Expected result: list of orphans, deadends, and hubs (notes with 5+ incoming references).

### 2b. Detect unresolved links

Use Grep with pattern `\[\[([^\]]+)\]\]` on the scope to extract all links. For each link found (without the alias suffix `|...`), use Glob to verify that the file `link-target.md` exists. List links that do not correspond to any file.

**If broken links exist:** present to {USER_NAME} with suspected reason ("note to create" vs "malformed link"). Wait for instruction before acting.

## Step 3 — Connection analysis

Read the priority notes identified in Step 2 in this order:
1. Notes that are both orphans and deadends (complete isolation)
2. Orphans only, then deadends only
3. Notes in active folders (`03 - Knowledge/`, `04 - Projects/`, `99 - Claude Code/`) — these folders contain the most recently modified notes by default
4. Hubs (notes with 5+ references)

If the scope exceeds 30 notes, launch multiple passes with Read in parallel (10-12 notes per pass). For each note:
- Read its complete content with Read
- Identify key subjects and concepts
- Use Grep to search for these terms in the scope
- Return pairs of candidate notes

Also identify **missing bridges between clusters**: two groups of notes gravitating around the same subject without crossing. Propose 1-2 bridge links per cluster pair identified.

Limit to 30-40 suggestions max per session — quality > quantity.

### Reciprocal links rule

If note A proposes a link to B, do not automatically propose the link B → A. Evaluate each direction separately based on the source note's content: does A discuss B functionally? Does the A → B link add value to A's reader?

## Step 4 — Scoring and presentation of links

For each candidate link, evaluate on 2 dimensions:
- **Conceptual strength** (1-5): is the link real and non-trivial?
  - 1 = vague or tangential
  - 3 = common subject, clear but basic connection
  - 5 = deep or complementary connection
- **Structural impact** (1-5): does this link improve graph traversability?
  - 1 = connects two hubs already well-connected
  - 3 = creates a minor bridge between two clusters
  - 5 = removes an orphan/deadend from isolation or creates a key bridge

Score = Strength × Impact (max 25).

- Score > 15 → present as priority
- Score 5-15 → present if quota not reached
- Score < 5 → silently reject

**Case "no relevant link":** if no candidate link reaches score 5, indicate to {USER_NAME} "no links proposed for this scope — notes too isolated or already well-connected" and stop (do not continue to Step 5).

**Present retained links in table format:**

```
### Suggested links

| Source note | Link to add | Target note | Reason | Score |
|-------------|-------------|-------------|--------|-------|
| vault-second-brain.md | [[{USER_NAME}]] | {USER_NAME}.md | Personal context directly related | 20 |
| NMM.md | [[Balthasar-Gold]] | Balthasar-Gold.md | Painting mentioned in the technique | 16 |
```

**Wait for {USER_NAME} validation before adding anything.** {USER_NAME} can reject individual links or all suggestions.

## Step 5 — Adding links and cleanup

For each link validated by {USER_NAME}, use Edit to add `[[note-name]]` at the relevant place in the source note — at the end of the note in a `## See also` section if no natural place exists.

```markdown
## See also
- [[{USER_NAME}]]
- [[vault-second-brain]]
```

**After adding all links:** continue to Step 6 — do not stop here.

## Step 6 — Updating INDEX.md files

**Scope:** use all folders defined in Step 1 — not just those where links were added. A folder with no added links may still be missing INDEX.md or have missing entries.

Only process folders with a real delta — ignore folders already up-to-date.

### 6a. Change detection

For each folder in Step 1 scope:
- Glob `folder/*.md` → list of notes (exclude `INDEX.md` itself and subfolders)
- **If `INDEX.md` absent** → folder candidate for creation
- **If `INDEX.md` present** → read its content, extract already-listed slugs, compare with Glob → note missing entries
- **If no delta** → silently ignore this folder

### 6b. Generate new entries

For each note absent from the index (or all if creation):
- Read the frontmatter: extract `title` (or `name`) and `tags`
- If no usable frontmatter → use the first H1 line or the file slug
- Build the line: `| [[slug]] | 1-line description | #tag1 #tag2 |`
- If the note has neither title, nor H1, nor tags: leave Description and Tags empty rather than invent

### 6c. Presentation and validation

Display affected folders and new entries:

```
### INDEX.md to update

**03 - Knowledge/** — creation
| Note | Description | Tags |
...

**02 - Hobbies/** — 2 entries added
| [[new-note]] | ... | ... |
```

**Wait for {USER_NAME} validation before writing.** {USER_NAME} can validate in bulk or adjust entries.

### 6d. Writing

- **Creation**: Write `INDEX.md` with header `# Index — [Folder Name]` + complete table
- **Addition**: Edit `INDEX.md` — append new lines in the existing table (do not rewrite already-present entries)

**After writing all INDEX.md files:** update the tracker (`99 - Claude Code/command-tracker.md`) if the file exists — `/link` line → replace the date with today's date in `YYYY-MM-DD` format. Do not block if the tracker does not exist.

## Step 7 — Capitalizing refusals (optional)

Each time {USER_NAME} refuses a link (or all suggestions) with an explanation, propose capitalization: add the heuristic to the "Learned heuristics" section with the general pattern (not the specific example) so the rule applies to future sessions.

**If {USER_NAME} refuses the entire result:** note the context (type of notes, scope, theme, reason for refusal) — do not relaunch a similar session without explicit signal.
