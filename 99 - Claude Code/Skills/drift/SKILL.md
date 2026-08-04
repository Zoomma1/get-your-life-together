---
name: drift
description: Detect recurring uncapitalized ideas over the past 15 days — ideas mentioned multiple times without existing note or ticket. Targeted and compact. Never create without explicit validation from {USER_NAME}.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected from aggressive optimization**
>
> This skill produces **narrative qualitative** output. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes precedence over line reduction.

# Skill : /drift

Drift reveals what truly matters vs what sounds good. When an idea keeps coming back without ever being acted upon, it's a signal: either it deserves a place in the system, or it's taking up mental space for nothing. The purpose of the skill is to make this signal visible and force a decision.

**Key difference from `/harvestdeep`** : drift is targeted (15d, repetitions only, compact) ; harvestdeep is exhaustive (30d, broad capitalization, signals, inbox review). If {USER_NAME} is unsure between the two, choose drift for a quick check, harvestdeep for a complete review.

## Triggering

- the user says "drift", "check the drifts", "what keeps coming back"
- **Default period** : last 15 days only (scoped = fast)
- Optional : custom period ("drift this week", "drift this month") → otherwise, 15d

---

## Step 1 — Read minimal context

Read in parallel the 3 independent sources (do not scan the entire vault) :

1. **Daily notes** (last 15 days) in `00 - Daily notes/` → subjects mentioned 2+ times, intentions without follow-up
   - Search for files in `YYYY-MM-DD.md` format only
   - No daily note for a day? Skip (don't force), but **count that day as potential context for other sources** (session, index)
2. **Sessions** (last 15 days) in `99 - Claude Code/Sessions/` → uncapitalized ideas, deferred subjects
3. **Projects/INDEX.md** → active projects, associated kanbans

Aggregate before Step 2. Targeted only.

---

## Step 2 — Detect uncapitalized repetitions

Search for subjects **mentioned 2+ times across different days or contexts** that **have neither note nor ticket** :

**Definition of an occurrence** : a mention of the subject on a distinct day/session. Multiple mentions on the same day = 1 occurrence. Example: "Refactor paint-session service" mentioned 3 times on 2026-03-20 = 1 occurrence. Also mentioned on 2026-03-25 = 2nd occurrence → threshold reached.

**Detection threshold** : minimum 2 occurrences across different days/sessions. Higher frequency (3+) = higher priority.

**Filter before Step 3** :
1. **Kanban check** : does the subject exist in Idea/Specs/Ready/WIP ? → do not report (already capitalized)
2. **Orphan check** : is there an orphan note via glob `04 - Projects/*/Todos/` or `09 - Inbox/` ? → do not create duplicate, link to kanban (Step 5)

**Do not report** :
- Ideas in WIP or Done
- Mentions in only a single day/session
- Personal alert signals (harvestdeep)

---

## Step 3 — Classify: resistance or obstacle?

For each detected drift, identify why it has not been acted upon:

**True resistance** : the subject comes back, {USER_NAME} actively avoids it, but nothing concretely prevents moving forward.
- The subject is mentioned but no follow-up is given
- No external dependency identified
- Next steps could be defined immediately

**Structural obstacle** : blocked by a real constraint, not by avoidance.
- Unresolved external dependency (response awaited, missing info, wrong timing)
- Next step unclear or outside {USER_NAME}'s control
- Timing constrained by an external factor

This distinction changes the proposed conclusion :
- **Resistance** → force a decision (drop / schedule 48h / reframe)
- **Obstacle** → identify the concrete unblocking and note it

---

## Step 4 — Compact presentation

### If no drift
```
No drift over the last 15 days — everything is capitalized or too recent.
```

### If drifts detected
Present quick list first, then details :

**Detected drifts (to validate) :**
- [Subject 1]
- [Subject 2]

Then for each drift :

```
🌊 DRIFT : [Subject]
→ Appeared [X times] : [date/context], [date/context]
→ Capitalized : NO
→ Type : Resistance / Obstacle
→ Proposed action : [drop / schedule 48h / reframe / unblock : what]
```

**Example with 2 drifts** :
```
🌊 DRIFT : Refactor paint-session service
→ Appeared 3 times : 2026-03-12 daily, 2026-03-18 session, 2026-03-25 daily
→ Capitalized : NO
→ Type : Resistance
→ Proposed action : Schedule 48h or drop

🌊 DRIFT : Contact prof Brno
→ Appeared 2 times : 2026-03-20 daily, 2026-03-24 session
→ Capitalized : NO
→ Type : Obstacle — awaiting email
→ Proposed action : Check response, otherwise follow up
```

**PAUSE before Step 5 — Wait for {USER_NAME} validation.** For each drift, {USER_NAME} responds: `validated`, `invalidated [reason]`, or `already in [kanban column]`.

### Drifts invalidated by {USER_NAME}
List here with comment (if provided) :
```
- [Subject] — [reason from {USER_NAME} if provided]
```

---

## Step 5 — Create validated tickets

For each **validated** drift :

| Condition | Destination | Action |
|-----------|-------------|--------|
| Orphan note exists in `Todos/` | Relevant kanban | Link `[[Note]]` in Idea, notify {USER_NAME} |
| Linked to active project, no orphan note | Project kanban — Idea column | Create drift ticket |
| Linked to project, kanban does not exist | Claude Code Kanban | Create drift ticket + notify {USER_NAME} for project kanban creation |
| Tech/Claude Code, no project | Claude Code Kanban — Idea column | Create drift ticket |
| Personal/hobby, no project | Claude Code Kanban — Idea column | Create drift ticket |
| Intellectual tension / opinion to write (not a task) | Claude Code Kanban — **Essays** column | Create essay ticket (`type=📝 Essay`) |
| Merits knowledge note | Appropriate destination | Create note + link ticket |

**Invalidated** drifts : already listed in "Invalidated drifts" (see Step 4), do not relaunch.

**Drift ticket** — use the `create-ticket` skill with :
- `type` = `💡 Idea`
- `column` = `Idea`
- `project` = relevant project (or null for Claude Code Kanban)
- `context` = summary in 1 sentence of the recurrence

> **If the drift is an essay idea** (tension/opinion to write, not a task) : pass `type` = `📝 Essay` — create-ticket automatically routes it to **Essays** column (never refine, `/essay` does the refinement).

Add the following sections to the note body:

## Recurring idea
[Description as it appeared]

## Occurrences
- [date] : "[excerpt]"
- [date] : "[excerpt]"
```

**CREATE VIA MCP AFTER VALIDATION, NOT BEFORE.**

---

## Final step — Update the tracker

After drift completion (including {USER_NAME} validation), update `99 - Claude Code/command-tracker.md` :
- `/drift` line → replace date with today's date in `YYYY-MM-DD` format

If command-tracker is inaccessible or malformed :
- Log the timestamp in the final report
- Notify {USER_NAME} : "command-tracker not accessible, drift validated manually on YYYY-MM-DD"
- Continue without blocking ticket creation

---

## Absolute rules

- **Zero autonomous action** : PAUSE before any creation, {USER_NAME} validation mandatory
- Targeted 15d only — no full harvest
- Check existing: kanban + orphan Todos/
- Orphan found → link to kanban, don't create duplicate
- Create via MCP after validation — don't ask {USER_NAME}
- One idea = one unique ticket
- Invalidated drifts not relaunch

## Edge cases

| Scenario | Management |
|----------|---------|
| No drift detected | Message "everything capitalized", finish |
| Kanban does not exist for project | Create ticket in Claude Code Kanban + notify {USER_NAME} (see Step 5) |
| Orphan note not found | Search recursively `04 - Projects/` + `09 - Inbox/`, notify {USER_NAME} if absent |
| {USER_NAME} invalidates a drift | List in "Invalidated drifts" (Step 4), zero creation |
| Command-tracker inaccessible | Log in report + notify {USER_NAME}, continue without blocking (see Final step) |
| Drift mentioned 1 time daily + 1 time session | Counts as 2 occurrences (distinct sources) → report |
| Drift in session, zero daily note that day | Don't penalize, count session occurrence alone |
