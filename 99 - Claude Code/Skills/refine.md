---
name: refine
description: Challenge a ticket or feature before coding — structured discussion in 6 steps: uncover hidden assumptions, severity matrix (Crack/Tension/Foundation risk), open discussion, underlying question, conclusion on 5 possible issues (Go / Adapt / Jeter / Backlog V2 / Blocker). Trigger when the user says "refine", "/refine [ticket-name]", "let's discuss this feature", "challenge this ticket", "is this feasible", "validate the specs", "what alternatives", or before starting a feature with unclear specs. Pair programming mode — no code until {USER_NAME} explicitly says "go" or "take over".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured by the **richness of output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet required even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in ways that strip narrative instructions (grouping, context, key moments, open questions, tone, narration). Qualitative content preservation takes priority over line reduction.

# Skill: Refine

This skill opens a structured discussion on a ticket or feature **before coding**. The goal is to avoid 3 common pitfalls:
1. Coding the wrong thing because specs are unclear
2. Discovering mid-way that a dependency or assumption was false
3. Implementing in the wrong direction for lack of exploring alternatives

Refine = challenge the specs, identify what's implicit, evaluate feasibility, and decide together on the next step.

## Triggering

- Command `/refine [ticket-name]`
- the user says "let's discuss this feature", "challenge this ticket", "is this feasible", "take over the refine on ticket X"
- **Every ticket moving to Ready** — `/refine` is mandatory before confirming the move to Ready, whether during `/today`, a standalone refinement session, or any other session. Don't wait for explicit request from {USER_NAME}.

**Skill structure**: 6 steps — load context → extract assumptions → analysis+risks → discussion → underlying question → conclusion

## Early Detection — Exploratory Ticket (ADR-046)

**Before Step 1**, check if ticket is exploratory:
- Title contains "Explore", "Exploration", "Investigate", or
- Description clearly indicates discovery activity ("read", "watch", "understand", "evaluate if X is worth it")

**If exploratory → streamlined format**:
- Skip Steps 1-5 (assumptions, severity matrix, discussion, underlying question)
- Direct pass: **explore / backlog V2 / jeter** + 2-3 line reasoning
- Only question: "is it worth exploring this, and if so, how?"
- **Absolute rule**: never conclude "Jeter" without reading the source. Correct flow: read → extract learnings (Knowledge note if relevant) → implementation tickets downstream if it deserves it.

**If not exploratory → standard Steps 1-6 flow.**

## Step 1 — Load Context

1. Search for ticket in active project Kanbans:
   - Read `{VAULT_PATH}\{PROJECTS_FOLDER}\[ProjectName]\` to locate Features or Kanban file
   - Search for ticket note (format: `FeatureName.md` or equivalent)
2. If found → read ticket note + existing specs. **Proceed directly, without asking permission — {USER_NAME} named the ticket, they expect it to be loaded.**
3. Read project README (`{VAULT_PATH}\{PROJECTS_FOLDER}\[ProjectName]\claude-code\README.md`) for technical context
4. **Never load skills by anticipation** — wait for explicit request from {USER_NAME} ("show me", "how would you", "take over")

**If ticket not found or poorly written** → ask {USER_NAME} to describe it directly in chat. Accept verbal description as truth source for refine. If description is fragmentary, iterate: ask clarifying questions (scope, context, dependencies) before moving to Step 2.

## Step 2 — Extract and Validate Assumptions

Before analyzing the ticket, identify hidden assumptions it contains. State them explicitly:

- "We assume that..." (ex: "...the DB is accessible in real-time")
- "This supposes that..." (ex: "...{USER_NAME} has access to a third-party API")
- "This works only if..." (ex: "...we accept 2s latency")

**Concrete format**: present 3-5 key assumptions, one per line, validated against ticket and project README.

**Then validate with {USER_NAME}** before continuing. Goal: avoid spending an hour discussing a wrong version of the ticket.
- If {USER_NAME} confirms → proceed to Step 3
- If {USER_NAME} contradicts → immediately return to Step 1 to re-read and adjust
- If {USER_NAME} adds assumption → incorporate and re-validate

## Step 3 — Analysis + Severity Matrix

Present an honest analysis with risk classification:

```
## Analysis of [TicketName]

### What I Understand
[Summary of what the ticket asks]

### Feasibility
[Feasible / Feasible with constraints / Complex / Needs Reconsideration]

### Risks and Pain Points
- **Crack** (minor) — [ex: small ambiguity or detail to clarify]
- **Tension** (blocking until resolved) — [ex: contradiction, missing decision]
- **Foundation risk** (critical) — [ex: external dependency, false assumption = ticket collapses]

### Open Questions
- ...

### My Take
[Direct opinion — no corporate speak]
```

**Risk classification**:
- **Crack** → continue discussion, revisit next sprint if needed
- **Tension** → ask {USER_NAME} now, block Go until resolved
- **Foundation risk** → STOP. Identify who must validate and document dependency. Tag `#blocked` if blocking.

**Process in order**: Foundation risks first, then Tensions, then Cracks.

## Step 4 — Discussion

Open discussion mode — {USER_NAME} shares opinion, we iterate until a decision or pivot.

**Rules during discussion**:
- Name problems directly, propose an alternative, let {USER_NAME} decide — no automatic validation
- Stay concrete — always anchor in real project context
- No code during discussion — only when {USER_NAME} says "show me" or "take over"
- **Limit**: if discussion loops (same question asked 3+ times, no progress), propose stopping and waiting for more info. Document the stopping point in ticket.

**If {USER_NAME} wants to abort or pivot**:
- Respect the decision without negotiating
- Document what was explored and why discussion stops (for future context)
- Move to Step 6 (Conclusion) and select appropriate issue (often Blocker if external dependency, or Backlog V2 if future pivot)

## Step 5 — The Underlying Question

Before concluding, identify and ask the hidden question — the one not named explicitly but that conditions final decision:

**Concrete examples**:
- "Do we accept a complex solution now or simplify it in V2?"
- "What's really the blocking dependency — is it truly insurmountable?"
- "Do we code for the nominal case or prevent all edge cases?"
- "Does this ticket solve the real user problem, or just a symptom?"

**Why it matters**: Tensions and Cracks often reflect a single underlying question. Asking it directly accelerates final decision.

**Attitude**: ask directly, no corporate speak. Don't automatically validate the answer — wait for {USER_NAME}'s reaction.

## Step 6 — Conclusion and Issue

Propose one of five issues and document the decision:

**✅ Go — implement as-is**
- Specs are clear, assumptions confirmed, feasibility OK
- Ask if {USER_NAME} wants to start now or later
- If "later": note the date and intent in ticket (not just verbal)

**✏️ Adapt — modify specs**
- Update the `## Generated Specs` section of ticket with made decisions
- Move ticket to Ready column if not already

**🗑️ Jeter — abandon the ticket**
- Move ticket to Done column with cancellation note
- Document why in ticket note

**🧊 Backlog V2 — valid ticket but premature**
- Tag `#V2` in kanban
- Feed `V2 ideas.md` file in project with ticket and reasoning (create file if absent)
- Leave ticket in Idea column — will be picked up when prerequisites are met

**⏸️ Blocker — valid ticket but blocked**
- Ticket depends on missing external info, undelivered feature, or pending decision
- Precisely identify what blocks and who must unblock
- Tag `#blocked` in kanban + note blocker in ticket

**For all issues**: update ticket note with full reasoning — it's the memory of refine for future review.

## Absolute Rules

- Never start coding without {USER_NAME} explicitly saying "go" or "take over"
- Always update ticket note with discussion decisions
- Honest opinion beats reassuring opinion
- **During /refine, the only modified file is the ticket note** — never target files ({USER_NAME}.md, skills, daily notes, CLAUDE.md, etc.). Any other modification awaits explicit "go" from {USER_NAME}.
