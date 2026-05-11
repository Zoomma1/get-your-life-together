---
name: replan-today
description: Adaptive replanning during the day — trigger when the /today plan no longer holds. Covers 3 cases: less time than expected (energy drained, unexpected event), more time than expected (task finished early, cancelled outing), or plan completed. Asks 1 question, captures the reason in predefined categories, proposes a revised pool from active kanbans, and traces everything in the daily note under a timestamped section. Trigger when the user says "/replan-today", "replan", "my plan changed", "I have more time", "I have less time than expected", "plan completed", "what do I do now", "I'm back from X and still have time", "I finished early", or any signal of global divergence between the morning plan and current reality. Do NOT trigger for a simple task completed — that's /today Step 6.
---

**Replanning the plan during the day** — for when the /today plan has diverged from reality as a whole.

**Boundary with /today Step 6**: Step 6 = a task completed, what's next (navigation in the existing plan). `/replan-today` = the *global plan* no longer holds (the day's context has changed). The difference is scope — task vs entire day.

---

## Step 1 — Read the current plan state

Get the current time: `date +"%H:%M"`. Store as `HEURE_REPLAN`.

Read `{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md` (today's date).

Extract from `## 📅 Plan du jour`:
- All unchecked `- [ ]` lines in Personal / Work / Hobby (ignore Agenda and Refinement)
- If a `### 🔄 Replannification` section already exists → read it too to know the cumulative state
- Store remaining tasks as `TACHES_RESTANTES`

---

## Step 2 — Identify the case

If the case is obvious from the {USER_NAME} message (ex: "I'm back from the dealership and have 2h" → case B, "I'm exhausted after the assembly" → case A), detect it directly, announce in one line and ask for confirmation.

Otherwise, ask this single question:

> **Which case are you in?**
> **A)** Less time than expected — something changed, the original plan is too ambitious
> **B)** More time than expected — you finished early or an unexpected event was cancelled
> **C)** Plan completed — everything is checked, you're looking for what to do next (or closing the day)

---

## Step 3 — Capture the reason

**Cases A and B only.** One additional question:

> **Why?** → `physical` / `mental energy` / `external unexpected` / `finished early` / `other`

This category serves the harvest of behavioral patterns — not a diagnosis. One-word answer is enough.

**Case C**: no "why" question. Move directly to Step 4.

---

## Step 4 — Propose a revised pool

### Case A — Less time

Stay within `TACHES_RESTANTES`. Do not look in the kanbans — the existing plan is already the source.

Filter based on what {USER_NAME} expressed:
- Physical or mental fatigue → only tasks ≤ 30min
- External unexpected (appointment, outing) → estimate remaining time, propose what fits

Propose **1 to 3 tasks** in order of importance. Suggest subtasks if the entire ticket is too long.

### Case B — More time

Read `{VAULT_PATH}/{PROJECTS_FOLDER}/INDEX.md` for active projects.

For each active project, read its Kanban and extract **all** tickets in the `Ready` column — no cap on the number. Also include the CC Kanban (`99 - Claude code/Claude Code Kanban.md`) and the Hobby Kanban (`{HOBBIES_FOLDER}/Hobby Kanban.md`).

Do not redo the full `/today` analysis (no frontmatter recalculation, no hourly budgets, no dry-run). The filter is simple: estimated energy at the moment of replan (what {USER_NAME} communicates) + time of day:
- Afternoon (12pm-5pm): favor tasks ≤ 1h30
- Evening (after 5pm): favor tasks ≤ 45min

Propose **2 to 4 additional tasks**. Always include at least one task from the most active project (WIP non-empty or most mentioned in recent daily notes).

### Case C — Plan completed

Check the time (`HEURE_REPLAN`):
- Before 5pm → propose 1-2 short tasks (same logic as case B, reduced pool to essentials)
- After 5pm → propose directly: *"Plan finished in late afternoon — do you want to run `/closeday`?"*

---

## Step 5 — Trace in the daily note

Once {USER_NAME} has validated the revised pool, add to `## 📅 Plan du jour` in today's daily note, **after the existing plan** (never overwrite):

```markdown
### 🔄 Replannification at HH:MM
**Reason**: [category] — [context in 1 line if {USER_NAME} provided one]
- [ ] [Task 1] — [[obsidian-link]] — (~Xmin)
- [ ] [Task 2] — [[obsidian-link]] — (~Xmin)
```

**Tracing rules**:
- Timestamp with `HEURE_REPLAN`
- If multiple replans during the day → each section is timestamped separately, the latest prevails for the evening summary
- Never modify the original plan lines — the `🔄 Replannification` section is always additive
- Obsidian links `[[]]` to source notes, as in `/today`

---

## Absolute rules

- **One question at a time** — ask the case (Step 2) then the reason (Step 3) in two separate messages, never together
- **No frontmatter recalculation** — do not reread the energy from the frontmatter or the hourly budgets from the morning. Energy at the moment of replan is what the user says or shows in their message
- **Case B: all Ready** — do not limit to N tickets per kanban. The lightness comes from processing (no dry-run, no budgets), not from reading scope
- **Do not modify the original plan** — only add, never overwrite
- **Case C before 5pm**: propose short tasks, do not close the day by default
