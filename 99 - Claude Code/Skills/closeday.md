---
name: closeday
description: End-of-day summary — synthesize sessions, update daily note with observed patterns, detect WIP Warhammer in progress, verify essay-check overdue. Trigger when user says one of these formulas : "closeday", "I'm stopping", "I'm finishing", "it's done", "end of session", "goodnight", "good day", "I'm stopping now", "that's enough", "day is done", "I'm done stopping", "it's finished" or via /closeday.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of output produced**, not structural compactness.
>
> **For `/evaluateskills`** : if mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill : Close Day

## Triggering

user says one of these formulas (or equivalent) :
- "closeday"
- "I'm stopping", "I'm finishing", "it's done"
- "goodnight", "good day"
- "end of session", "I'm stopping"

Or : command `/closeday`

## Step 1 — Collect Data from the Day

**Target date** : calculate before any reading. If `hour < 04:00` → date = yesterday, otherwise date = today. Use this date for all paths below.

Read in parallel (with fallbacks) :

1. **Daily note of the day** : `00 - Daily notes/[target date].md`
   - If missing → create minimal file (empty frontmatter + day title), continue
   - Format : `---\n---\n# YYYY-MM-DD\n`
   
2. **Sessions of the day** : `99 - Claude Code/Sessions/YYYY-MM-DD.md`
   - If missing → synthesize from daily note, note `[Approximate synthesis — to be validated by {USER_NAME}]`
   - If multiple sessions → list each with start time (e.g., `09:30 — Project X`)
   - If file too long (token error) → read in successive chunks (limit: 200, offset: 0 → 200 → 400 → …) until end. Never build summary from partial read — if truncation, note `[Complete read by chunks — summary validated]`.
   
3. **Hobby Kanban** : `02 - Hobbies/Hobby Kanban.md`
   - If missing → skip Step 1.5 silently
   - Check if `## WIP` column contains tickets (non-empty items)

4. **Weekly lookback — 3 previous daily notes** : `00 - Daily notes/YYYY-MM-DD.md` for D-1, D-2, D-3
   - Targeted reading of sections `## 🌙 End of Day Summary`, `## 💡 Ideas & Reflections`, frontmatter (`energy`, `score`, `ressenti`)
   - If a daily note is missing → skip silently, continue with present ones
   - Objective : detect inter-day patterns (rising/falling energy, recurring topics, contradictions with today, repeated or isolated key moments)
   - This data feeds Step 2.2 (sourced open questions) and Step 2.3 (overall state narrative)

## Step 2 — Build the Summary

### 2.1 — Narrative Aggregation and Grouping

From daily note and `Sessions/YYYY-MM-DD.md`, extract and **group by project** (not chronological order) :

- **Grouping by project/theme** : one feature, one project, one refinement session, one personal task = one bullet. Don't split if multiple sessions cover same subject.
- **Execution context mandatory per bullet** : for each project, include what makes work concrete — stack touched, files modified, tests written, ADR created, decisions made, people involved. No bare bullets like "Bug 429 fail to fetch" — prefer "Bug 429 + fail to fetch armed input/project — exponential retry client-side, debug Prisma timing, 3 tests added".
- **Key narrative moments** : explicitly note significant events of the day (pleasant surprise, frustration, joy, notable interaction, crisis) — these go in `Overall state` at Step 2.3, not in bullet list.
- **Energy and states** : observations of flow, fatigue, blockers, notable gaps (e.g., low energy but high output) — for overall state.
- **Inter-day patterns** : crossing with 3 previous daily notes (loaded at Step 1, point 4), note what repeats, what contradicts, what emerges as constant. These observations feed open questions at Step 2.2.
- **Optional semantic seen-before check** (optional) : for each pattern identified above, run :
  ```bash
  uv run ~/.claude/semantic_search.py "<pattern in 3-5 words>" --top-k 2 --type accomplished
  ```
  If similarity ≥ 0.45 on earlier session → pattern is a **seen-before**. For each seen-before :
  1. **First occurrence date** : extract date from found session
  2. **What came from it** : rerun with `--type next_steps --since <date>` to see planned followups after pattern
  3. **Causal link** : if followups exist, build link "pattern → what happened next"
  Store this info in note's `Patterns detected` section (see template below).
  If Postgres/Ollama unreachable → non-blocking, display : `⚠️ Seen-before check unavailable (Postgres/Ollama down) — patterns sourced from daily notes only.`
- **Ideas/Decisions** : note but **handle in Step 4, not here**.

### 2.2 — Presentation and Validation of Summary

Present to {USER_NAME} **the complete narrative version** — not a summary. {USER_NAME} must see in chat what will be written, not flat preview :

> Here's what I saw on the day :
>
> **What got done** (grouped by project, execution context included) :
> - [project 1 — execution context : stack, files, tests, ADR, decisions]
> - [project 2 — execution context]
> - …
>
> **Overall state** (narrative, 2-4 sentences) : [energy felt, flow or friction, key moment of the day, possible link with fatigue/motivation — tell the day's story, don't summarize]
>
> **Patterns observed** (crossed with 3 previous days) :
> - [recurring pattern or contradiction detected, sourced "seen on D-1/D-2" or "new vs yesterday"]
> - [energy/output gap, or motivation compensating fatigue, etc.]
>
> **2 questions to explore** (sourced from weekly lookback, not generic) :
> 1. [Question linked to specific inter-day pattern, e.g., "Pattern X returned 3 times this week — is it constant or context Y-related ?"]
> 2. [Question on what notes don't capture well, or observed contradiction]

**Rules for open questions** :
- **Always 1 to 2 questions**, never zero (that's what makes retrospective alive)
- **Sourced** : each question must rely on something concrete seen in 3 last dailies or thinking sessions of the day
- **Not generic** : avoid "how do you feel ?", "what did you learn ?" — prefer precise questions on detected patterns or contradictions

**If `## 💡 Ideas & Reflections` exists and is filled** → present complete narrative version + open questions, then ask : "Good, I'll note it ?"
- Accept : yes, ok, agreed, yeah. Refuse : no, nope, silence/timeout (45s) → continue without modifying.

**Otherwise (section empty or missing)** → present what could be reconstructed + ask :
> (1) What did you really advance ? (2) A blocker or observation ? (3) [sourced question from weekly lookback if patterns detected]

Accept responses (free form). Timeout (45s) or no response → include existing data (sessions, mood, weekly lookback) + note "[Quick Wrap skipped — timeout]".

### 2.3 — Writing the Summary

**Check if `## 🌙 End of Day Summary` already exists** → If yes, go to Step 3 (summary already written). If no, add at bottom of daily note :

```markdown
## 🌙 End of Day Summary

### What got done
- **[Project 1 — narrative title]** — complete execution context : stack touched, files modified, tests written, ADR created, decisions made, concrete results
- **[Project 2 — narrative title]** — complete execution context
- [...]

### Energy & state
- Energy of the day : [frontmatter value or "not specified"]
- Final score : [score]/5 — *[feeling]*
- **Overall state** : [NARRATIVE 2-4 sentences — tell the day's story, don't summarize. Include : day's tone (atypical, dense, calm, difficult...), any energy/output gap, flow moments, key moment(s) noted (good news, frustration, interaction, crisis, joy). No bullets here — text that tells.]

### Patterns detected
[Cross with 3 previous daily notes. Integrate 2-4 structured observations :
- Inter-day patterns (recurrences, contradictions, energy/output gaps)
- Emerging behavioral dynamics sourced on concrete facts
- If `## 💡 Ideas & Reflections` is filled : do NOT just write "See Reflections section" — do **meta** on top, note what emerges crossing multiple thinking sessions, not just list them
- For patterns identified as seen-before (Step 2.1 semantic check) : mandatory format :
  `→ Already seen YYYY-MM-DD — followup : [what came from it, 1 sentence]`]

### Tomorrow
- Next priority step : [from sessions]
- Don't forget : [mentioned during day]
```

**Critical rule on narrative quality** : this summary is the skill's main output. Steps 4 (ideas to file), 5 (capitalization proposals) and 6 (essay-check) are **secondary** and must **in no way** compromise summary richness. If model feels torn between "write good summary" and "anticipate lateral steps", **absolute priority to narrative richness**.

## Step 3 — Score, Feeling and Frontmatter

**Score** — Check if `score:` exists in frontmatter (numeric value 1-5).

**If present and valid** → proceed to feeling.

**If missing or invalid** :
- Ask : "Rate your day out of 5 ?"
- Accept : numbers 1-5. Refuse : non-number, silence/timeout (30s) → skip without score.
- If obtained → write in frontmatter : `score: [value]`

(This score conditions weekly essay-check at Step 6.)

**Feeling** — Always ask, whether score already present or not :
- Ask : "One word on the day ?" (e.g., *"hard morning, good afternoon"*, *"smooth throughout"*, *"draining but satisfied"*)
- Accept : free text, 1 line max. Timeout (30s) → skip without feeling.
- If response → write in frontmatter : `ressenti: "[text]"`

## Step 4 — Ideas and Decisions : Filing Suggestions

From sessions and daily note, **find all mentioned ideas/decisions** : new insights, direction changes, tasks to track, tech to explore, etc.

**If none found** → skip silently, go to Step 5.

**If found** : propose a destination for each :

```
[Idea] → [Destination : 03 - Knowledge/ | 04 - Projects/… | 01 - Me/{USER_NAME}.md | kanban project | Hobby Kanban | command-tracker]
```

Present :

> Ideas/decisions of the day :
> - [item 1] → [destination]
> - [item 2] → [destination]
> 
> Want to file some ?

Accept : explicit lists ("yes, first 2", "item X only"). Refuse : "no", "nope", silence/timeout (45s) → leave in daily note, write nothing.

## Step 5 — Capitalization Proposals (conditional)

**Check** if `99 - Claude Code/Sessions/proposals-YYYY-MM-DD.md` exists for today's date.

**If missing** → skip silently, go to Step 6.

**If present and `processed: true`** → skip silently, go to Step 6.

**If present and `processed: false`** :

1. Read file
2. Present proposals to {USER_NAME} :

> Capitalization proposals of the day :
>
> [for each Session block]
> **Session HH:MM :**
> - [ADR] Title — Scope — Context
> - [Skill] Name — Action — Context
>
> Do you validate, reject, or defer ?

3. For each validated item :
   - **Cross-cutting ADR** → create in `99 - Claude Code/ADR/` + update `ADR/INDEX.md`
   - **Project ADR** → create in `04 - Projects/[Project]/claude-code/ADR/`
   - **Skill update** → apply modification in `99 - Claude Code/Skills/[skill].md`
   - **Skill create** → invoke `/create-ticket` with Improvement type to ticketize creation
4. Timeout (45s) or global refusal → skip all
5. **Always** mark `processed: true` in frontmatter after processing (validated or not)

## Step 6 — Weekly Essay-check (conditional)

**Read** `99 - Claude Code/command-tracker.md` and find last line `/essay-check → YYYY-MM-DD`.

**Conditions to trigger essay-check** :
- command-tracker exists **AND**
- `/essay-check` entry found **AND**
- date in YYYY-MM-DD format valid **AND**
- date ≥ 7 days old (overdue)

Otherwise (file missing, entry not found, invalid format, or date < 7 days) → skip, end closeday.

---

**If essay-check overdue** :

Trigger `/essay-check` and wait for return. (All synthesis, check-in, and {USER_NAME}.md enrichment handled by dedicated `essay-check` skill.)

**After essay-check** : Update command-tracker : `/essay-check → YYYY-MM-DD` (today's date).

## Rules

1. **Absolute priority to narrative summary** — the skill's main output is a rich, narrative summary, grouped by project, with weekly lookback and sourced open questions. Steps 4-5-6 (filing, capitalization, essay-check) are **secondary** and must never degrade summary quality. If model must choose between narrative richness and lateral anticipation, choose narrative richness.
2. **No flat list** — Step 2.3 : bullets in "What got done" must be grouped by project with complete execution context, never chronological list. "Overall state" must be narrative 2-4 sentences, not summary bullets.
3. **Always 1-2 sourced open questions** at Step 2.2 — never zero, never generic. They must rely on concrete patterns observed in 3 previous dailies or thinking sessions of the day.
4. **No writing without confirmation** — always present before writing
5. **Standard timeouts** — each interaction has max (30-45s depending context). At expiration : default action (skip, continue + note "[action skipped — timeout]")
6. **Graceful missing files** — skip silently if non-blocking (except today's daily note — create if missing)
7. **Append-only** — never overwrite daily note — sections `## 🌙 End of Day Summary` added at bottom. If exists → skip to Step 3.
8. **Robust parsing** — unexpected format (e.g., `score: "four"`, malformed date) → skip + note "[invalid format]", don't block
9. **Chunking by chunks** — too long : limit: 200 (sessions) or 100 (mood), offset: 0 → 200/100 → … until end
10. **{USER_NAME}.md fallback** — if missing, skip all enrichment silently (Step 6 only)
