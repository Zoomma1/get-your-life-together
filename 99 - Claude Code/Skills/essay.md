---
name: essay
description: Launch an introspective, systems analysis or strong-opinion essay — guided workflow in 5 steps: subject framing, plan + 5-8 questions anchored in {USER_NAME}'s experience, answers, validated draft, final version saved in 03 - Knowledge/Essays/. Trigger when {USER_NAME} says "essay", "/essay", "essay [ticket name]", "I want to write about X", "I want to explore this idea in writing", "introspection", "dig into this thought", or to challenge a belief or retrace a personal evolution. Without argument = free-subject mode (stub ticket creation), with argument = reads the ticket from 09 - Inbox/tickets/.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimisation**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips the narrative instructions (grouping, context, highlights, open questions, tone, narration). Preserving qualitative content takes priority over reducing line count.

# Skill: /essay

## Trigger

```
/essay                        → free-subject mode (framing questions → stub ticket)
/essay [ticket name]          → reads the existing ticket from 09 - Inbox/tickets/
```

---

## Step 0 — Detect mode

**If no argument:**
→ Go to **Step 0b** (stub ticket creation)

**If an argument is provided:**
→ Attempt to read `{VAULT_PATH}\{INBOX_FOLDER}\tickets\[argument].md`
→ If file exists: go directly to **Step 1**
→ If file does not exist: notify {USER_NAME} "I could not find the ticket `[argument].md` in `09 - Inbox/tickets/`. Can you check the name or create the ticket first?" — stop

---

## Step 0b — Free-subject mode: create stub ticket

Ask {USER_NAME} the following framing questions (in a single response):

```
To frame the essay, I need a few clarifications:

1. **Subject**: What is this essay about? (one sentence)

2. **Angle**: What direction do you want to take? A few examples:
   - Introspection: explore a personal pattern or insight about yourself
   - Systems analysis: dissect a problem (e.g. ADHD at work, pair-programming, dev tools)
   - Strong opinion: challenge a common belief ("why solo work isn't productive")
   - Historical: retrace an evolution (e.g. your relationship with code, with learning)
   - Other: specify

3. **Target reader**: Who are you writing for?
   - Yourself in 2 years (to remember an insight)
   - Someone like you (ADHD, dev, etc.)
   - Someone who doesn't know you
   - Doesn't matter

4. **Available sources**: Are there vault notes, daily notes, specific experiences, past essays you want me to use?

5. **Target length**: Short (~500 words), medium (~1000 words), long (2000+)?
```

Once {USER_NAME} has responded, create a stub ticket at `{VAULT_PATH}\{INBOX_FOLDER}\tickets\essay-[slug].md`:

```markdown
---
title: Essay — [Title]
date: DD/MM/YYYY
type: 💡 Idea
status: WIP
---

# Essay — [Title]

## Summary

[One-sentence reformulation of the subject]

## Context / Why

[Angle + target reader]

## Technical notes

- Sources: [list of sources mentioned by {USER_NAME}]
- Target length: [short / medium / long]
```

→ Continue to **Step 1** with this stub as the reference ticket.

---

## Step 1 — Load context

1. Read the ticket (existing or stub)
2. Read sources explicitly listed in the ticket:
   - Mentioned daily notes (via path `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\`)
   - Existing essays (`{VAULT_PATH}\{KNOWLEDGE_FOLDER}\Essays\`)
   - `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` if the essay is introspective
   - Tickets linked in ticket dependencies
   - **If a source does not exist**: silently ignore and continue

3. **Before Step 2**, if listed sources are vague or absent, ask {USER_NAME} inline:
   - "Are there specific daily notes, experiences or vault notes you want me to use for the essay?"
   - Wait for the response before generating the plan
   - Do not list candidates — let {USER_NAME} decide what matters

---

## Step 2 — Generate plan + questions

Produce in a single response:

```markdown
## Proposed plan — [Essay title]

### Sources
- [list of sources read]

### Proposed structure
1. [Section 1 — hook or context]
2. [Section 2 — central development]
3. [Section 3 — tension or reversal]
4. [Section 4 — open or concrete conclusion]

### Questions to answer

**To anchor in reality:**
- Q1: [What specific moment/experience triggered this reflection?]
- Q2: [Tell me a concrete detail that illustrates it]

**To develop the thesis:**
- Q3: [What do you understand now that you did not understand before?]
- Q4: [What obstacle or contradiction do you see in this idea?]

**For the conclusion:**
- Q5: [What do you want the reader to take away?]
```

Rules for questions:
- **Formulated in second person**: "When you realised that...", "Tell me the moment when...", "What detail..."
- **Anchored in {USER_NAME}'s experience**, not generic — BAD example: "What is productivity?"; GOOD: "What moment at work showed you that you weren't productive working solo?"
- **5 to 8 questions maximum** — forces conciseness
- **Designed to surface a thesis**, not list facts — do not ask "list your achievements" but "why do these achievements matter to you"
- **No rhetorical questions** — expect a real answer

**Plan validation:**
End with: "**Before continuing:** does this plan and these questions resonate? If you want to adjust the structure or rephrase questions, say so — I'll redo Step 2. Otherwise, answer Q1-Q5 and we'll move to Step 3."

**If {USER_NAME} rejects or adjusts the plan:**
→ Redo Step 2 only (not Step 1) with the new direction

---

## Step 3 — {USER_NAME} responds

{USER_NAME} answers the questions — in chat or by editing the ticket note.

**Claude must not:**
- Prompt {USER_NAME} or rush them
- Fill in on {USER_NAME}'s behalf
- Paraphrase answers — use them as is

**If answers are very short (< 1 sentence per Q):**
Ask for clarification — "Can you expand on Q2? I need more concrete detail to anchor it properly." Do not continue until the content is sufficient.

**If {USER_NAME} asks to reject/adjust the plan or a question:**
Return to Step 2 and re-propose — do not force the existing plan

---

## Step 4 — Draft + validation

Before producing the final version:

1. Write a **complete draft** (first person, direct style, not academic)
2. Follow the plan proposed in Step 2; if the answers suggest a different structure, signal the change to {USER_NAME}
3. Propose the draft: "Here is the first draft — is this the direction you want? I can refine, cut, develop a section..."
4. **Wait for {USER_NAME}'s green light before the final version**

**If {USER_NAME} requests substantial changes:**
- Refine in place, do not re-run Step 2
- If {USER_NAME} wants a complete restructure → return to Step 2

Drafting rules:
- No generic conclusion — end on something concrete or an open tension
- Length: respect the ticket target (or ~800 words by default)
- No artificial reformulation — keep {USER_NAME}'s well-phrased sentences as they are

---

## Step 5 — Save

Write the essay to `{VAULT_PATH}\{KNOWLEDGE_FOLDER}\Essays\[slug].md`

Frontmatter format:

```markdown
---
title: [Full title]
date: DD/MM/YYYY
tags: [essay, introspection, ...]
sources: [list of sources used]
---
```

Update the original ticket: set status to `Done`.

---

## Absolute rules

- **Never write without answers to questions**: Step 3 must be complete before Step 4
- **Plan validation before writing**: ask {USER_NAME} if the structure and questions work (Step 2)
- **Draft validation before final**: propose the first draft and wait for ok (Step 4)
- Respect {USER_NAME}'s style — do not academise, do not smooth over
- The questions (Step 2) are the deliverable — not an essay draft
- The stub ticket (free-subject mode) is created before Steps 1–5
- If answers are partial/incomplete: ask for explicit clarification — do not invent
- Never modify the ticket without {USER_NAME}'s permission
