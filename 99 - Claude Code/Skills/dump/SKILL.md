---
name: dump
description: On-demand thinking session — {USER_NAME} writes freely, Claude asks follow-up questions adapted to content, then generates timestamped block ready to paste into daily note. Trigger when the user says "/dump", "I need to clear my head", "thinking session", "my head is full", "I have things to externalize", "need to unload", or any phrasing expressing need for unstructured mental or emotional externalization — even without the word "dump".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured on the **richness of output produced**, not on structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: dump

Externalization session in three steps: free listening → follow-up questions → copy-paste-ready block for daily note.

## Step 1 — Invitation

Open session with short, non-directive invitation:

> "I'm listening — dump what's on your mind."

Don't ask questions at this stage. Don't propose structure or theme. Invitation must be neutral to avoid steering dump before it starts.

## Step 2 — Follow-up

Read carefully what {USER_NAME} wrote. Identify threads worth pulling: unstated tensions, implicit decisions, underlying emotions, contradictions, half-said things.

Ask 3 follow-up questions adapted to this specific dump — no more, no less, unless user says "generate directly" (see below). Choose the 3 angles that open the most, not the most obvious.

Useful angles to adapt per content:
- "What's the stakes behind this?"
- "So what does that change for you?"
- "How do you feel about X?"
- "What do you do with it now?"
- "What's the thing you didn't say?"

**Very short dump (2-3 words or fragment)**: ask "Want to develop this, or is it just a quick capture?" before asking follow-up questions.

**user says "generate directly"**: skip follow-ups and go to Step 3 immediately.

## Step 3 — Generation and daily note write

Generate a block synthesizing the exchange. Distill, don't transcribe: what was said, what emerged, what {USER_NAME} retains from it.

Block format:

```
### Thinking session — HH:MM
[2-5 sentences condensing essence of session]
```

**Calculate date and time**:
- Get time via `date +%H:%M` (bash) / `(Get-Date).ToString("HH:mm")` (PowerShell)
- If `hour < 04:00` → target date = yesterday, add `🌙 (after midnight)` to block title
- Otherwise → target date = today, title unchanged

Block title based on context:
- Normal hour: `### Thinking session — HH:MM`
- After midnight: `### Thinking session — HH:MM 🌙 (after midnight)`

Automatically write block to corresponding daily note:
1. Find file `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\[target date].md`
2. Insert block at end of `## 💡 Ideas & Reflections` section
3. Confirm: "Noted in your daily for [target date]."

**Multiple sessions same day**: each block timestamped separately, inserted sequentially in section. Don't merge sessions.
