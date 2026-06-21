---
name: closeday
description: "End-of-day wrap-up — synthesize sessions, update daily note with observed patterns, detect WIP hobby in progress, verify essay-check overdue. Trigger when the user says one of these phrases: \"closeday\", \"I'm stopping\", \"I'm done\", \"that's finished\", \"end of session\", \"good night\", \"good day\", \"stopping for today\", \"that's enough\", \"day finished\", \"I'm stopping now\", \"it's done\" or via /closeday."
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, highlights, open questions, tone, narration). Preserving qualitative content takes precedence over reducing lines.

# Skill : Close Day

## Trigger

the user says one of these phrases (or equivalent) :
- "closeday"
- "I'm stopping", "I'm done", "that's finished"
- "good night", "good day"
- "end of session", "I'm stopping"

Or: command `/closeday`

## Step 1 — Collect day's data

**Target date** : calculate before any reading. If `hour < 04:00` → date = yesterday, else date = today. Use this date for all paths below.

Read in parallel (with fallbacks) :

1. **Daily note of the day** : `00 - Daily notes/[target date].md`
   - If absent → create minimal file (empty frontmatter + day title), continue
   - Format : `---\n---\n# YYYY-MM-DD\n`
   
2. **Sessions of the day** : `99 - Claude Code/Sessions/YYYY-MM-DD.md`
   - If absent → synthesize from daily note, note `[Approx synthesis — to be validated by {USER_NAME}]`
   - If multiple sessions → enumerate each with start time (ex: `09:30 — Project X`)
   - If file too long (token error) → read by successive chunks (limit: 200, offset: 0 → 200 → 400 → …) until complete. Never build summary on partial read — if truncation, note `[Complete read by chunks — synthesis validated]`.
   
3. **Hobby Kanban** : `02 - Hobbies/Hobby Kanban.md`
   - If absent → skip Step 1.5 silently
   - Check if `## WIP` column contains tickets (non-empty items)

4. **Weekly lookback — 3 previous daily notes** : `00 - Daily notes/YYYY-MM-DD.md` for J-1, J-2, J-3
   - Targeted reading of `## 🌙 Day wrap-up`, `## 💡 Ideas & Reflections`, frontmatter (`energy`, `score`, `feeling`)
   - If a daily note is absent → skip silently, continue with available ones
   - Objective : detect inter-day patterns (energy rising/falling, recurring subjects, contradictions with today, repeated or isolated highlights)
   - These data feed Step 2.2 (sourced open questions) and Step 2.3 (general state narrative)

## Step 2 — Build the wrap-up

### 2.1 — Aggregation and narrative grouping

From daily note and `Sessions/YYYY-MM-DD.md`, extract and **group by project** (not flat chronological order) :

- **Grouping by project/theme** : one feature, one project, one refinement session, one personal project = one bullet. Do not split if multiple sessions cover the same subject.
- **Mandatory execution context per bullet** : for each project, include what makes the work concrete — stack touched, files modified, tests written, ADR created, decisions made, people involved. No bare bullet like "Bug 429 fail to fetch" — prefer "Bug 429 + fail to fetch armed input/project — exponential retry on client side, Prisma timing debug, 3 tests added".
- **Narrative highlights** : explicitly call out marking events of the day (nice surprise, frustration, joy moment, notable interaction, crisis) — these go in `General state` at Step 2.3, not in the bullet list.
- **Energy and states** : observations of flow, fatigue, blockers, notable gaps (ex: low energy but high output) — for general state.
- **Inter-day patterns** : cross-referencing with 3 previous daily notes (loaded at Step 1, point 4), highlight what repeats, what contradicts, what emerges as constant. These observations feed open questions at Step 2.2.
- **Semantic already-seen check** (optional) : for each pattern identified above, query :
  ```bash
  uv run ~/.claude/semantic_search.py "<pattern in 3-5 words>" --top-k 2 --type completed
  ```
  If similarity ≥ 0.45 on a prior session → the pattern is a **deja-vu**. For each deja-vu :
  1. **First appearance date** : extract date from found session
  2. **What came of it** : relaunch with `--type next_steps --since <date>` to see planned follow-ups after this pattern
  3. **Causal link** : if follow-ups exist, build the link "pattern → what happened after"
  This information enriches the `Patterns detected` section in the note (see template below).
  If Postgres/Ollama inaccessible → non-blocking, display : `⚠️ Deja-vu verification unavailable (Postgres/Ollama down) — patterns sourced from daily notes only.`
- **Ideas/Decisions** : flag but **process in Step 4, not here**.

### 2.2 — Presentation and validation of wrap-up

Present to {USER_NAME} **the full narrative version** — not a summarized version. {USER_NAME} must see in chat what will be written, not a flat preview :

> Here's what I saw for the day :
>
> **What was done** (grouped by project, context included) :
> - [project 1 — execution context : stack, files, tests, ADR, decisions]
> - [project 2 — execution context]
> - …
>
> **General state** (narrative, 2-4 sentences) : [energy felt, flow or friction, day highlight, possible link with fatigue/motivation — tell the day, don't summarize it]
>
> **Patterns observed** (cross-referenced with 3 prior days) :
> - [recurring pattern or contradiction detected, sourced "seen J-1/J-2" or "new vs yesterday"]
> - [energy/output gap, or motivation compensating fatigue, etc.]
>
> **2 questions to dig deeper** (sourced from weekly lookback, not generic) :
> 1. [Question linked to specific inter-day pattern, ex: "Pattern X came back 3 times this week — is it constant or context Y related ?"]
> 2. [Question on what notes don't capture well, or observed contradiction]

**Rules for open questions** :
- **Always 1 to 2 questions**, never zero (that's what makes the retrospective alive)
- **Sourced** : each question must rely on something concrete seen in the 3 last dailies or in today's thinking sessions
- **Not generic** : avoid "how do you feel?", "what did you learn?" — prefer precise questions on detected patterns or contradictions

**If `## 💡 Ideas & Reflections` exists and filled** → present full narrative version + open questions, then ask : "Sound good, should I note it?"
- Accept : yes, ok, agreed, yeah. Reject : no, nope, silence/timeout (45s) → continue without modifying.

**Otherwise (section empty or absent)** → present what could be reconstructed + ask :
> (1) What did you really advance ? (2) A blocker or observation ? (3) [question sourced from weekly lookback if patterns detected]

Accept responses (free form). Timeout (45s) or no response → include existing data (sessions, mood, weekly lookback) + note "[Quick Wrap skipped — timeout]".

### 2.3 — Writing the wrap-up

**Check if `## 🌙 Day wrap-up` already exists** → If yes, skip to Step 3 (wrap-up already written). If no, add at bottom of daily note :

```markdown
## 🌙 Day wrap-up

### What was done
- **[Project 1 — narrative title]** — complete execution context : stack touched, files modified, tests written, ADR created, decisions made, concrete results
- **[Project 2 — narrative title]** — complete execution context
- [...]

### Energy & state
- Energy of the day : [frontmatter value or "not filled"]
- Final score : [score]/5 — *[feeling]*
- **General state** : [NARRATIVE 2-4 sentences — tell the day, don't summarize it. Include : day's tone (atypical, dense, calm, difficult...), possible energy/output gap, flow moments, highlight(s) noted (good news, frustration, notable interaction, crisis, joy). No bullets here — text that tells a story.]

### Patterns detected
[Cross-reference with 3 previous daily notes. Integrate 2-4 structured observations :
- Inter-day patterns (recurrences, contradictions, energy/output gaps)
- Emerging behavioral dynamics sourced on concrete facts
- If `## 💡 Ideas & Reflections` is filled : do NOT just write "See Reflections section" — meta above it, highlight what emerges crossing multiple thinking sessions, not just list them
- For patterns identified as deja-vu (semantic verification Step 2.1) : mandatory format :
  `→ Already observed on YYYY-MM-DD — follow-up : [what came of it, in 1 sentence]`]

### Tomorrow
- Next priority step : [from sessions]
- Don't forget : [mentioned during the day]
```

**Critical rule on narrative quality** : this wrap-up is the main skill output. Steps 4 (ideas to pursue), 5 (capitalization proposals) and 6 (essay-check) are **secondary** and must **in no way** compromise wrap-up richness. If the model feels torn between "write the wrap-up well" and "anticipate lateral capitalizations", **absolute priority to narrative wrap-up**.

## Step 3 — Score, feeling and frontmatter

**Score** — Check if `score:` exists in frontmatter (numeric value 1-5).

**If present and valid** → move to feeling.

**If absent or invalid** :
- Ask : "Rate your day on 5 ?"
- Accept : numbers 1-5. Reject : non-number, silence/timeout (30s) → skip without score.
- If obtained → write in frontmatter : `score: [value]`

(This score conditions the weekly essay-check at Step 6.)

**Feeling** — Always ask, whether score is already present or not :
- Ask : "One word on the day ?" (ex: *"tough morning, good restart afternoon"*, *"smooth throughout"*, *"exhausting but satisfied"*)
- Accept : free text, 1 line max. Timeout (30s) → skip without feeling.
- If response → write in frontmatter : `feeling: "[text]"`

## Step 4 — Ideas and decisions : filing suggestions

From sessions and daily note, **flag all ideas/decisions mentioned** : new insights, direction changes, tasks to track, tech to explore, etc.

**If none found** → skip silently, go to Step 5.

**If found** : propose a destination for each :

```
[Idea] → [Destination : 03 - Knowledge/ | 04 - Projects/… | 01 - Me/{USER_NAME}.md | project kanban | Hobby Kanban | command-tracker]
```

Present :

> Ideas/decisions of the day :
> - [item 1] → [destination]
> - [item 2] → [destination]
> 
> Want to file some ?

Accept : explicit lists ("yes, the first 2", "item X only"). Reject : "no", "nope", silence/timeout (45s) → leave in daily note, write nothing.

## Step 5 — Capitalization proposals (conditional)

**Check** if `99 - Claude Code/Sessions/proposals-YYYY-MM-DD.md` exists for the day's date.

**If absent** → skip silently, go to Step 6.

**If present and `processed: true`** → skip silently, go to Step 6.

**If present and `processed: false`** :

1. Read the file
2. Present proposals to {USER_NAME} :

> Capitalization proposals of the day :
>
> [for each Session block]
> **Session HH:MM :**
> - [ADR] Title — Scope — Context
> - [Skill] Skill name — Action — Context
>
> Do you validate, reject, or defer ?

3. For each validated item :
   - **Transverse ADR** → create in `99 - Claude Code/ADR/` + update `ADR/INDEX.md`
   - **Project ADR** → create in `04 - Projects/[Project]/claude-code/ADR/`
   - **Skill update** → apply modification in `99 - Claude Code/Skills/[skill].md`
   - **Skill create** → invoke `/create-ticket` with type Enhancement to ticket the creation
4. Timeout (45s) or global reject → skip all
5. **Always** mark `processed: true` in frontmatter after processing (validated or not)

## Step 6 — Weekly essay-check (conditional)

**Read** `99 - Claude Code/command-tracker.md` and find the last line `- /essay-check → YYYY-MM-DD`.

**Conditions to trigger essay-check** :
- command-tracker exists **AND**
- `/essay-check` entry found **AND**
- date in YYYY-MM-DD format valid **AND**
- date ≥ 7 days old (overdue)

Otherwise (file absent, entry not found, invalid format, or date < 7d) → skip essay-check, **move to Step 7**.

---

**If essay-check overdue** :

Trigger `/essay-check` and wait for return. (Full synthesis, check-in, and {USER_NAME}.md enrichment are handled by the dedicated `essay-check` skill.)

**After essay-check** : Update command-tracker : `/essay-check → YYYY-MM-DD` (today's date). Then move to Step 7.

## Step 7 — Nudge measurement dreaming (conditional — Phase 0)

**Read** `99 - Claude Code/memory/digest.md`.

**Conditions to trigger nudge** :
- file exists **AND**
- its frontmatter contains `enabled: true`

Otherwise (absent, `enabled: false`, or invalid format) → skip silently, end closeday. *(The nudge thus self-disables once Phase 0 dreaming is turned off — no debt cleanup.)*

---

**If active** :

Phase 0 of dreaming tests whether the working digest injected at SessionStart actually helps (cf. `99 - Claude Code/memory/phase0-log.md`, spec §11 — *"without metric, impossible to decide"*). From today's sessions, **propose** to {USER_NAME} a line to add to the Journal table in `phase0-log.md` :

```
| YYYY-MM-DD | <session(s) of day, subject> | <✅ / ⚠️ partial / ❌ outdated> | <yes/no fetch avoided> | <yes/no hit useful> | <short note> |
```

- If nothing observable (digest not used, day outside vault) → propose a neutral line anyway (`| … | — | — | — | no notable usage |`) : **the trace of absence counts** for the verdict.
- **No writing without {USER_NAME} validation** — append at end of Journal table, never overwrite. Never judge "hit useful" on their behalf without confirmation.
- If {USER_NAME} flags that a live thread changed → propose updating `digest.md` + its `updated:` (optional, on demand).

## Rules

1. **Absolute priority to narrative wrap-up** — the main skill output is a rich, narrative, project-grouped wrap-up, with weekly lookback and sourced open questions. Steps 4-5-6 (filing, capitalization, essay-check) are **secondary** and must never degrade wrap-up quality. If the model must arbitrate between narrative richness and lateral step anticipation, choose narrative richness.
2. **No flat list** — Step 2.3 : bullets in "What was done" must be grouped by project with complete execution context, never a flat chronological list. "General state" must be a 2-4 sentence narrative, not a bullet summary.
3. **Always 1-2 sourced open questions** at Step 2.2 — never zero, never generic. They must rely on concrete patterns observed in the 3 previous daily notes or today's thinking sessions.
4. **No writing without confirmation** — always present before writing
5. **Standard timeouts** — each interaction has a max (30-45s per context). On expiry : default action (skip, continue + note "[action skipped — timeout]")
6. **Graceful missing files** — skip silently if non-blocking (except today's daily note — create if absent)
7. **Append-only** — never overwrite daily note — `## 🌙 Day wrap-up` sections added at bottom. If already exists → skip to Step 3.
8. **Robust parsing** — unexpected format (ex : `score: "four"`, malformed date) → skip + note "[invalid format]", don't block
9. **Chunking by slices** — too long : limit: 200 (sessions) or 100 (mood), offset: 0 → 200/100 → … until end
10. **{USER_NAME}.md fallback** — if absent, skip all enrichment silently (Step 6 only)
