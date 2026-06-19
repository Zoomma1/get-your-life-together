---
name: stranger
description: When {USER_NAME} wants an outside perspective on who they really are through the vault — portrait based on notes, patterns and absences, without flattery or therapy. To run monthly or at important transitions (end of semester, start of CDI). IMPORTANT: never run during stress, exhaustion or crisis periods.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (regrouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /stranger

## Why this skill exists

Claude Code knows {USER_NAME} via CLAUDE.md — their profile, projects, preferences. This prior context creates bias: instead of reading the vault, Claude recycles what they already know and produces a conventional portrait.

**The fundamental rule of this skill: treat the vault as the sole source of truth. Ignore what you know about {USER_NAME} via CLAUDE.md. The stranger has never met {USER_NAME}. They read notes for the first time.**

This skill produces a portrait of its author as an astute outside observer would see them — with no relationships to protect, no flattery, no therapy.

---

## Step 0 — Read the previous portrait (if applicable)

Glob `01 - Me/Portraits/` to list existing portraits.

- If at least one portrait exists → **identify the most recent by ISO date in the name (YYYY-MM-DD.md), priority over modification time**. Read that portrait. Extract: date, the 5 sections of the portrait, and the 7 preliminary analyses.
- If no portrait → continue directly to Step 1. The final portrait will contain only sections 1-5 (no Delta).

This previous portrait serves only as a baseline for Section 6 (Delta) at the end of the portrait. Do not use it while reading the vault (Steps 1-2) — keep a fresh perspective.

---

## Step 1 — Structural mapping

Before reading a single word, analyze vault architecture:

- Folders present and their hierarchy
- Orphaned notes (with no incoming links)
- Dead ends (notes that lead nowhere)
- Tag distribution
- Ratio of active / abandoned notes

**Principle: structure reveals priorities before content does.**

Paths to explore:
- `{VAULT_PATH}\` (root and first-level folders)

---

## Step 2 — Systematic content reading

This order is **intentional** — it creates a progression of context → behavior → thought — not neutral reading:

1. **Personal context** (`01 - Me/`) — what the user says they are, declared values, identified projects
2. **Recent behavior** (`00 - Daily notes/` from the last 2-3 weeks) — what they actually do, here now
3. **Systematized thought** (`03 - Knowledge/` and essays) — what they've formalized, deepened, accepted
4. **Webs of meaning** (most-linked notes and their backlinks) — connections they make, implicit patterns
5. **Raw material** (`09 - Inbox/` and notes in progress) — unfiltered ideas, unresolved tensions

**While reading: note emerging patterns. No preconceived grid, but maintain the structuring order.**

---

## Step 3 — Seven forced analyses

These seven analyses must be **completed and written out explicitly** before writing the portrait. No shortcuts.

1. **Frequency of topics**: which themes appear in daily notes vs formal notes? The divergence is significant.

2. **Declared vs revealed priorities**: what the user says they do vs what they actually do according to notes. The gap is the real subject.

3. **Emotional patterns**: in daily notes, when does energy rise? When does it fall? What triggers appear?

4. **Social world**: who is mentioned, how often, in what context? Who is absent from notes?

5. **Recurring questions**: not passing curiosities — obsessions. What comes back unresolved.

6. **Footprint of writing style**: tone, length, structure, recurring vocabulary. What the way of writing says about the way of thinking.

7. **Conspicuous absences**: what should be there *according to what {USER_NAME} himself declared doing* and isn't. Examples: the user says emphasis on family, but family doesn't appear in daily notes. {USER_NAME} declares TDD as non-negotiable, but tests are never mentioned in session feedback. Blind spots reveal as much as what's present.

---

## Step 4 — The portrait (five sections)

**Format: third person throughout, except the final question.**

**Non-negotiable constraints:**
- Minimum 2 uncomfortable observations (with evidence)
- Minimum 2 admiring observations (with evidence)
- Every claim cited with concrete source from the vault
- Zero flattery
- Zero therapy-speak. Not "he needs to", "he should", "he ought to". Observations, not prescriptions.
- Zero diplomatic hedging ("maybe", "one could say")
- Zero generic summary of what's already visible

---

### Section 1 — First impression

What the vault communicates first, before any analysis. The overall impression of a reader who stumbles on it by chance.

### Section 2 — Real priorities

What {USER_NAME} actually does with their attention and energy — deduced from patterns, not statements. Include gaps between declared and revealed priorities.

### Section 3 — Trajectory

Where {USER_NAME} is headed, according to notes. Not what they say they want to do — what they're actually gravitating toward.

### Section 4 — Invisible patterns

Schemes that {USER_NAME} probably doesn't see themselves. Recurrences, structures, contradictions visible only from outside.

### Section 5 — The unasked question

The question the vault never asks but everything points toward. Identify this question by:
- **Unresolvable recurrence**: a theme that returns unresolved (not just "I had a bad day", but a structural pattern)
- **Unnamed tension**: two elements of the vault in implicit conflict (ex: declared value vs revealed behavior, stated goal vs real energy)
- **Active void**: something {USER_NAME} clearly wonders about (traces in notes) but never explores publicly

**This section ends with a direct question to the second person, posed to {USER_NAME}.**

### Section 6 — Delta since previous portrait

*Only if a previous portrait was read in Step 0. Omit entirely otherwise.*

```
**What disappeared**: patterns, tensions, topics present in the previous portrait and absent now.

**What strengthened**: patterns confirmed across both portraits — deep structural signals.

**What appeared**: new dimensions absent from the previous portrait.

**Shifts in work mode**: changes in declared priorities, organization, observed energy, active projects.

**Drift score**: Low (visible continuity) / Notable (clear evolution) / Rupture (major change between the two portraits)
```

---

## Presenting the result

Present the complete portrait to {USER_NAME} without preamble, without explaining the method, without asking if it's okay.

After the portrait, one single line: "Want to dig into something?"

**That's the only additional action authorized. Not:** work suggestions, method summary, process confirmation, reaction interpretation.

Then create `01 - Me/Portraits/YYYY-MM-DD.md` with the complete portrait (the 5 or 6 sections + the 7 preliminary analyses). Create the `Portraits/` folder if it doesn't exist. Confirm to {USER_NAME}: *"Portrait saved in `01 - Me/Portraits/`."*

A portrait is a portrait. Not a plan.

---

## Step 5 — Update the command-tracker

- Open `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- Line `/stranger` → replace the date with today's date in `YYYY-MM-DD` format

---

## Step 6 — Guided capitalization (after {USER_NAME} has dug in)

**Conditional**: trigger this step only **if** {USER_NAME} engaged in discussion after the portrait (response to "Want to dig into something?"). If {USER_NAME} leaves the portrait as-is or closes the session, **skip** this step.

The portrait can bring out new elements: patterns to promote as confirmed patterns, contradictions to name, alert signals to add, tensions to formalize, spoken facts to archive. These elements **disappear** if not capitalized while hot — the 2026-04-15 `/stranger` session showed that the post-portrait phase is as important as the portrait itself (4 `01 - Me/` files enriched, 1 file created, ADR-018 from the discussion).

When {USER_NAME} has dug into a point, **explicitly propose** a capitalization target:

> **What we just explored might deserve:**
> - **Promotion to confirmed pattern** in `01 - Me/{USER_NAME}.md` (section "Observed patterns") — if we touched a recurring behavior sourced across 3+ instances
> - **New alert signal** in `01 - Me/Alert signals.md` — if we named a failure mode or structural drift
> - **Active tension** in `01 - Me/Aspiration.md` — if we put a finger on a contradiction between two things {USER_NAME} wants
> - **Context note** created in `01 - Me/` — if {USER_NAME} shared rich oral context that doesn't exist anywhere in the vault (history, founding anecdote, biographical fact)
> - **Transverse ADR** in `99 - Claude Code/ADR/` — if the discussion produced a reusable decision worth formalizing
>
> What do you validate?

For each validated element: apply the edit / create the file / enrich the target note. Present touched files at the end.

**Important rules**:
- Never write in `01 - Me/` or create an ADR without explicit validation — the introspection phase is sensitive, no silent capitalization
- **Don't overload**: if {USER_NAME} dug into only one point, don't invent 5 possible capitalizations. The capitalization/discussion ratio should stay lean
- If the portrait triggered no discussion → skip, the portrait is enough

---

## Recommended frequency

- Monthly as a recalibration exercise
- At major transitions (new project, new context, return from long trip)
- Not during high-load or stress periods
