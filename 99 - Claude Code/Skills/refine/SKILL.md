---
name: refine
description: "Challenge a ticket or feature before coding — structured discussion in 6 steps: extraction of hidden assumptions, severity matrix (Crack/Tension/Foundation risk), free discussion, underlying question, conclusion with 5 possible issues (Go / Adapt / Discard / Backlog V2 / Blocker). Trigger when the user says \"refine\", \"/refine [ticket name]\", \"let's discuss this feature\", \"challenge this ticket\", \"is this doable\", \"validate the specs\", \"what are the alternatives\", or before starting a feature with fuzzy specs. Pair programming mode — no code until {USER_NAME} explicitly says \"go\" or \"take over\"."
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips out narrative instructions (regrouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Refine

This skill opens a structured discussion about a ticket or feature **before coding**. The goal is to avoid 3 common pitfalls:
1. Coding the wrong thing because specs are fuzzy
2. Discovering mid-way that a dependency or assumption was wrong
3. Implementing in the wrong direction due to not exploring alternatives

Refine = challenge the specs, identify what is implicit, evaluate feasibility, and decide together on next steps.

## Triggering

- Command `/refine [ticket name]`
- the user says "let's discuss this feature", "challenge this ticket", "is this doable", "take over the refine of ticket X"
- **Every ticket moving to Ready** — `/refine` is mandatory before confirming the move to Ready, whether during `/today`, a standalone refinement session, or any other session. Do not wait for explicit request from {USER_NAME}.

**Skill structure**: 6 steps — load context → extract assumptions → analyze+risks → discussion → underlying question → conclusion. Two intermediate steps activate only on **dev tickets**: 5.5 (agentic specs) and 5.6 (adversarial pass).

## Early detection — Exploratory ticket (ADR-046)

**Before Step 1**, check if the ticket is exploratory type:
- Title contains "Explore", "Exploration", "Investigate", or
- Description clearly indicates a discovery activity ("read", "look at", "understand", "evaluate if X is worth it")

**If exploratory → streamlined format**:
- Skip Steps 1-5 (assumptions, severity matrix, discussion, underlying question)
- Direct pass: **frame (→ Ready) / backlog V2 / discard** + 2-3 line reasoning
- The only question: "is it worth exploring this, and if so, in what form?"
- **Frame → Ready**: an investigation/instrumentation ticket that exits refine with a defined scope (priority #1 identified, out-of-scope named) moves to the **Ready** column like any other ticket — it follows the `✏️ Adapt` issue, **never left in Idea**. An investigation ticket remains actionable: in Idea it is forgotten (decision {USER_NAME}, session 19:16 2026-05-17).
- **Backlog V2 / Idea reserved** for truly premature cases (missing prerequisites), not as default for exploratory tickets.
- **Absolute rule**: never conclude "Discard" without having read the source. Correct flow: read → extract learnings (note Knowledge if relevant) → implementation tickets in follow-up if it merits.

**If non-exploratory → standard flow Steps 1-6.**

## Step 1 — Load context

1. Search for the ticket in Kanbans of active projects:
   - Read `{VAULT_PATH}\{PROJECTS_FOLDER}\[ProjectName]\` to locate Features or Kanban file
   - Search for the ticket note (format: `FeatureName.md` or equivalent)
2. If found → read the ticket note + existing specs. **Proceed directly, without asking permission — {USER_NAME} named the ticket, they expect it to be loaded.**
3. Read the project README (`{VAULT_PATH}\{PROJECTS_FOLDER}\[ProjectName]\claude-code\README.md`) for technical context
4. **Never load skills in anticipation** — wait for explicit request from {USER_NAME} ("show me", "how would you do it", "take over")

**If the ticket is not found or poorly written** → ask {USER_NAME} to describe it directly in the chat. Accept a verbal description as the source of truth for the refine. If the description given is fragmentary, iterate: ask clarifying questions (scope, context, dependencies) before moving to Step 2.

## Step 1.5 — Ticket recap

Before any analysis, restate the ticket clearly: type, project, what it does, why, expected behavior, out-of-scope, potential hard point flagged by the ticket. Short format — a readable summary, not a copy-paste of the file.

**Goal**: {USER_NAME} validates that we're talking about the same ticket before investing in analysis — catches a framing misunderstanding in 30s instead of after several reformulations.

Also applies to **exploratory tickets** (streamlined format): short recap → then verdict frame / backlog V2 / discard.

## Step 2 — Extraction and validation of assumptions

Before analyzing the ticket, identify the hidden assumptions it contains. State them explicitly:

- "We assume that..." (ex: "...the DB is accessible in real time")
- "This assumes..." (ex: "...{USER_NAME} has access to a third-party API")
- "This only works if..." (ex: "...we accept a 2s latency")

**Concrete format**: present 3-5 key assumptions, one per line, validated against the ticket and the project README.

**Then validate with {USER_NAME}** before continuing. The goal: avoid spending an hour discussing a wrong version of the ticket.
- If {USER_NAME} confirms → continue to Step 3
- If {USER_NAME} contradicts → return immediately to Step 1 to reread and adjust
- If {USER_NAME} adds an assumption → incorporate and re-validate

## Step 3 — Analysis + Severity matrix

Present an honest analysis with classification of each risk:

```
## Analysis of [TicketName]

### What I understand
[Summary of what the ticket requests]

### Feasibility
[Feasible / Feasible with constraints / Complex / To reconsider]

### Risks and sticking points
- **Crack** (minor) — [ex: small ambiguity or detail to clarify]
- **Tension** (blocking until resolved) — [ex: contradiction, missing decision]
- **Foundation risk** (critical) — [ex: external dependency, wrong assumption = ticket collapses]

### Open questions
- ...

### My opinion
[Direct opinion — no hedging]
```

**Risk classification**:
- **Crack** → continue the discussion, revisit at the next sprint if needed
- **Tension** → ask {USER_NAME} now, block the Go until resolved
- **Foundation risk** → STOP. Identify who must validate and document the dependency. Tag `#blocked` if blocking.

**Treat in order**: Foundation risks first, then Tensions, then Cracks.

**Heuristics by ticket type** — apply before concluding on feasibility:

- **Acquisition / scale** → verify baseline usage first (retention of already-passed users) before discussing channel or format. 20 users, 0 retained = scaling returns to filling a leaky bucket. The real question precedes acquisition.
- **Already-spec'd fix** → validate the spec and resolve the issue, **do not trigger investigation**. Commands, access, diagnosis = execution, not refine. A conditional unknown (ex: the actual port of a container) resolves at execution — it's not a spec blocker.
- **Measurement** → check if the data exists elsewhere (infra logs, metrics, platform dashboards) **before** prescribing instrumentation (DB field, event table, custom code). Do not instrument what is already measured.
- **Structural discovery during refine** (the problem is bigger than the ticket) → create a dedicated decision ticket (resolve drop / rewrite / merge). Do not patch on the fly.

## Step 4 — Discussion

Free discussion mode — {USER_NAME} gives their opinion, we iterate until a decision or pivot.

**Rules during discussion**:
- Name problems directly, propose an alternative, let {USER_NAME} decide — no automatic validation
- Stay concrete — always anchor in the context of the real project
- No code during discussion — only when the user says "show me" or "take over"
- **Limit**: if discussion loops (same question asked 3+ times, no progress), propose to stop and wait for more info. Document the stopping point in the ticket.

**If {USER_NAME} wants to abort or pivot**:
- Respect the decision without negotiating
- Document what was explored and why discussion stops (for future context)
- Move to Step 6 (Conclusion) and select an appropriate issue (often Blocker if it's external dependency, or Backlog V2 if it's a future pivot)

## Step 5 — The underlying question

Before concluding, identify and ask the hidden question — the one not explicitly named but that conditions the final decision:

**Concrete examples**:
- "Do we accept a complicated solution now or simplify it in V2?"
- "What is really the blocking dependency — is it truly insurmountable?"
- "Do we code for the nominal case or prevent all edge cases?"
- "Does this ticket solve the real user problem, or just a symptom?"

**Why it matters**: the Tensions and Cracks we identified often reflect a single real underlying question. Asking it directly accelerates the final decision.

**Attitude**: ask the question directly, without hedging. Do not automatically validate the answer — wait for {USER_NAME}'s reaction.

## Step 5.5 — Agentic specs (dev tickets)

This step activates only for **dev** tickets. It exists because a ticket intended for code benefits from arriving with its execution contract already surgical — breakdown, validation points, testable criteria. {USER_NAME}'s insight (2026-05-15): this granularity serves **even when the ticket is coded by hand**, not just facing an agent. It is not therefore an artifact "for the machine", it is simply a better refine altogether for dev tickets.

**Detect the dev signal** — the ticket is attached to a code project (FSTG, HLS…) **or** its content contains dev keywords: `route`, `component`, `migration`, `skill`, `endpoint`, `service`, `refactor`, `query`, `test`. The list guides judgment, it does not confine it — a clearly dev ticket without these exact words also counts.

**If signal detected → propose, {USER_NAME} decides in one word**: *"Dev ticket — should I generate the `### Agentic specs` block in `## Generated specs`? (yes/no)"*. No frontmatter to fill, no rigid gating: the block remains under {USER_NAME}'s control, faithful to the fact that it is not tied to actual execution mode (agentic or manual).

**If no signal, or if the user says no** → add nothing, move to Step 6 normally.

**If {USER_NAME} confirms** → the ✏️ Adapt issue of Step 6 must write the subsection `### Agentic specs` (structure detailed in this branch).

## Step 5.6 — Adversarial pass (dev tickets)

This step exists for one reason only: **the refine cannot criticize itself**. The sycophancy of a refine is *relational* — it arises from the history of discussion, where agreement built turn after turn. A directive "be more critical" addressed to the same model drifts, because it asks the one who just validated to attack it. What resists is a mechanism: **delegate criticism to an agent who has never seen the conversation**. It cannot be sycophantic toward an agreement it did not participate in.

**Gate** — same dev signal as Step 5.5. Non-dev ticket (essay, vault-ops, organization) → **no pass**, go directly to Step 6. If Step 5.5 ran, the pass applies.

**Position in flow** — the pass runs **before** Step 6 writes anything in the note. At this point the direction is decided (Steps 3-5): draft the content of the `## Generated specs` **without writing it in the ticket yet**, send it to the agent, and only let Step 6 write the version that survived. A spec torn apart never lands in the file — we do not correct it after, it does not enter at all.

**If the intended issue is ✅ Go** (the specs are already in the ticket and have nothing to rewrite), there is no prior drafting: the artifact attacked is the **note as-is**. The pass still applies — it even has the most value there, a ✅ Go being precisely when the refine has nothing to criticize. If the `### Agentic specs` block from Step 5.5 was produced, it is part of the attacked artifact: the execution contract is criticized like everything else.

### What we give the agent, what we hide

- ✅ **Given** — the complete ticket note · the drafted content of specs · **pointers** to technical project context (project README, project `CLAUDE.md`, constraints, target files).
- 🚫 **Hidden** — **all conversation history of the refine, without exception**: exchanges, {USER_NAME} validations, confirmed assumptions, tone of discussion.

**The exclusion of conversational history is the entire mechanism.** Transmitting it "for context" reopens exactly the flaw this step closes: the agent would see agreement build and fall in line. If the agent lacks material, the answer is **more technical project context** — never a piece of conversation.

**Spawn** — `Agent` tool, `subagent_type: general-purpose`, single agent, synchronous.

### Hostile prompt (frozen — wording validated {USER_NAME} 2026-08-04)

```
You are an adversarial reviewer. Your role: build the strongest case AGAINST the spec below,
like a reviewer who wants to sink it.

You did not participate in the discussion that produced this spec and will never see it.
That is intentional: you have no agreement to preserve, no position to defend, no one to
spare. Treat it like the work of a stranger that you must prevent from shipping.

## Artifact under attack
[complete ticket note]

## Retained specs
[drafted content of ## Generated specs]

## Technical project context
[pointers: project README, project CLAUDE.md, constraints, target files]

## What you produce — 5 sections, in this order

1. **Steelman of the alternative approach** — the best version of the solution that was NOT
   chosen. Not a strawman: phrase it as someone who believes it is better would defend it.
2. **If this spec is wrong, here is the most likely reason** — ONE only, the most likely,
   not a list. Name the failure mechanism, not a generic risk.
3. **What would need to be true for this decision to fail?** — the conditions, and for each:
   verifiable now? at what cost?
4. **Confidence level** — your confidence in the direction taken by the spec, and what would
   change your mind.
5. **Trade-offs and paths** — hybrids between the retained approach and the alternative, or
   targeted corrections. For EACH, mandatory:
   **what it gains** and **what it loses**, both named.
   A path whose loss you cannot name is not a path, it is a slogan: do not propose it.

## Prohibited

- **No paths, corrections, or mitigations in sections 1 to 4.** They carry the charge, period.
  Everything that repairs goes in section 5, never before.
- **No opener or closer formulas of benevolence** ("overall solid", "good foundation", "a few
  minor points"). You do not balance.
- **Do not fabricate objections.** If the spec holds, say it through section 4 (high confidence)
  — not by inventing grievances to fill space. An honest and brief charge beats a long hollow
  one.
- Ask no questions: you produce a report, you do not converse.
```

### Two-stage return

The agent returns 5 sections. The cut is made on a **declared section boundary**, never on a judgment call:

1. **Time 1 — the bill of indictment.** Return **sections 1 to 4 in full**. Never drop an objection, never summarize it, never reclassify by severity, never comment on it. The main refine **does not nuance, defend, or contextualize** at this stage. Then stop and wait for {USER_NAME}'s reaction.
2. **Time 2 — trade-offs and paths.** Return **section 5**, only *after* {USER_NAME} has read and reacted. Each path arrives with its gain **and** its loss, as the agent named them — never one without the other.

**Why a cut and not a filter**: the refine that produced the spec is precisely the biased instance. Letting it choose which objections merit surfacing, or interleaving each objection with its remedy, returns the power we just took away. Cutting on a section boundary is mechanical — it asks no judgment.

### Return to flow

{USER_NAME} arbitrates what holds and what does not. Retained objections **reopen the specs**: return to Step 5.5/6, and the corrected version is what Step 6 will write. Discarded objections are not re-discussed — it is their arbitration, not a negotiation.

## Step 6 — Conclusion and issue

**If Step 5.6 ran**, it precedes issue selection: the specs written here are those that survived the adversarial pass and {USER_NAME}'s arbitration, not the earlier version.

Propose one of five issues and document the decision:

**✅ Go — implement as-is**
- Specs are clear, assumptions confirmed, feasibility OK
- Ask if {USER_NAME} wants to start now or later
- If "later": note the date and intention in the ticket (not just verbal)

**✏️ Adapt — modify specs**
- Update the `## Generated specs` section of the ticket with decisions made — **post-pass 5.6 version** if it ran
- Move the ticket to Ready column if not already done
- **If Step 5.5 confirmed a dev ticket** → add to `## Generated specs` a subsection `### Agentic specs` structured in 6 points (0→5). The goal: an execution contract that an agent — or {USER_NAME} in manual dev — can follow without reinterpreting. References on agentic specs (Addy Osmani, O'Reilly, analysis of 2500+ repos) converge on three requirements this structure encodes: exact commands (not tool names), binary-oracle-verifiable criteria, and third-party boundaries made explicit.

  0. **Project context to load** — pointers, not content: read `claude-code/README.md`, the project `CLAUDE.md`, `claude-code/lessons.md`, and name skills relevant *to this specific ticket* (ex: `/express-route-pattern`, `/vitest-test-pattern`). Conventions themselves (naming, TDD, DDD, stack) live in project constitution and are never recopied here — duplicating them by ticket recreates the maintenance point the 15/05 decision wanted to avoid and lets them diverge. If project constitution is incomplete on a point, propose an addition to project `CLAUDE.md` separately — not a patch in the ticket.
  1. **Step-by-step executable breakdown** — each step = action + exact command if applicable (`npm test -- foo.spec.ts`, not "run tests") + file(s) touched.
  2. **Review gates in 3 tiers** — ✅ what the agent does alone / ⚠️ what it stops on and asks / 🚫 what it never does. Vocabulary aligned with "Contract of an agentic task" in CLAUDE.md and [[03 - Knowledge/Claude code/agentic-coding-workflow]].
  3. **Done criteria testable** — format `input → observable output` or `such test passes`. Never "it works": a criterion must give a pass/fail signal without interpretation.
  4. **Explicit scope + named out-of-scope** — taken from Agentic Contract in CLAUDE.md; named out-of-scope counts as much as scope.
  5. **Final self-check** — the agent rereads its output against criteria in point 3 and lists gaps before closing the phase. This is the net that catches implementation that "looks done" but does not pass criteria.

**🗑️ Discard — abandon the ticket**
- Move the ticket to Done column with an abandonment note
- Document why in the ticket note

**🧊 Backlog V2 — valid ticket but premature**
- Tag `#V2` in the kanban
- Feed the project's `V2 ideas.md` file with the ticket and reasoning (create the file if it does not exist)
- Leave the ticket in Idea column — it will be picked up when prerequisites are met

**⏸️ Blocker — valid ticket but blocked**
- The ticket depends on missing external info, an undelivered feature, or a pending decision
- Identify precisely what blocks it and who must unblock it
- Tag `#blocked` in the kanban + note the blocker in the ticket note

**For all issues**: update the ticket note with the complete reasoning — it is the memory of the refine for later review.

## Absolute rules

- Never start coding without {USER_NAME} explicitly saying "go" or "take over"
- Always update the ticket note with discussion decisions
- Honest opinion trumps reassuring opinion
- **During /refine, the only file modified is the ticket note** — never the target files of implementation ({USER_NAME}.md, skills, daily notes, CLAUDE.md, etc.). Any modification outside the ticket must wait for explicit "go".
- **The adversarial agent of Step 5.6 never receives conversation history of the refine** — no excerpt, no summary, no "for context". This is the entire mechanism of the step: an agent that saw agreement build falls in line. Missing context → add *technical project* context, never conversational.
- **No improvement paths at time 1 of 5.6 return.** Sections 1 to 4 of the bill of indictment are returned in full and alone; section 5 (trade-offs and paths) arrives only after {USER_NAME}'s reaction. Never interleave, never anticipate "to be constructive" — it is exactly the dilution this step exists to prevent.
