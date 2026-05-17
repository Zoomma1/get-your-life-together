---
name: create-adr
description: Single entry point for creating an ADR (Architecture Decision Record) for a project or transverse scope. Invoke whenever a structural decision is made — architecture choice, transverse convention, technical arbitration, pivot. Resolves scope, detects the target folder's naming convention, generates a complete ADR in fixed format from the decision context, updates INDEX.md. Guarantees homogeneous ADRs without manually copying an existing ADR as a template. Invoked directly by {USER_NAME} ("create an ADR for X", "document this decision") or by /recapsession at session end when a structural decision has been made.
---

# Skill: Create ADR

Centralizes ADR creation to guarantee a homogeneous format. Invoked **at the moment a decision is made**: the skill captures the decision from the session context, generates a complete ADR (not an empty skeleton), numbers it according to the target folder's convention, and indexes it.

Purpose: never manually copy an existing ADR to match the format again. The skill is the format.

## When to invoke

- Architecture decision (technology choice, pattern, structure)
- Transverse convention (naming, workflow, session rule)
- Settled technical arbitration (X rather than Y, and why)
- Pivot or invalidation of an approach (with `status: superseded` + link)

Do not invoke for: a simple note, a ticket, a reversible choice with no lasting consequence.

## Step 1 — Resolve scope (target folder)

The argument passed is: `$ARGUMENTS` — may contain an explicit scope at the start (`transverse`, or a project name/slug) followed by a title, or just a title, or nothing.

1. **Explicit scope in argument**:
   - `transverse` → `TARGET = 99 - Claude code/ADR/`, `SCOPE_NAME = transverse`, `INDEX_HEADER = GLOBAL`
   - Project name or slug → read `04 - Projects/INDEX.md`, "Active Projects" table, case-insensitive match on displayed name **or** slug. Deduce the **project folder name** from the path in the Tickets/Kanban column (segment after `04 - Projects/`).
     - `FOLDER = <folder segment>` (ex: `From sprue to glory`, `Waddle` — the literal folder value, not the INDEX display name which may differ like `CryptoBot (Waddle)`)
     - `TARGET = 04 - Projects/<FOLDER>/claude-code/ADR/`
     - `SCOPE_NAME = <FOLDER>` — project folder name, stable and aligned with path. Never the INDEX display name or slug.
     - `INDEX_HEADER = <name displayed in the target ADR folder's INDEX>` (detected in Step 8 — may differ from FOLDER, do not infer it here)

2. **No explicit scope** → present an interactive list:
   ```
   ADR scope?
   1. Transverse (99 - Claude code/ADR/)
   2. <Project 1 from INDEX.md>
   3. <Project 2 from INDEX.md>
   ...
   ```
   List all active projects from `04 - Projects/INDEX.md`. **Wait for {USER_NAME}'s choice.** No inference from working directory (in vault session cwd is `/home/vico`, not discriminating).

3. **Project provided but absent from INDEX.md** → report: "Project `<name>` absent from INDEX.md — transverse instead, or create the project entry first?" and wait.

## Step 2 — Detect target folder convention

Scan `TARGET` (all `*.md` except `INDEX.md`). Deduce the pattern from existing filenames:

| Existing files match | `FILE_PREFIX` | `PAD` | `ID_FORM` |
| -------------------- | ------------- | ----- | --------- |
| `^ADR-(\d+)-` | `ADR-` | digit width (3) | `ADR-NNN` |
| `^(\d+)-` (Waddle) | *(empty)* | digit width (3) | `ADR-NNN` |
| `^([A-Z]+-ADR)-(\d+)-` (FSTG) | `<PREFIX>-ADR-` | width (3) | `<PREFIX>-ADR-NNN` |
| empty folder (first ADR) | `ADR-` | 3 | `ADR-NNN` |

**Notes**:
- The frontmatter `id` and H1 title use `ID_FORM` (ex: Waddle has a file `012-...md` but `id: ADR-012` in frontmatter — `ID_FORM` remains `ADR-NNN`).
- If multiple patterns coexist in the folder (historical inconsistency) → take the **majority pattern** and report it to {USER_NAME} at execution end (non-blocking note).

## Step 3 — Number

- Extract the number from each file according to the detected pattern.
- `NEXT = max(numbers) + 1`, zero-padded to `PAD` width (ex: `073`, `008`).
- Empty folder → `NEXT = 001`.

## Step 4 — Build identifiers

- `ID = ID_FORM` with `NNN = NEXT` (ex: `ADR-073`, `FSTG-ADR-022`).
- Slugify the title: lowercase, remove accents, spaces → dashes, strip special characters (same rule as `/create-ticket`).
- `FILENAME = <FILE_PREFIX><NEXT>-<slug-title>.md`
  - `ADR-` → `ADR-073-my-title.md`
  - empty (Waddle) → `073-my-title.md`
  - `FSTG-ADR-` → `FSTG-ADR-022-my-title.md`
- `FILESTEM` = `FILENAME` without `.md`.

## Step 5 — Detect overlap with existing ADR

Before drafting, check if the decision overlaps with an **already active ADR** in the target folder (not just supersedes).

1. Extract 3–5 keywords from the decision (technology, convention, subject).
2. Scan the target INDEX's lines + filenames in the folder. Spot an active ADR on a related subject.
3. **If plausible overlap** → stop and present to {USER_NAME}:
   ```
   ⚠ Possible overlap with <ID> — <INDEX decision>.
   Do you want: (a) supersede (new one invalidates old)
               (b) extension (distinct new ADR, cross-link, old stays active)
               (c) abandon (old is enough, no new ADR)
   ```
   **Wait for response.** Never write a redundant ADR silently.
4. No overlap → proceed.

## Step 6 — Draft content (lean)

**The skill drafts the ADR itself** from session context. This is the skill's core: a complete, homogeneous ADR, **dense**.

1. Identify the decision: what was settled, why, discarded alternatives, consequences.
2. Insufficient context → **one grouped question** to {USER_NAME} (all gaps at once), then draft. Never empty sections or `<!-- TODO -->`.
3. Draft each section, **lean style** (see `/lean` skill) — an ADR is read by an agent AND by {USER_NAME}, density wins:
   - **Context**: the problem forcing the decision. Factual, dated if relevant. ≤ 4 dense lines.
   - **Decision**: what was settled. Affirmative, one sentence if possible + code/command block if it clarifies. No justification here.
   - **Reasons**: discarded alternatives + rationale, as a list. One line per alternative. No prose.
   - **Consequences**: what concretely changes (to do, side effects, accepted debt), as a list. ≤ 5 bullets.
   - **Sources**: `Session HH:MM YYYY-MM-DD — <subject>`, links `[[ADR-XXX]]`, original ticket. Raw list.

**Anti-verbosity**: drop superfluous articles, filler (just/really/basically), rhetorical scaffolding ("It is important to note that…", "One can observe that…"). Fragments OK. Exact technical substance intact. Target: a tightened existing ADR (ex: `ADR-072`, `ADR-057`) — never longer without reason. Clear decision > essay.

## Step 6bis — Supersede (if Step 5 = supersede)

- New ADR: `status: active` + `supersedes: <old ID>`.
- Old ADR: `status: superseded` + `superseded-by: <new ID>`.
- Old ADR's INDEX line: prefix with `⛔ *Superseded by <new ID>* — ` (convention ADR-065, ADR-068).

## Step 7 — Write ADR file

Write `TARGET/FILENAME` with this **fixed** template:

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

For a supersede, add `supersedes: <ID>` (or `superseded-by:` on the old one) under `status:`.

Create the folder `TARGET` if it does not exist (first ADR of the project).

## Step 8 — Update INDEX.md

Target: `TARGET/INDEX.md`.

1. **Detect link format** from existing `[[...]]` in the table:
   - Standard: `[[<FILESTEM>]]` (ex: `[[ADR-072-prompt-injection-third-party-repos-clones]]`)
   - Waddle: `[[ADR/<FILESTEM>]]` (subfolder prefix observed)
   - Reuse exactly the prefix from an existing entry. Empty folder/INDEX → `[[<FILESTEM>]]`.
2. **Determine `INDEX_HEADER`**: if target INDEX exists and already contains a `## <…>`, **reuse this header as-is** (transverse = `GLOBAL` ; project = the existing header, ex: `CryptoBot (Waddle)`). Do not replace it with `FOLDER`. Locate the table under this header.
3. Add at **table end**:
   ```
   | [[<link>]] | <decision summary in 1 line, ≤ 120 chars> |
   ```
   Summary = the essence of the decision, matching the style of existing lines (dense, no "The", starts with the what).

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

1. **The skill drafts the ADR, lean style** — never empty sections or `TODO`, never verbose prose. Homogeneity AND density: an ADR is read by an agent and by {USER_NAME}.
2. **Frontmatter format fixed**: `id / date / scope / status` — always `status: active` at creation (created ADR = accepted/active). No other keys except `supersedes`/`superseded-by`.
3. **Naming convention detected, never imposed** — respect the target folder's pattern (`ADR-` / empty / `<PREFIX>-ADR-`). No retroactive unification of existing files.
4. **Scope resolution via INDEX.md** — never hardcode project paths. Interactive list if scope not provided.
5. **`scope` = project folder name** (ex: `Waddle`, `From sprue to glory` — the literal folder value under `04 - Projects/`, never the INDEX display name or slug), `transverse` for transverse ADRs.
6. **Numbering atomic by scan** — max + 1, no external counter.
7. **Always create the file AND update the INDEX** — an unindexed ADR is invisible to Claude navigation.
8. **Supersede announced** — any invalidation of an existing ADR is announced to {USER_NAME} before writing.
9. **Overlap detected before writing** (Step 5) — if the decision overlaps an active ADR, stop and propose supersede/extension/abandon. Never a redundant ADR silently.

## Usage by other skills

`/recapsession` (session-end capitalization):
```
If structural decision made → apply create-adr with:
- scope: "<transverse | project name>"
- title: "<short title of decision>"
Session context provides content — the skill drafts.
```
