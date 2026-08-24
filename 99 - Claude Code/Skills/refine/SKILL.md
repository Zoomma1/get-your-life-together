---
name: refine
description: "Challenge a ticket or feature before coding — structured discussion in 6 steps: extraction of hidden assumptions, severity matrix (Crack/Tension/Foundation risk), free discussion, underlying question, conclusion on 5 possible issues (Go / Adapt / Throw / Backlog V2 / Blocker). Trigger when the user says \"refine\", \"/refine [ticket name]\", \"we're discussing this feature\", \"challenge this ticket\", \"is it feasible\", \"validate the specs\", \"what alternatives\", or before starting a feature whose specs are unclear. Pair programming mode — no code until {USER_NAME} explicitly says \"go\" or \"take the lead\"."
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compaction.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet required even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips out narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Refine

This skill opens a structured discussion on a ticket or feature **before coding**. The goal is to avoid 3 common pitfalls:
1. Coding the wrong thing because specs are vague
2. Discovering mid-way that a dependency or assumption was wrong
3. Implementing in the wrong direction for lack of exploring alternatives

Refine = challenge the specs, identify what is implicit, evaluate feasibility, and decide together on next steps.

## Triggering

- Command `/refine [ticket name]`
- the user says "we're discussing this feature", "challenge this ticket", "is it feasible", "take the lead on refining ticket X"
- **Any ticket moving to Ready** — `/refine` is required before confirming the move to Ready, whether during `/today`, a standalone refinement session, or any other session. Don't wait for explicit request from {USER_NAME}.

**Skill structure**: 6 steps — load context → extraction assumptions → analysis+risks → discussion → underlying question → conclusion. Two intercalary steps activate only on **dev tickets**: 5.5 (agentic specs) and 5.6 (adversarial pass).

## Early detection — Exploratory ticket (ADR-046)

**Before Step 1**, verify whether the ticket is of exploratory type:
- Title contains "Explore", "Exploration", "Investigate", **"Audit"** *(expanded 2026-08-18)*, or
- Description clearly indicates a discovery activity ("read", "look at", "understand", "evaluate if X is worth it")

**If exploratory → lightweight format**:
- Skip Steps 1-5 (assumptions, severity matrix, discussion, underlying question)
- **The inventory side happens right away if it costs less than 5 min** *(2026-08-18)* — it's what corrects the framing, and it can't correct it from the backlog. `/refine` rereads the **ticket**, never the **terrain**: it can only *clarify* the initial hypothesis, never invalidate it. *(Measured 18/08: a 20-second inventory side yielded 6 skills, 3 unsuspected by the ticket, 1 false positive and 2 out of scope — a full refine would have refined a list of 5 wrong names to 40 %. Cf. ADR-046, amendment of 18/08.)*
- Direct pass: **frame (→ Ready) / backlog V2 / throw** + reasoning 2-3 lines
- The only question: "is it worth exploring that, and if so, in what form?"
- **Frame → Ready**: an investigation/instrumentation ticket that comes out of refine with a defined scope (priority #1 identified, out-of-scope named) moves to column **Ready** like any ticket — it follows the issue `✏️ Adapt`, **never left in Idea**. An investigation ticket remains actionable: in Idea it gets forgotten (decision {USER_NAME}, session 19:16 2026-05-17).
- **Backlog V2 / Idea reserved** for truly premature cases (missing prerequisites), not as default for exploratory tickets.
- **Absolute rule**: never conclude "Throw" without having read the source. Correct flow: read → extract learnings (Knowledge note if relevant) → implementation tickets in the follow-up if it's worth it.

**If non-exploratory → standard flow Steps 1-6.**

## Step 1 — Load context

1. Search for the ticket in the Kanbans of active projects:
   - Read `{VAULT_PATH}\{PROJECTS_FOLDER}\[ProjectName]\` to locate the Features or Kanban file
   - Search for the ticket note (format: `FeatureName.md` or equivalent)
2. If found → read the ticket note + existing specs. **Proceed directly, without asking for permission — {USER_NAME} named the ticket, they expect you to load it.**
3. Read the project README (`{VAULT_PATH}\{PROJECTS_FOLDER}\[ProjectName]\claude-code\README.md`) for technical context
4. **Never load skills by anticipation** — wait for explicit request from {USER_NAME} ("show me", "how would you do it", "take the lead")

**If the ticket is not found or poorly written** → ask {USER_NAME} to describe it directly in chat. Accept a verbal description as source of truth for the refine. If the description given is fragmentary, iterate: ask clarifying questions (scope, context, dependencies) before moving to Step 2.

## Step 1.5 — Recap of the ticket

Before any analysis, restate the ticket clearly: type, project, what it does, why, expected behavior, out-of-scope, any tricky point flagged by the ticket. Short format — a readable summary, not a copy-paste from the file.

**Goal**: {USER_NAME} validates we're talking about the same ticket before investing in analysis — catches a framing misunderstanding in 30s instead of after several rewordings.

Also applies to **exploratory tickets** (lightweight format): short recap → then verdict frame / backlog V2 / throw.

## Step 2 — Extraction and validation of assumptions

Before analyzing the ticket, identify the hidden assumptions it contains. State them explicitly:

- "We're assuming that..." (ex: "...the DB is accessible in real-time")
- "That assumes..." (ex: "...{USER_NAME} has access to a third-party API")
- "That only works if..." (ex: "...we accept a 2s latency")

**Concrete format**: present 3-5 key assumptions, one per line, validated against the ticket and the project README.

**Then validate with {USER_NAME}** before continuing. The goal: avoid spending an hour discussing a wrong version of the ticket.
- If {USER_NAME} confirms → continue to Step 3
- If {USER_NAME} contradicts → go back immediately to Step 1 to reread and adjust
- If {USER_NAME} adds an assumption → incorporate and revalidate

## Step 3 — Analysis + Severity matrix

Present an honest analysis with classification of each risk:

```
## Analysis of [TicketName]

### What I understand
[Summary of what the ticket asks for]

### Feasibility
[Feasible / Feasible with constraints / Complex / To reconsider]

### Risks and pain points
- **Crack** (minor) — [ex: small ambiguity or detail to clarify]
- **Tension** (blocking until resolved) — [ex: contradiction, missing decision]
- **Foundation risk** (critical) — [ex: external dependency, false assumption = ticket collapses]

### Open questions
- ...

### My opinion
[Direct opinion — no corporate speak]
```

**Risk classification**:
- **Crack** → continue the discussion, revisit next sprint if needed
- **Tension** → ask {USER_NAME} now, block Go until resolved
- **Foundation risk** → STOP. Identify who must validate and document the dependency. Tag `#blocked` if blocking.

**Process in order**: Foundation risks first, then Tensions, then Cracks.

**Heuristics by ticket type** — apply before concluding on feasibility:

- **Acquisition / scale** → first verify the baseline of existing usage (retention of users already passed) before discussing channel or format. 20 users, 0 retained = scaling amounts to filling a leaky bucket. The real question comes before acquisition.
- **Already-spec'd fix** → validate the spec and settle the issue, **don't trigger an investigation**. Commands, access, diagnosis = execution, not refine. A conditional unknown (ex: the actual port of a container) gets resolved at execution — that's not a spec blocker.
- **Measurement** → verify if the data already exists elsewhere (infra logs, metrics, platform dashboards) **before** prescribing instrumentation (DB field, events table, custom code). Don't instrument what's already measured.
- **Structural discovery during refine** (the problem is bigger than the ticket) → create a dedicated decision ticket (settle drop / rewrite / merge). Don't improvise in the follow-up.

## Step 4 — Discussion

Free-form discussion mode — {USER_NAME} gives their opinion, we iterate until a decision or pivot.

**Rules during discussion**:
- Name problems directly, propose an alternative, let {USER_NAME} decide — no automatic validation
- Stay concrete — always anchor in the real project context
- No code during discussion — only when the user says "show me" or "take the lead"
- **Limit**: if discussion loops (same question asked 3+ times, no progress), propose stopping and waiting for more info. Document the stopping point in the ticket.

**If {USER_NAME} wants to abort or pivot**:
- Respect the decision without negotiating
- Document what was explored and why discussion stops (for future context)
- Move to Step 6 (Conclusion) and select an appropriate issue (often Blocker if it's an external dependency, or Backlog V2 if it's a future pivot)

## Step 5 — The underlying question

Before concluding, identify and ask the hidden question — the one not explicitly named but conditions the final decision:

**Concrete examples**:
- "Do we accept a complicated solution now or simplify it in V2?"
- "What is really the blocking dependency — is it truly insurmountable?"
- "Do we code for the nominal case or guard against all edge cases?"
- "Does this ticket solve the real user problem, or just a symptom?"

**Why it matters**: the Tensions and Cracks we identified often reflect a single real underlying question. Asking it directly accelerates the final decision.

**Attitude**: ask the question directly, no corporate speak. Don't automatically validate the answer — wait for {USER_NAME}'s reaction.

## Step 5.5 — Agentic specs (dev tickets)

This step activates only for **dev** tickets. It exists because a ticket destined for code gains from arriving with its execution contract already surgical — breakdown, validation points, testable criteria. The insight from {USER_NAME} (2026-05-15): this granularity serves **even when the ticket is coded by hand**, not just facing an agent. So it's not an artifact "for the machine", it's a better refine altogether for dev tickets.

**Detect the dev signal** — the ticket is attached to a code project ([project-A], [project-B]…) **or** its content contains dev keywords: `route`, `component`, `migration`, `skill`, `endpoint`, `service`, `refactor`, `query`, `test`. The list guides judgment, doesn't constrain it — a clearly dev ticket without these exact words also counts.

**If signal detected → propose, {USER_NAME} decides in one word**: *"Dev ticket — I generate the `### Agentic specs` block in `## Generated specs`? (yes/no)"*. No frontmatter to fill, no rigid gating: the block stays under {USER_NAME}'s control, faithful to the fact it's not linked to the actual mode of execution (agentic or manual).

**If no signal, or if the user says no** → add nothing, move to Step 6 normally.

**If {USER_NAME} confirms** → the issue ✏️ Adapt of Step 6 must write the subsection `### Agentic specs` (structure detailed in that branch).

## Step 5.6 — Adversarial pass (dev tickets)

This step exists for one reason only: **the refine cannot criticize itself**. A refine's sycophancy is *relational* — it's born from the conversation's history, where agreement built turn by turn. An instruction "be more critical" addressed to the same model drifts, because it asks whoever just validated to attack. What resists is a mechanism: **delegate the critique to an agent who never saw the conversation**. They can't be sycophantic toward an agreement they didn't participate in.

**Gate** — same dev signal as Step 5.5. Non-dev ticket (essay, vault-ops, organization) → **no pass**, go directly to Step 6. If Step 5.5 ran, the pass applies.

**Position in flow** — the pass runs **before** Step 6 writes anything into the note. At this stage the direction is settled (Steps 3-5): draft the content of `## Generated specs` **without yet writing it into the ticket**, send it to the agent, and let Step 6 write only the version that survived. A demolished spec never lands in the file — we don't fix it after, it doesn't go in.

**If the anticipated issue is ✅ Go** (the specs are already in the ticket and have nothing to rewrite), there's no prior drafting: the artifact attacked is the **note as-is**. The pass still applies — that's even where it has the most value, a ✅ Go being precisely when refine found nothing to object to. If the `### Agentic specs` block from Step 5.5 was produced, it's part of the attacked artifact: the execution contract gets critiqued like everything else.

### What we give the agent, what we hide

- ✅ **Given** — the complete ticket note · the drafted specs content · **pointers** to project technical context (project README, project `CLAUDE.md`, constraints, target files).
- 🚫 **Hidden** — **the entire conversation history of the refine, without exception**: exchanges, {USER_NAME}'s validations, confirmed assumptions, tone of the discussion.

**Exclusion of conversation history is the entirety of the mechanism.** Transmitting it "for context" reopens exactly the flaw this step closes: the agent would see agreement build and comply with it. If the agent lacks material, the answer is **more technical project context** — never a snippet of conversation.

**Spawn** — tool `Agent`, `subagent_type: general-purpose`, single agent, synchronous.

### Hostile prompt (frozen — wording validated {USER_NAME} 2026-08-04)

```
You are adversarial reviewer. Your role: build the strongest case
AGAINST the spec below, like a reviewer who wants to sink it.

You did not participate in the discussion that produced this spec and you will
never see it. That's intentional: you have no agreement to preserve, no position
to defend, nobody to spare. Treat it like the work of a stranger that you
must prevent from going to production.

## Artifact attacked
[complete ticket note]

## Specs retained
[drafted content of ## Generated specs]

## Project technical context
[pointers: project README, project CLAUDE.md, constraints, target files]

## What you produce — 5 sections, in this order

1. **Steelman of the rejected approach** — the best version of the solution that
   was NOT chosen. Not a strawman: phrase it as someone who believes it better
   would defend it.
2. **If this spec is bad, here's the most probable reason** — ONE only,
   the most probable, not a list. Name the failure mechanism, not a
   generic risk.
3. **What would need to be true for this decision to fail?** — the
   conditions, and for each: verifiable now? at what cost?
4. **Confidence level** — your confidence in the direction taken by the spec,
   and what would make you change your mind.
5. **Middle grounds and leads** — hybrids between the retained approach and the
   rejected approach, or targeted fixes. For EACH, obligatory:
   **what it gains** and **what it loses**, both named.
   A lead whose loss you can't name is not a lead, it's a slogan: don't propose it.

## Prohibitions

- **No lead, fix or mitigation in sections 1 to 4.** They carry the burden, full stop. Everything that repairs goes in section 5, never before.
- **No benevolent opening or closing formula** ("broadly solid", "good foundation", "a few minor points"). You don't balance.
- **Don't fabricate objections.** If the spec holds, say so in section 4
  (high confidence) — don't invent grievances to fill space. An honest and short burden is better than a long hollow one.
- Ask no questions: you produce a report, you don't converse.
```

### Restitution in two phases

The agent produces 5 sections. The cut is made on a **section boundary declared in advance**, never on a judgment call from refine:

1. **Phase 1 — the burden of proof.** Restate **sections 1 to 4 in full**. Never drop an objection, never summarize it, never reclassify by severity, never comment on it. The main refine **does not nuance, defend, or contextualize** at this stage. Then stop and wait for {USER_NAME}'s reaction.
2. **Phase 2 — middle grounds and leads.** Restate **section 5**, only *after* {USER_NAME} has read and reacted. Each lead arrives with its gain **and** its loss, as the agent named them — never one without the other.

**Why a cut and not a filter**: the refine that produced the spec is precisely the instance with bias. Letting it choose which objections deserve surface, or interweaving each objection with its remedy, returns the power we just removed. Cutting on a section boundary is mechanical — it asks no judgment.

### Return to flow

{USER_NAME} arbitrates what stands and what doesn't. Retained objections **reopen the specs**: return Step 5.5/6, and the corrected version is what Step 6 writes. Rejected objections don't get rediscussed — that's their arbitration, not a negotiation.

## Step 6 — Conclusion and issue

**If Step 5.6 ran**, it precedes issue selection: the specs written here are those that survived the adversarial pass and {USER_NAME}'s arbitration, not the pre-pass version.

Propose one of five issues and document the decision:

**✅ Go — implement as-is**
- Specs are clear, assumptions confirmed, feasibility OK
- Ask whether {USER_NAME} wants to start now or later
- If "later": note the date and intention in the ticket (not just verbal)

**✏️ Adapt — modify the specs**
- Update the `## Generated specs` section of the ticket with decisions made — **post-pass 5.6 version** if it ran
- Move the ticket to Ready column if not already done
- **If Step 5.5 confirmed a dev ticket** → add in `## Generated specs` a subsection `### Agentic specs` structured in 6 points (0→5). The goal: an execution contract that an agent — or {USER_NAME} in manual dev — can follow without reinterpreting. References on agentic specs (Addy Osmani, O'Reilly, analysis of 2500+ repos) converge on three requirements this structure encodes: exact commands (not tool names), criteria verifiable in binary oracle, and boundaries in three explicit tiers.

  0. **Project context to load** — pointers, not content: read `claude-code/README.md`, the project `CLAUDE.md`, `claude-code/lessons.md`, and name the relevant skills *for this specific ticket* (ex: `/express-route-pattern`, `/vitest-test-pattern`). The conventions themselves (naming, TDD, DDD, stack) live in the project constitution and are never recopied here — duplicating them per ticket recreates the maintenance point that the 15/05 decision wanted to avoid and makes them diverge. If the project constitution is incomplete on a point, propose an addition to project `CLAUDE.md` separately — not a patch in the ticket.
  1. **Step-by-step executable breakdown** — each step = action + exact command if applicable (`npm test -- foo.spec.ts`, not "run the tests") + file(s) touched.
  2. **Review gates in three tiers** — ✅ what the agent does alone / ⚠️ what it stops on and asks / 🚫 what it never does. Vocabulary aligned with "Contract of an agentic task" in CLAUDE.md and [[03 - Knowledge/Claude code/agentic-coding-workflow]].
  3. **Testable done criteria** — format `input → observable output` or `this test passes`. Never "it works": a criterion must give pass/fail signal without interpretation.
  4. **Explicit scope + named out-of-scope** — taken from Agentic Contract in CLAUDE.md; named out-of-scope counts as much as scope.
  5. **Final self-verification** — the agent rereads its output against the criteria from point 3 and lists gaps before closing the phase. It's the net that catches the implementation that "looks done" but doesn't pass criteria.

**🗑️ Throw — abandon the ticket**
- Move the ticket to Done column with an abandonment note
- Document why in the ticket note

**🧊 Backlog V2 — ticket valid but premature**
- Tag `#V2` in the kanban
- Feed the project's `V2 ideas.md` file with the ticket and reasoning (create the file if it doesn't exist)
- Leave the ticket in Idea column — it will be picked up when prerequisites are met

**⏸️ Blocker — ticket valid but blocked**
- The ticket depends on missing external info, an undelivered feature, or a pending decision
- Identify precisely what blocks and who must unblock it
- Tag `#blocked` in the kanban + note the blocker in the ticket note

**For all issues**: update the ticket note with complete reasoning — that's refine's memory for future review.

## Absolute rules

- Never start coding without {USER_NAME} explicitly saying "go" or "take the lead"
- Always update the ticket note with decisions from the discussion
- Honest opinion beats reassuring opinion
- **During /refine, the only file modified is the ticket note** — never the target files of implementation ({USER_NAME}.md, skills, daily notes, CLAUDE.md, etc.). Any modification outside the ticket must wait for explicit "go".
- **The adversarial agent of Step 5.6 never receives the refine conversation history** — neither excerpt, nor summary, nor "for context". It's the entire mechanism of the step: an agent that saw agreement build complies with it. Lack of context → add *technical project context*, never conversational.
- **No improvement lead at phase 1 of 5.6 restitution.** Sections 1 to 4 of the burden of proof are fully restated and alone; section 5 (middle grounds and leads) arrives only after {USER_NAME}'s reaction. Never interweave, never anticipate "to be constructive" — that's exactly the dilution this step exists to prevent.
