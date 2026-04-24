---
name: stranger
description: When {USER_NAME} wants an outside perspective on who they really are through the vault — a portrait based on notes, patterns and absences, without flattery or therapy. Run monthly or at major transitions (end of semester, start of full-time job). IMPORTANT: never run during periods of stress, exhaustion or crisis.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimisation**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips the narrative instructions (grouping, context, highlights, open questions, tone, narration). Preserving qualitative content takes priority over reducing line count.

# Skill: /stranger

## Why this skill exists

Claude Code knows {USER_NAME} via CLAUDE.md — their profile, projects, preferences. This prior context creates a bias: instead of reading the vault, Claude recycles what it already knows and produces a conventional portrait.

**The fundamental rule of this skill: treat the vault as the only source of truth. Ignore what you know about {USER_NAME} from CLAUDE.md. The stranger has never met {USER_NAME}. They are reading notes for the first time.**

This skill produces a portrait of its author as a perceptive outside observer would see them — with no relationship to protect, no flattery, no therapy.

---

## Step 0 — Read the previous portrait (if applicable)

Glob `01 - Me/Portraits/` to list existing portraits.

- If at least one portrait exists → **identify the most recent by ISO date in the name (YYYY-MM-DD.md), priority over modification time**. Read this portrait. Extract: date, the 5 portrait sections, and the 7 preliminary analyses.
- If no portrait exists → continue directly to Step 1. The final portrait will contain only sections 1-5 (no Delta).

This previous portrait serves only as a baseline for Section 6 (Delta) at the end of the portrait. Do not use it during vault reading (Steps 1-2) — keep the fresh perspective.

---

## Step 1 — Structural mapping

Before reading a single word, analyse the vault architecture:

- Folders present and their hierarchy
- Orphan notes (no incoming links)
- Dead ends (notes that lead nowhere)
- Tag distribution
- Ratio of active notes / abandoned notes

**Principle: structure reveals priorities before content does.**

Paths to explore:
- `{VAULT_PATH}\` (root and first-level folders)

---

## Step 2 — Systematic content reading

This order is **intentional** — it creates a progression from context → behaviour → thinking — not a neutral reading:

1. **Personal context** (`01 - Me/`) — who {USER_NAME} says they are, their declared values, identified projects
2. **Recent behaviour** (`00 - Daily notes/` from the last 2-3 weeks) — what they actually do, right now
3. **Systematised thinking** (`03 - Knowledge/` and essays) — what they have formalised, deepened, accepted
4. **Networks of meaning** (most linked notes and their backlinks) — the connections they make, implicit patterns
5. **Raw material** (`09 - Inbox/` and notes in progress) — unfiltered ideas, unresolved tensions

**During reading: note emerging patterns. No pre-set grid, but maintain the structuring order.**

---

## Step 3 — Seven forced analyses

These seven analyses must be **completed and explicitly written** before writing the portrait. No shortcuts.

1. **Topic frequency**: what themes appear in daily notes vs formal notes? The divergence is significant.

2. **Declared vs revealed priorities**: what {USER_NAME} says they do vs what they actually do according to the notes. The gap is the real subject.

3. **Emotional patterns**: in daily notes, when does energy rise? When does it fall? What triggers appear?

4. **Social world**: who is mentioned, with what frequency, in what context? Who is absent from the notes?

5. **Recurring questions**: not passing curiosities — obsessions. What keeps coming back without being resolved.

6. **Writing style imprint**: tone, length, structure, recurring vocabulary. What the way of writing says about the way of thinking.

7. **Conspicuous absences**: what should be there *according to what {USER_NAME} has themselves declared they do* and is not. Examples: {USER_NAME} says they put emphasis on family, but family doesn't appear in daily notes. {USER_NAME} declares TDD non-negotiable, but tests are never mentioned in session recaps. Blind spots reveal as much as what is present.

---

## Step 4 — The portrait (five sections)

**Format: third person throughout, except the final question.**

**Non-negotiable constraints:**
- Minimum 2 uncomfortable observations (with evidence)
- Minimum 2 admiring observations (with evidence)
- Each claim cited with a concrete source in the vault
- Zero flattery
- Zero therapy-speak. No "they need to", "they should", "they ought to". Observations, not prescriptions.
- Zero diplomatic hedging ("perhaps", "one could say")
- Zero generic summary of what is already visible

---

### Section 1 — First impression

What the vault communicates first, before any analysis. The overall impression of a reader who stumbles upon it by chance.

### Section 2 — Real priorities

What {USER_NAME} actually does with their attention and energy — deduced from patterns, not declarations. Include gaps between declared and revealed priorities.

### Section 3 — Trajectory

Where {USER_NAME} is going, according to the notes. Not what they say they want to do — what they are actually gravitating towards.

### Section 4 — Invisible patterns

The patterns {USER_NAME} probably does not see themselves. Recurrences, structures, contradictions that are only visible from the outside.

### Section 5 — The unasked question

The question the vault never asks but that everything points towards. Identify this question through:
- **Unresolvable recurrence**: a theme that keeps coming back without ever being addressed at its root (not just "I had a bad day", but a structural pattern)
- **Unnamed tension**: two elements in the vault that are in implicit conflict (e.g. declared value vs revealed behaviour, stated goal vs real energy)
- **Active void**: something {USER_NAME} is clearly asking themselves (traces in the notes) but never explores publicly

**This section ends with a direct question in the second person, addressed to {USER_NAME}.**

### Section 6 — Delta since the previous portrait

*Only if a previous portrait was read in Step 0. Omit entirely otherwise.*

```
**What has disappeared**: patterns, tensions, subjects present in the previous portrait and absent from this one.

**What has strengthened**: patterns confirmed across both portraits — deep structural signals.

**What has appeared**: new dimensions absent from the previous portrait.

**Shifts in working mode**: changes in declared priorities, organisation, observed energy, active projects.

**Drift score**: Low (visible continuity) / Notable (clear evolution) / Rupture (major change between the two portraits)
```

---

## Presenting the result

Present the complete portrait to {USER_NAME} without preamble, without method explanation, without asking if it's ok.

After the portrait, a single line: "Do you want to dig into something?"

**This is the only additional action allowed. No:** work suggestions, methodological summary, process confirmation, reaction interpretation.

Then create `01 - Me/Portraits/YYYY-MM-DD.md` with the complete portrait (5 or 6 sections + the 7 preliminary analyses). Create the `Portraits/` folder if it does not exist. Confirm to {USER_NAME}: *"Portrait saved in `01 - Me/Portraits/`."*

A portrait is a portrait. Not a plan.

Update `99 - Claude Code/command-tracker.md`: `/stranger` line → replace the date with today's date in `YYYY-MM-DD` format.

---

## Step 6 — Guided capitalisation (after {USER_NAME} has dug in)

**Conditional**: only trigger this step **if** {USER_NAME} has engaged in discussion after the portrait (response to "Do you want to dig into something?"). If {USER_NAME} leaves the portrait as is or closes the session, **skip** this step.

The portrait may surface new elements: patterns to promote to confirmed pattern, contradictions to name, alert signals to add, tensions to formalise, oral facts to archive. These elements **disappear** if not capitalised while fresh — the `/stranger` session of 2026-04-15 showed that the post-portrait phase is as important as the portrait itself (4 `01 - Me/` files enriched, 1 file created, ADR-018 from the discussion).

When {USER_NAME} has dug into a point, **explicitly propose** a capitalisation target:

> **What we just explored might deserve:**
> - **Promotion to confirmed pattern** in `{PERSONAL_FOLDER}/{USER_NAME}.md` (section "Observed patterns") — if we touched a recurring behaviour sourced across 3+ instances
> - **New alert signal** in `01 - Me/Signaux d'alerte.md` — if we named a failure mode or structural drift
> - **Active tension** in `01 - Me/Aspiration.md` — if we identified a contradiction between two things {USER_NAME} wants
> - **Context note** created in `01 - Me/` — if {USER_NAME} delivered rich oral context that exists nowhere in the vault (history, founding anecdote, biographical fact)
> - **Cross-cutting ADR** in `99 - Claude Code/ADR/` — if the discussion produced a reusable decision worth formalising
>
> What do you validate?

For each validated element: apply the edit / create the file / enrich the target note. Present the touched files at the end.

**Important rules**:
- **Never** write in `01 - Me/` or create an ADR without explicit validation — the introspective phase is sensitive, no silent capitalisation
- **Do not overload**: if {USER_NAME} only dug into one point, do not invent 5 possible capitalisations. The capitalisation/discussion ratio must remain sober
- If the portrait triggered no discussion → skip, the portrait suffices

---

## Recommended frequency

- Monthly as a recalibration exercise
- At major transitions (new project, new context, return from a long trip)
- Not during periods of high load or stress
