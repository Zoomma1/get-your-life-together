---
name: ideas
description: Launch every 2-4 weeks when the user wants to know what to do next — transforms vault patterns into concrete actionable ideas. Unlike vault-harvest-deep (which detects and capitalizes) and emerge (which looks for inter-note clusters), /ideas transforms those patterns into actionable ideas classified by category with estimated effort and mandatory sourcing. Use when the user says "ideas", "what should I do", "generate ideas", "show me opportunities".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **narrative qualitative** output. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (regrouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /ideas

Extracts actionable ideas from real vault patterns — not generic brainstorming. Each idea must be sourced ("based on your note from [date]..."), otherwise it has no place here.

**When to invoke `/ideas` instead of another skill:**

Use `/ideas` when you want **prioritized actions** based on a 30-day vault synthesis. Other skills complement it:
- **/drift** → isolated signal reappeared in last 15d (not yet actioned)
- **/harvestdeep** → comprehensive 30-day overview (consolidation without prioritization)
- **/emerge** → inter-note clusters (new connections, not actions)
- **/ideas** → 4-dimension synthesis → top 3 actions + 1 key opportunity

---

## Step 1 — Read the vault (scope 30 days or less if little data)

Mentally synthesize 6 signal sources over the last 30 days. Each source gives a distinct analysis angle. (Do this synthesis by direct vault reading — don't call external tools.)

**Source 1 — Daily notes (`00 - Daily notes/YYYY-MM-DD.md`, 30d)**
Topics mentioned 2+ times, intentions without explicit follow-up, cited frustrations, decisions made.

**Source 2 — Sessions (`99 - Claude Code/Sessions/`, 30d)**
Projects worked on, progression vs. stagnation noted, decisions, topics deferred/intentionally avoided.

**Source 3 — Active projects and kanbans (`04 - Projects/INDEX.md` + kanbans, Idea/Specs/Ready/WIP columns)**
State of each project, tickets blocked for several days/weeks, unresolved dependencies.

**Source 4 — Active knowledge (`03 - Knowledge/**/*.md`, modified in last 30d)**
Domains {USER_NAME} has written on recently, capitalized concepts, visible gaps (active topics without dedicated note).

**Source 5 — Inbox (`09 - Inbox/`)**
Uncapitalized ideas, tickets without follow-up, recurring topics not actioned.

**Source 6 — Active project READMEs (`04 - Projects/[Project]/claude-code/README.md` for each active project)**
Declared objectives, official "next steps", mentioned technical debt.

### Consolidation before Step 2

Briefly recap what emerges from the 6 sources. If more than 4 sources return "no data" (vault under-fed, no recent sessions, no kanbans, etc.), signal to {USER_NAME} that the signal is too weak: propose waiting an additional week or continuing with partial patterns.

---

## Step 2 — Synthesis in 4 dimensions (STOP and validate {USER_NAME})

Synthesize the 6 consolidated sources on these 4 axes. **Present this synthesis to {USER_NAME} as a 2D table and wait for explicit confirmation before continuing to Step 3.**

Presentation format (table):

| Dimension | Signal / Example |
|-----------|------------------|
| **What works** | Topics/projects/practices with energy and concrete progress (sources 2, 3, 4) |
| **What frustrates** | Recurring friction, intentions without follow-up, avoided dependencies (sources 1, 2, 5) |
| **What's missing** | Identified gaps (tools, knowledge, process, docs), open questions (sources 4, 5, 6) |
| **Bottlenecks** | What blocks multiple domains: unresolved dependencies, lack of resource/time (sources 2, 3, 6) |

**Concrete example:** If Source 1 mentions an idea 3 times in 2 weeks (frustration), and Source 3 shows a ticket in Blocked for 15d (bottleneck), then: "Blocked: [Title] for 15d in Blocked, mentioned 3 times as frustration" → row in table "Bottlenecks".

---

## Step 3 — Generate ideas (9 categories, 3-4 max per category)

For each category, generate only ideas **anchored in the vault** — if an idea can't be sourced (note + date, or explicit vault pattern), reject it. **Each idea is immediately qualified by type (Step 4 merged here).**

Standardized format for an idea:

```
[Idea title]
→ Type: obvious-but-important / genuinely non-obvious
→ Source: [note/daily from YYYY-MM-DD or « pattern from X, Y, Z »]
→ Effort: quick (< 1h) / medium (1d) / heavy (multiple sessions)
→ Why now: [explicit link to a signal from Step 2]
```

**Type definitions:**
- **Obvious-but-important** — logical and expected idea, but not yet actioned. Reduces debt of inaction.
- **Genuinely non-obvious** — connection between distant domains, hidden pattern, conclusion that wouldn't have emerged without cross-analysis. **Highlight because more valuable.**

### 1. Tools to build
Tools, scripts, automations that would solve an identified friction.

### 2. Conversations to have
People to contact, topics to discuss — triggered by a problem or opportunity.

### 3. Essays to write
Intellectual tensions, forged opinions, viewpoints worth writing down.

### 4. Projects to start
New initiatives distinct from current projects.

### 5. Skills to develop
Skills identified as missing or needing strengthening to accelerate/unblock patterns.

### 6. People to connect
Potential collaborations, mentors, communities for an active domain.

### 7. Systems to improve
Processes, workflows, routines that could be optimized or automated.

### 8. Questions to answer
Open questions present in the vault without current answer.

### 9. Experiments to run
Quick tests to validate a hypothesis or learn something.

**Volume rule**: 2-3 ideas max per category. Better to have 6-8 strong sourced ideas than 25 vague ones.

---


## Step 4 — Final prioritization

**Top 3 high-impact actions**
Based on: effort/impact, alignment with active projects, and bottlenecks identified in Step 2.

**1 key opportunity**
The most important idea emerged in this session — the one that, if actioned, unblocks or significantly changes a friction or domain.

```
KEY OPPORTUNITY: [title]
→ Type: obvious-but-important / genuinely non-obvious
→ Why this one: [reasoning in 2-3 sentences based on Step 2]
→ First concrete step: [minimal action to start]
```

---

## Step 5 — Persistence and ticket decision

### Save the report (mandatory)

Create `03 - Knowledge/Ideas/YYYY-MM-DD.md` with the following structure:

```markdown
---
date: YYYY-MM-DD
type: ideas-session
vault-state: complete (6/6 sources) | partial (2-5/6 sources) | weak (< 2/6)
---

# Session /ideas — YYYY-MM-DD

## 4-dimension synthesis
[Table Step 2: What works | What frustrates | What's missing | Bottlenecks]

## Ideas by category
[All ideas from 9 categories — Step 3 — with type + source + effort + why now]

## Prioritization
[Top 3 + Key opportunity — Step 4]

## Tickets generated
[If {USER_NAME} ticketized: list + target kanbans]
```

### Present ticketing list

Display to {USER_NAME} a numbered list with: title + category + target kanban + effort. **{USER_NAME} explicitly chooses** which to create (numbers, "all", or "nothing").

**Default routing (kanbans):**
- Tools/Systems → `99 - Claude Code/Claude Code Kanban.md`
- Projects → corresponding project kanban
- Skills/Questions/Experiments → Claude Code Kanban
- Essays → Claude Code Kanban (Idea column)
- Conversations/People → Claude Code Kanban

**Once confirmed:** for each ticket to create, apply the `create-ticket` skill with `column=Idea`, `type` qualified, `project` if applicable, and `context` = source (note + YYYY-MM-DD) + estimated effort.

### Update command-tracker

After persistence, add a line to `99 - Claude Code/command-tracker.md`:

```
/ideas | YYYY-MM-DD | ~20-30 days | X tickets created
```

---

## Absolute rules

- **Mandatory sourcing**: each idea cites its source (note + date) or explicit vault pattern (e.g., "blocked for 15d in Blocked"). If sourcing impossible → reject the idea.
- **Synthesis first**: present 4-dimension table (Step 2) — wait for {USER_NAME} validation before Step 3.
- **No autonomous creation**: tickets created only on {USER_NAME}'s explicit choice (numbers, "all", or "nothing").
- **No generic brainstorming**: only vault ideas, zero free suggestions.
- **No duplication**: if `/drift` or `/emerge` already covered a signal in Step 1, omit it.
- **Mandatory report**: `03 - Knowledge/Ideas/YYYY-MM-DD.md` created even if {USER_NAME} doesn't ticketize anything.
- **Weak signal**: if more than 4 sources are empty, signal and propose waiting 1 additional week or continuing with partial patterns.

---

## Example invocation scenario

the user says: "generate ideas — I haven't worked in 2 weeks and don't know what to focus on"

1. Read last 2 weeks of daily notes + sessions + kanbans → Step 1
2. Synthesize in 4 dimensions (table) → Step 2 → present to {USER_NAME}
3. Wait for confirmation {USER_NAME}: "ok, continue" or "wait I need to add something"
4. Generate ideas 9 categories, each idea with type/source/effort/why → Step 3
5. Top 3 + Key opportunity → Step 4
6. Save report + propose ticketing → Step 5
7. Create tickets on {USER_NAME} confirmation → Step 5 (end)
