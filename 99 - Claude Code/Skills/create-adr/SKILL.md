---
name: create-adr
description: Single entry point for creating an ADR (Architecture Decision Record) for a project or transversely. To be invoked as soon as a structural decision is made — architecture choice, transverse convention, technical arbitration, pivot. Resolves the scope, detects the naming convention of the target folder, generates a complete ADR from the decision context in a fixed format, updates the INDEX.md. Ensures homogeneous ADRs without manually copying an existing ADR as a template. Invoked directly by {USER_NAME} ("create an ADR for X", "document this decision") or by /recapsession at the end of a session when a structural decision has been made.
---

# Skill: Create ADR

Centralizes ADR creation to ensure a homogeneous format. Invoked **when a decision is made**: the skill captures the decision from the session context, generates a complete ADR (not an empty skeleton), numbers it according to the convention of the target folder, and indexes it.

The goal: never manually copy an existing ADR to match the format again. The skill is the format.

## When to invoke

- Architecture decision (technology choice, pattern, structure)
- Transverse convention (naming, workflow, session rule)
- Settled technical arbitration (X rather than Y, and why)
- Pivot or invalidation of an approach (with `status: superseded` + link)

Do not invoke for: a simple note, a ticket, a reversible choice without lasting consequence.

## Step 1 — Resolve the scope (target folder)

The argument passed is: `$ARGUMENTS` — can contain an explicit scope at the head (`transverse`, or a project name/slug) followed by a title, or just a title, or nothing.

1. **Explicit scope in the argument**:
   - `transverse` → `TARGET = 99 - Claude Code/ADR/`, `SCOPE_NAME = transverse`, `INDEX_HEADER = GLOBAL`
   - Project name or slug → resolve via the **two sources** below, in that order.

   **Source A — `04 - Projects/INDEX.md`** (table "Active Projects"). Case-insensitive match on the displayed name **or** the slug.
   - Deduce the **project folder path** from the Tickets or Kanban column: take the path as written and **remove its last segment** (`Tickets`, `Features`, `Project management`…). ⚠️ **Never presuppose the `04 - Projects/` prefix** — several active projects live elsewhere (`06 - Work/Theodo Extend/jira-run-watcher`, `06 - Work/Theodo Extend/LORE`) and deriving by prefix fabricates a target path that does not exist.
   - `PROJECT_DIR = <deduced path>` (ex: `04 - Projects/Waddle`, `06 - Work/Theodo Extend/jira-run-watcher`)
   - `FOLDER = basename(PROJECT_DIR)` (ex: `Waddle`, `jira-run-watcher` — literal value of the folder, not the INDEX display name which may differ like `CryptoBot (Waddle)`)

   **Source B — filesystem discovery** (if not found in A). Theodo run clients (Minlay, Theoboost, Advancy, minlink…) are not in any project index — their home is `06 - Work/Theodo Extend/Projects/<Client>/`. Search for an existing ADR folder:
   ```bash
   find "06 - Work" "04 - Projects" -type d -path '*claude-code/ADR' 2>/dev/null
   ```
   Match the requested scope against the parent segment of `claude-code/` (case-insensitive). A `claude-code/ADR/` folder **that already exists is proof** that the project has an ADR convention — no need for a declaration elsewhere.
   - `PROJECT_DIR = <folder parent to claude-code/>`, `FOLDER = basename(PROJECT_DIR)`

   **In both cases**:
   - `TARGET = <PROJECT_DIR>/claude-code/ADR/`
   - `SCOPE_NAME = <FOLDER>` — name of the project folder, stable and aligned with the path. Never the INDEX display name nor the slug.
   - `INDEX_HEADER = <name displayed in the INDEX of the target ADR folder>` (detected Step 8 — can differ from FOLDER, do not deduce it here)

2. **No explicit scope** → present an interactive list:
   ```
   ADR scope?
   1. Transverse (99 - Claude Code/ADR/)
   2. <Project 1 from INDEX.md>
   ...
   N. <Client Run discovered by find>
   ```
   List active projects from `04 - Projects/INDEX.md` **then** ADR folders discovered by source B that are not listed there (flag them as *Run client*). **Await {USER_NAME}'s choice.** No inference from the working directory (in vault session the cwd is the user's home, non-discriminant).

3. **Project provided not found in either source** (neither INDEX.md, nor existing `claude-code/ADR/` folder) → report: "Project `<name>` not found — neither in `04 - Projects/INDEX.md`, nor as an existing ADR folder. Transverse instead, or create the project entry first?" and wait. Never fabricate a target path by convention.

## Step 2 — Detect the convention of the target folder

Scan `TARGET` (all `*.md` except `INDEX.md`). Deduce the pattern from existing file names:

| Existing files match | `FILE_PREFIX` | `PAD` | `ID_FORM` |
| -------------------- | ------------- | ----- | --------- |
| `^ADR-(\d+)-` | `ADR-` | digit width (3) | `ADR-NNN` |
| `^(\d+)-` (Waddle) | *(empty)* | digit width (3) | `ADR-NNN` |
| `^([A-Z]+-ADR)-(\d+)-` (FSTG) | `<PREFIX>-ADR-` | width (3) | `<PREFIX>-ADR-NNN` |
| empty folder (1st ADR) | `ADR-` | 3 | `ADR-NNN` |

**Notes**:
- The frontmatter `id` and H1 title use `ID_FORM` (ex: Waddle has a file `012-...md` but `id: ADR-012` in the frontmatter — `ID_FORM` remains `ADR-NNN`).
- If multiple patterns coexist in the folder (historical inconsistency) → take the **majority** pattern and flag it to {USER_NAME} at the end of execution (non-blocking note).

## Step 2bis — Detect the content format locally

The *naming* convention (Step 2) says nothing about *content format*. Before using the default template (Step 7), open **1-2 sibling ADRs** from the `TARGET` folder (the most recent) and note their **actual structure**: section titles and frontmatter. The `## Context`/`## Decision`/`## Reasons`/`## Consequences`/`## Sources` sections are just a default — a project may use `## Rationale`, `## See also`, a summary table, omit `## Sources`, order differently, etc.

- **If siblings follow a coherent structure different from the default template** → adopt **their** structure (sections, order, frontmatter copied from sibling ADRs) for the new ADR, and store it as `LOCAL_FORMAT` for Step 7.
- **If folder is empty or siblings are inconsistent** → `LOCAL_FORMAT` remains empty, the default template applies.

Why: the skill's goal is homogeneity **within the folder**, not imposition of a global format. An ADR that stands out from its siblings recreates exactly the friction this skill wants to eliminate (manually copying an existing ADR to match the format). When a local format exists, it is authoritative.

## Step 3 — Number

- Extract the number from each file according to the detected pattern.
- `NEXT = max(numbers) + 1`, zero-padded to `PAD` width (ex: `073`, `008`).
- Empty folder → `NEXT = 001`.

## Step 4 — Build identifiers

- `ID = ID_FORM` with `NNN = NEXT` (ex: `ADR-073`, `FSTG-ADR-022`).
- Slugify the title: lowercase, accents removed, spaces → hyphens, special characters removed (same rule as `/create-ticket`).
- `FILENAME = <FILE_PREFIX><NEXT>-<slug-title>.md`
  - `ADR-` → `ADR-073-my-title.md`
  - empty (Waddle) → `073-my-title.md`
  - `FSTG-ADR-` → `FSTG-ADR-022-my-title.md`
- `FILESTEM` = `FILENAME` without `.md`.

## Step 5 — Detect overlap with an existing ADR

Before writing, check whether the decision overlaps with an already **active** ADR in the target folder (not just supersedes).

1. Extract 3-5 keywords from the decision (technology, convention, subject).
2. Scan the lines of the target INDEX + folder file titles. Identify an active ADR on a similar subject.
3. **If plausible overlap** → stop and present to {USER_NAME}:
   ```
   ⚠ Possible overlap with <ID> — <INDEX decision>.
   Do you want: (a) supersede (the new invalidates the old)
                (b) extension (new distinct ADR, cross-link, old remains active)
                (c) abandon (the old is enough, no new ADR)
   ```
   **Await the response.** Never silently write a redundant ADR.
4. No overlap → continue.

## Step 6 — Write the content (lean)

**The skill writes the ADR itself** from the session context. This is the skill's core: a complete, homogeneous, **dense** ADR.

1. Identify the decision: what is settled, why, rejected alternatives, consequences.
2. Insufficient context → **a single grouped question** to {USER_NAME} (all gaps), then write. Never empty sections or `<!-- TODO -->`.
3. Write each section in **lean** style (cf. `/lean` skill) — an ADR is read by an agent AND by {USER_NAME}, density takes priority:
   - **Context**: the problem that forces the decision. Factual, dated if relevant. ≤ 4 dense lines.
   - **Decision**: what is settled. Affirmative, one sentence if possible + code block/command if it clarifies. No justification here.
   - **Reasons**: rejected alternatives + motivation, as a list. One line per alternative. No prose.
   - **Consequences**: what concretely changes (to do, side effects, accepted debt), as a list. ≤ 5 bullets.
   - **Sources**: `Session HH:MM YYYY-MM-DD — <subject>`, `[[ADR-XXX]]` links, original ticket. Raw list.

**Anti-verbosity**: drop superfluous articles, filler (just/really/basically), rhetorical scaffolding ("It is important to note that…", "One can observe that…"). Fragments OK. Exact technical substance intact. Target: an existing tightened ADR (ex: `ADR-072`, `ADR-057`) — never longer without reason. Clear decision > dissertation.

## Step 6bis — Supersede (if Step 5 = supersede)

- New ADR: `status: active` + `supersedes: <old ID>`.
- Old ADR: `status: superseded` + `superseded-by: <new ID>`.
- Old INDEX line: prefix with `⛔ *Superseded by <new ID>* — ` (convention ADR-065, ADR-068).

## Step 7 — Write the ADR file

Write `TARGET/FILENAME`. **If `LOCAL_FORMAT` was detected (Step 2bis), follow that structure** (sections, order, frontmatter copied from sibling ADRs) — the template below is only the **default**, applied when the folder is empty or inconsistent:

````markdown
---
id: <ID>
date: <YYYY-MM-DD of today>
scope: <SCOPE_NAME>
status: active
---

# <ID> — <Title>

## Context

<written>

## Decision

<written>

## Reasons

<written>

## Consequences

<written>

## Sources

<written>
````

For a supersede, add `supersedes: <ID>` (or `superseded-by:` on the old side) under `status:`.

Create the `TARGET` folder if it does not exist (first ADR of the project).

## Step 8 — Update INDEX.md

Target: `TARGET/INDEX.md`.

1. **Detect link format** from existing `[[...]]` in the table:
   - Standard: `[[<FILESTEM>]]` (ex: `[[ADR-072-prompt-injection-third-party-repos]]`)
   - Waddle: `[[ADR/<FILESTEM>]]` (subfolder prefix observed)
   - Reuse exactly the prefix from an existing entry. Empty folder/INDEX → `[[<FILESTEM>]]`.
2. **Determine `INDEX_HEADER`**: if the target INDEX exists and already contains a `## <…>`, **reuse that header as-is** (transverse = `GLOBAL`; project = the existing header, ex: `CryptoBot (Waddle)`). Do not replace it with `FOLDER`. Locate the table under that header.
3. Add at the **end of the table**:
   ```
   | [[<link>]] | <1-line decision summary, ≤ 120 chars> |
   ```
   The summary = the essence of the decision, styled like existing lines (dense, without "The", starts with the what).

**If INDEX.md is missing** → create it (`INDEX_HEADER` = `GLOBAL` if transverse, else `FOLDER`):
```markdown
# Index — ADR

## <INDEX_HEADER>

| Link | Decision |
|------|----------|
| [[<link>]] | <summary> |
```

**If the section `## <INDEX_HEADER>` is missing** from an existing INDEX → add it with its table before inserting.

## Expected return

```
ADR created: <TARGET>/<FILENAME>
ID: <ID> — scope <SCOPE_NAME>
Indexed: <TARGET>/INDEX.md (section <INDEX_HEADER>)
[Supersede: <old ID> → status superseded]  (if applicable)
[⚠ mixed patterns in folder, majority retained]  (if applicable)
```

## Absolute rules

1. **The skill writes the ADR, in lean** — never empty sections or `TODO`, never verbose prose. Homogeneity AND density: an ADR is read by an agent and by {USER_NAME}.
2. **Fixed frontmatter format**: `id / date / scope / status` — always `status: active` on creation (ADR created = accepted/active). No other key except `supersedes`/`superseded-by`.
3. **Detected naming convention, never imposed** — respect the pattern of the target folder (`ADR-` / empty / `<PREFIX>-ADR-`). No retroactive normalization of existing files.
4. **Scope resolution by discovery, never by convention** — two sources: `04 - Projects/INDEX.md` (path derived from Tickets/Kanban column, **without presupposing the `04 - Projects/` prefix**), then a `find` of existing `claude-code/ADR/` folders for Run clients absent from any index. Never hardcoding or fabricated paths. Interactive list if scope not provided.
5. **`scope` = name of the project folder** (ex: `Waddle`, `From sprue to glory`, `Minlay`, `jira-run-watcher` — the literal `basename` of the project folder, wherever it lives in the vault; never the INDEX display name nor the slug), `transverse` for transverse ADRs.
6. **Atomic numbering by scan** — max + 1, no external counter.
7. **Always create the file AND update the INDEX** — an unindexed ADR is invisible to Claude navigation.
8. **Supersede flagged** — any invalidation of an existing ADR is announced to {USER_NAME} before writing.
9. **Overlap detected before writing** (Step 5) — if the decision overlaps an active ADR, stop and offer supersede/extension/abandon. Never redundant ADR in silence.

## Use by other skills

`/recapsession` (session-end capitalization):
```
If structural decision made → apply create-adr with:
- scope: "<transverse | project name>"
- title: "<short title of the decision>"
Session context provides the content — the skill writes.
```
