---
name: trace
description: Retrace the evolution of an idea in the vault — when it appeared, how it changed, where it stands now. Chronological pair-programming: Claude searches + synthesises, {USER_NAME} validates at 3 key points (synonyms, raw results, timeline). Trigger when {USER_NAME} wants to understand how a thought has matured, detect a contradiction, or map a concept's trajectory. Examples: "/trace ADHD", "/trace software architecture", "/trace Brno", "/trace pair programming".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimisation**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips the narrative instructions (grouping, context, highlights, open questions, tone, narration). Preserving qualitative content takes priority over reducing line count.

# Skill: /trace

An idea in a vault is never fixed. It appears under one name, changes form, merges with others, contradicts itself. The `/trace` skill follows this evolution chronologically — not to tell a clean story, but to make visible what actually happened in {USER_NAME}'s thinking.

**Difference from `/recall`**: `recall` looks for *what exists* on a subject; `trace` looks for *how that subject changed over time*.

---

## Trigger

```
/trace [concept]         → traces the evolution of this concept in the vault
/trace ADHD              → how the understanding of ADHD has evolved
/trace architecture      → how the vision of software architecture has changed
/trace pair programming  → how the vision of working with Claude Code has evolved
```

---

## Step 0 — Check viability

**Before launching the trace**, determine whether the concept exists in the vault over a significant duration.

Claude runs a light initial grep (max 10 seconds) on the obvious terms of the concept. Three possible cases:

1. **Rich concept** (10+ occurrences, 2+ months of evolution) → continue to Step 1
2. **Very new or rare concept** (1-5 occurrences, <1 month) → notify {USER_NAME}: "This concept has very few traces. The trace will be short/thin. Continue?"
3. **Absent concept** (0 occurrences) → stop and tell {USER_NAME}: "I cannot find any trace of [concept] in the vault. Do you want me to search for variants?" → return to Step 1 if {USER_NAME} provides variants

This is a mini-validation BEFORE investing 5 minutes in Steps 1-2.

---

## Step 1 — Build and validate the synonym map

**Before searching for anything**, generate the full list of terms to search. An idea often changes names over time — searching only the original term misses earlier or parallel occurrences.

For the concept passed as argument, list:
- The exact term + its spelling variants
- Direct synonyms
- Adjacent terms (concepts that often co-evolve with this one)
- Negative formulations (e.g. "I can't manage to..." reveals a relationship with a concept)
- Abbreviations and acronyms used by {USER_NAME}

Example for `/trace ADHD`:
```
Terms: ADHD, ADD, attention, focus, concentration, procrastination,
       hyperfocus, executive dysfunction, motivation, drift, "taking control of"
```

**{USER_NAME} VALIDATION REQUIRED** — Present this list and wait for their response:
- If {USER_NAME} says "looks good" or implicitly validates → Step 2.
- If {USER_NAME} adds terms, reformulates or removes → integrate and ask for confirmation again.
- If {USER_NAME} says "this concept doesn't exist in my vault" or "too new" → stop and signal.

---

## Step 2 — Search in sources (5 directories in parallel)

The validated synonym list is known → launch the search across the 5 directories in parallel. **Claude runs the 5 Greps in parallel, {USER_NAME} validates the results afterwards.**

Each search returns matches with their context (file, date, exact excerpt):

```
Agent 1: `00 - Daily notes/` → search all terms + [[term]]
Agent 2: `03 - Knowledge/` → search all terms + [[term]]
Agent 3: `99 - Claude Code/ADR/` → search all terms + [[term]]
Agent 4: `99 - Claude Code/Sessions/` → search all terms + [[term]]
Agent 5: `04 - Projects/*/claude-code/` → search all terms + [[term]]
```

**Processing results** (Claude):
- Aggregate the 5 returns by uniqueness (file + line)
- For each match: extract **file, date (deduced from name or frontmatter), exact excerpt**
- Mark backlinks `[[term]]` as "high confidence"
- Signal if a term has ZERO occurrences → note `[absent from vault]`

**Pause for validation**: present raw results to {USER_NAME}. They can request additional searches or validate for Step 3.

---

## Step 3 — Detect implicit patterns and gaps

**Claude analyses the results from Step 2** to identify implicit traces: moments where the concept appears *without being named*.

Patterns to look for:
- **Decisions that reveal a position**: an ADR may reflect a belief without ever naming the concept
- **Emotional reactions**: "that frustrated me", "that's exactly it" indicate a relationship with an underlying idea
- **Recurring approaches**: if {USER_NAME} always solves the same problems the same way, that's an implicit pattern
- **Significant absences**: a subject that suddenly disappears from the vault after having been frequent

These implicit patterns will be marked `[implicit]` in the timeline.

**Claude also signals gaps**:
- Empty periods (e.g. concept abundant until date X, then silence for 6 months)
- Terms absent from the vault (marked `[absent]`)
- Expected but missing files (e.g. project CLAUDE.md not showing a decision on the subject)

**Note on temporal breakdown**: if the trace covers > 2 years or > 50 entries, Claude asks {USER_NAME}: "The trace is very long. Do you want to see it complete or segmented by period/theme?" and waits for the response before Step 4.

---

## Step 4 — Build and validate the timeline

**Claude builds** the timeline from Steps 2-3 results, organising chronologically.

For each timeline entry:

```
[DATE] — [SOURCE] — [confidence]
"[exact excerpt, verbatim quote]"
→ [context in one sentence: what was happening at that moment?]
```

**Confidence markers (mandatory on each entry):**

| Marker | Meaning |
|--------|---------|
| `[solid]` | Clearly stated position, unambiguous |
| `[evolving]` | Position in transition, signs of change |
| `[hypothesis]` | Tentative idea, explored without firm conviction |
| `[questioning]` | Explicit doubt, questioning a previous position |
| `[implicit]` | Deduced from a pattern, not directly named |
| `[absent]` | Period without occurrences or term not found |

**Citation rule**: always use {USER_NAME}'s exact words, in quotes. Never paraphrase. If the excerpt is too long, cut with `[...]` but preserve key formulations.

**Catalysts**: if a change is visible between two entries, identify what caused it — a reading, an event, a project, a decision. Mark them `→ ⚡ Catalyst: ...`.

**{USER_NAME} VALIDATION REQUIRED** — Before Step 5:
- Present the raw timeline
- {USER_NAME} can flag: wrong dates, misinterpretation, forgotten entry, incorrect context
- Integrate feedback, then proceed to Step 5

---

## Step 5 — Identify and present the arc

**Claude builds** a narrative analysis from the validated timeline. Mandatory sections:

### Initial appearance
- When did the concept first appear?
- In what form? With what initial confidence?

### Inflection points
- What moments made the thinking evolve?
- What caused each pivot?

### Current position
- Where does {USER_NAME} stand on this subject now?
- With what level of confidence?

### Evolution pattern

Classify the arc among these types:

| Type | Definition |
|------|-----------|
| **Linear** | Progressive deepening of the same position |
| **Pivot** | Abandonment of a previous position — clear break |
| **Convergence** | Several distinct threads that come together into a unified position |
| **Divergence** | An initial idea that splits into two distinct positions |
| **Circular** | Return to a previous position after exploring others |

### Unresolved contradictions
What tensions persist in current thinking?

### Probable trajectories
Where does this thinking seem to be heading? What questions remain open?

---

## Output format (Step 5, final synthesis)

```
## Trace: [concept] — [analysis date]

### Terms searched (validated by {USER_NAME})
[list of synonyms + adjacent terms used]

### Timeline
[DATE] — [source] [confidence]
"[exact quote]"
→ [context]

[DATE] — [source] [confidence]
"[exact quote]"
→ [context]
→ ⚡ Catalyst: [what caused the change]

[Note on detected gaps or absences]

### Arc
**Type**: [linear / pivot / convergence / divergence / circular]
**Appearance**: [when, in what form, confidence]
**Inflections**: [list of key moments + catalysts]
**Current position**: [summary] [confidence]
**Contradictions**: [unresolved tensions, or "none detected"]
**Trajectory**: [where it seems to be heading, open questions]
```

**Note**: Synonyms appear AT THE TOP (validated by {USER_NAME} in Step 1), not at the end. Gaps and absences are noted after the timeline for context.

---

## Absolute rules

### Citations and dates
- **Exact citations mandatory** — never paraphrase {USER_NAME}'s words, always use quotes and `[...]` to cut
- **Date every entry** — an undated entry is useless for a timeline. If the date is approximate, note it `[~DATE]`
- **Confidence markers on every entry** — `[solid]`, `[evolving]`, `[hypothesis]`, `[questioning]`, `[implicit]`, or `[absent]`

### Workflow and validation
- **Step 1 → {USER_NAME} VALIDATION** — never start the Grep without agreement on synonyms
- **Step 2 → present raw results** — {USER_NAME} can request additional searches
- **Step 4 → {USER_NAME} VALIDATION** — before synthesising the arc, validate dates and contexts
- **No solo interpretation** — if a position is ambiguous, mark it `[hypothesis]` or `[questioning]`, not `[solid]`

### Content
- **Explicitly signal gaps**: empty periods, unfindable terms, missing files
- **No judgement**: the skill describes an evolution, it does not say which position is "better"
- **Look for catalysts**: every pivot must have an explanation (reading, event, decision)

### Output
- **Present the complete result** before asking questions
- **Name exact sources**: not "Daily notes" but "00 - Daily notes/2026-03-15.md"
