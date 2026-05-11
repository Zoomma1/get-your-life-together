---
name: drift
description: Detect recurring ideas not yet captured over the last 15 days — ideas mentioned multiple times without existing note or ticket. Targeted and compact. Never create without explicit validation from {USER_NAME}.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured on the **richness of output produced**, not on structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /drift

Drift reveals what really matters vs what sounds good. When an idea comes up regularly without ever being acted on, it's a signal: either it deserves a place in the system, or it's taking up mental space for nothing. The skill's purpose is to make this signal visible and force a decision.

**Key difference from `/harvestdeep`**: drift is targeted (15d, repetitions only, compact); harvestdeep is exhaustive (30d, broad capitalization, signals, inbox review). If {USER_NAME} hesitates between the two, choose drift for quick check, harvestdeep for full review.

## Trigger

- the user says "drift", "check the drifts", "what keeps coming up"
- **Default period**: last 15 days only (scoped = fast)
- Optional: custom period ("drift of the week", "drift of the month") → otherwise, 15d

---

## Step 1 — Read minimal context

Read in parallel 3 independent sources (don't scan entire vault):

1. **Daily notes** (last 15 days) in `00 - Daily notes/` → subjects mentioned 2+ times, intentions without follow-up
   - Search for files in `YYYY-MM-DD.md` format only
   - No daily note for a day? Skip (don't force), but **count that day as potential context for other sources** (session, index)
2. **Sessions** (last 15 days) in `99 - Claude Code/Sessions/` → uncapitalized ideas, deferred subjects
3. **Projects/INDEX.md** → active projects, associated kanbans

Aggregate before Step 2. Targeted only.

---

## Step 2 — Detect uncapitalized repetitions

Search for subjects **mentioned 2+ times across different days or contexts** that **have neither note nor ticket**:

**Definition of occurrence**: one mention of subject in distinct day/session. Multiple mentions same day = 1 occurrence. Example: "Refactor paint service" mentioned 3 times on 2026-03-20 = 1 occurrence. Also mentioned 2026-03-25 = 2nd occurrence → threshold reached.

**Detection threshold**: 2 occurrences minimum across different days/sessions. Higher frequency (3+) = higher priority.

**Filter before Step 3**:
1. **Kanban check**: does subject exist in Idea/Specs/Ready/WIP? → don't flag (already captured)
2. **Orphan check**: does orphaned note exist via glob `04 - Projects/*/Todos/` or `09 - Inbox/`? → don't create duplicate, link to kanban (Step 5)

**Do not flag**:
- Ideas in WIP or Done
- Mentions in single day/session only
- Personal alert signals (harvestdeep)

---

## Step 3 — Classify: true resistance or obstacle?

For each detected drift, identify why it hasn't been acted on:

**True resistance**: subject comes up, {USER_NAME} actively avoids it, but nothing concretely prevents moving forward.
- Subject is mentioned but no follow-up is given
- No identified external dependency
- Next steps would be definable immediately

**Structural obstacle**: blocked by real constraint, not avoidance.
- External dependency unresolved (waiting for response, missing info, wrong timing)
- Next step unclear or outside {USER_NAME}'s control
- Timing constrained by external factor

This distinction changes proposed conclusion:
- **Resistance** → force a decision (drop / schedule 48h / reframe)
- **Obstacle** → identify concrete unblocking and note it

---

## Step 4 — Compact presentation

### If no drift
```
No drift in the last 15 days — everything is captured or too recent.
```

### If drifts detected
Present quick list first, then details:

**Detected drifts (to validate):**
- [Subject 1]
- [Subject 2]

Then for each drift:

```
🌊 DRIFT: [Subject]
→ Appeared [X times]: [date/context], [date/context]
→ Captured: NO
→ Type: Resistance / Obstacle
→ Proposed action: [drop / schedule 48h / reframe / unblock: what]
```

**Example 2 drifts**:
```
🌊 DRIFT: Refactor paint-session service
→ Appeared 3 times: 2026-03-12 daily, 2026-03-18 session, 2026-03-25 daily
→ Captured: NO
→ Type: Resistance
→ Proposed action: Schedule 48h or drop

🌊 DRIFT: Contact prof Brno
→ Appeared 2 times: 2026-03-20 daily, 2026-03-24 session
→ Captured: NO
→ Type: Obstacle — waiting for email
→ Proposed action: Check response, otherwise follow up
```

**PAUSE before Step 5 — Wait for {USER_NAME} validation.** For each drift, {USER_NAME} responds: `validated`, `invalidated [reason]`, or `already in [kanban column]`.

### Drifts invalidated by {USER_NAME}
List here with comment (if provided):
```
- [Subject] — [reason {USER_NAME} if provided]
```

---

## Step 5 — Create validated tickets

For each **validated** drift:

| Condition | Destination | Action |
|-----------|-------------|--------|
| Orphaned note exists in `Todos/` | Concerned kanban | Link `[[Note]]` in Idea, signal to {USER_NAME} |
| Related to active project, no orphaned note | Project kanban — Idea column | Create drift ticket |
| Related to project, kanban missing | Claude Code Kanban | Create drift ticket + signal {USER_NAME} for kanban creation |
| Tech/Claude Code, no project | Claude Code Kanban — Idea column | Create drift ticket |
| Personal/hobby, no project | Claude Code Kanban — Idea column | Create drift ticket |
| Deserves knowledge note | Appropriate destination | Create note + link ticket |

**Invalidated** drifts: already listed in "Invalidated drifts" (see Step 4), don't re-launch.

**Drift ticket** — use `/create-ticket` skill with:
- `type` = `💡 Idea`
- `column` = `Idea`
- `project` = project concerned (or null for Claude Code Kanban)
- `context` = 1-sentence summary of recurrence

Add following sections to note body:

## Recurring idea
[Description as it appeared]

## Occurrences
- [date]: "[excerpt]"
- [date]: "[excerpt]"
```

**CREATE VIA MCP AFTER VALIDATION, NOT BEFORE.**

---

## Final step — Update tracker

After drift completion (validation by {USER_NAME} included), update `99 - Claude Code/command-tracker.md`:
- Line `/drift` → replace date with today's date in format `YYYY-MM-DD`

If command-tracker inaccessible or malformed:
- Log timestamp in final report
- Signal to {USER_NAME}: "command-tracker inaccessible, drift validated manually on YYYY-MM-DD"
- Continue without blocking ticket creation

---

## Absolute rules

- **Zero autonomous action**: PAUSE before any creation, {USER_NAME} validation mandatory
- Targeted 15d only — no full harvest
- Check existing: kanban + Todos/ orphans
- Orphan found → link to kanban, don't create duplicate
- Create via MCP after validation — don't ask {USER_NAME}
- One idea = one unique ticket
- Invalidated drifts not re-launched

## Edge cases

| Scenario | Handling |
|----------|---------|
| No drift detected | Message "everything captured", terminate |
| Missing kanban for project | Create ticket in Claude Code Kanban + signal {USER_NAME} (see Step 5) |
| Orphaned note not found | Search recursively `04 - Projects/` + `09 - Inbox/`, signal {USER_NAME} if absent |
| {USER_NAME} invalidates drift | List in "Invalidated drifts" (Step 4), zero creation |
| Command-tracker inaccessible | Log in report + signal {USER_NAME}, continue without blocking (see Final step) |
| Drift mentioned 1x daily + 1x session | Count as 2 occurrences (distinct sources) → flag |
| Drift in session, zero daily note that day | Don't penalize, count session occurrence alone |
