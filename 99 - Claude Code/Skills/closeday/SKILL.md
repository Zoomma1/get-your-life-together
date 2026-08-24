---
name: closeday
description: "End of day summary — synthesize sessions, update daily note with observed patterns, detect WIP Warhammer in progress, check essay-check overdue. Trigger when the user says one of these phrases: \"closeday\", \"I'm stopping\", \"I'm done\", \"that's it\", \"end of session\", \"good night\", \"have a good day\", \"I'm stopping for today\", \"that's enough\", \"day's done\", \"I'm done stopping\", \"it's over\" or via /closeday."
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, highlights, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Close Day

## Trigger

the user says one of these phrases (or equivalent) :
- "closeday"
- "I'm stopping", "I'm done", "that's it"
- "good night", "have a good day"
- "end of session", "I'm stopping"

Or : command `/closeday`

## Step 1 — Collect day's data

**Target date** : calculate before any reading. If `time < 04:00` → date = previous day, else date = today. Use this date for all paths below.

Read in parallel (with fallbacks) :

1. **Daily note for the day** : `00 - Daily notes/[target date].md`
   - If missing → create a minimal file (empty frontmatter + title of day), continue
   - Format : `---\n---\n# YYYY-MM-DD\n`
   
2. **Sessions of the day** : `99 - Claude Code/Sessions/YYYY-MM-DD.md`
   - If missing → synthesize from daily note, note `[Approx synthesis — to be validated by {USER_NAME}]`
   - If multiple sessions → enumerate each with start time (ex: `09:30 — Project X`)
   - If file too long (token error) → read by successive chunks (limit: 200, offset: 0 → 200 → 400 → …) until complete. Never build summary on partial read — if truncation, note `[Complete read by chunks — synthesis validated]`.
   - ⚠️ **A session's timestamp is NOT the work hour.** Entries in `Sessions/YYYY-MM-DD.md` bear the hour of the `/recapsession` or `/clear` that wrote them, not the execution time. **Never deduce a pattern from timestamps alone** ("late-night restart", "day overflowing", "working late") — cross with actually declared state (Telegram channel, daily note, feeling) before concluding anything about day rhythm. *(Cause: 2026-07-22, a closeday concluding a "cut at 19:28 then restart at 22:29" when the evening had been properly cut and the 22:29/22:59/23:00 entries were just recaps and clears. Confirmed by {USER_NAME} on 27/07: "it's just that I clear too late".)*
   
3. **Hobby Kanban** : `02 - Hobbies/Hobby Kanban.md`
   - If missing → silently skip Step 1.5
   - Check if `## WIP` column contains tickets (non-empty items)

4. **Weekly review — 3 previous daily notes** : `00 - Daily notes/YYYY-MM-DD.md` for J-1, J-2, J-3
   - Targeted reading of sections `## 🌙 Day summary`, `## 💡 Ideas & Reflections`, frontmatter (`energy`, `score`, `feeling`)
   - If a daily note is missing → silently skip, continue with existing ones
   - Objective : detect inter-day patterns (energy rising/falling, recurring topics, contradictions with today, repeated or isolated highlights)
   - This data feeds Step 2.2 (sourced open questions) and Step 2.3 (General State narrative)

5. **Command-tracker** : `99 - Claude Code/command-tracker.md` — **read here, during collection**, not just at Step 6 (essay-check)
   - Compare `Last execution` dates to target date : any command dated **today** is a project of the day, to integrate into Step 2.1 bullets just like a session
   - **Why** : a heavy skill launched in a **different Claude Code window** writes neither session nor daily note line — it exists, for the summary, only in the tracker. Without this read it becomes invisible and the summary under-reports the day. *(Cause: 2026-08-02, a `/closemonth` of 20 KB running in parallel at 17h55 was absent from the summary; the gap was only caught by manual correction by {USER_NAME} the next day.)*
   - If file is missing or its table unreadable → silent skip, continue

## Step 2 — Build the summary

### 2.1 — Aggregation and narrative grouping

From the daily note and `Sessions/YYYY-MM-DD.md`, extract and **group by project** (not chronological order) :

- **Grouping by project/theme** : one feature, one project, one refinement session, one personal task = one bullet. Do not split by session if multiple sessions cover the same topic.
- **Mandatory execution context per bullet** : for each project, include what makes the work concrete — stack touched, files modified, tests written, ADR created, decisions made, people involved. No bare bullets like "Bug 429 fail to fetch" — prefer "Bug 429 + fail to fetch armed entry/project — exponential retry client-side, Prisma timing debug, 3 tests added".
- **Narrative highlights** : explicitly note striking events of the day (pleasant surprise, frustration, joy, notable interaction, crisis) — these go in `General state` at step 2.3, not in the bullets list.
- **Energy and states** : observations of flow, fatigue, blockers, notable gaps (ex: low energy but high output) — for General state.
- **Inter-day patterns** : crossing with 3 previous daily notes (loaded at step 1, point 4), note what repeats, what contradicts, what emerges as constant. These observations feed the open questions at step 2.2.
  - ⚠️ **Mandatory guard — a recurring gap is not a behavioral pattern until a cause is sought.** Before calling a regularity a trend, an attention drift or a signal about priorities, first seek an **external cause** : season, third-party leave, client load, equipment unavailability, time of year. If it exists → **name it**, and state the **re-test condition** ("if the gap holds once X returns, then it's a signal"). If searched without finding → state that.
  - The failure mode is unique to the summary : a series of **4-5 days suffices** for good observation, and an observation framed as *behavior* is far more interesting to write than external fact — so it wins, untested. The cost is not analysis error (corrected in one line) but **capitalizing** on it : anchored here then in `{USER_NAME}.md` via `/closeweek` Step 5, a conjunctural regularity becomes a character trait that following summaries confirm **by construction**.
  - Reflex: *what external cause would produce exactly this series?* *(Cause: 2026-08-10 — pattern written "fifth day in a row where team tooling leads the summary over Run, gap widening", presented as a signal about attention allocation. {USER_NAME} refuted in one line: "lots of clients on vacation so very few tickets to process". It was August.)*
- **Optional semantic déjà-vu check** : for each identified pattern above, query :
  ```bash
  uv run ~/.claude/semantic_search.py "<pattern in 3-5 words>" --top-k 2 --type accomplished
  ```
  If similarity ≥ 0.45 on prior session → pattern is a **déjà-vu**. For each déjà-vu :
  1. **First appearance date** : extract date from found session
  2. **What followed** : rerun with `--type next_steps --since <date>` to see planned follow-ups after this pattern
  3. **Causal link** : if follow-ups exist, build link "pattern → what happened next"
  Feed this info into `Patterns detected` section in note (see template below).
  If Postgres/Ollama unreachable → non-blocking, display : `⚠️ Déjà-vu check unavailable (Postgres/Ollama down) — patterns sourced from daily notes only.`
- **Ideas/Decisions** : note but **handle in Step 4, not here**.

### 2.2 — Presentation and summary validation

Present to {USER_NAME} **the complete narrative version** — not a condensed one. {USER_NAME} must see in chat what will be written, not a flat preview :

> Here's what I saw over the day :
>
> **What was done** (grouped by project, context included) :
> - [project 1 — execution context : stack, files, tests, ADR, decisions]
> - [project 2 — execution context]
> - …
>
> **General state** (narrative, 2-4 sentences) : [energy felt, flow or friction, day's highlight, possible link with fatigue/motivation — tell the day, don't summarize it]
>
> **Patterns observed** (crossed with 3 previous days) :
> - [recurring pattern or detected contradiction, sourced "already seen J-1/J-2" or "new vs yesterday"]
> - [energy/output gap, or motivation compensating fatigue, etc.]
>
> **2 questions to dig into** (sourced from weekly review, not generic) :
> 1. [Question tied to a precise inter-day pattern, ex: "Pattern X came back 3 times this week — is it a constant or linked to context Y ?"]
> 2. [Question on what notes don't capture well, or observed contradiction]

**Rules for open questions** :
- **Always 1 to 2 questions**, never zero (that's what makes the retrospective alive)
- **Sourced** : each question must rest on something concrete seen in last 3 dailies or today's thinking sessions
- **Not generic** : avoid "how do you feel?", "what did you learn?" — prefer precise questions on detected patterns or contradictions

**If `## 💡 Ideas & Reflections` exists and filled** → present complete narrative version + open questions, then ask : "Good, I note it ?"
- Accept : yes, ok, agreed, yeah. Refuse : no, nope, silence/timeout (45s) → continue without modifying.

**Else (section empty or missing)** → present what could be reconstructed + ask :
> (1) What did you really advance ? (2) A blocker or observation ? (3) [sourced question on weekly review if patterns detected]

Accept replies (freeform). Timeout (45s) or no reply → include existing data (sessions, weekly review) + note "[Quick Wrap skipped — timeout]".

### 2.3 — Writing the summary

**Check if `## 🌙 Day summary` already exists** → If yes, go to Step 3 (summary already written). If no, add at bottom of daily note :

```markdown
## 🌙 Day summary

### What was done
- **[Project 1 — narrative title]** — complete execution context : stack touched, files modified, tests written, ADR created, decisions made, concrete results
- **[Project 2 — narrative title]** — complete execution context
- [...]

### Energy & state
- Day's energy : [frontmatter value or "not specified"]
- Final score : [score]/5 — *[feeling]*
- **General state** : [NARRATIVE 2-4 sentences — tell the day, not summarize it. Include : day's tone (atypical, dense, calm, difficult...), possible energy/output gap, flow moments, highlight(s) noted (good news, frustration, notable interaction, crisis, joy). No bullets here — prose that tells.]

### Patterns detected
[Cross with 3 previous daily notes. Integrate 2-4 structured observations :
- Inter-day patterns (recurrences, contradictions, energy/output gaps)
- Emerging behavioral dynamics sourced on concrete facts
- If `## 💡 Ideas & Reflections` filled : do NOT just write "See Reflections section" — do **meta** on top, note what emerges crossing multiple thinking sessions, not just list them
- For patterns identified as déjà-vu (semantic check Step 2.1) : mandatory format :
  `→ Already observed YYYY-MM-DD — follow-up : [what resulted, in 1 sentence]`]

### Tomorrow
- Next priority : [from sessions]
- Don't forget : [mentioned during day]
```

**Critical rule on narrative quality** : this summary is the skill's main output. Steps 4 (ideas to file), 5 (capitalization proposals) and 6 (essay-check) are **secondary** and must **in no way** compromise summary richness. If the model feels torn between "write the summary well" and "anticipate lateral capitalizations", **absolute priority to narrative summary**.

## Step 3 — Score, feeling and frontmatter

> ⛔ **Never pre-fill `score` or `feeling`.** These two fields are **declarations by {USER_NAME}**, not inferences from the summary. Even when sessions say "satisfied", even when the day clearly went well, even in `/closeyesterday` where the day ended long ago : **ask the question and wait for reply**. Writing a plausible value in its place attributes a feeling they didn't express — and once in frontmatter, this value feeds `/closeweek`, `/closemonth` and `/stranger` gate averages as if it were declared.
> *(Cause: 2026-08-22, closeday of 21 — score and feeling pre-filled, immediately corrected by {USER_NAME}. Proposal of the day.)*

**Score** — Check if `score:` exists in frontmatter (numeric value 1-5).

**If present and valid** → move to feeling.

**If missing or invalid** :
- Ask : "Rate your day out of 5 ?"
- Accept : numbers 1-5. Refuse : non-number, silence/timeout (30s) → skip without score.
- If obtained → write in frontmatter : `score: [value]`

(This score conditions the weekly essay-check at Step 6.)

**Feeling** — Always ask, whether score already present or not :
- Ask : "One word on the day ?" (ex: *"hard morning, good afternoon comeback"*, *"smooth all through"*, *"exhausting but satisfied"*)
- Accept : free text, max 1 line. Timeout (30s) → skip without feeling.
- If reply → write in frontmatter : `feeling: "[text]"`

## Step 4 — Ideas and decisions : filing suggestions

From sessions and daily note, **note all ideas/decisions mentioned** : new insights, direction changes, tasks to track, tech to explore, etc.

**If none found** → silently skip, go to Step 5.

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

Accept : explicit lists ("yes, first 2", "item X only"). Refuse : "no", "nope", silence/timeout (45s) → leave in daily note, write nothing.

## Step 5 — Capitalization proposals (conditional)

**Check** if `99 - Claude Code/Sessions/proposals-YYYY-MM-DD.md` exists for day's date.

**If missing** → silently skip, go to Step 6.

**If present and `processed: true`** → silently skip, go to Step 6.

**If present and `processed: false`** :

1. Read file
2. Present proposals to {USER_NAME} :

> Capitalization proposals of the day :
>
> [for each Session block]
> **Session HH:MM :**
> - [ADR] Title — Scope — Context
> - [Skill] Skill name — Action — Context
>
> Validate, reject, or defer ?

3. For each validated item :
   - **Transverse ADR** → create in `99 - Claude Code/ADR/` + update `ADR/INDEX.md`
   - **Project ADR** → create in `04 - Projects/[Project]/claude-code/ADR/`
   - **Skill update** → apply modification in `99 - Claude Code/Skills/[skill].md`
   - **Skill create** → invoke `/create-ticket` with type Enhancement to ticket creation
4. Timeout (45s) or global refusal → skip all
5. **Always** mark `processed: true` in frontmatter after handling (validated or not)

## Step 6 — Weekly essay-check (conditional)

**Read** `99 - Claude Code/command-tracker.md` and search for last line `- /essay-check → YYYY-MM-DD`.

**Cadence** : read in 3rd column of command-tracker line (`| /essay-check | YYYY-MM-DD | <N> days |`). If column missing/unreadable → **fallback 15 days**.

**Conditions to trigger essay-check** :
- command-tracker exists **AND**
- `/essay-check` entry found **AND**
- date in YYYY-MM-DD format valid **AND**
- `today − date ≥ cadence` (overdue ; cadence = column 3, default 15d)

Else (file missing, entry not found, format invalid, or date < cadence) → skip essay-check, **go to Step 7**.

---

**If essay-check overdue** :

Trigger `/essay-check` and await return. (All synthesis, check-in, and {USER_NAME}.md enrichment handled by dedicated `essay-check` skill.)

**After essay-check** : Update command-tracker : `/essay-check → YYYY-MM-DD` (day's date). Then go to Step 7.

## Step 7 — Dreaming measure nudge (conditional — Phase 0)

**Read** `99 - Claude Code/memory/digest.md`.

**Conditions to trigger nudge** :
- file exists **AND**
- its frontmatter contains `enabled: true`

Else (missing, `enabled: false`, or format invalid) → silent skip, end of closeday. *(Nudge turns itself off once Phase 0 dreaming is disabled — no debt to clean.)*

---

**If active** :

Phase 0 of dreaming tests whether the working digest injected at SessionStart truly helps (cf. `99 - Claude Code/memory/phase0-log.md`, spec §11 — *"without metric, impossible to decide"*). From today's sessions, **propose** to {USER_NAME} a line to add to Journal table in `phase0-log.md` :

```
| YYYY-MM-DD | <session(s) of day, topic> | <✅ / ⚠️ partial / ❌ stale> | <yes/no fetch avoided> | <yes/no useful hit> | <short note> |
```

- If nothing observable (digest unused, day outside vault) → still propose a neutral line (`| … | — | — | — | no notable usage |`) : **the trace of absence counts** for the verdict.
- **No write without {USER_NAME} validation** — append to end of Journal table, never overwrite. Never judge "useful hit" on their behalf without confirmation.
- If {USER_NAME} flags that a live thread changed → propose updating `digest.md` + its `updated:` (optional, at their request).

## Rules

1. **Absolute priority to narrative summary** — the skill's main output is a rich, narrative, project-grouped summary, with weekly review and sourced open questions. Steps 4-5-6 (filing, capitalization, essay-check) are **secondary** and must never degrade summary quality. If the model must choose between narrative richness and anticipating lateral steps, choose narrative richness.
2. **No flat list** — Step 2.3 : "What was done" bullets must be grouped by project with complete execution context, never a flat chronological list. "General state" must be 2-4 sentence narrative, not bulleted summary.
3. **Always 1-2 sourced open questions** at step 2.2 — never zero, never generic. They must rest on concrete patterns observed in 3 previous daily notes or today's thinking sessions.
4. **No write without confirmation** — always present before writing
5. **Standard timeouts** — each interaction has a max (30-45s depending on context). On expiration : default action (skip, continue + note "[action skipped — timeout]")
6. **Missing files graceful** — silently skip if non-blocking (except day's daily note — create if missing)
7. **Append-only** — never overwrite daily note — `## 🌙 Day summary` sections added at bottom. If exists already → skip to Step 3.
8. **Robust parsing** — unexpected format (ex : `score: "four"`, malformed date) → skip + note "[format invalid]", don't block
9. **Chunking by slices** — too long : limit: 200 (sessions), offset: 0 → 200 → … until complete
10. **{USER_NAME}.md fallback** — if missing, skip all enrichment silently (Step 6 only)
