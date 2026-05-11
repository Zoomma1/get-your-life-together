---
name: essay
description: Launch an introspective, system analysis, or opinionated essay — guided 5-step workflow: scoping the subject, plan + 5-8 questions anchored in {USER_NAME}'s lived experience, answers, validated draft, final version saved in 03 - Knowledge/Essays/. Trigger when user says "essay", "/essay", "essay [ticket name]", "I feel like writing about X", "I want to explore this idea in writing", "introspection", "dig into this thought", or to challenge a belief or retrace personal evolution. No argument = free-form mode (stub ticket creation), with argument = read existing ticket in 09 - Inbox/tickets/.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **narrative qualitative** output. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /essay

## Trigger

```
/essay                        → free-form mode (scoping questions → stub ticket)
/essay [ticket name]          → read existing ticket in 09 - Inbox/tickets/
```

---

## Step 0 — Detect mode

**If no argument:**
→ Go to **Step 0b** (stub ticket creation)

**If an argument is provided:**
→ Try to read the note `{VAULT_PATH}\{INBOX_FOLDER}\tickets\[argument].md`
→ If file exists: go directly to **Step 1**
→ If file does not exist: signal to {USER_NAME} "I didn't find the ticket `[argument].md` in `09 - Inbox/tickets/`. Can you check the name or create the ticket first?" — stop

---

## Step 0b — Free-form mode: create stub ticket

Ask {USER_NAME} the following scoping questions (in a single response):

```
To scope this essay, I need a few clarifications:

1. **Subject**: What is this essay about? (one sentence)

2. **Angle**: What direction do you want to take? A few examples:
   - Introspection: explore a personal pattern or an insight about yourself
   - System analysis: dissect a problem (ex: ADHD at work, pair-programming, dev tools)
   - Opinionated take: challenge a common belief ("why solo work isn't productive")
   - Historical: retrace an evolution (ex: your relationship with code, with learning)
   - Other: specify

3. **Target reader**: Who are you writing for?
   - Future you (in 2 years, to remind yourself of an insight)
   - Someone like you (ADHD, dev, etc.)
   - Someone who doesn't know you
   - Doesn't matter

4. **Available sources**: Are there vault notes, daily notes, specific experiences, past essays you want me to leverage?

5. **Intended length**: Short (~500 words), medium (~1000 words), long (2000+)?
```

Once {USER_NAME} has answered, create a stub ticket in `{VAULT_PATH}\{INBOX_FOLDER}\tickets\essay-[slug].md`:

```markdown
---
title: Essay — [Title]
date: DD/MM/YYYY
type: 💡 Idea
status: WIP
---

# Essay — [Title]

## Summary

[Restatement of the subject in one sentence]

## Context / Why

[Angle + target reader]

## Technical notes

- Sources: [list of sources mentioned by {USER_NAME}]
- Intended length: [short / medium / long]
```

→ Continue to **Step 1** with this stub as the reference ticket.

---

## Step 1 — Load context

1. Read the ticket (existing or stub)
2. Read the sources explicitly listed in the ticket:
   - Daily notes mentioned (via path `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\`)
   - Existing essays (`{VAULT_PATH}\{KNOWLEDGE_FOLDER}\Essays\`)
   - `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` if the essay is introspection
   - Linked tickets in ticket dependencies
   - **If a source doesn't exist**: silently ignore and continue

3. **Before step 2**, if listed sources are vague or absent, ask {USER_NAME} inline:
   - "Are there specific daily notes, experiences, or vault notes you want me to leverage for the essay?"
   - Wait for the answer before generating the plan
   - Don't list candidates — let {USER_NAME} decide what matters

---

## Step 2 — Generate plan + questions

Produce in a single response:

```markdown
## Proposed Plan — [Essay Title]

### Sources
- [list of read sources]

### Planned structure
1. [Section 1 — hook or context]
2. [Section 2 — central development]
3. [Section 3 — tension or reversal]
4. [Section 4 — open or concrete conclusion]

### Questions to answer

**To anchor in reality:**
- Q1: [What specific moment/experience triggered this reflection?]
- Q2: [Tell me one concrete detail that illustrates it]

**To develop the thesis:**
- Q3: [What do you understand now that you didn't before?]
- Q4: [What obstacle or contradiction do you see in this idea?]

**For the conclusion:**
- Q5: [What do you want the reader to take away?]
```

Rules for questions:
- **Formulated in second person**: "When did you realize that...", "Tell me the moment when...", "What detail..."
- **Anchored in {USER_NAME}'s lived experience**, not generic — example WRONG: "What is productivity?"; RIGHT: "What moment at work showed you that you weren't productive working solo?"
- **Maximum 5 to 8 questions** — forces concision
- **Designed to surface a thesis**, not list facts — don't ask "list your achievements" but "why do these achievements matter to you"
- **No rhetorical questions** — expect a real answer

**Plan validation:**
End with: "**Before we continue:** does this plan and these questions resonate? If you want to adjust the structure or rephrase questions, let me know — I'll redo step 2. Otherwise, answer Q1-Q5 and we move to step 3."

**If {USER_NAME} rejects or adjusts the plan:**
→ Redo step 2 only (not step 1) with the new direction

---

## Step 3 — {USER_NAME} answers

{USER_NAME} answers the questions — in the chat or by editing the ticket note.

**Claude must NOT:**
- Re-prompt {USER_NAME} or rush them
- Complete in {USER_NAME}'s place
- Paraphrase answers — use them as-is

**If answers are very short (< 1 sentence per Q):**
Ask for clarification — "Can you develop Q2? I need more concrete detail to ground it well." Don't continue until content is sufficient.

**If {USER_NAME} asks to reject/adjust the plan or a question:**
Go back to step 2 and re-propose — don't force the existing plan

---

## Step 4 — Draft + validation

Before producing the final version:

1. Write a **complete first draft** (first person, direct style, not academic)
2. Respect the plan proposed in step 2; if answers suggest a different structure, signal the change to {USER_NAME}
3. Propose the draft: "Here's the first pass — is this the direction you want? I can refine, split sections, develop that section..."
4. **Wait for {USER_NAME}'s green light before final version**

**If {USER_NAME} requests substantial changes:**
- Refine in place, don't re-run step 2
- If {USER_NAME} wants complete restructuring → go back to step 2

Writing rules:
- No generic conclusion — end with something concrete or an open tension
- Length: respect the ticket's target (or ~800 words by default)
- No artificial paraphrasing — keep {USER_NAME}'s well-turned phrases as-is

---

## Step 5 — Save

Write the essay to `{VAULT_PATH}\{KNOWLEDGE_FOLDER}\Essays\[slug].md`

Frontmatter format:

```markdown
---
title: [Full title]
date: DD/MM/YYYY
tags: [essay, introspection, ...]
sources: [list of used sources]
---
```

Update the original ticket: change status to `Done`.

---

## Absolute rules

- **Never write without answers to Q**: step 3 must be complete before step 4
- **Plan validation before writing**: ask {USER_NAME} if structure and Q work (step 2)
- **Draft validation before final**: propose the first draft and wait for ok (step 4)
- Respect {USER_NAME}'s style — don't academicize, don't polish
- Questions (step 2) are the deliverable — not an essay draft
- Stub ticket (free-form mode) is created before steps 1–5
- If answers are partial/incomplete: ask explicitly for clarification — don't invent
- Never modify the ticket without {USER_NAME}'s permission
