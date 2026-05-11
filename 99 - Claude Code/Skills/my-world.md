---
name: my-world
description: Load the global context of {USER_NAME} BEFORE knowing what to work on. Use at session start when the user doesn't yet know where to focus, wants an overview of their current situation, or wants to calibrate priorities before choosing a subject. Different from /workon (which loads a specific subject) and /today (which plans the day with calendar and kanbans).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured on **output richness**, not structural compactness.
>
> **For `/evaluateskills`**: on mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (regrouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill : /my-world

Synthesizes the current state of {USER_NAME}'s life/projects in **4 blocks** to answer "where am I?" before deciding what to work on.

## Step 1 — Read recent daily notes

Use Glob on `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\` to list all `.md` files in `YYYY-MM-DD.md` format (ex: `2026-04-01.md`).
Sort lexicographically and take the **5 most recent files**.
Read in chronological order (oldest to most recent).

**Fallback**: if fewer than 5 exist, read those available without noting the shortage.
**Extraction**: note what occupies {USER_NAME} — recurring mentions, revisited subjects, disappearances, implicit decisions.

## Step 2 — Read the last session

Use Glob on `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` to list all `.md` files.
Take the file with the **highest date**.

**Extraction**: accomplishments, next step, perceived momentum.
**Fallback**: if no session, note "no session recap" in final synthesis — use daily notes alone.

## Step 2bis — Long-term memory (optional)

**Condition**: launch only if Postgres and Ollama are accessible. Test with:
```bash
python3 -c "import socket; s=socket.create_connection(('localhost',5433),timeout=2); s.close()"
curl -s http://localhost:11434/api/tags > /dev/null
```
Postgres listens on port **5433** (not 5432). If either fails → non-blocking, continue to Step 3, display: `⚠️ Long-term memory unavailable (Postgres/Ollama down) — synthesis from daily notes only.`

Infer 2 major themes from daily notes read (active projects, recurring subjects). For each:
```bash
uv run ~/.claude/semantic_search.py "<theme>" --top-k 2 --since <date J-30>
```

**Usage in synthesis** — enrich only:
- **Block 1**: if a project is mentioned over several weeks (historical pattern), note it `[evolving]` with first appearance date
- **Block 3**: if a shift is actually a recurrence ("already observed YYYY-MM-DD"), flag it explicitly

Don't create an extra block. Don't overload synthesis — max 1-2 historical enrichments.

---

## Step 3 — Synthesize into 4 blocks

From daily notes + session (if exists), build structured synthesis.
Limit to **3-5 items per block** — prioritize by importance/frequency.
**Strict rule**: never invent info absent from read files. If a block is empty, declare it explicitly.

### Block 1 — Active priorities

What {USER_NAME} is **actually working on** right now (WIP tickets, checked actions, recurring daily-note subjects).
Sort by frequency (more often = higher).
Mark each priority:
- `[solid]` — mentioned in last session OR last daily note
- `[evolving]` — mentioned ≥2 times in 5 days
- `[hypothesis]` — rarely/indirectly mentioned

### Block 2 — Open questions

Undecided decisions, uncertainties, topics mentioned without follow-up.
Search daily notes for: "not sure if", "to think about", "unsure", blocked tickets, abandonments/restarts.
Sort by urgency (blockers first).

### Block 3 — Recent shifts

What has **changed** since last session or start of the 5 daily notes.
Search for: priority changes, new mentions absent from session, disappearing recurring subjects, decisions made.
Sort by magnitude (visible impacts first).

### Block 4 — Energy / personal context

The **personal** state of {USER_NAME} (distinct from work priorities).
Extract from last 2-3 daily notes: energy level, fatigue/momentum, logistical constraints (Brno, travel, exam), emotional state.

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

Use the format provided above. **Rules**:
- Don't propose action plans or task suggestions (role of `/today`)
- Don't load project kanbans or inbox (out of scope)
- **Always** end with "What do you want to work on?" without continuing
