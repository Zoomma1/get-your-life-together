---
name: create-adr
description: Single entry point to create an ADR (Architecture Decision Record) for a project or transversal scope. Invoke whenever a structural decision is made — architecture choice, transverse convention, technical arbitration, pivot. Resolves scope, detects target folder naming convention, generates a complete ADR from the decision context at a fixed format, updates INDEX.md. Guarantees homogeneous ADRs without manually copying an existing ADR to match format. Invoked directly by {USER_NAME} ("create an ADR for X", "document this decision") or by /recapsession at end of session when a structural decision has been made.
---

# Skill: Create ADR

Centralizes ADR creation to guarantee a consistent format. Invoked **when a decision is made**: the skill captures the decision from the session context, generates a complete ADR (not an empty skeleton), numbers it per the target folder's convention, and indexes it.

Goal: never manually copy an existing ADR to match the format again. The skill is the format.

## When to invoke

- Architecture decision (technology choice, pattern, structure)
- Transverse convention (naming, workflow, session rule)
- Settled technical arbitration (X rather than Y, and why)
- Pivot or invalidation of an approach (with `status: superseded` + link)

Do not invoke for: a simple note, a ticket, a reversible choice without lasting consequence.

## Step 1 — Resolve scope (target folder)

The argument passed is: `$ARGUMENTS` — may contain an explicit scope at the head (`transverse`, or a project name/slug) followed by a title, or just a title, or nothing.

1. **Explicit scope in argument**:
   - `transverse` → `TARGET = 99 - Claude Code/ADR/`, `SCOPE_NAME = transverse`, `INDEX_HEADER = GLOBAL`
   - Project name or slug → read `04 - Projects/INDEX.md`, "Active Projects" table, case-insensitive match on displayed name **or** slug. Deduce the **project folder name** from the Tickets/Kanban column path (segment after `04 - Projects/`).
     - `FOLDER = <folder segment>` (ex: `From sprue to glory`, `Waddle` — the literal folder value, not the INDEX displayed name which may differ like `CryptoBot (Waddle)`)
     - `TARGET = 04 - Projects/<FOLDER>/claude-code/ADR/`
     - `SCOPE_NAME = <FOLDER>` — project folder name, stable and aligned with the path. Never the INDEX displayed name nor the slug.
     - `INDEX_HEADER = <name displayed in the target ADR folder's INDEX>` (detected at Step 8 — may differ from FOLDER, do not deduce here)

2. **No explicit scope** → present an interactive list:
   ```
   ADR scope?
   1. Transverse (99 - Claude Code/ADR/)
   2. <Project 1 from INDEX.md>
   3. <Project 2 from INDEX.md>
   ...
   ```
   List all active projects from `04 - Projects/INDEX.md`. **Wait for {USER_NAME}'s choice.** No inference from working directory (in vault sessions cwd is `/home/vico`, non-discriminant).

3. **Project provided but absent from INDEX.md** → signal: "Project `<name>` absent from INDEX.md — transverse instead, or you create the project entry first?" and wait.

## Step 2 — Detect target folder naming convention

Scan `TARGET` (all `*.md` except `INDEX.md`). Deduce the pattern from existing filenames:

| Existing files match | `FILE_PREFIX` | `PAD` | `ID_FORM` |
| -------------------- | ------------- | ----- | --------- |
| `^ADR-(\d+)-` | `ADR-` | digit width (3) | `ADR-NNN` |
| `^(\d+)-` (Waddle) | *(empty)* | digit width (3) | `ADR-NNN` |
| `^([A-Z]+-ADR)-(\d+)-` (FSTG) | `<PREFIX>-ADR-` | width (3) | `<PREFIX>-ADR-NNN` |
| empty folder (1st ADR) | `ADR-` | 3 | `ADR-NNN` |

**Notes**:
- The frontmatter `id` and H1 title use `ID_FORM` (ex: Waddle has a file `012-...md` but `id: ADR-012` in frontmatter — `ID_FORM` remains `ADR-NNN`).
- If multiple patterns coexist in the folder (historical inconsistency) → take the **majority** pattern and signal it to {USER_NAME} at the end (non-blocking note).

## Step 2bis — Detect local content format

The *naming* convention (Step 2) says nothing about *content format*. Before using the default template (Step 7), open **1-2 sibling ADRs** from the `TARGET` folder (the most recent ones) and note their **actual structure**: section headings and frontmatter. The `## Context`/`## Decision`/`## Reasons`/`## Consequences`/`## Sources` sections are only a default — a project may use `## Reason`, `## See also`, a summary table, omit `## Sources`, order differently, etc.

- **If siblings follow a coherent structure different from the default template** → adopt **their** structure (sections, order, frontmatter aligned with sibling ADRs) for the new ADR, and store it as `LOCAL_FORMAT` for Step 7.
- **If folder is empty or siblings are inconsistent** → `LOCAL_FORMAT` remains empty, the default template applies.

Why: the skill's goal is homogeneity **within the folder**, not imposing a global format. An ADR that stands out from its siblings recreates the exact friction this skill aims to eliminate (manually copying an existing ADR to match the format). When a local format exists, it is authoritative.

## Step 3 — Number

- Extract the number from each file per the detected pattern.
- `NEXT = max(numbers) + 1`, zero-padded to `PAD` (ex: `073`, `008`).
- Empty folder → `NEXT = 001`.

## Step 4 — Build identifiers

- `ID = ID_FORM` with `NNN = NEXT` (ex: `ADR-073`, `FSTG-ADR-022`).
- Slugify the title: lowercase, accents removed, spaces → hyphens, special chars removed (same rule as `/create-ticket`).
- `FILENAME = <FILE_PREFIX><NEXT>-<slug-title>.md`
  - `ADR-` → `ADR-073-my-title.md`
  - empty (Waddle) → `073-my-title.md`
  - `FSTG-ADR-` → `FSTG-ADR-022-my-title.md`
- `FILESTEM` = `FILENAME` without `.md`.

## Step 5 — Detect overlap with existing ADR

Before drafting, check if the decision overlaps with an **already active** ADR in the target folder (not just supersedes).

1. Extract 3-5 keywords from the decision (tech, convention, subject).
2. Scan the target INDEX lines + folder filenames. Spot an active ADR on a similar subject.
3. **If plausible overlap** → stop and present to {USER_NAME}:
   ```
   ⚠ Possible overlap with <ID> — <decision from INDEX>.
   You want to: (a) supersede (new invalidates old)
               (b) extend (new distinct ADR, cross-link, old remains active)
               (c) abandon (old is sufficient, no new ADR)
   ```
   **Wait for the response.** Never silently write a redundant ADR.
4. No overlap → continue.

## Step 6 — Draft content (lean)

**The skill drafts the ADR itself** from the session context. This is the skill's core: a complete, coherent, **dense** ADR.

1. Identify the decision: what is settled, why, rejected alternatives, consequences.
2. Insufficient context → **one grouped question** to {USER_NAME} (all gaps), then draft. Never empty sections nor `<!-- TODO -->`.
3. Draft each section, **lean** style (see `/lean` skill) — an ADR is read by an agent AND by {USER_NAME}, density wins:
   - **Context**: the problem forcing the decision. Factual, dated if relevant. ≤ 4 dense lines.
   - **Decision**: what is settled. Affirmed, one sentence if possible + code block/command if it clarifies. No justification here.
   - **Reasons**: rejected alternatives + motive, as list. One line per alternative. No prose.
   - **Consequences**: what concretely changes (to do, side effects, accepted debt), as list. ≤ 5 bullets.
   - **Sources**: `Session HH:MM YYYY-MM-DD — <subject>`, `[[ADR-XXX]]` links, original ticket. Raw list.

**Anti-verbosity**: drop unnecessary articles, filler (just/really/basically), rhetorical scaffolding ("It is important to note that…", "One can observe that…"). Fragments OK. Exact technical substance intact. Target: a tightened existing ADR (ex: `ADR-072`, `ADR-057`) — never longer without reason. Clear decision > dissertation.

## Step 6bis — Supersede (if Step 5 = supersede)

- New ADR: `status: active` + `supersedes: <old ID>`.
- Old ADR: `status: superseded` + `superseded-by: <new ID>`.
- Old INDEX line: prefix with `⛔ *Superseded by <new ID>* — ` (convention ADR-065, ADR-068).

## Step 7 — Write ADR file

Write `TARGET/FILENAME`. **If `LOCAL_FORMAT` was detected (Step 2bis), follow that structure** (sections, order, frontmatter aligned with sibling ADRs) — the template below is only the **default**, applied when the folder is empty or siblings are inconsistent:

````markdown
---
id: <ID>
date: <YYYY-MM-DD of today>
scope: <SCOPE_NAME>
status: active
---

# <ID> — <Title>

## Context

<drafted>

## Decision

<drafted>

## Reasons

<drafted>

## Consequences

<drafted>

## Sources

<drafted>
````

For a supersede, add `supersedes: <ID>` (or `superseded-by:` on the old side) under `status:`.

Create the `TARGET` folder if it doesn't exist (project's first ADR).

## Step 8 — Update INDEX.md

Target: `TARGET/INDEX.md`.

1. **Detect link format** from existing `[[...]]` in the table:
   - Standard: `[[<FILESTEM>]]` (ex: `[[ADR-072-prompt-injection-third-party-clone-repos]]`)
   - Waddle: `[[ADR/<FILESTEM>]]` (subfolder prefix observed)
   - Reuse the exact prefix from an existing entry. Empty folder/INDEX → `[[<FILESTEM>]]`.
2. **Determine `INDEX_HEADER`**: if the target INDEX exists and already contains a `## <…>`, **reuse that header exactly** (transverse = `GLOBAL`; project = already-in-place header, ex: `CryptoBot (Waddle)`). Don't replace it with `FOLDER`. Locate the table under this header.
3. Add at **table end**:
   ```
   | [[<link>]] | <decision summary in 1 line, ≤ 120 chars> |
   ```
   Summary = the essence of the decision, styled like existing lines (dense, no "The", starts with the what).

**If INDEX.md absent** → create it (`INDEX_HEADER` = `GLOBAL` if transverse, else `FOLDER`):
```markdown
# Index — ADR

## <INDEX_HEADER>

| Link | Decision |
|------|----------|
| [[<link>]] | <summary> |
```

**If section `## <INDEX_HEADER>` absent** from an existing INDEX → add it with its table before inserting.

## Expected return

```
ADR created: <TARGET>/<FILENAME>
ID: <ID> — scope <SCOPE_NAME>
Indexed: <TARGET>/INDEX.md (section <INDEX_HEADER>)
[Supersede: <old ID> → status superseded]  (if applicable)
[⚠ mixed patterns in folder, majority retained]  (if applicable)
```

## Absolute rules

1. **The skill drafts the ADR, in lean style** — never empty sections nor `TODO`, never verbose prose. Homogeneity AND density: an ADR is read by an agent and by {USER_NAME}.
2. **Frontmatter format fixed**: `id / date / scope / status` — always `status: active` on creation (ADR created = accepted/active). No other keys except `supersedes`/`superseded-by`.
3. **Naming convention detected, never imposed** — respect the target folder's pattern (`ADR-` / empty / `<PREFIX>-ADR-`). No retroactive uniformization of existing files.
4. **Scope resolution via INDEX.md** — never hardcode project path. Interactive list if scope not provided.
5. **`scope` = project folder name** (ex: `Waddle`, `From sprue to glory` — the literal folder value under `04 - Projects/`, never the INDEX displayed name nor the slug), `transverse` for transverse ADRs.
6. **Atomic numbering by scan** — max + 1, no external counter.
7. **Always create the file AND update INDEX** — an unindexed ADR is invisible to Claude navigation.
8. **Supersede signaled** — any invalidation of an existing ADR is announced to {USER_NAME} before writing.
9. **Overlap detected before writing** (Step 5) — if the decision overlaps an active ADR, stop and propose supersede/extend/abandon. Never silently write a redundant ADR.

## Usage by other skills

`/recapsession` (end-of-session capitalization):
```
If structural decision made → apply create-adr with:
- scope: "<transverse | project name>"
- title: "<short decision title>"
Session context provides content — skill drafts.
```
