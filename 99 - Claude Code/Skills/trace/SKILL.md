---
name: trace
description: "Trace the evolution of an idea in {USER_NAME}'s vault — when it appeared, how it changed, where it is now. Chronological pair-programming: Claude searches + synthesizes, {USER_NAME} validates at 3 key points (synonyms, raw results, timeline). Trigger when the user wants to understand how a thought has matured, detect a contradiction, or map the trajectory of a concept. Examples: \"/trace ADHD\", \"/trace software architecture\", \"/trace Brno\", \"/trace pair programming\"."
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /trace

An idea in a vault is never fixed. It appears under one name, changes form, merges with others, contradicts itself. The `/trace` skill follows this evolution chronologically — not to tell a clean story, but to make visible what actually happened in {USER_NAME}'s thinking.

**Difference from `/recall`**: `recall` searches *what exists* on a subject; `trace` searches *how that subject changed over time*.

---

## Triggering

```
/trace [concept]         → trace the evolution of this concept in the vault
/trace ADHD              → how understanding of ADHD has evolved
/trace architecture      → how the vision of software architecture has changed
/trace pair programming  → how the vision of working with Claude Code has evolved
```

---

## Step 0 — Verify viability

**Before launching the trace**, determine if the concept exists in the vault over a significant duration.

Claude executes a light initial grep (10 seconds max) on the concept's obvious terms. Three possible cases:

1. **Rich concept** (10+ occurrences, 2+ months of evolution) → continue to Step 1
2. **Very new or rare concept** (1-5 occurrences, <1 month) → signal to {USER_NAME}: "This concept has very few traces. The trace will be short/thin. Continue?"
3. **Absent concept** (0 occurrences) → stop and say to {USER_NAME}: "I find no trace of [concept] in the vault. Would you like me to search for variants?" → return to Step 1 if {USER_NAME} provides variants

This is a mini-validation BEFORE investing 5 minutes in Steps 1-2.

---

## Step 1 — Build and validate the synonym map

**Before searching for anything**, generate the complete list of terms to search. An idea often changes names over time — searching only for the original term misses prior or parallel occurrences.

For the concept passed as argument, list:
- The exact term + its spelling variants
- Direct synonyms
- Adjacent terms (concepts that often co-evolve with this one)
- Negative formulations (e.g., "I can't..." reveals a relationship with a concept)
- Abbreviations and acronyms used by {USER_NAME}

Example for `/trace ADHD`:
```
Terms: ADHD, ADD/H, attention, focus, concentration, procrastination,
       hyperfocus, executive dysfunction, motivation, drift, "take the reins on"
```

**VICTOR'S VALIDATION MANDATORY** — Present this list and wait for his response:
- If {USER_NAME} says "looks good" or implicitly validates → Step 2.
- If {USER_NAME} adds terms, reformulates, or removes → integrate and ask for confirmation again.
- If {USER_NAME} says "this concept doesn't exist in my vault" or "too new" → stop and signal.

---

## Step 2 — Search in sources (5 directories in parallel)

The validated synonym list is known → launch the search in the 5 directories in parallel. **Claude executes the 5 Greps in parallel, {USER_NAME} validates the results afterward.**

Each search returns matches with their context (file, date, exact excerpt):

```
Agent 1: `00 - Daily notes/` → search all terms + [[term]]
Agent 2: `03 - Knowledge/` → search all terms + [[term]]
Agent 3: `99 - Claude Code/ADR/` → search all terms + [[term]]
Agent 4: `99 - Claude Code/Sessions/` → search all terms + [[term]]
Agent 5: `04 - Projects/*/claude-code/` → search all terms + [[term]]
```

**Result processing** (Claude):
- Aggregate the 5 returns by uniqueness (file + line)
- For each match: extract **file, date (deduced from name or frontmatter), exact excerpt**
- Mark `[[term]]` backlinks as "high confidence"
- Signal if a term has ZERO occurrences → note `[absent from vault]`

**Pause for validation**: present raw results to {USER_NAME}. He can request additional search or validate for Step 3.

---

## Step 3 — Detect implicit patterns and gaps

**Claude analyzes the results from Step 2** to identify implicit traces: moments when the concept appears *without being named*.

Patterns to search for:
- **Decisions that reveal a position**: an ADR may reflect a belief without ever naming the concept
- **Emotional reactions**: "it frustrated me", "that's exactly it" indicate a relationship with an underlying idea
- **Recurring approaches**: if {USER_NAME} always solves the same problems the same way, it's an implicit pattern
- **Significant absences**: a subject that suddenly disappears from the vault after being frequent

These implicit patterns will be marked `[implicit]` in the timeline.

**Claude also signals gaps**:
- Empty periods (e.g., concept abundant until date X, then silence for 6 months)
- Terms absent from vault (marked `[absent]`)
- Expected files but missing (e.g., project CLAUDE.md not showing a decision on the subject)

**Note on time segmentation**: if the trace covers > 2 years or > 50 entries, Claude asks {USER_NAME}: "The trace is very long. Do you want to see it complete or segmented by period/theme?" and waits for the response before Step 4.

---

## Step 4 — Build and validate the timeline

**Claude builds** the timeline from results of Steps 2-3, organizing chronologically.

For each timeline entry:

```
[DATE] — [SOURCE] — [confidence]
"[exact excerpt, verbatim citation]"
→ [context in one sentence: what was happening at this moment?]
```

**Confidence markers (mandatory on each entry):**

| Marker | Meaning |
|--------|---------|
| `[solid]` | Position clearly stated, without ambiguity |
| `[evolving]` | Position in transition, indices of change |
| `[hypothesis]` | Tentative idea, explored without affirmed conviction |
| `[questioning]` | Explicit doubt, questioning of an earlier position |
| `[implicit]` | Deduced from a pattern, not directly named |
| `[absent]` | Period without occurrences or term not found |

**Citation rule**: always use {USER_NAME}'s exact words, in quotes. Never paraphrase. If the excerpt is too long, cut with `[...]` but preserve key formulations.

**Catalysts**: if a change is visible between two entries, identify what triggered it — a reading, an event, a project, a decision. Mark them `→ ⚡ Catalyst: ...`.

**VICTOR'S VALIDATION MANDATORY** — Before Step 5:
- Present the raw timeline
- {USER_NAME} can flag: wrong dates, misinterpretation, forgotten entry, wrong context
- Integrate feedback, then move to Step 5

---

## Step 5 — Identify and present the arc

**Claude builds** narrative analysis from the validated timeline. Mandatory sections:

### Initial appearance
- When did the concept first appear?
- In what form? With what initial confidence?

### Inflection points
- What moments made the thinking evolve?
- What triggered each pivot?

### Current position
- Where is {USER_NAME} on this subject now?
- With what level of confidence?

### Evolution pattern

Classify the arc among these types:

| Type | Definition |
|------|-----------|
| **Linear** | Progressive deepening of the same position |
| **Pivot** | Abandonment of an earlier position — clear rupture |
| **Convergence** | Multiple distinct threads that come together in one unified position |
| **Divergence** | An initial idea that splits into two distinct positions |
| **Circular** | Return to an earlier position after exploring others |

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
"[exact citation]"
→ [context]

[DATE] — [source] [confidence]
"[exact citation]"
→ [context]
→ ⚡ Catalyst: [what triggered the change]

[Note on detected gaps or absences]

### Arc
**Type**: [linear / pivot / convergence / divergence / circular]
**Appearance**: [when, in what form, confidence]
**Inflections**: [list of key moments + catalysts]
**Current position**: [summary] [confidence]
**Contradictions**: [unresolved tensions, or "none detected"]
**Trajectory**: [where it seems to be heading, open questions]
```

**Note**: The synonyms appear AT THE HEAD (validated by {USER_NAME} in Step 1), not at the end. Gaps and absences are noted after the timeline for context.

---

## Step 6 — Anchoring in the vault (optional, NEVER automatic)

`/trace` is **read-only by default**. The trace is presented in conversation, period. {USER_NAME} reads, then decides.

**Triggering**: only if {USER_NAME} explicitly asks after reading the output — "anchor that", "keep that", "put it in the vault". Never propose writing before presenting the full Step 5. Never write without explicit OK.

*Why this safeguard*: a trace that writes itself fills the vault with unvalidated analyses. The correct order is read → validate → anchor, like the three validations of Steps 1/2/4.

### Destination

```
03 - Knowledge/Traces/trace-[concept-in-kebab-case].md
```

Update `03 - Knowledge/Traces/INDEX.md` (table `| Trace | Concept | Arc | Date |`).

### Frontmatter

```yaml
---
title: Trace — [sentence that says the arc, not just the concept]
date: [YYYY-MM-DD]
type: trace
source: /trace "[concept as passed in argument]"
tags: [...]
---
```

### Composition rule — don't reduplicate the vault

This is the rule that makes the note valuable. **Before writing, identify what the trace brings that the vault doesn't say anywhere** — typically overlooked priority, a contradiction between two notes never brought together, a structural absence, an unidentified catalyst.

Structure:

1. **Net findings up front** — numbered, each sourced. This is the deliverable.
2. **Timeline as evidence base** — phases, exact citations `file:line`, confidence markers, catalysts ⚡.
3. **The arc**, **unresolved contradictions**, **open questions**.
4. **Links** — and **explicit referral** to what is not reduplicated.

⚠️ Never recoppy what `01 - Me/{USER_NAME}.md`, a `closemonth` or a `closeweek` already tells — link to it. A duplicated account diverges at the first update of the source.

### Side effects to propose (never execute without OK)

If the trace contradicts an existing note, ticket, or essay, **signal it** and propose a `## ⚠️ Revision post-trace ([date])` block in the concerned file — without settling its status in place of {USER_NAME}.

---

## Absolute rules

### Citations and dates
- **Exact citations mandatory** — never paraphrase {USER_NAME}'s words, always use quotes and `[...]` to cut
- **Date each entry** — an entry without a date is useless for a timeline. If the date is approximate, note it `[~DATE]`
- **Confidence markers on each entry** — `[solid]`, `[evolving]`, `[hypothesis]`, `[questioning]`, `[implicit]`, or `[absent]`

### Workflow and validation
- **Step 1 → VICTOR'S VALIDATION** — never start Grep without agreement on synonyms
- **Step 2 → present raw results** — {USER_NAME} can request additional searches
- **Step 4 → VICTOR'S VALIDATION** — before synthesizing the arc, validate dates and contexts
- **No solo interpretation** — if a position is ambiguous, mark it `[hypothesis]` or `[questioning]`, not `[solid]`

### Content
- **Signal gaps explicitly**: empty periods, unfound terms, missing files
- **No judgment**: the skill describes an evolution, it doesn't say which position is "better"
- **Search for catalysts**: each pivot must have an explanation (reading, event, decision)

### Output
- **Present the complete result** before asking questions
- **Name exact sources**: not "Daily notes" but "00 - Daily notes/2026-03-15.md"
- **Read-only by default** — Step 6 (anchoring) triggers only on explicit request from {USER_NAME}, after reading Step 5. Never automatic writing, never propose writing before synthesis.
