---
name: link
description: Analyze the vault and create [[]] links between notes. Trigger this skill when the user says "/link", "do the linking", "link my notes" or "vault link".
---
# Skill: Vault Link

This skill analyzes the vault and proposes Obsidian `[[]]` links between notes that discuss the same subjects. It never modifies a note without explicit validation from {USER_NAME}.

Anchoring philosophy: the role is to make the graph traversable, not to generate understanding. Claude connects. {USER_NAME} thinks. A well-traversable graph allows other commands like `/emerge`, `/trace` or `/connect` to work correctly — this is the real challenge of linking.

## Triggering

- the user says "/link", "do the linking", "link my notes"
- {USER_NAME} specifies a folder: "/link my Warhammer notes"
- Without specification → analyze the entire vault

## Learned Heuristics — {USER_NAME}'s refusals

These rules apply from the generation of suggestions, not after.

### Prefer the specific to the general
Do not link to an aggregate/tracking note when a note specific to the subject exists. Example: a note on Drukhari should point to `[[Drukhari - Squidmar Colors Schema]]`, not to `[[tracking-armies]]` (too generic).

### Do not link two distinct projects that share a common subject
[Hobby-project] and [Work-project] may share a topic but are independent projects in the vault. Do not create cross-links between them — the shared subject is not enough, the notes must complement each other functionally.

### Do not link the organization of one project with personal notes from another domain
A note from [Organization-project] should not link to personal collection notes. The two contexts are separate even if the topic overlaps.

### Verify the link exists before proposing it
Read the complete content of the source note (body text, "See also", "Connections" sections, inline links `→ [[...]]`) before suggesting a link. Never propose a link already present, regardless of its form in the note.

> ⚠️ **"Already linked" is tested on both forms, not just the short slug** (capitalized 2026-08-03, 3 false positives caught just before writing on a session of 24 candidates). A `grep -F "[[target"` does **not** match `[[04 - Projects/…/target]]` — the note is linked, the filter doesn't see it, and the link is proposed then written in duplicate. The normalization described below (Step 2a) is the solution, and it must apply **also here**, when proposing, not only when detecting orphans.

### Verify "already present" by wikilink, never by substring
A `grep -F "target"` also matches mentions **in plain text** — `├── THE PROBLEM.md` in ASCII trees, `` `memory/phase0-log.md` `` in inline code, `→ Show HN post` in plain text, `- ADR-023 — …` in a "See also". Concluding "link already present" on these matches is a **false positive that misses exactly the links to create**: the relationship is written but the graph doesn't see it. Always test the wikilink form (`grep -F "[[target"`), and treat a plain text mention as a **priority candidate** — the relationship is already validated by {USER_NAME} when he wrote it, only materializing it in the graph remains. Capitalized 2026-07-27: 44 of 50 links in the session came from this pattern ("See also" sections of cross-cutting ADRs).

### Do not link a project technical resource to its vision/ecosystem hub
A note that documents a tool for a specific project (ex: UX analytics for [project-name]) should point to the project directly, not to the note that aggregates vision or ecosystem. The resource is operational — the hub is strategic. The shared subject is not enough: there must be functional complementarity between the two notes.

### Broken link detection — exclude 2 artifacts
Ignore the `[[ ... ]]` syntax in bash code blocks (ex: `[[ $EUID -ne 0 ]]`), and do not cut the link at `|` when it's `\|` (escaped pipe in Obsidian table = valid link with alias, not a malformed link). Verify with real `grep '\]]'` that a corruption actually exists before proposing a "cleanup" — a destructive edit on a false positive breaks the rendering of tables.

### Never write in a Kanban board
Before adding a link (or a `## See also` section) to a note, check its frontmatter: if it contains `kanban-plugin: board`, **do not touch it** — any content outside columns breaks the Obsidian plugin rendering. This typically targets `Project management.md` files in projects, which look like hubs but are boards. Look for another location (README, INDEX.md of the folder) or abandon the link and state this. Capitalized 2026-07-27: the link `Husker/Project management` → `m3-done-criteria` was abandoned for this reason. Corollary: if the only remaining location is an outdated document or a single-file folder, **leaving the note orphaned is a valid answer** — do not fabricate an INDEX for a single file nor place a link in a dead document to lower a counter.

### If {USER_NAME} refuses the entire result
Do not relaunch a similar session without explicit signal. Note the context of the refusal (type of notes, scope, theme) to improve future detection.

## Step 1 — Scope and minimal validation

If {USER_NAME} specifies a folder or note → limit yourself to that scope. Without specification → scan all folders except `00 - Daily notes/` (too much volume, ephemeral links), mandatorily including `99 - Claude Code/Sessions/`.

List the folders that will be analyzed and wait for confirmation from {USER_NAME}.

**Minimal validation before continuing:**
- If scope < 5 notes: propose enlargement ("Insufficient scope — analyze [folder] in addition?")
- If scope > 200 notes: propose subdivision ("Scope too large — prioritize [folder] first?")
  - **If {USER_NAME} explicitly authorizes volume override** (he asks to exceed the limit and process the entire scope, ex "everything except inbox/tickets") → do not process flat. Prioritize in this strict order: **1) complete isolation (orphan AND deadend), 2) orphans alone, 3) deadends alone** — maintain quality despite volume. The guard rail yields, the prioritization strategy remains. Step 4 scoring still applies; removing isolated notes from the graph takes priority over exhaustive coverage.

---

## Step 2 — Structural Inventory

Before reading the content of notes, do a structural scan to prioritize reading. Orphans and deadends are the priority candidates — they benefit the most from linking.

> ⚙️ **Harness trap — bash scan put in background too early** (capitalized 2026-06-01): if structural scan goes through a bash script (faster than Glob/Grep on large scope), the harness can switch the command to background before the process ends → file reads arrive on an incomplete result. **Validated workaround**: a **single script with end marker** (ex: `/tmp/linkscan.sh` that writes a sentinel on the last line), read as one block after confirming the marker — never separate bash commands + `sleep`.

### 2a. Enumerate and detect orphans / deadends

For each folder to analyze:
- Use Glob to enumerate all `.md` files (pattern: `folder/**/*.md`)
- For each file, use Grep to search for `\[\[`: 0 result → deadend (note without outgoing link)

> ⚙️ **Two blind spots in deadend scan** (capitalized 2026-08-03, `/link` session on 1073 notes):
> 1. **Markdown relative links `[text](path.md)` are resolved by the Obsidian graph.** A note that only uses this form (seen on `TMAFR-1096`) has no `[[` and falls **falsely in deadend** — then receives wikilinks to targets already linked. Count `\[[^]]+\]\([^)]+\.md\)` as valid outgoing link, and do not propose wikilink to a target already reachable by this form.
> 2. **ADR slugs `ADR-XXX-...` are in PascalCase and escape the kebab-case pattern.** Any scan filtering candidates on `^[a-z0-9-]+$` makes **all ADRs invisible**. Do a **targeted scan separate** on `ADR-[0-9]{3}` in addition to the main scan, otherwise the most referenced layer of the vault is never analyzed.
- For each file X, use Grep to search for `\[\[X(\|[^\]]+)?\]\]` in the analyzed scope (replace X with the file slug without .md, accept aliases via `|`): 0 result → orphan (note without incoming link)

> ⚙️ **Trap in orphan detection — normalize link targets before comparison** (capitalized 2026-07-07). A basename-only grep `\[\[X...` **misses 3 forms** massively used in the vault and produces **false orphans** (notes flagged as isolated when they are well-linked):
> 1. **Full-path link** `[[04 - Projects/.../X]]` — starts with `[[04 - Projects/...`, not `[[X`.
> 2. **Spaced alias** `[[X | alias]]` — spaces around `|`.
> 3. **Escaped pipe** `[[X\|alias]]` — in Obsidian tables (especially INDEX.md).
>
> **Robust solution** (validated on 04/03/06, session 2026-07-07): extract **all** targets from the corpus in one pass, **normalize them to basename**, then compare by equality. Normalization, in order:
> ```
> grep -oE '\[\[[^]]+\]\]' ALL \
>   | sed -E 's/^\[\[//; s/\]\]$//' \
>   | sed -E 's/\\\|/|/g' \    # escaped pipe \| -> | BEFORE alias strip (else basename\ residual)
>   | sed -E 's/\|.*$//' \      # strip alias
>   | sed -E 's#^.*/##' \       # strip path
>   | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' \
>   | sort -u
> ```
> A file is orphan iff its basename is **absent** from this set (`grep -Fxq`). **Always** re-verify the real incoming links of a note **before** proposing a link (the "verify link existence" heuristic covers this) — normalization reduces noise, it does not suppress it 100%.

Prioritize notes that are both orphans AND deadends (complete isolation).

Expected result: list of orphans, deadends, and hubs (notes with 5+ incoming references).

### 2b. Detect unresolved links

Use Grep with pattern `\[\[([^\]]+)\]\]` on the scope to extract all links. For each link found (without the alias suffix `|...`), use Glob to verify that the file `link-target.md` exists. List links that don't correspond to any file.

**If broken links exist:** present to {USER_NAME} with supposed reason ("note to create" vs "malformed link"). Wait for instruction before acting.

## Step 3 — Connection Analysis

Read the priority notes identified in Step 2 in this order:
1. Notes that are both orphans and deadends (complete isolation)
2. Orphans alone, then deadends alone
3. Notes in active folders (`03 - Knowledge/`, `04 - Projects/`, `99 - Claude Code/`) — these folders contain the most recently modified notes by default
4. Hubs (notes with 5+ references)

If the scope exceeds 30 notes, launch multiple passes with Read in parallel (10-12 notes per pass). For each note:
- Read its complete content with Read
- Identify key subjects and concepts
- Use Grep to search for these terms in the scope
- Return candidate note pairs

Also identify **missing bridges between clusters**: two groups of notes that gravitate around the same subject without crossing. Propose 1-2 bridge links per cluster pair identified.

Limit to 30-40 suggestions max per session — quality > quantity.

### Reciprocal links rule

If note A proposes a link to B, do not automatically propose the link B → A. Evaluate each direction separately based on the source note's content: does A discuss B in a functional way? Does the link A → B provide value to the reader of A?

## Step 4 — Scoring and presenting links

For each candidate link, evaluate on 2 dimensions:
- **Conceptual strength** (1-5): is the link real and non-trivial?
  - 1 = vague or tangential
  - 3 = shared subject, connection clear but basic
  - 5 = deep or complementary connection
- **Structural impact** (1-5): does this link improve graph traversability?
  - 1 = links two already well-connected hubs
  - 3 = creates a minor bridge between two clusters
  - 5 = removes a note orphan/deadend from isolation or creates a key bridge

Score = Strength × Impact (max 25).

- Score > 15 → present in priority
- Score 5-15 → present if quota is not met
- Score < 5 → silently reject

**"No relevant links" case:** if no candidate link reaches score 5, indicate to {USER_NAME} "no links proposed for this scope — notes too isolated or already well-connected" and stop (do not continue to Step 5).

**Present retained links as a table:**

```
### Suggested links

| Source note | Link to add | Target note | Reason | Score |
|-------------|------------|------------|--------|-------|
| vault-second-brain.md | [[{USER_NAME}]] | {USER_NAME}.md | Personal context directly linked | 20 |
| NMM.md | [[Balthasar-Gold]] | Balthasar-Gold.md | Painting mentioned in the technique | 16 |
```

**Wait for {USER_NAME}'s validation before adding anything.** {USER_NAME} can reject links individually or all suggestions.

## Step 5 — Adding links and cleanup

For each link validated by {USER_NAME}, use Edit to add `[[note-name]]` at the relevant location in the source note — end of note in a `## See also` section if no natural location exists.

```markdown
## See also
- [[{USER_NAME}]]
- [[vault-second-brain]]
```

**After adding all links:** continue to Step 6 — do not stop here.

## Step 6 — Updating INDEX.md

**Scope:** resume all folders defined in Step 1 — not just those where links were validated. A folder without added links can still be missing INDEX.md or have missing entries.

Only process folders with a real delta — ignore folders already up to date.

### 6a. Detecting changes

For each folder in Step 1 scope:
- Glob `folder/*.md` → list of notes (exclude `INDEX.md` itself and subfolders)
- **If `INDEX.md` absent** → folder candidate for creation
- **If `INDEX.md` present** → read its content, extract already-listed slugs, compare with Glob → note missing entries
- **If no delta** → ignore this folder silently

### 6b. Generating new entries

For each note absent from the index (or all if creating):
- Read frontmatter: extract `title` (or `name`) and `tags`
- If no usable frontmatter → use first line H1 or file slug
- Build the line: `| [[slug]] | 1-line Description | #tag1 #tag2 |`
- If the note has neither title, nor H1, nor tags: leave Description and Tags empty rather than inventing

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

**Wait for {USER_NAME}'s validation before writing.** {USER_NAME} can validate in bulk or adjust entries.

### 6d. Writing

- **Creation**: Write `INDEX.md` with header `# Index — [Folder Name]` + complete table
- **Addition**: Edit `INDEX.md` — append new lines to the existing table (do not rewrite already-present entries)

**After writing all INDEX.md:** update the tracker (`99 - Claude Code/command-tracker.md`) if the file exists — `/link` line → replace the date with today's date in `YYYY-MM-DD` format. Do not block if tracker doesn't exist.

## Step 7 — Capitalizing refusals (optional)

Each time {USER_NAME} refuses a link (or all suggestions) with an explanation, propose to capitalize: add the heuristic to the "Learned heuristics" section with the general pattern (not the specific example) so the rule applies to future sessions.

**If {USER_NAME} refuses the entire result:** note the context (type of notes, scope, theme, reason for refusal) — do not relaunch a similar session without explicit signal.
