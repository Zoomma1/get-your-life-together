---
name: refine
description: Challenge a ticket or feature before coding — structured discussion in 6 steps: extract hidden assumptions, severity matrix (Crack/Tension/Foundation risk), free-form discussion, underlying question, conclusion on 5 possible outcomes (Go / Adapt / Discard / Backlog V2 / Blocker). Trigger when the user says "refine", "/refine [ticket name]", "we discuss this feature", "challenge this ticket", "is this feasible", "validate the specs", "what are the alternatives", or before starting a feature with unclear specs. Pair programming mode — no code until {USER_NAME} explicitly says "go" or "take the lead".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, strong moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Refine

This skill opens a structured discussion on a ticket or feature **before code**. The goal is to avoid 3 common pitfalls:
1. Coding the wrong thing because specs are unclear
2. Discovering mid-way that a dependency or assumption was false
3. Implementing in the wrong direction due to not exploring alternatives

Refine = challenge the specs, identify what is implicit, assess feasibility, and decide together on next steps.

## Triggering

- Command `/refine [ticket name]`
- the user says "we discuss this feature", "challenge this ticket", "is this feasible", "take the lead on refining ticket X"
- **Any ticket moving to Ready** — `/refine` is mandatory before confirming the move to Ready, whether during `/today`, a standalone refinement session, or any other session. Do not wait for explicit request from {USER_NAME}.

**Skill structure**: 6 steps — load context → extract assumptions → analyze + risks → discussion → underlying question → conclusion

## Early detection — Exploratory ticket (ADR-046)

**Before Step 1**, verify if the ticket is exploratory type:
- Title contains "Explore", "Exploration", "Investigate", or
- Description clearly indicates discovery activity ("read", "look at", "understand", "evaluate if X is worth it")

**If exploratory → lightweight format**:
- Skip Steps 1-5 (assumptions, severity matrix, discussion, underlying question)
- Direct path: **explore / backlog V2 / discard** + 2-3 line reasoning
- The only question: "is it worth exploring this, and if so, in what form?"
- **Absolute rule**: never conclude "Discard" without reading the source. Correct flow: read → extract learnings (note to Knowledge if relevant) → implementation tickets in follow-up if it merits.

**If not exploratory → standard flow Steps 1-6.**

## Step 1 — Load context

1. Search for the ticket in Kanbans of active projects:
   - Read `{VAULT_PATH}\{PROJECTS_FOLDER}\[ProjectName]\` to locate the Features or Kanban file
   - Search for the ticket note (format: `FeatureName.md` or equivalent)
2. If found → read the ticket note + existing specs. **Proceed directly, without asking permission — {USER_NAME} named the ticket, they expect us to load it.**
3. Read the project README (`{VAULT_PATH}\{PROJECTS_FOLDER}\[ProjectName]\claude-code\README.md`) for technical context
4. **Never load skills proactively** — wait for explicit request from {USER_NAME} ("show me", "how would you do it", "take the lead")

**If ticket not found or poorly written** → ask {USER_NAME} to describe it directly in chat. Accept verbal description as source of truth for the refine. If description given is fragmentary, iterate: ask clarifying questions (scope, context, dependencies) before moving to Step 2.

## Step 2 — Extraction and validation of assumptions

Before analyzing the ticket, identify the hidden assumptions it contains. State them explicitly:

- "We assume that..." (e.g. "...the DB is accessible in real-time")
- "This requires that..." (e.g. "...{USER_NAME} has access to a third-party API")
- "This only works if..." (e.g. "...we accept a latency of 2s")

**Concrete format**: present 3-5 key assumptions, one per line, validated against the ticket and project README.

**Then validate with {USER_NAME}** before continuing. The goal: avoid spending an hour discussing a false version of the ticket.
- If {USER_NAME} confirms → continue to Step 3
- If {USER_NAME} contradicts → return immediately to Step 1 to re-read and adjust
- If {USER_NAME} adds an assumption → incorporate and re-validate

## Step 3 — Analysis + Severity matrix

Present an honest analysis with classification of each risk:

```
## Analysis of [TicketName]

### What I understand
[Summary of what the ticket asks for]

### Feasibility
[Feasible / Feasible with constraints / Complex / To reconsider]

### Risks and blocking points
- **Crack** (minor) — [e.g: small ambiguity or detail to clarify]
- **Tension** (blocking until resolved) — [e.g: contradiction, missing decision]
- **Foundation risk** (critical) — [e.g: external dependency, false assumption = ticket collapses]

### Open questions
- ...

### My take
[Direct opinion — no hedging]
```

**Risk classification**:
- **Crack** → continue discussion, revisit next sprint if needed
- **Tension** → ask {USER_NAME} now, block Go until resolved
- **Foundation risk** → STOP. Identify who must validate and document the dependency. Tag `#blocked` if blocking.

**Handle in order**: Foundation risks first, then Tensions, then Cracks.

## Step 4 — Discussion

Free-form discussion mode — {USER_NAME} gives their take, we iterate until a decision or pivot.

**Rules during discussion**:
- Name problems directly, propose an alternative, let {USER_NAME} decide — no automatic validation
- Stay concrete — always ground in the context of the real project
- No code during discussion — only when the user says "show me" or "take the lead"
- **Limit**: if discussion loops (same question asked 3+ times, no progress), propose stopping and waiting for more info. Document the stopping point in the ticket.

**If {USER_NAME} wants to abort or pivot**:
- Respect the decision without negotiating
- Document what was explored and why discussion stops (for future context)
- Move to Step 6 (Conclusion) and select an appropriate outcome (often Blocker if external dependency, or Backlog V2 if future pivot)

## Step 5 — The underlying question

Before concluding, identify and ask the hidden question — the one not explicitly named but that conditions the final decision:

**Concrete examples**:
- "Do we accept a complicated solution now or simplify it in V2?"
- "What is really the blocking dependency — is it truly insurmountable?"
- "Do we code for the nominal case or handle all edge cases?"
- "Does this ticket solve the real user problem, or just a symptom?"

**Why it matters**: the Tensions and Cracks we identified often reflect a single underlying question. Asking it directly accelerates the final decision.

**Attitude**: ask the question directly, without hedging. Do not automatically validate the answer — wait for {USER_NAME}'s reaction.

## Step 5.5 — Agentic specs (dev tickets)

This step only activates for **dev** tickets. It exists because a ticket destined for code benefits from arriving with its execution contract already surgical — breakdown, validation points, testable criteria. {USER_NAME}'s insight (2026-05-15): this granularity serves **even when the ticket is coded by hand**, not just against an agent. So it's not a "for the machine" artifact, it's just a better refine overall for dev tickets.

**Detect the dev signal** — the ticket is attached to a code project (FSTG, HLS…) **or** its content contains dev keywords: `route`, `component`, `migration`, `skill`, `endpoint`, `service`, `refactor`, `query`, `test`. The list guides judgment, it doesn't confine it — a clearly dev ticket without these exact words counts too.

**If signal detected → propose, {USER_NAME} decides in one word**: *"Dev ticket — should I generate the `### Agentic specs` block in `## Generated specs`? (yes/no)"*. No frontmatter to fill, no rigid gating: the block stays under {USER_NAME}'s control, true to the fact that it's not tied to actual execution mode (agentic or manual).

**If no signal, or if the user says no** → add nothing, proceed to Step 6 normally.

**If {USER_NAME} confirms** → the outcome ✏️ Adapt in Step 6 must write the subsection `### Agentic specs` (structure detailed in that branch).

## Step 6 — Conclusion and outcome

Propose one of five outcomes and document the decision:

**✅ Go — implement as-is**
- Specs are clear, assumptions confirmed, feasibility OK
- Ask if {USER_NAME} wants to start now or later
- If "later": note the date and intention in the ticket (not just verbal)

**✏️ Adapt — modify the specs**
- Update the `## Generated specs` section of the ticket with decisions made
- Move the ticket to Ready column if not already done
- **If Step 5.5 confirmed a dev ticket** → add in `## Generated specs` a subsection `### Agentic specs` structured in 6 points (0→5). The goal: an execution contract that an agent — or {USER_NAME} in manual dev — can follow without reinterpreting. References on agentic specs (Addy Osmani, O'Reilly, analysis of 2500+ repos) converge on three requirements this structure encodes: exact commands (not tool names), criteria verifiable as binary oracle, and boundaries in explicit thirds.

  0. **Project context to load** — pointers, not content: read `claude-code/README.md`, project `CLAUDE.md`, `claude-code/lessons.md`, and name relevant skills *for this specific ticket* (e.g. `/express-route-pattern`, `/vitest-test-pattern`). The conventions themselves (naming, TDD, DDD, stack) live in the project constitution and are never recopied here — duplicating them per ticket recreates the maintenance point the 15/05 decision wanted to avoid and makes them diverge. If the project constitution is incomplete on a point, propose an addition to project `CLAUDE.md` separately — not a band-aid in the ticket.
  1. **Step-by-step executable breakdown** — each step = action + exact command if applicable (`npm test -- foo.spec.ts`, not "run the tests") + file(s) touched.
  2. **Review gates in 3 tiers** — ✅ what the agent does alone / ⚠️ what it stops on and asks about / 🚫 what it never does. Vocabulary aligned with the "Contract for an agentic task" in CLAUDE.md and [[03 - Knowledge/Claude code/agentic-coding-workflow]].
  3. **Testable done criteria** — format `input → observable output` or `such test passes`. Never "it works": a criterion must give a pass/fail signal without interpretation.
  4. **Explicit scope + named out-of-scope** — taken from the agentic Contract in CLAUDE.md; named out-of-scope counts as much as scope.
  5. **Final self-verification** — the agent re-reads its output against the criteria in point 3 and lists gaps before closing the phase. This is the net that catches implementation that "looks finished" but doesn't meet criteria.

**🗑️ Discard — abandon the ticket**
- Move the ticket to Done column with an abandonment note
- Document why in the ticket note

**🧊 Backlog V2 — valid ticket but premature**
- Tag `#V2` in the kanban
- Feed the project's `V2 ideas.md` file with the ticket and reasoning (create the file if it doesn't exist)
- Leave the ticket in Idea column — it will be revisited when prerequisites are met

**⏸️ Blocker — valid ticket but blocked**
- The ticket depends on missing external info, undelivered feature, or pending decision
- Identify precisely what blocks and who must unblock it
- Tag `#blocked` in the kanban + note the blocker in the ticket note

**For all outcomes**: update the ticket note with the complete reasoning — it's the memory of the refine for later review.

## Absolute rules

- Never start coding without {USER_NAME} explicitly saying "go" or "take the lead"
- Always update the ticket note with discussion decisions
- Honest opinion trumps reassuring opinion
- **During /refine, the only file modified is the ticket note** — never implementation target files ({USER_NAME}.md, skills, daily notes, CLAUDE.md, etc.). Any modification outside the ticket must wait for explicit "go".
