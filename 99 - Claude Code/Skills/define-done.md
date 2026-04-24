---
name: define-done
description: Generate a done-criteria checklist before starting a milestone, for any project type. Invoke via /define-done [MilestoneName] when Victor explicitly wants to frame a milestone's end before diving in, avoid post-milestone fuzziness, or ensure scope is complete and verifiable. Also trigger if Victor says "let's frame milestone X", "what does done mean for this milestone", "define end criteria", "done checklist for X" — even without explicit /define-done.
---

## Argument

`$ARGUMENTS` = milestone name. If empty → ask: "Which milestone do you want to frame?"

---

## Step 1 — Identify project and load context

Search in order:
1. **Active context**: is a project being discussed in the session? Retain it.
2. **CLAUDE.md or current session**: has README or kanban been read recently?
3. **Ask**: if project isn't obvious → "For which project?"

Then load what exists — without assuming fixed structure:
- Planning or kanban file (`Project management.md`, `PLANNING.md`, tickets, or equivalent)
- Context documentation (`README.md`, `claude-code/README.md`, project main note)

---

## Step 2 — Identify milestone elements

Search for elements related to `$ARGUMENTS` in available sources:

1. **Named section**: does planning have `## [MilestoneName]` section → take all its content
2. **Tag/label**: elements with `#[MilestoneName]` or `milestone: [MilestoneName]`
3. **Partial match**: elements whose title contains `$ARGUMENTS` (case insensitive)
4. **Implicit context**: if it's the only active milestone, WIP/Ready elements probably belong to it

**If nothing found**: display what exists and ask → "I don't see elements associated with '[MilestoneName]'. Can you tell me which ones are part of it, or should I generate from project context alone?"
**Wait before continuing.**

---

## Step 3 — Generate checklist

Analyze available context and produce checklist adapted to project type.

**Structure in 4 sections:**

```markdown
## Done criteria — [MilestoneName]
> Generated on [date] — [Project]

### Deliverables
- [ ] [Element/feature/task] — [expected result in 1 sentence, user/beneficiary side]
- [ ] ...

### Quality criteria
- [ ] [Verifiable criterion specific to project]
- [ ] ...

### Validation
- [ ] [How to confirm done — test, review, demo, acceptance]
- [ ] ...

### Closure conditions
- [ ] [Final action to officially close milestone]
- [ ] ...
```

**Adapt sections by project type:**

| Type | Deliverables | Validation | Closure |
|------|-----------|------------|---------|
| **Dev** | features, bugfixes | tests pass, no console errors | deployed to prod |
| **Organizational** | decisions made, actions taken | validated by stakeholders | report sent/archived |
| **Learning/research** | report, code, capitalized notes | objectives reached, exercises done | capitalized in vault |
| **Hardware/infra** | components installed, config validated | services up, functional tests | documented |

**Quality rule**: each item must be objectively verifiable.
- ❌ "code is clean" → ✅ "tests pass without modification"
- ❌ "well prepared" → ✅ "agenda sent 48h before"
- ❌ fuzzy criterion → `[To clarify: ...]`

**Present checklist before saving.**

---

## Step 4 — Validation

Wait for Victor to validate, adjust, or complete items.

**Don't save before explicit confirmation** ("OK", "save", "looks good").

---

## Step 5 — Save

Save note in project vault:
```
{VAULT_PATH}\{PROJECTS_FOLDER}\[Project]\milestones\[milestone-name]-done-criteria.md
```
Create `milestones/` folder if it doesn't exist.

If project not in vault → ask where to save.

Minimal frontmatter:
```yaml
---
title: Done criteria — [MilestoneName]
date: [YYYY-MM-DD]
milestone: [MilestoneName]
status: active
---
```

Confirm: "Saved → `[path]/[name]-done-criteria.md`"

---

## Absolute rules

- Never save without explicit validation
- If milestone not found → display what exists and ask, don't improvise
- All criteria must be verifiable — reword or mark `[To clarify]`
- Section structure adapts to project — don't force dev sections on org project
