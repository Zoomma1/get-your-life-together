---
name: dump
description: On-demand mental dumping session — Victor writes freely, Claude asks follow-up questions tailored to the content, then generates a timestamped block ready to paste into the daily note. Trigger whenever Victor says "/dump", "I need to dump", "thinking session", "my head is full", "I have stuff to get out", "need to offload", or any phrasing expressing a need for unstructured mental or emotional externalization — even without the word "dump".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected from aggressive optimization**
>
> This skill produces **narrative qualitative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). The preservation of qualitative content takes priority over line reduction.

# Skill : dump

Externalization session in three steps : open listening → follow-up questions → copyable block for the daily note.

## Step 1 — Invitation

Open the session with a short, non-directive invitation :

> "I'm listening — dump what's on your mind."

Do not ask questions at this stage. Do not propose structure or themes. The invitation should be neutral to avoid orienting the dump before it starts.

## Step 2 — Follow-up

Read carefully what Victor has written. Identify threads worth pulling : unnamed tensions, implicit decisions, underlying emotions, contradictions, things said in half-words.

Ask 3 follow-up questions tailored to this specific dump — no more, no less, unless Victor says "generate directly" (see below). Choose the 3 angles that open up the most, not the most obvious ones.

A few useful angles to adapt based on content :
- "What's the issue behind this?"
- "So, what does that change for you?"
- "What do you feel about X?"
- "What are you doing with it now?"
- "What's the thing you didn't say?"

**Very short dump (2-3 words or fragment)** : ask "Do you want to expand, or is this just a quick capture?" before asking follow-up questions.

**Victor says "generate directly"** : skip follow-up questions and go to Step 3 immediately.

## Step 3 — Generation and writing to daily note

Generate a block that synthesizes the exchange. Distill, don't transcribe : what was said, what emerged, what Victor takes from it.

Block format :

```
### Thinking session — HH:MM
[2-5 sentences condensing the essence of the session]
```

**Time calculation** :
- Get time via `date +%H:%M` (bash) / `(Get-Date).ToString("HH:mm")` (PowerShell)
- If `time < 04:00` → target date = yesterday, add `🌙 (after midnight)` to block title
- Otherwise → target date = today, title unchanged

Block title based on context :
- Normal time : `### Thinking session — HH:MM`
- After midnight : `### Thinking session — HH:MM 🌙 (after midnight)`

Automatically write the block to the daily note :
1. Find file `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\[target date].md`
2. Insert block at the end of `## 💡 Ideas & Reflections` section
3. Confirm : "Noted in your daily note for [target date]."

**Multiple sessions same day** : each block is timestamped separately, inserted in sequence in the section. Do not merge sessions.

## Notes

**Telegram channel available** : if Victor is mobile, the dump can be sent directly from the phone via Telegram channel. The behavior is identical — first message = the dump, Claude asks 3 follow-up questions directly (without re-asking "dump what's on your mind"), synthesis written to today's daily note. See CLAUDE.md § `📱 Channel Telegram` for detailed behavior.
