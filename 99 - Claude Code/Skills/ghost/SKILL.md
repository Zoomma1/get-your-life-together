---
name: ghost
description: Answer a question in the voice of {USER_NAME} by relying only on what the vault contains. Use when the user wants to know "what they would think about X" without brainstorming from scratch, to draft an essay from their existing positions, or to test if the vault truly captures their thinking. Examples: "/ghost What do you think of DDD applied to solo projects?", "/ghost How do you handle procrastination?".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **narrative qualitative** output. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (regrouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /ghost

Answers a question as {USER_NAME} would have written it — by relying only on what the vault contains. Then reveals the mechanics behind the answer.

The fundamental rule: each claim must be sourced in the vault (VAULT), strongly implicit from multiple sources (INFERRED), or explicitly marked as extrapolated (EXTRAPOLATED). Beyond 50% EXTRAPOLATED or UNKNOWN → refuse and report what the vault actually contains.

---

## Step 0 — Classify the question and define refusal threshold

**Decision 1: Question type**

| Type | Example | Refusal threshold |
|------|---------|-------------------|
| Factual | "What is your current stack?" | >20% EXTRAPOLATED |
| Opinion | "What do you think of X?" | >40% EXTRAPOLATED |
| Advice | "What would you say to someone about X?" | >50% EXTRAPOLATED |
| Personal | "How do you feel about X?" | >25% EXTRAPOLATED |
| Prediction | "What do you think will happen?" | >60% EXTRAPOLATED |

Classify the question, note its refusal threshold. This threshold guides everything else.

**Decision 2: Voice profile needed?**

- Stack/architecture/TDD/DDD → NO (implicit) → go directly to Step 2
- Other → YES → do Step 1 (1-2 notes close to the subject to extract tone)

**Edge cases to refuse outright:**
- Questions out of scope (topic doesn't concern {USER_NAME}) → refuse with "The vault doesn't discuss [topic]"
- Request for judgment about third parties (e.g., "What do you think of [Person X]?") → refuse ("The vault talks about {USER_NAME}, not [Person X]")

---

## Step 1 — Extract voice profile (if Decision 2 = YES)

**Quick search (max 2 notes):**
1. Look for 1 essay or daily note _on the exact topic_ (not "adjacent")
2. If absent: look for 1 note on **parent domain** (e.g., if topic = procrastination, read productivity, ADHD, or time management patterns) — seek context that explains {USER_NAME}'s posture

**Identify explicitly these 6 dimensions:**
1. **Sentence structure**: short and declarative? Long and exploratory? Mixed?
2. **Vocabulary**: which words does {USER_NAME} use? Which words does he never use?
3. **Rhetorical patterns**: analogies, lists, questions, provocations?
4. **Emotional register**: direct and dry? Passionate? Measured? When does that change?
5. **Characteristic formulations**: recurring turns of phrase, favorite metaphors (e.g., "it's not a big deal", "what are we aiming for", "the thing is")
6. **What he doesn't do**: stylistic choices conspicuously absent (e.g., "it is important to note", excessive hedging)

This voice profile is a **hard constraint** on the ghost response — use it to anchor tone and structure the response, not to copy-paste sentences.

---

## Step 2 — Collect and tag evidence

**Search in:** `00 - Daily notes/`, `03 - Knowledge/`, `01 - Me/{USER_NAME}.md`, `99 - Claude Code/ADR/`, `99 - Claude Code/Sessions/`

**Strategy:**
1. Read 1-2 relevant notes in the closest area
2. Extract 3-5 adjacent terms / {USER_NAME} jargon (e.g., refactoring → design debt, legacy, TDD)
3. Refine searches with these terms (broaden corpus)

**For each piece of information, tag immediately:**

| Tag | Definition |
|-----|-----------|
| **VAULT** | Direct explicit quote |
| **INFERRED** | Implicit but supported by 2+ independent sources |
| **EXTRAPOLATED** | Consistent with vault, goes beyond what is written |
| **UNKNOWN** | Vault silent after search |

**Mandatory rule: list ALL tagged evidence BEFORE Step 3. No composition without inventory.**

---

## Step 2.5 — Refusal decision (before Step 3)

**Count evidence:**
- % VAULT, % INFERRED, % EXTRAPOLATED, % UNKNOWN

**Compare % EXTRAPOLATED to refusal threshold from Step 0:**

| Situation | Action |
|-----------|--------|
| EXTRAPOLATED ≤ threshold - 10% | Continue to Step 3 (green) |
| Threshold - 10% < EXTRAPOLATED ≤ threshold | Add warning at top: "Caution: [X%] extrapolated" → continue |
| EXTRAPOLATED > threshold | Block: **propose refusal to {USER_NAME} (see below) + option "continue anyway?"** |

**If refusal triggered — offer two paths:**

**Option A (default):** refuse with honest exposure
```
Ghost mode impossible — too much extrapolation.

Type: [TYPE] | Threshold: [Y%] | Extrapolation: [X%]

Vault content:
- [VAULT claim + source]
- [INFERRED claim + source]
- [Gap: vault silent on...]

To enrich: add [Gap 1], [Gap 2]
```

**Option B ({USER_NAME} can request):** "Answer anyway but score low on voice fidelity (< 7/10)" → accept, add explicit disclaimer in Step 4

---

## Step 3 — Compose and validate ghost response

**If Step 1 = NO:** ignore "voice profile"
**If Step 1 = YES:** open with 1-2 extracted traits (tone anchoring)

**Write as {USER_NAME}:**
- Natural length (no padding) — if response should be short, it will be short; if discourse, discourse. Follow vault tone, not convention
- Integrate tags inline: `[VAULT: note]`, `[INFERRED: source1 + source2]`

**Anti-pattern review (unpack the 6 below):**
1. **Wikipedia Ghost**: neutral response instead of {USER_NAME}'s position → add the stance
2. **Confident Fabricator**: fluent but without vault data → list evidence first
3. **Claude Ghost**: generic voice (bullet points, "it is important") → would {USER_NAME} write it? If not, redo
4. **Therapist Ghost**: general wisdom instead of real {USER_NAME} answer → stay technical / personal {USER_NAME}
5. **Yes Ghost**: assume agreement when vault shows resistance → check INFERRED, flag contradictions
6. **Soft Ghost**: soften firmly-held positions → read VAULT/INFERRED, don't "measure"

**Quick test:** Does {USER_NAME} use parentheses for lateral thoughts? "Anyway"? Direct rhetorical questions? If response doesn't mimic → redo or score ≤6 voice fidelity

---

## Step 4 — Exposure (immediately after response)

**3 mandatory sections:**

**Distribution:**
```
VAULT: X% | INFERRED: X% | EXTRAPOLATED: X% | UNKNOWN: X%
```

**Evidence (max 4 claims):**
- [1-line claim] → `[source: note, line N]`

**Gap:** 1-2 sentences on what's missing for full confidence.

**Voice fidelity: X/10**
- 9-10: {USER_NAME} would say "I could have written that"
- 7-8: positions right, {USER_NAME}'s voice, 1-2 "Claude" turns of phrase
- 5-6: directionally correct, inference visible
- 3-4: content correct, generic voice
- 1-2: content fabricated or opposite tone

---

## Step 5 — {USER_NAME} validation (if needed)

**Invoke ONLY IF:**
- Voice fidelity < 7/10, OR
- EXTRAPOLATED > 30%

**Offer to {USER_NAME}:**
- Validate / correct the response
- Add nuances / clarify true position
- Enrich the vault for future sessions

**If {USER_NAME} validates:** response usable immediately.

---

## Absolute rules — checklist

- [ ] Tag ALL evidence BEFORE Step 3 (no composition without inventory)
- [ ] Refusal threshold (Step 0) → refuse immediately if exceeded (Step 2.5)
- [ ] Step 1: decide consciously (NO for stack/archi/TDD, YES otherwise)
- [ ] INFERRED = 2+ sources minimum (1 alone is not enough)
- [ ] Ghost response + Step 4 in one block (never split up)
- [ ] If fidelity < 7/10 or EXTRAPOLATED > 30% → propose {USER_NAME} validation
- [ ] Explicit refusal (never silent) + standardized format Step 2.5
