---
name: closeday
description: End-of-day summary — synthesize sessions, update daily note with observed patterns, detect Warhammer WIP in progress, check essay-check overdue. Trigger when Victor says one of these phrases : "closeday", "I'm stopping", "I'm done", "that's done", "end of session", "good night", "good day", "I'm stopping now", "that's enough", "day's over", "I'm done stopping", "it's finished" or via /closeday.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected from aggressive optimization**
>
> This skill produces **narrative qualitative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). The preservation of qualitative content takes priority over line reduction.

# Skill : Close Day

## Trigger

Victor says one of these phrases (or equivalent) :
- "closeday"
- "I'm stopping", "I'm done", "it's done"
- "good night", "good day"
- "end of session", "I'm stopping"

Or : command `/closeday`

## Step 1 — Collect day's data

**Target date** : calculate before any reading. If `time < 04:00` → date = yesterday, else date = today. Use this date for all paths below.

Read in parallel (with fallbacks) :

1. **Daily note of day** : `00 - Daily notes/[target date].md`
   - If absent → create minimal file (empty frontmatter + day title), continue
   - Format : `---\n---\n# YYYY-MM-DD\n`
   
2. **Sessions of day** : `99 - Claude Code/Sessions/YYYY-MM-DD.md`
   - If absent → synthesize from daily note, note `[Approx synthesis — to be validated by Victor]`
   - If multiple sessions → enumerate each with start time (ex: `09:30 — Project X`)
   - If file too long (token error) → read in successive chunks (limit: 200, offset: 0 → 200 → 400 → …) until complete. Never build summary on partial read — if truncation, note `[Complete read by chunks — synthesis validated]`.
   
3. **Hobby Kanban** : `02 - Hobbies/Hobby Kanban.md`
   - If absent → skip Step 1.5 silently
   - Verify if `## WIP` column contains tickets (non-empty items)

4. **Weekly lookback — 3 previous daily notes** : `00 - Daily notes/YYYY-MM-DD.md` for J-1, J-2, J-3
   - Targeted read of `## 🌙 Day Summary`, `## 💡 Ideas & Reflections`, frontmatter (`energy`, `score`)
   - If a daily note missing → skip silently, continue with available ones
   - Objective : detect inter-day patterns (energy rising/falling, recurring topics, contradictions with today, repeated or isolated highlights)
   - This data feeds Step 2.2 (sourced open questions) and Step 2.3 (general state narrative)

## Step 1.5 — Warhammer tracking (optional — skip if Hobby Kanban absent)

**Prerequisite** : Hobby Kanban found.

**If `## WIP` is not empty** → skip (already populated, no need to re-launch).

**If `## WIP` is empty** → Ask : "Any figurines in progress? (Warhammer, painting, etc.)"

Accept : "yes", "ok", or concrete name. Refuse : "no", silence, timeout (30s) → continue without writing.
- If accepted → add to WIP
- Otherwise → continue without writing

## Step 2 — Build summary

### 2.1 — Aggregation and narrative grouping

From daily note and `Sessions/YYYY-MM-DD.md`, extract and **group by project** (not in flat chronological order) :

- **Grouping by project/theme** : one feature, one project, one refinement session, one personal task = one bullet. Don't splinter by session if multiple sessions cover same subject.
- **Mandatory execution context per bullet** : for each project, include what makes work concrete — stack touched, files modified, tests written, ADR created, decisions made, people involved. No bare bullet like "Bug 429 fail to fetch" — prefer "Bug 429 + fail to fetch armed input/project — exponential retry client-side, Prisma timing debug, 3 tests added".
- **Narrative highlights** : explicitly note day's landmark events (good surprise, frustration, joy moment, notable interaction, crisis) — these go in `General state` at step 2.3, not in bullets.
- **Energy and states** : observations of flow, fatigue, blockers, notable gaps (ex: low energy but high output) — for general state.
- **Inter-day patterns** : crossing with 3 previous daily notes read (loaded at step 1, point 4), note what repeats, what contradicts, what emerges as constant. These observations feed Step 2.2 open questions.
- **Optional semantic already-seen check** (optional) : for each pattern identified above, query :
  ```bash
  uv run ~/.claude/semantic_search.py "<pattern in 3-5 words>" --top-k 2 --type accomplished
  ```
  If similarity ≥ 0.45 on earlier session → pattern is an **already-seen**. For each already-seen :
  1. **First appearance date** : extract date from found session
  2. **What followed** : re-launch with `--type next_steps --since <date>` to see planned follow-ups after this pattern
  3. **Causal link** : if follow-ups exist, build the link "pattern → what happened after"
  This information enriches `Patterns detected` section in note (see template below).
  If Postgres/Ollama inaccessible → non-blocking, display : `⚠️ Already-seen check unavailable (Postgres/Ollama down) — patterns sourced from daily notes only.`
- **Ideas/Decisions** : note but **handle in Step 4, not here**.

### 2.2 — Presentation and validation of summary

Present to Victor **the full narrative version** — not a summary preview. Victor should see in chat what will be written, not a flat preview :

> Here's what I saw over the day :
>
> **What was done** (grouped by project, execution context included) :
> - [project 1 — execution context : stack, files, tests, ADR, decisions]
> - [project 2 — execution context]
> - …
>
> **General state** (narrative, 2-4 sentences) : [energy felt, flow or friction, day's highlight, eventual link with fatigue/motivation — tell the day, don't summarize]
>
> **Patterns observed** (crossed with last 3 days) :
> - [recurring pattern or detected contradiction, sourced "already seen J-1/J-2" or "new vs yesterday"]
> - [energy/output gap, or motivation compensating fatigue, etc.]
>
> **2 questions to dig into** (sourced from weekly lookback, not generic) :
> 1. [Question linked to specific inter-day pattern, ex: "Pattern X came back 3 times this week — is it constant or linked to context Y ?"]
> 2. [Question on what notes don't capture well, or observed contradiction]

**Rules for open questions** :
- **Always 1 to 2 questions**, never zero (that's what makes retrospective alive)
- **Sourced** : each question must rest on something concrete seen in last 3 dailies or thinking sessions today
- **Not generic** : avoid "how do you feel?", "what did you learn?" — prefer precise questions on detected patterns or contradictions

**If `## 💡 Ideas & Reflections` exists and filled** → present full narrative version + open questions, then ask : "Good, I'll note it?"
- Accept : yes, ok, agreed, yeah. Refuse : no, nope, silence/timeout (45s) → continue without modifying.

**Otherwise (section empty or absent)** → present what could be reconstructed + ask :
> (1) What did you really advance? (2) A blocker or observation? (3) [sourced question from weekly lookback if patterns detected]

Accept responses (free form). Timeout (45s) or no response → include existing data (sessions, mood, weekly lookback) + note "[Quick Wrap skipped — timeout]".

### 2.3 — Writing the summary

**Check if `## 🌙 Day Summary` already exists** → If yes, go to Step 3 (summary already written). If no, add at bottom of daily note :

```markdown
## 🌙 Day Summary

### What was done
- **[Project 1 — narrative title]** — complete execution context : stack touched, files modified, tests written, ADR created, decisions made, concrete results
- **[Project 2 — narrative title]** — complete execution context
- [...]

### Energy & state
- Day's energy : [frontmatter value or "not provided"]
- Final score : [Step 3]
- **General state** : [NARRATIVE 2-4 sentences — tell the day, don't summarize. Include : day's tone (atypical, dense, calm, difficult...), any energy/output gap, flow moments, highlights (good news, frustration, notable interaction, crisis, joy). No bullets here — prose that tells.]

### Patterns detected
[Cross with last 3 daily notes. Integrate 2-4 structured observations :
- Inter-day patterns (recurrences, contradictions, energy/output gaps)
- Emerging behavioral dynamics sourced on concrete facts
- If `## 💡 Ideas & Reflections` is filled : don't just write "See Reflections" — do **meta** analysis, note what emerges crossing multiple thinking sessions, not just list them
- For patterns identified as already-seen (semantic check Step 2.1) : mandatory format :
  `→ Already observed on YYYY-MM-DD — follow-up : [what happened after, 1 sentence]`]

### Tomorrow
- Next priority step : [from sessions]
- Don't forget : [mentioned during day]
```

**Critical rule on narrative quality** : this summary is the skill's main output. Steps 4 (ideas to track), 5 (capitalization proposals) and 6 (essay-check) are **secondary** and must **in no way** compromise summary richness. If the model feels pulled between "write good summary" and "anticipate lateral capitalizations", **absolute priority to narrative richness**.

## Step 3 — Score and frontmatter

Check if `score:` exists in frontmatter (numeric value 1-5).

**If present and valid** → continue to Step 4.

**If absent or invalid** :
- Ask : "Rate your day on 5?"
- Accept : numbers 1-5. Refuse : non-number, silence/timeout (30s) → skip without score, continue to Step 4.

(This score conditions weekly essay-check in Step 6.)

## Step 4 — Ideas and decisions : filing suggestions

From sessions and daily note, **identify all mentioned ideas/decisions** : new insights, direction changes, tasks to track, tech to explore, etc.

**If none found** → skip silently, go to Step 5.

**If found** : propose a destination for each :

```
[Idea] → [Destination : 03 - Knowledge/ | 04 - Projects/… | {PERSONAL_FOLDER}/{USER_NAME}.md | project kanban | Hobby Kanban | command-tracker]
```

Present :

> Ideas/decisions from day :
> - [item 1] → [destination]
> - [item 2] → [destination]
> 
> Want to file any?

Accept : explicit lists ("yes, first 2", "item X only"). Refuse : "no", "nope", silence/timeout (45s) → leave in daily note, write nothing.

## Step 5 — Capitalization proposals (conditional)

**Check** if `99 - Claude Code/Sessions/proposals-YYYY-MM-DD.md` exists for day's date.

**If absent** → skip silently, go to Step 6.

**If present and `processed: true`** → skip silently, go to Step 6.

**If present and `processed: false`** :

1. Read the file
2. Present proposals to Victor :

> Capitalization proposals from day :
>
> [for each Session block]
> **Session HH:MM :**
> - [ADR] Title — Scope — Context
> - [Skill] Name — Action — Context
>
> You validate, reject, or defer?

3. For each validated element :
   - **Transverse ADR** → create in `99 - Claude Code/ADR/` + update `ADR/INDEX.md`
   - **Project ADR** → create in `04 - Projects/[Project]/claude-code/ADR/`
   - **Skill update** → apply modification in `99 - Claude Code/Skills/[skill].md`
   - **Skill create** → invoke `/create-ticket` with type Improvement to ticketize creation
4. Timeout (45s) or global refusal → skip all
5. **Always** mark `processed: true` in frontmatter after handling (validated or not)

## Step 6 — Weekly essay-check (conditional)

**Read** `99 - Claude Code/command-tracker.md` and find last line `- /essay-check → YYYY-MM-DD`.

**Conditions to trigger essay-check** :
- command-tracker exists **AND**
- `/essay-check` entry found **AND**
- date in valid YYYY-MM-DD format **AND**
- date ≥ 7 days (overdue)

Otherwise (file absent, entry not found, invalid format, or date < 7d) → skip, end closeday.

---

**If essay-check overdue** :

Trigger `/essay-check` and wait for return. (All synthesis, check-in, and {USER_NAME}.md enrichment are managed by dedicated `essay-check` skill.)

**After essay-check** : Update command-tracker : `/essay-check → YYYY-MM-DD` (day's date).

## Rules

1. **Absolute priority to narrative summary** — the skill's main output is a rich, narrative, project-grouped summary with weekly lookback and sourced open questions. Steps 4-5-6 (filing, capitalization, essay-check) are **secondary** and must never degrade summary quality. If the model must choose between narrative richness and anticipating lateral steps, choose narrative richness.
2. **No flat list** — Step 2.3 : "What was done" bullets must be grouped by project with complete execution context, never flat chronological list. "General state" must be 2-4 sentence narrative, not bullet summary.
3. **Always 1-2 sourced open questions** in Step 2.2 — never zero, never generic. They must rest on concrete patterns observed in last 3 daily notes or thinking sessions today.
4. **No write without confirmation** — always present before writing
5. **Standard timeouts** — each interaction has max (30-45s depending context). At expiration : default action (skip, continue + note "[action skipped — timeout]")
6. **Missing files graceful** — skip silently if non-blocking (except daily note of day — create if absent)
7. **Append-only** — never overwrite daily note — `## 🌙 Day Summary` sections added at bottom. If exists already → skip to Step 3.
8. **Robust parsing** — unexpected format (ex : `score: "four"`, malformed date) → skip + note "[invalid format]", don't block
9. **Chunking by slices** — too long : limit: 200 (sessions) or 100 (mood), offset: 0 → 200/100 → … until end
10. **{USER_NAME}.md fallback** — if absent, skip all enrichment silently (Step 6 only)
