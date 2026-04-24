---
name: drift
description: Detect recurring non-capitalised ideas over the last 15 days — ideas mentioned multiple times with no existing note or ticket. Targeted and compact. Never create without explicit validation from {USER_NAME}.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimisation**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips the narrative instructions (grouping, context, highlights, open questions, tone, narration). Preserving qualitative content takes priority over reducing line count.

# Skill: /drift

Drift reveals what truly matters vs what just sounds good. When an idea keeps coming back without ever being actioned, it is a signal: either it deserves a place in the system, or it is occupying mental space for nothing. The skill's purpose is to make this signal visible and force a decision.

**Key difference from `/harvestdeep`**: drift is targeted (15 days, repetitions only, compact); harvestdeep is exhaustive (30 days, broad capitalisation, signals, inbox review). If {USER_NAME} hesitates between the two, choose drift for a quick check, harvestdeep for a full review.

## Trigger

- {USER_NAME} says "drift", "check drifts", "what keeps coming up"
- **Default period**: last 15 days only (scoped = fast)
- Optional: custom period ("drift from this week", "drift this month") → otherwise 15 days

---

## Step 1 — Read minimal context

Read in parallel from the 3 independent sources (do not scan the entire vault):

1. **Daily notes** (last 15 days) in `00 - Daily notes/` → subjects mentioned 2+ times, unresolved intentions
   - Look for files in `YYYY-MM-DD.md` format only
   - No daily note for a day? Skip (do not force), but **count that day as potential context for other sources** (session, index)
2. **Sessions** (last 15 days) in `99 - Claude Code/Sessions/` → non-capitalised ideas, deferred subjects
3. **Projects/INDEX.md** → active projects, associated kanbans

Aggregate before Step 2. Targeted only.

---

## Step 2 — Detect non-capitalised repetitions

Look for subjects **mentioned 2+ times on different days or contexts** that have **no note or ticket**:

**Definition of an occurrence**: a mention of the subject in a distinct day/session. Multiple mentions on the same day = 1 occurrence. Example: "Refactor paint service" mentioned 3 times on 2026-03-20 = 1 occurrence. Also mentioned on 2026-03-25 = 2nd occurrence → threshold reached.

**Detection threshold**: 2 occurrences minimum on different days/sessions. Higher frequency (3+) = higher priority.

**Filter before Step 3**:
1. **Kanban check**: does the subject exist in Idea/Specs/Ready/WIP? → do not flag (already capitalised)
2. **Orphan check**: does an orphan note exist via glob `04 - Projects/*/Todos/` or `09 - Inbox/`? → do not create duplicate, link to kanban (Step 5)

**Do not flag**:
- Ideas in WIP or Done
- Mentions in a single day/session only
- Personal alert signals (harvestdeep)

---

## Step 3 — Classify: resistance or obstacle?

For each detected drift, identify why it has not been actioned:

**True resistance**: the subject keeps coming back, {USER_NAME} actively avoids it, but nothing concretely prevents moving forward.
- The subject is mentioned but no follow-up is given
- No external dependency identified
- Next steps would be immediately definable

**Structural obstacle**: blocked by a real constraint, not avoidance.
- Unresolved external dependency (awaiting response, missing information, not the right time)
- Next step unclear or outside {USER_NAME}'s control
- Timing constrained by an external factor

This distinction changes the proposed conclusion:
- **Resistance** → force a decision (drop / schedule 48h / reframe)
- **Obstacle** → identify the concrete unblocking action and note it

---

## Step 4 — Compact presentation

### If no drift
```
No drift over the last 15 days — everything is capitalised or too recent.
```

### If drifts detected
Present quick list first, then details:

**Drifts detected (to validate):**
- [Subject 1]
- [Subject 2]

Then for each drift:

```
🌊 DRIFT: [Subject]
→ Appeared [X times]: [date/context], [date/context]
→ Capitalised: NO
→ Type: Resistance / Obstacle
→ Proposed action: [drop / schedule 48h / reframe / unblocking: what]
```

**Example 2 drifts**:
```
🌊 DRIFT: Refactor paint-session service
→ Appeared 3 times: 2026-03-12 daily, 2026-03-18 session, 2026-03-25 daily
→ Capitalised: NO
→ Type: Resistance
→ Proposed action: Schedule 48h or drop

🌊 DRIFT: Contact Brno professor
→ Appeared 2 times: 2026-03-20 daily, 2026-03-24 session
→ Capitalised: NO
→ Type: Obstacle — awaiting email
→ Proposed action: Check for reply, otherwise follow up
```

**PAUSE before Step 5 — Wait for {USER_NAME} validation.** For each drift, {USER_NAME} responds: `validated`, `invalidated [reason]`, or `already in [kanban column]`.

### Drifts invalidated by {USER_NAME}
List here with comment (if provided):
```
- [Subject] — [{USER_NAME}'s reason if provided]
```

---

## Step 5 — Create validated tickets

For each **validated** drift:

| Condition | Destination | Action |
|-----------|-------------|--------|
| Orphan note exists in `Todos/` | Concerned kanban | Link `[[Note]]` in Idea, notify {USER_NAME} |
| Linked to active project, no orphan note | Project kanban — Idea column | Create drift ticket |
| Linked to project, kanban does not exist | Claude Code Kanban | Create drift ticket + notify {USER_NAME} to create project kanban |
| Tech/Claude Code, no project | Claude Code Kanban — Idea column | Create drift ticket |
| Personal/hobby, no project | Claude Code Kanban — Idea column | Create drift ticket |
| Deserves knowledge note | Appropriate destination | Create note + link ticket |

**Invalidated** drifts: already listed in "Invalidated drifts" (see Step 4), do not re-process.

**Drift ticket** — use the `create-ticket` skill with:
- `type` = `💡 Idea`
- `column` = `Idea`
- `project` = concerned project (or null for Claude Code Kanban)
- `context` = 1-sentence summary of the recurrence

Add the following sections to the note body:

## Recurring idea
[Description as it appeared]

## Occurrences
- [date]: "[excerpt]"
- [date]: "[excerpt]"
```

**CREATE VIA MCP AFTER VALIDATION, NOT BEFORE.**

---

## Final step — Update the tracker

After completing the drift (including {USER_NAME} validation), update `99 - Claude Code/command-tracker.md`:
- `/drift` line → replace date with today's date in `YYYY-MM-DD` format

If command-tracker inaccessible or malformed:
- Log the timestamp in the final report
- Notify {USER_NAME}: "command-tracker not accessible, drift manually validated on YYYY-MM-DD"
- Continue without blocking ticket creation

---

## Absolute rules

- **Zero autonomous action**: PAUSE before any creation, {USER_NAME} validation mandatory
- Targeted 15 days only — no full harvest
- Check existing: kanban + Todos/ orphans
- Orphan found → link to kanban, do not create duplicate
- Create via MCP after validation — do not ask {USER_NAME} again
- One idea = one unique ticket
- Invalidated drifts not re-processed

## Edge cases

| Scenario | Handling |
|----------|---------|
| No drift detected | Message "everything capitalised", end |
| Kanban does not exist for project | Create ticket in Claude Code Kanban + notify {USER_NAME} (see Step 5) |
| Orphan note not found | Search recursively in `04 - Projects/` + `09 - Inbox/`, notify {USER_NAME} if absent |
| {USER_NAME} invalidates a drift | List in "Invalidated drifts" (Step 4), zero creation |
| Command-tracker inaccessible | Log in report + notify {USER_NAME}, continue without blocking (see Final step) |
| Drift mentioned 1 time in daily + 1 time in session | Counts as 2 occurrences (distinct sources) → flag |
| Drift in session, zero daily note that day | Do not penalise, count the session occurrence alone |
