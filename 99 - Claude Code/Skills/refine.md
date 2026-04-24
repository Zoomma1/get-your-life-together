---
name: refine
description: Challenge a ticket or feature before coding — structured discussion in 6 steps: extract hidden assumptions, severity matrix (Crack/Tension/Foundation risk), free discussion, underlying question, conclusion on 5 possible issues (Go / Adapt / Throw / Backlog V2 / Blocker). Trigger when Victor says "refine", "/refine [ticket name]", "let's discuss this feature", "challenge this ticket", "is this feasible", "validate specs", "what alternatives", or before starting a feature with fuzzy specs. Pair programming mode — no code until Victor explicitly says "go" or "take the wheel".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured by **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (regrouping, context, strong moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Refine

This skill opens a structured discussion on a ticket or feature **before code**. The goal is to avoid 3 common pitfalls:
1. Coding the wrong thing because specs are fuzzy
2. Discovering mid-way that a dependency or assumption was false
3. Implementing in the wrong direction for lack of exploring alternatives

Refine = challenge specs, identify what's implicit, assess feasibility, and decide together on next steps.

## Trigger

- Command `/refine [ticket name]`
- Victor says "let's discuss this feature", "challenge this ticket", "is this feasible", "take over refining ticket X"

**Skill structure**: 6 steps — load context → extract assumptions → analysis+risks → discussion → underlying question → conclusion

## Step 1 — Load context

1. Search for ticket in active project Kanbans:
   - Read `{VAULT_PATH}\{PROJECTS_FOLDER}\[ProjectName]\` to locate Features or Kanban file
   - Search for ticket note (format: `FeatureName.md` or equivalent)
2. If found → read ticket note + existing specs. **Proceed directly, without asking permission — Victor named the ticket, he expects it to be loaded.**
3. Read project README (`{VAULT_PATH}\{PROJECTS_FOLDER}\[ProjectName]\claude-code\README.md`) for technical context
4. **Never load skills by anticipation** — wait for Victor's explicit request ("show me", "how would you do it", "take the wheel")

**If ticket not found or poorly named** → ask Victor to describe it directly in chat. Accept verbal description as source of truth for refine. If description is fragmentary, iterate: ask clarifying questions (scope, context, dependencies) before moving to Step 2.

## Step 2 — Extraction and validation of assumptions

Before analyzing the ticket, identify hidden assumptions it contains. State them explicitly:

- "We assume that..." (ex: "...the DB is accessible in real time")
- "This supposes that..." (ex: "...Victor has access to a third-party API")
- "This works only if..." (ex: "...we accept a 2s latency")

**Concrete format**: present 3-5 key assumptions, one per line, validated against ticket and project README.

**Then validate with Victor** before continuing. Goal: avoid spending an hour discussing a false version of the ticket.
- If Victor confirms → continue to Step 3
- If Victor contradicts → immediately return to Step 1 to re-read and adjust
- If Victor adds an assumption → incorporate and re-validate

## Step 3 — Analysis + Severity matrix

Present honest analysis with risk classification:

```
## Analysis of [TicketName]

### What I understand
[Summary of what the ticket requests]

### Feasibility
[Feasible / Feasible with constraints / Complex / Needs reconsideration]

### Risks and pain points
- **Crack** (minor) — [ex: small ambiguity or detail to clarify]
- **Tension** (blocker until resolved) — [ex: contradiction, missing decision]
- **Foundation risk** (critical) — [ex: external dependency, assumption false = ticket collapses]

### Open questions
- ...

### My opinion
[Direct opinion — no corporate speak]
```

**Risk classification**:
- **Crack** → continue discussion, revisit next sprint if needed
- **Tension** → ask Victor now, block Go until resolved
- **Foundation risk** → STOP. Identify who must validate and document dependency. Tag `#blocked` if blocking.

**Treat in order**: Foundation risks first, then Tensions, then Cracks.

## Step 4 — Discussion

Free discussion mode — Victor gives opinion, iterate until decision or pivot.

**Rules during discussion**:
- Name problems directly, propose alternative, let Victor decide — no automatic validation
- Stay concrete — always anchor in real project context
- No code during discussion — only when Victor says "show me" or "take the wheel"
- **Limit**: if discussion loops (same question 3+ times, no progress), propose stopping and waiting for more info. Document stopping point in ticket.

**If Victor wants to abort or pivot**:
- Respect decision without negotiating
- Document what was explored and why discussion stops (for future context)
- Move to Step 6 (Conclusion) and select appropriate issue (often Blocker if external dependency, or Backlog V2 if future pivot)

## Step 5 — The underlying question

Before concluding, identify and ask the hidden question — the one not explicitly named but conditioning final decision:

**Concrete examples**:
- "Do we accept a complicated solution now or simplify it in V2?"
- "What's really the blocking dependency — is it truly insurmountable?"
- "Code for the nominal case or prevent all edge cases?"
- "Does this ticket solve the real user problem, or just a symptom?"

**Why this matters**: Tensions and Cracks we identified often reflect a single real underlying question. Asking it directly speeds final decision.

**Attitude**: ask question directly, no corporate speak. Don't auto-validate answer — wait for Victor's reaction.

## Step 6 — Conclusion and issue

Propose one of five issues and document decision:

**✅ Go — implement as is**
- Specs are clear, assumptions confirmed, feasibility OK
- Ask if Victor wants to start now or later
- If "later": note date and intent in ticket (not just verbal)

**✏️ Adapt — modify specs**
- Update ticket's `## Generated specs` section with decisions made
- Move ticket to Ready column if not already

**🗑️ Throw — abandon ticket**
- Move ticket to Done column with abandonment note
- Document why in ticket note

**🧊 Backlog V2 — ticket valid but premature**
- Tag `#V2` in kanban
- Feed project's `V2 ideas.md` file with ticket and reasoning (create file if missing)
- Leave ticket in Idea column — will be picked up when prerequisites met

**⏸️ Blocker — ticket valid but blocked**
- Ticket depends on missing external info, undelivered feature, or pending decision
- Identify precisely what blocks and who must unblock
- Tag `#blocked` in kanban + note blocker in ticket

**For all issues**: update ticket note with full discussion reasoning — it's the refine memory for future review.

## Absolute rules

- Never start coding without Victor explicitly saying "go" or "take the wheel"
- Always update ticket note with discussion decisions
- Honest opinion beats reassuring opinion
