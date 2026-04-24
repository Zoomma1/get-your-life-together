---
name: my-world
description: Load Victor's global context BEFORE knowing what to work on. Use at session start when Victor doesn't yet know where to start, wants an overview of his current situation, or wants to calibrate priorities before choosing a topic. Different from /workon (which loads a specific topic) and /today (which plans the day with calendar and kanbans).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected from aggressive optimization**
>
> This skill produces **narrative qualitative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). The preservation of qualitative content takes priority over line reduction.

# Skill : /my-world

Synthesizes Victor's current life/projects state in **4 blocks** to answer "where am I at?" before deciding what to work on.

## Step 1 — Read recent daily notes

Use Glob on `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\` to list all `.md` files in `YYYY-MM-DD.md` format (ex : `2026-04-01.md`).
Sort lexicographically and take the **5 most recent files**.
Read in chronological order (oldest to most recent).

**Fallback** : if fewer than 5 exist, read those available without signaling shortage.
**Extraction** : note what occupies Victor — recurring mentions, revisited topics, disappearances, implicit decisions.

## Step 2 — Read the latest session

Use Glob on `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` to list all `.md` files.
Take the file with the **highest date**.

**Extraction** : accomplishments, next step, perceived momentum.
**Fallback** : if no session, note "no session recap" in final synthesis — use daily notes alone.

## Step 2bis — Long-term memory (optional)

**Condition** : launch only if Postgres and Ollama are accessible. If command fails → non-blocking, continue to Step 3, display : `⚠️ Long-term memory unavailable (Postgres/Ollama down) — synthesis based on daily notes only.`

Infer 2 major themes from daily notes read (active projects, recurring topics). For each :
```bash
uv run ~/.claude/semantic_search.py "<theme>" --top-k 2 --since <date J-30>
```

**Usage in synthesis** — enrich only :
- **Block 1** : if a project is mentioned over several weeks (historical pattern), note it `[evolving]` with first appearance date
- **Block 3** : if a shift is actually recurrence ("already observed on YYYY-MM-DD"), signal explicitly

Don't create extra blocks. Don't overload synthesis — max 1-2 historical enrichments.

---

## Step 3 — Synthesize in 4 blocks

From daily notes + session (if exists), build structured synthesis.
Limit to **3-5 items per block** — prioritize by importance/frequency.
**Strict rule** : never invent info absent from read files. If a block is empty, declare it explicitly.

### Block 1 — Active priorities

What Victor is **really working on** right now (WIP tickets, checked actions, recurring daily note topics).
Sort by frequency (more often = higher).
Mark each priority :
- `[solid]` — mentioned in last session OR last daily note
- `[evolving]` — mentioned ≥2 times in last 5 days
- `[hypothesis]` — rarely/indirectly mentioned

### Block 2 — Open questions

Decisions not made, uncertainties, mentioned topics without follow-up.
Search in daily notes : "not sure if", "to think about", "unsure", blocked tickets, abandonments/resumptions.
Sort by urgency (blockers before "long-term").

### Block 3 — Recent shifts

What has **changed** since last session or since start of 5 daily notes.
Search : priority changes, new mentions absent from session, disappearance of recurring topics, decisions made.
Sort by impact (visible impacts first).

### Block 4 — Energy / personal context

Victor's **personal state** (distinct from work priorities).
Extract from last 2-3 daily notes : energy level, fatigue/momentum, logistical constraints (Brno, travel, exam), emotional state.

## Output format

```
## My world — [today's date]

### 🎯 Active priorities
- [Priority 1] [solid/evolving/hypothesis]
- [Priority 2] [solid/evolving/hypothesis]

### ❓ Open questions
- [Question or uncertainty 1]

### 🔄 Recent shifts
- [What changed]

### ⚡ Energy / context
- [Current state in 1-2 sentences]

---
What do you want to work on?
```

## Step 4 — Present and close

Use the format provided below. **Rules** :
- Don't propose action plan or task suggestions (role of `/today`)
- Don't load project kanbans or inbox (out of scope)
- ALWAYS end with "What do you want to work on?" without chaining on
