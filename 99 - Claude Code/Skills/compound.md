---
name: compound
description: Run 2-3 times a year on a strategic question — career, personal architecture, relationship with ADHD. Answers the same question at three moments in the vault to show how answer quality evolves as context accumulates. Different from /trace (understanding how an idea evolved): /compound measures whether the vault actually makes answers better.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimisation**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips the narrative instructions (grouping, context, highlights, open questions, tone, narration). Preserving qualitative content takes priority over reducing line count.

# Skill: /compound

Answers the same question three times — at three distinct moments in the vault — using only the context available at each point in time. The equal length constraint between the three answers is the heart of the skill: it isolates quality from volume, and forces you to see whether the vault actually improves answers or just makes them longer.

**Difference from `/trace`**: `/trace` follows the evolution of an idea in the vault (understanding). `/compound` answers a question at three different moments (measuring whether the vault thinks better).

**Full flow:** Validate Q (Step 0) → Analyse vault (Step 1) → Choose 3 periods (Step 2) → Context inventory (Step 3) → Predict (Step 4) → Generate 3 answers (Step 5) → Check anachronisms (Step 6) → Synthesis + delta (Step 7) → Save (Step 8).

## Trigger

```
/compound [question]
```

**Good questions:**
- Questions whose answer depends on personal context (no universal answer)
- Strategy, posture, or decision-making questions
- Questions where more context changes the answer — not just its length

**Bad questions:**
- Factual questions with stable answers ("how does JWT work?")
- Subjects barely touched on in the vault

---

## Step 0 — Validate the question and search for a previous run

**Validate first:** Does this question depend on {USER_NAME}'s personal context?

- **Yes** → continue
- **No** → say so clearly and propose a reformulation if possible

**Check vault depth on this subject:** Glob `03 - Knowledge/` and daily notes (`00 - Daily notes/`). Does the vault contain at least **6 months of substantial history** on this subject? (At least 3+ knowledge notes OR 20+ daily notes mentioning the subject, distributed over the period.)
- If **yes** → continue
- If **no** → clearly signal that the vault is too young for this subject and propose a null result rather than forcing three periods

**Search for a previous run:** Glob `03 - Knowledge/Compound/` to list existing notes (the folder may not exist if this is the first run — that's normal). Look for a note whose name contains the key terms of the question.
- If found → read the note: extract the run date, the 3 answers (especially Period C — "Now"), and the final synthesis
- If absent (empty or non-existent folder) → continue without comparison (delta will be omitted in Step 7)

---

## Step 1 — Analyse the vault timeline

Understand when the relevant context actually accumulated. Look for **operational inflection points** — moments where context density changes significantly.

**Analysis criteria:**

- **Daily note density**: measure the transition from a "sparse" phase (< 5 mentions/month) to "regular" (5-10 mentions/month) to "dense" (> 10 mentions/month). Note transition dates.
- **Knowledge notes**: when were the first substantial notes on this subject created? List key dates (first mention, major essay, ADR, active project, etc.). A note counts if it has >100 words and is not a bookmark.
- **Incoming backlinks**: from which dated notes is this subject referenced? Enables seeing reconvergences and cross-domain integration.
- **Change signals**: shift in tone in daily notes, appearance of new concerns, abandonment of old questions, new projects launched

---

## Step 2 — Select three periods

Choose real inflection points — **not fixed intervals**. Criterion: at what moment did the relevant context on this subject significantly increase (transition from one density to the next in Step 1)?

- **Period A (Beginning)**: First substantial note on this subject. Minimal context — just enough to answer, no more. The date is that of the first file identified in Step 1 (first mention).
- **Period B (Middle)**: Notable inflection — from this point, density increased (transition sparse → regular, or regular → dense). Answers would have been visibly different.
- **Period C (Now)**: Full vault — today, with all accumulated history.

**Young vault?** If you can only identify one or two distinct periods (fewer than 6 months of relevant history), signal this to {USER_NAME} — null result is valid, do not force three periods.

If the vault does not have enough temporal depth on this subject → say so, do not fabricate.

---

## Step 3 — Context inventory per period

For each period, **list the concrete files** available at that moment. Selection strategy:

1. **Identify all relevant files**: glob `03 - Knowledge/*`, daily notes, `Projects/[Project]/ADR/`, `99 - Claude Code/` if created before the period.
2. **Filter by date**: eliminate everything created after the period.
3. **Select 3-5 of the most relevant**: priority order: (a) notes dedicated to the subject, (b) ADRs that reveal a position, (c) daily notes showing the density of concern at that time. Exclude bookmarks and notes < 100 words.
4. **List the result**: format of 3-5 bullet points with exact path.

**Example format:**
- `03 - Knowledge/How I think about X — 2025-11-20.md` (key decision)
- `00 - Daily notes/2025-11-18.md` (3 mentions of subject)
- `Projects/Rust/ADR/001 — Stack choices.md` (learning context)

---

## Step 4 — Predictions before generation

Before writing the three answers, formulate a structured prediction: how will the quality and form of the answer change between A, B and C? **This step locks in your understanding before generation — it prevents confabulation.**

**Structured format:**
- **Dimension 1**: [Measurable aspect — e.g. clarity, depth, nuance, resilience, tone, concrete actions]. Prediction: "A will be X (because [limited files]), B will show Y (thanks to [new accumulation]), C will reach Z (with [full integration])".
- **Dimension 2**: same (at least 2 dimensions, max 3)
- **Uncertainty**: One zone where you cannot predict — why is it unclear?

**Before continuing to Step 5:** Validate your prediction with {USER_NAME} — check it makes sense given the Step 3 inventories. Adapt if needed. Continue only when {USER_NAME} validates (or says "looks good, generate").

---

## Step 5 — Generate the three answers

### Strict constraints (non-negotiable)

1. **Context boundary** — answer A uses ONLY the context of period A. No leaking of later information. Check: every fact/reference cited must exist in the Step 3 inventory for that period.

2. **Equal length ±20%** — this is the heart of the mechanism: it isolates quality from volume (not padding). **Strict measurement**: `wc -w` (raw word count, excluding titles/metadata). Average of the three = M. Accept A/B/C if each ∈ [0.8×M, 1.2×M]. Recalculate M if Step 6 requires a rewrite.

3. **Same voice** — first person, embodying {USER_NAME} at each period (not an external narrator). The voice may mature A→C (natural), but always remains {USER_NAME}'s. No condescension in A, no self-satisfaction in C.

### Presentation format

```
## Period A — [temporal label]
[Available context: list in 2-3 lines]

[Answer — X words]

---

## Period B — [temporal label]
[Available context: list in 2-3 lines]

[Answer — X words]

---

## Period C — Now
[Available context: list in 2-3 lines]

[Answer — X words]
```

---

## Step 6 — Verification

### Anachronism check
Before accepting the three answers, verify that A/B contain NO fact that appeared after that period. If an anachronism is found:
1. Identify precisely: what fact, what actual date of appearance in the vault
2. Rewrite the answer by removing this fact and replacing it with an equivalent available at the period
3. Redo the word count — recalculate M if total length changes
4. Log the correction in Step 7

### Predictions check
Compare Step 4 predictions vs actual results. What diverged? Why? Integrate this gap into the final synthesis — it is valid data.

---

## Step 7 — Synthesis

A short synthesis (5-8 lines) that answers: did the vault improve the quality of the answer, or only its volume?

If answers did not significantly improve → that is the result. Do not force a progression narrative. A null result is valid information.

### Delta from previous run (if applicable)

If a previous run was found in Step 0, add this section:

```
## Delta since the run of [YYYY-MM-DD]

**What changed**: viewpoints that have evolved, new dimensions absent from the previous run, abandoned or nuanced positions.

**What was confirmed**: stable positions across both runs — signs of anchored thinking.

**Observable shifts**: changes in {USER_NAME}'s working mode, priorities or context between the two runs (deduced from answer content, not invented).

**Compounding quality**: is the answer better, more nuanced, richer? Or stagnant? Be honest — stagnation is valid information.
```

If no previous run → omit this section entirely.

---

## Step 8 — Save the result

After the synthesis, create `03 - Knowledge/Compound/YYYY-MM-DD — [question in 3-5 words].md` with the complete session content (question, 3 answers, verification, synthesis, delta if applicable). Date format: `YYYY-MM-DD` (e.g. `2026-04-01`). Always create this note — it enables comparing subsequent runs on the same question.

If a `/compound` note on the same question already exists (same subject, same question) → indicate this to {USER_NAME} and ask whether they want to create a new note or enrich the existing one. The same subject can have multiple runs (e.g. `2026-02-15 — how i think about refactoring.md` and `2026-04-01 — how i think about refactoring.md` = two different snapshots).

---

## Anti-patterns (ranked by impact — to prevent)

### Critical (break the skill)
1. **Context leak** — using in A information that only exists in C. Invalidates A/B/C.
2. **Forced compounding** — fabricating a "progression" the vault does not show. The skill measures, does not narrate.
3. **Caricatured answer A** — A must be honest (what the vault had), not deliberately impoverished to create contrast.

### Important (weaken reliability)
4. **Volume illusion** — longer ≠ better. Equal length exists for this reason.
5. **Vault summary** — answer the question, do not list available content.
6. **Blind cheerleading** — celebrate every progression. A null result is valid and informative.

### To avoid
7. **Periods too close** — if A and B are only separated by a few weeks, the delta will be noisy. Signal to {USER_NAME} if the vault is too young.

---

## Absolute rules

- **Validate the question first** — if it does not depend on personal context, say so clearly
- **Equal length ±20%** — non-negotiable, it is the heart of the mechanism
- **Null result = valid result** — never force a progression narrative
- **Predict before generating** — Step 4 + {USER_NAME} validation before Step 5
- **Introspective use** — this skill is for {USER_NAME}, not an external demonstration
