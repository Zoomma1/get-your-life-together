---
name: specs
description: Generate specs for features in Spec column, prioritize their implementation, validate with user, then move to Ready. Supports multiple kanbans in one session.
---

Executes the workflow for generating specs for one or more kanbans.

## Prerequisites — Load vault parameters

Read `99 - Claude Code/config/vault-settings.md` → extract: `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Step 0 — Configure dynamic paths

For each kanban to process, establish the root path:

| Kanban | Root path | README | Priority |
|--------|------------|--------|----------|
| Standard project | `[PROJECTS_FOLDER]/<Project>/` | `README.md` | `Priority.md` |
| Claude Code | `99 - Claude Code/` | (no README) | `Priority.md` |

Use this mapping in all following steps to avoid repeated searches.

## Step 1 — Identify kanbans to process

1. Read `[PROJECTS_FOLDER]/INDEX.md` to identify active projects and their kanbans
2. Identify kanbans to process:
   - If user specifies a project → process only that kanban
   - If user says "all" or doesn't specify → process all kanbans with tickets in **Spec** column:
     - Project kanbans: `[PROJECTS_FOLDER]/<Project>/Project management.md`
     - Claude Code kanban: `99 - Claude Code/Claude Code Kanban.md`
3. For each identified kanban:
   - Standard project → read README at `<Root path>/README.md` for context (Architecture, Stack, Conventions)
   - Claude Code → rely on CLAUDE.md and existing skills (no README)

## Step 2 — List features

For each identified kanban:
1. Read the kanban
2. Extract all features in **Spec** column and classify:
   - **Specs to generate** : empty note or without `## Specs générées` section
   - **Already-spec'd** : existing note with `## Specs générées` section filled → mark for move to Ready (no re-generation)
   - **Already implemented** : only if explicit in "Done" section or project README progress — don't assume
3. Also list features in **Ready** column not yet started (for overall priority order — they can be reordered if affected by new order)
4. Ignore features in **Done** column — never relist them

**Step 2 result** : 3 lists per kanban
- Features in Spec to spec: `[F1, F2, F3]`
- Features in Spec already spec'd: `[F4, F5]`
- Features in Ready (not started): `[F6, F7]`

## Step 3 — Propose priority order

For each kanban with at least one feature to process (Spec or Ready):

Analyze and propose order based on:
- **Dependencies** : a feature that blocks another (explicit in titles/descriptions) comes first — consider intra-kanban dependencies only
- **User value** : impact on end-user perceived experience
- **Technical complexity** : complex features that could be foundations for others

Present result as single table per kanban:

```markdown
### Kanban [ProjectName]
| # | Feature | Reason |
|---|---------|--------|
| 1 | [[FeatureName]] | Blocks X / High user value |
| 2 | [[FeatureName]] | Dependency of #1 / Medium impact |
```

**Edge case** : If kanban has zero features to spec **AND** zero features in Ready → skip directly to next section, no action.

Wait for user validation before continuing.

## Step 4 — Update Priority.md (optional)

**Prerequisite** : This step executes ONLY if:
1. user validated the order in step 3 AND
2. At least one feature was identified as "to spec" in step 2 (even if ultimately zero specs were generated)

If this condition is not met → skip to step 6.

For each kanban that has a `Priority.md` (use paths from Step 0):

### 4a — Clean old batches

For each existing batch in Priority.md:
1. List features in batch present in kanban's **Done** column
2. Remove these lines from the batch
3. If batch now empty → remove entire batch section

After cleanup, apply this consolidation logic:

```
IF (all old batches empty) THEN:
  IF (Ready features remain in kanban) THEN:
    Create single "Backlog Ready [date-ISO]" table
    Add all Ready features in priority order
  ELSE:
    Remove all batch sections
ELSE:
  Keep existing batch structure (remaining partial batches)
END
```

### 4b — Add new batch

Create section for features spec'd this session:

```markdown
## Batch [date] — Priority order
| # | Feature | Reason |
|---|---------|--------|
| 1 | [[FeatureName]] | Blocks X / High user value |
| 2 | [[FeatureName]] | Dependency of #1 / Medium impact |
```

## Step 5 — Generate missing specs

For tickets identified in step 2 as "specs to generate", in agreed order:

1. Verify note exists — if not, create it in `<Root path>/Features/` with feature title
2. Fill the `## Specs générées` section with:
   - Expected behavior (user stories or use cases)
   - Acceptance criteria (AC — testable, concrete)
   - Technical notes (stack, patterns, existing dependencies)
   - Edge cases to handle
3. Rely on project README context (`Architecture`, `Stack`) and CLAUDE.md conventions
4. Never overwrite what user already filled — add to existing section

## Step 6 — Move tickets

For each feature processed in step 5 (generated or already present), update kanban:

- **Generated or already-present specs** → move from **Spec** to **Ready**
- **Already implemented feature** → move from **Spec** to **Done**

Move process:
1. Find line in **Spec** section
2. Cut entire line (keep `[[...]]` formatting and spacing)
3. Paste in **Ready** or **Done** maintaining kanban structure
4. Verify kanban stays coherent (no duplicates, structure intact)

## Absolute rules

- **Mandatory validation** : wait for priority order validation before generating specs or updating Priority.md
- **No overwrite** : never overwrite existing content — add to `## Specs générées` without removing
- **No re-generation** : if specs already exist (section `## Specs générées` present), move to Ready without modifying
- **Dependency truthfulness** : only validate a dependency if explicit in titles, descriptions, or kanban notes
- **Mandatory context** : always read project README before generating (Architecture, Stack)
- **Pair-programming** : no autonomous action — wait for validation at each key step (Step 3, then Step 4)
