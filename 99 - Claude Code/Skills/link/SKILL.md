---
name: link
description: Analyze the vault and create [[]] links between notes. Trigger this skill when the user says "/link", "do the linking", "link my notes" or "vault link".
---
# Skill: Vault Link

This skill analyzes the vault and proposes Obsidian `[[]]` links between notes discussing the same subjects. It never modifies a note without explicit validation from {USER_NAME}.

Anchoring philosophy: the role is to make the graph traversable, not to generate understanding. Claude connects. {USER_NAME} thinks. A well-traversable graph allows other commands like `/emerge`, `/trace`, or `/connect` to work correctly — that's the real stake of linking.

## Trigger

- the user says "/link", "do the linking", "link my notes"
- {USER_NAME} specifies a folder: "/link my Warhammer notes"
- Without specification → analyze the entire vault

## Learned heuristics — {USER_NAME}'s refusals

These rules apply from the moment suggestions are generated, not afterward.

### Prefer the specific to the general
Do not link to an aggregate/tracking note when a note specific to the subject exists. Example: a note about Drukhari should point to `[[Drukhari - Squidmar Color Scheme]]`, not to `[[follow-armies]]` (too generic).

### Do not link two distinct projects that share a common subject
[Hobby-project] and [Work-project] may share a topic but are independent projects in the vault. Do not create cross-links between them — the common subject is not enough, there must be functional complementarity between the notes.

### Do not link the organization of one project with the personal notes of another domain
A note from [Organization-project] should not link to personal collection notes. The two contexts are separate even if the topic overlaps.

### Check the existence of the link before proposing it
Read the full content of the source note (body of text, "See also", "Connections" sections, inline links `→ [[...]]`) before suggesting a link. Never propose a link already present, in whatever form in the note.

> ⚠️ **"Already linked" is tested in both forms, not just the short slug** (capitalized 2026-08-03, 3 false positives caught just in time before writing on a 24-candidate session). A `grep -F "[[target"` does NOT match `[[04 - Projects/…/target]]` — the note is linked, the filter doesn't see it, and the link is proposed then written in duplicate. The normalization in basename described below (Step 2a) is the remedy, and it must apply **here too**, at the moment of proposing, not just at the moment of detecting orphans.

### Check "already present" by wikilink, never by substring
A `grep -F "target"` also matches mentions **in plain text** — `├── THE PROBLEM.md` in ASCII trees, `` `memory/phase0-log.md` `` in inline code, `→ Show HN post` in plain text, `- ADR-023 — …` in a "See also". Concluding "link already present" from these matches is a **false positive that causes exactly the links to create to be missed**: the relationship is written but the graph doesn't see it. Always test the wikilink form (`grep -F "[[target"`), and treat a mention in plain text as a **priority candidate** — the relationship is already validated by {USER_NAME} when he wrote it, all that's left is to materialize it. Capitalized 2026-07-27: 44 of 50 links in the session came from this pattern (sections "See also" in transverse ADRs).

### Do not link a project technical resource to its vision/ecosystem hub
A note documenting a tool for a specific project (ex: UX analytics for [project-name]) should point to the project directly, not to the note aggregating the vision or ecosystem. The resource is operational — the hub is strategic. The common subject is not enough: there must be functional complementarity between the two notes.

### Broken links detection — exclude 2 artifacts
Ignore the `[[ ... ]]` syntax from bash present in code blocks (ex: `[[ $EUID -ne 0 ]]`), and do not cut the link at `|` when it's `\|` (escaped pipe in Obsidian table = valid link with alias, not a malformed link). Check by real `grep '\]]'` that corruption actually exists before proposing a "cleanup" — a destructive edit on a false positive breaks the render of tables.

### Never write in a Kanban board
Before adding a link (or a `## See also` section) to a note, check its frontmatter: if it contains `kanban-plugin: board`, **do not touch it** — any content outside columns breaks the render of the Obsidian plugin. This typically targets project `Project management.md` files, which look like hubs but are boards. Look for another anchor (README, INDEX.md of the folder) or give up the link and say so. Capitalized 2026-07-27: the link `Husker/Project management` → `m3-done-criteria` was abandoned for this reason. Corollary: if the only remaining anchor is an obsolete document or a single-file folder, **leaving the note orphaned is a valid answer** — do not fabricate an INDEX for a single file nor place a link in a dead document to lower a counter.

### Do not fabricate an INDEX where another index already does the work
A `Tickets/` folder is indexed by its `Project management.md` — an INDEX would duplicate the board and rot behind it. A project folder with a **hub note** (`Waddle/Waddle.md`, `HomeLabServeur/HomeLabServeur.md`) doesn't need one either. Same for `claude-code/` folders (agent context, not knowledge collection) and `Skills/*` (a single `SKILL.md`). **Check for the existence of a hub or kanban before counting a missing INDEX** — a bare `[ ! -f INDEX.md ]` massively over-detects. Capitalized 2026-08-17: Step 6 reported **25 folders "INDEX missing", of which 22 should not have had one** — 6 `Tickets/` folders, 5 `claude-code/`, 4 `Skills/*`, 7 with a single note. Extends the corollary of the Kanban heuristic above: here it was "do not fabricate an INDEX for a single file", here it's "do not fabricate one when a kanban or hub already does".

### If {USER_NAME} refuses the entire result
Do not restart a similar session without explicit signal. Note the context of the refusal (type of notes, scope, theme) to improve future detection.

## Step 1 — Scope and minimal validation

If {USER_NAME} specifies a folder or note → limit to that scope. Without specification → scan all folders except `00 - Daily notes/` (too much volume, ephemeral links), and mandatorily include `99 - Claude Code/Sessions/`.

List the folders that will be analyzed and wait for {USER_NAME}'s confirmation.

**Minimal validation before continuing:**
- If scope < 5 notes: propose expansion ("Insufficient scope — analyze [folder] too?")
- If scope > 200 notes: propose subdivision ("Scope too large — prioritize [folder] first?")
  - **If {USER_NAME} explicitly authorizes volume override** (asks to exceed the limit and process the entire scope, ex "everything except inbox/tickets") → do not treat flat. Prioritize in this strict order: **1) complete isolation (orphan AND deadend), 2) orphans alone, 3) deadends alone** — maintain quality despite volume. The safeguard yields, the prioritization strategy remains. The scoring from Step 4 still applies; pulling isolated notes from the graph takes priority over exhaustive coverage.

---

## Step 2 — Structural inventory

Before reading note contents, perform a structural scan to prioritize reading. Orphans and deadends are the priority candidates — they benefit the most from linking.

> ⚙️ **Harness pitfall — bash scan backgrounded too early** (capitalized 2026-06-01): if the structural scan goes through a bash script (faster than Glob/Grep on large scope), the harness can background the command before process end → file reads arrive on incomplete results. **Validated workaround**: a **single script with end marker** (ex: `/tmp/linkscan.sh` that writes a sentinel in the last line), read in one block after confirming the marker — never separate bash commands + `sleep`.

### 2a. Enumerate and detect orphans / deadends

For each folder to analyze:
- Use Glob to enumerate all `.md` files (pattern: `folder/**/*.md`)
- For each file, use Grep to search for `\[\[`: 0 result → deadend (note with no outgoing links)

> ⚙️ **Two blind spots of deadend scan** (capitalized 2026-08-03, `/link` session on 1073 notes):
> 1. **Markdown relative links `[text](path.md)` are resolved by the Obsidian graph.** A note using only this form (seen on `TMAFR-1096`) has no `[[` and falsely outputs as **deadend** — then receives wikilinks to targets already linked. Count `\[[^]]+\]\([^)]+\.md\)` as a valid outgoing link, and do not propose a wikilink to a target already reached by this form.
> 2. **The slugs `ADR-XXX-...` are in PascalCase and escape the kebab-case pattern.** Any scan filtering candidates on `^[a-z0-9-]+$` renders **the entirety of ADRs invisible**. Perform a **separate targeted scan** on `ADR-[0-9]{3}` in addition to the main scan, otherwise the most-referenced layer of the vault is never analyzed.
- For each file X, use Grep to search for `\[\[X(\|[^\]]+)?\]\]` in the analyzed scope (replace X with the file's slug without .md, accept aliases via `|`): 0 result → orphan (note with no incoming links)

> ⚙️ **Orphan detection pitfall — normalize link targets before comparison** (capitalized 2026-07-07). A basename-only grep `\[\[X...` **misses 3 forms** massively used in the vault and produces **false orphans** (notes flagged as isolated when they're actually well-linked):
> 1. **Full-path link** `[[04 - Projects/.../X]]` — starts with `[[04 - Projects/...`, not `[[X`.
> 2. **Spaced alias** `[[X | alias]]` — spaces around the `|`.
> 3. **Escaped pipe** `[[X\|alias]]` — in Obsidian tables (especially INDEX.md).
>
> **Robust workaround** (validated on 04/03/06, 2026-07-07 session): extract **all** targets from the corpus in one pass, **normalize them to basename**, then compare by equality. Normalization, in order:
> ```
> grep -oE '\[\[[^]]+\]\]' ALL \
>   | sed -E 's/^\[\[//; s/\]\]$//' \
>   | sed -E 's/\\\|/|/g' \    # escaped pipe \| -> | BEFORE alias strip (else basename\ residual)
>   | sed -E 's/\|.*$//' \      # strip alias
>   | sed -E 's#^.*/##' \       # strip path
>   | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' \
>   | sort -u
> ```
> A file is orphan iff its basename is **absent** from this set (`grep -Fxq`). **Always** re-check the actual incoming links of a note **before** proposing a link (the "check link existence" heuristic covers this) — normalization reduces noise, it doesn't suppress it 100%.

Prioritize notes that are both orphans AND deadends (complete isolation).

Expected result: list of orphans, deadends, and hubs (notes with 5+ incoming references).

### 2b. Detect unresolved links

Use Grep with pattern `\[\[([^\]]+)\]\]` on the scope to extract all links. For each link found (without the alias suffix `|...`), use Glob to check that the file `link-target.md` exists. List links that correspond to no file.

**If broken links exist:** present to {USER_NAME} with supposed reason ("note to create" vs "malformed link"). Wait for instruction before acting.

## Step 3 — Connection analysis

Read priority notes identified in Step 2 in this order:
1. Notes that are both orphans and deadends (complete isolation)
2. Orphans alone, then deadends alone
3. Notes in active folders (`03 - Knowledge/`, `04 - Projects/`, `99 - Claude Code/`) — these folders contain the most recently modified notes by default
4. Hubs (notes with 5+ references)

If the scope exceeds 30 notes, launch multiple passes with Read in parallel (10-12 notes per pass). For each note:
- Read its full content with Read
- Identify key subjects and concepts
- Use Grep to search these terms in the scope
- Return candidate note pairs

Also identify **missing bridges between clusters**: two groups of notes gravitating around the same subject without crossing. Propose 1-2 bridge links per cluster pair identified.

Limit to 30-40 suggestions max per session — quality > quantity.

### Rule of reciprocal links

If note A proposes a link to B, do not automatically propose the link B → A. Evaluate each direction separately based on the source note's content: does A talk about B in a functional way? Does the A → B link add value for the A reader?

## Step 4 — Scoring and link presentation

For each candidate link, evaluate on 2 dimensions:
- **Conceptual strength** (1-5): is the link real and non-trivial?
  - 1 = vague or tangential
  - 3 = common subject, clear but basic connection
  - 5 = deep or complementary connection
- **Structural impact** (1-5): does this link improve graph traversability?
  - 1 = links two already well-connected hubs
  - 3 = creates a minor bridge between two clusters
  - 5 = pulls an orphan/deadend note from isolation or creates a key bridge

Score = Strength × Impact (max 25).

- Score > 15 → present as priority
- Score 5-15 → present if quota not reached
- Score < 5 → silently reject

**Case "no relevant links":** if no candidate link reaches score 5, indicate to {USER_NAME} "no links proposed for this scope — notes too isolated or already well-connected" and stop (do not continue to Step 5).

**Present retained links as a table:**

```
### Suggested links

| Source note | Link to add | Target note | Reason | Score |
|-------------|-------------|------------|--------|-------|
| vault-second-brain.md | [[{USER_NAME}]] | {USER_NAME}.md | Personal context directly related | 20 |
| NMM.md | [[Balthasar-Gold]] | Balthasar-Gold.md | Painting technique mentioned | 16 |
```

**Wait for {USER_NAME}'s validation before adding anything.** {USER_NAME} can reject links individually or the entire suggestion set.

## Step 5 — Link addition and cleanup

For each link validated by {USER_NAME}, use Edit to add `[[note-name]]` at the relevant location in the source note — at the end of the note in a `## See also` section if no natural location exists.

```markdown
## See also
- [[{USER_NAME}]]
- [[vault-second-brain]]
```

**After adding all links:** continue to Step 6 — do not stop here.

## Step 6 — Update INDEX.md files

**Scope:** take all folders defined in Step 1 — not just those where links were validated. A folder without added links may still lack INDEX.md or have missing entries.

Only process folders with real delta — ignore already-up-to-date folders.

### 6a. Change detection

For each folder in Step 1 scope:
- Glob `folder/*.md` → list of notes (exclude `INDEX.md` itself and subfolders)
- **If `INDEX.md` absent** → folder candidate for creation
- **If `INDEX.md` present** → read its content, extract already-listed slugs, compare with Glob → note missing entries
- **If no delta** → silently ignore this folder

### 6b. Generate new entries

For each note missing from the index (or all if creation):
- Read the frontmatter: extract `title` (or `name`) and `tags`
- If no usable frontmatter → use the first H1 line or the file's slug
- Build the line: `| [[slug]] | 1-line description | #tag1 #tag2 |`
- If the note has neither title, nor H1, nor tags: leave Description and Tags empty rather than invent

### 6c. Presentation and validation

Display the affected folders and new entries:

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

- **Creation**: Write `INDEX.md` with header `# Index — [Folder Name]` + complete table
- **Addition**: Edit `INDEX.md` — append new lines to the existing table (do not rewrite already-present entries)

**After writing all INDEX.md files:** update the tracker (`99 - Claude Code/command-tracker.md`) if the file exists — `/link` line → replace the date with today's date in `YYYY-MM-DD` format. Do not block if the tracker doesn't exist.

## Step 7 — Capitalization of refusals (optional)

Each time {USER_NAME} refuses a link (or the entire suggestion set) with an explanation, propose capitalization: add the heuristic to the "Learned heuristics" section with the general pattern (not the specific example) so the rule applies to future sessions.

**If {USER_NAME} refuses the entire result:** note the context (type of notes, scope, theme, reason for refusal) — do not restart a similar session without explicit signal.
