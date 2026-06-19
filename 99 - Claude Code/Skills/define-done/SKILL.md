---
name: define-done
description: Generate a done-criteria checklist before starting a milestone, for any type of project. Invoke via /define-done [MilestoneName] whenever {USER_NAME} wants to explicitly frame the end of a milestone before diving in, avoid post-milestone confusion, or ensure scope is complete and verifiable. Also trigger if the user says "let's frame milestone X", "what does done mean for this milestone", "define the end criteria", "done checklist for X" — even without explicit /define-done.
---

## Argument

`$ARGUMENTS` = milestone name. If empty → ask: "Which milestone do you want to frame?"

---

## Step 1 — Identify the project and load context

Search in this order:
1. **Active context**: is a project being discussed in the session? Keep it.
2. **CLAUDE.md or current session**: has a README or kanban been read recently?
3. **Ask**: if the project isn't obvious → "Which project?"

Then load what exists — without assuming fixed structure:
- Planning or kanban file (`Project management.md`, `PLANNING.md`, tickets, or equivalent)
- Context documentation (`README.md`, `claude-code/README.md`, main project note)

---

## Step 2 — Identify milestone elements

Search for elements related to `$ARGUMENTS` in available sources:

1. **Named section**: planning has a `## [MilestoneName]` section → take all its content
2. **Tag/label**: elements with `#[MilestoneName]` or `milestone: [MilestoneName]`
3. **Partial match**: elements whose title contains `$ARGUMENTS` (case-insensitive)
4. **Implicit context**: if it's the only active milestone, WIP/Ready elements probably belong to it

**If nothing found**: display what exists and ask → "I don't see elements linked to '[MilestoneName]'. Can you tell me which ones belong to it, or should I generate from project context alone?"
**Wait before continuing.**

---

## Step 3 — Generate the checklist

Analyze available context and produce a checklist tailored to the project type.

**Structure in 4 sections:**

```markdown
## Done criteria — [MilestoneName]
> Generated on [date] — [Project]

### Deliverables
- [ ] [Element/feature/task] — [expected result in 1 sentence, phrased for the user or stakeholder]
- [ ] ...

### Quality criteria
- [ ] [Specific verifiable criterion for this project type]
- [ ] ...

### Validation
- [ ] [How to confirm it's done — test, review, demo, sign-off]
- [ ] ...

### Closure conditions
- [ ] [Final action to officially close the milestone]
- [ ] ...
```

**Adapt sections by project type:**

| Type | Deliverables | Validation | Closure |
|------|--------------|------------|---------|
| **Dev** | features, bugfixes | tests pass, no console errors | deployed to production |
| **Organizational** | decisions made, actions taken | validated by stakeholders | report sent/archived |
| **Learning/research** | report, code, notes capitalized | goals reached, exercises completed | capitalized in vault |
| **Hardware/infra** | components installed, config validated | services up, functional tests | documented |

**Quality rule**: each item must be objectively verifiable.
- ❌ "code is clean" → ✅ "tests pass without modifications"
- ❌ "well prepared" → ✅ "agenda sent 48 hours before"
- ❌ vague criterion → `[To clarify: ...]`

**Present the checklist before saving.**

---

## Step 4 — Validation

Wait for {USER_NAME} to validate, adjust, or complete the items.

**Don't save before explicit confirmation** ("OK", "save", "it's good").

---

## Step 5 — Save

Save the note in the vault project:
```
{VAULT_PATH}\{PROJECTS_FOLDER}\[Project]\milestones\[milestone-name]-done-criteria.md
```
Create the `milestones/` folder if it doesn't exist.

If the project isn't in the vault → ask where to save.

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
- If milestone is unfound → display what exists and ask, don't improvise
- All criteria must be verifiable — rephrase or mark `[To clarify]`
- Section structure adapts to project type — don't force dev sections on org projects
