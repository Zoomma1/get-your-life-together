---
name: closeday
description: "End-of-day summary — synthesize sessions, update daily note with observed patterns, detect ongoing Warhammer WIP, verify essay-check overdue. Trigger when the user says one of these phrases: \"closeday\", \"I'm stopping\", \"I'm done\", \"it's over\", \"end of session\", \"good night\", \"good day\", \"I'm stopping for today\", \"that's enough\", \"day's over\", \"that's it I'm stopping\", \"it's done\" or via /closeday."
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **narrative qualitative output**. Its effectiveness is measured by the **richness of the produced output**, not by structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in ways that strip narrative instructions (regrouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Close Day

## Trigger

The user says one of these phrases (or equivalent):
- "closeday"
- "I'm stopping", "I'm done", "it's over"
- "good night", "good day"
- "end of session", "I'm stopping"

Or: command `/closeday`

## Step 1 — Collect data for the day

**Target date**: calculate before any reading. If `hour < 04:00` → date = previous day, else date = today. Use this date for all paths below.

Read in parallel (with fallbacks):

1. **Daily note for the day**: `00 - Daily notes/[target date].md`
   - If absent → create minimal file (empty frontmatter + day title), continue
   - Format: `---\n---\n# YYYY-MM-DD\n`
   
2. **Sessions for the day**: `99 - Claude Code/Sessions/YYYY-MM-DD.md`
   - If absent → synthesize from daily note, note `[Approximate synthesis — to be validated by {USER_NAME}]`
   - If multiple sessions → enumerate each with start time (ex: `09:30 — Project X`)
   - If file too long (token error) → read in successive chunks (limit: 200, offset: 0 → 200 → 400 → …) until complete. Never build summary from partial read — if truncation, note `[Complete read in chunks — validated synthesis]`.
   - ⚠️ **A session timestamp is NOT work time.** Entries in `Sessions/YYYY-MM-DD.md` carry the timestamp of the `/recapsession` or `/clear` that wrote them, not execution time. **Never infer a pattern of timings** ("late-night resumption", "day running long", "working late") from these timestamps alone — cross-reference with actual declared state (Telegram channel, daily note, felt experience) before concluding anything about day rhythm. *(Cause: 2026-07-22, a closeday concluding a "cutoff at 19:28 then resumption at 22:29" when the evening had actually been cut off and the 22:29/22:59/23:00 entries were just recaps and clears. Confirmed by {USER_NAME} on 27/07: "it's just that I clear too late".)*
   
3. **Hobby Kanban**: `02 - Hobbies/Hobby Kanban.md`
   - If absent → silently skip Step 1.5
   - Check if `## WIP` column contains tickets (non-empty items)

4. **Weekly lookback — 3 previous daily notes**: `00 - Daily notes/YYYY-MM-DD.md` for D-1, D-2, D-3
   - Targeted reading of `## 🌙 Day Summary`, `## 💡 Ideas & Reflections`, frontmatter (`energy`, `score`, `ressenti`)
   - If a daily note is absent → silently skip, continue with present ones
   - Objective: detect inter-day patterns (energy rising/falling, recurring subjects, contradictions with today, repeated or isolated key moments)
   - These data feed Step 2.2 (sourced open questions) and Step 2.3 (general state narrative)

5. **Command-tracker**: `99 - Claude Code/command-tracker.md` — **read here, in collection**, not just at Step 6 (essay-check)
   - Compare `Last execution` dates against target date: any command dated **for today** is a workstream of the day, to integrate into Step 2.1 bullets alongside a session
   - **Why**: a heavy skill launched in a **different Claude Code window** writes neither session nor daily note line — for the summary it exists only in the tracker. Without this read it becomes invisible and the summary under-reports the day. *(Cause: 2026-08-02, a 20 KB `/closemonth` running in parallel at 17:55 was absent from the summary; the gap was only caught by {USER_NAME}'s manual correction the next day.)*
   - If file is absent or its table unreadable → silently skip, continue

## Step 2 — Build the summary

### 2.1 — Aggregation and narrative grouping

From the daily note and `Sessions/YYYY-MM-DD.md`, extract and **group by workstream** (not by flat chronological order):

- **Grouping by workstream/theme**: one feature, one project, one refinement session, one personal workstream = one bullet. Don't split by session if multiple sessions cover the same subject.
- **Execution context mandatory per bullet**: for each workstream, include what makes the work concrete — stack touched, files modified, tests written, ADR created, decisions made, people involved. No bare bullets like "Bug 429 fail to fetch" — prefer "Bug 429 + fail to fetch armed input/project — exponential retry client-side, Prisma timing debug, 3 tests added".
- **Narrative key moments**: explicitly call out noteworthy events of the day (pleasant surprise, frustration, moment of joy, notable interaction, crisis) — these moments go in `General state` at step 2.3, not in the bullet list.
- **Energy and states**: observations of flow, fatigue, blockers, notable gaps (ex: low energy but high output) — for General state.
- **Inter-day patterns**: cross-referencing the 3 previous daily notes (loaded at step 1, point 4), note what repeats, what contradicts, what emerges as constant. These observations feed the open questions at step 2.2.
- **Optional semantic dedup** (optional): for each pattern identified above, query:
  ```bash
  uv run ~/.claude/semantic_search.py "<pattern in 3-5 words>" --top-k 2 --type accompli
  ```
  If similarity ≥ 0.45 on a prior session → the pattern is a **déjà-vu**. For each déjà-vu:
  1. **Date of first appearance**: extract the date from the session found
  2. **What followed**: relaunch with `--type prochaines_etapes --since <date>` to see planned follow-ups after this pattern
  3. **Causal link**: if follow-ups exist, build the link "pattern → what happened after"
  These feed the `Patterns detected` section in the note (see template below).
  If Postgres/Ollama inaccessible → non-blocking, display: `⚠️ Déjà-vu check unavailable (Postgres/Ollama down) — patterns sourced from daily notes only.`
- **Ideas/Decisions**: call out but **handle in Step 4, not here**.

### 2.2 — Presentation and validation of the summary

Present to {USER_NAME} **the full narrative version** — not a summary version. {USER_NAME} must see in chat what will be written, not a flat preview:

> Here's what I saw for the day:
>
> **What got done** (grouped by workstream, context included):
> - [workstream 1 — execution context: stack, files, tests, ADR, decisions]
> - [workstream 2 — execution context]
> - …
>
> **General state** (narrative, 2-4 sentences): [energy felt, flow or friction, key moment of the day, possible connection to fatigue/motivation — tell the story of the day, don't summarize it]
>
> **Patterns observed** (cross-referenced with 3 previous days):
> - [recurring pattern or contradiction detected, sourced "already saw D-1/D-2" or "new vs yesterday"]
> - [energy/output gap, or motivation offsetting fatigue, etc.]
>
> **2 questions to dig into** (sourced from weekly lookback, not generic):
> 1. [Question linked to specific inter-day pattern, ex: "Pattern X came back 3 times this week — is it a constant or tied to context Y?"]
> 2. [Question about what notes don't capture well, or observed contradiction]

**Rules for open questions**:
- **Always 1 to 2 questions**, never zero (that's what makes the retrospective alive)
- **Sourced**: each question must rest on something concrete seen in the 3 last dailies or thinking sessions of the day
- **Not generic**: avoid "how do you feel?", "what did you learn?" — prefer precise questions on patterns or contradictions detected

**If `## 💡 Ideas & Reflections` exists and is filled** → present full narrative version + open questions, then ask: "Good, I'll note it?"
- Accept: yes, ok, agreed, yeah. Refuse: no, nope, silence/timeout (45s) → continue without modifying.

**Otherwise (section empty or absent)** → present what could be reconstructed + ask:
> (1) What did you really move forward? (2) A blocker or observation? (3) [question sourced from weekly lookback if patterns detected]

Accept responses (free-form). Timeout (45s) or no response → include existing data (sessions, weekly lookback) + note "[Quick Wrap skipped — timeout]".

### 2.3 — Writing the summary

**Check if `## 🌙 Day Summary` already exists** → If yes, move to Step 3 (summary already written). If no, add to bottom of daily note:

```markdown
## 🌙 Day Summary

### What got done
- **[Workstream 1 — narrative title]** — complete execution context: stack touched, files modified, tests written, ADR created, decisions made, concrete results
- **[Workstream 2 — narrative title]** — complete execution context
- [...]

### Energy & state
- Day's energy: [frontmatter value or "not specified"]
- Final score: [score]/5 — *[felt]*
- **General state**: [NARRATIVE 2-4 sentences — tell the story of the day, don't summarize it. Include: tone of the day (atypical, dense, calm, hard...), any energy/output gap, flow moments, key moment(s) noted (good news, frustration, notable interaction, crisis, joy). No bullets here — text that tells the story.]

### Patterns detected
[Cross-reference with 3 previous daily notes. Integrate 2-4 structured observations:
- Inter-day patterns (recurrences, contradictions, energy/output gaps)
- Emergent behavioral dynamics sourced from concrete facts
- If `## 💡 Ideas & Reflections` is filled: don't just write "See Reflections section" — do **meta** over it, highlight what emerges from crossing multiple thinking sessions, not just list them
- For patterns identified as déjà-vu (semantic verification Step 2.1): mandatory format:
  `→ Already observed on YYYY-MM-DD — follow-up: [what came of it, in 1 sentence]`]

### Tomorrow
- Next priority: [from sessions]
- Don't forget: [mentioned during the day]
```

**Critical rule on narrative quality**: this summary is the skill's main output. Steps 4 (ideas to file), 5 (capitalization proposals), and 6 (essay-check) are **secondary** and must **in no way** compromise the summary's richness. If the model feels pulled between "write a good summary" and "anticipate lateral capitalizations", **absolute priority to narrative summary**.

## Step 3 — Score, felt sense and frontmatter

**Score** — Check if `score:` exists in frontmatter (numeric value 1-5).

**If present and valid** → move to felt sense.

**If absent or invalid**:
- Ask: "Rate your day on 5?"
- Accept: numbers 1-5. Refuse: non-number, silence/timeout (30s) → skip without score.
- If obtained → write in frontmatter: `score: [value]`

(This score conditions the weekly essay-check at Step 6.)

**Felt sense** — Always ask, whether score is already present or not:
- Ask: "One word on the day?" (ex: *"hard morning, good comeback afternoon"*, *"smooth all along"*, *"exhausting but satisfied"*)
- Accept: free-form text, 1 line max. Timeout (30s) → skip without felt sense.
- If response → write in frontmatter: `ressenti: "[text]"`

## Step 4 — Ideas and decisions: filing suggestions

From sessions and the daily note, **call out all ideas/decisions mentioned**: new insights, direction changes, tasks to track, tech to explore, etc.

**If none found** → silently skip, go to Step 5.

**If found**: propose a destination for each:

```
[Idea] → [Destination: 03 - Knowledge/ | 04 - Projects/… | 01 - Me/{USER_NAME}.md | project kanban | Hobby Kanban | command-tracker]
```

Present:

> Ideas/decisions for the day:
> - [item 1] → [destination]
> - [item 2] → [destination]
> 
> Want to file some?

Accept: explicit lists ("yes, the first 2", "item X only"). Refuse: "no", "nope", silence/timeout (45s) → leave in daily note, don't write anything.

## Step 5 — Capitalization proposals (conditional)

**Check** if `99 - Claude Code/Sessions/proposals-YYYY-MM-DD.md` exists for the day's date.

**If absent** → silently skip, go to Step 6.

**If present and `processed: true`** → silently skip, go to Step 6.

**If present and `processed: false`**:

1. Read the file
2. Present the proposals to {USER_NAME}:

> Capitalization proposals for the day:
>
> [for each Session block]
> **Session HH:MM:**
> - [ADR] Title — Scope — Context
> - [Skill] Skill name — Action — Context
>
> You validate, reject, or defer?

3. For each validated item:
   - **Cross-project ADR** → create in `99 - Claude Code/ADR/` + update `ADR/INDEX.md`
   - **Project ADR** → create in `04 - Projects/[Project]/claude-code/ADR/`
   - **Skill update** → apply the modification in `99 - Claude Code/Skills/[skill].md`
   - **Skill create** → invoke `/create-ticket` with Improvement type to ticket the creation
4. Timeout (45s) or global refusal → skip all
5. **Always** mark `processed: true` in frontmatter after handling (validated or not)

## Step 6 — Weekly essay-check (conditional)

**Read** `99 - Claude Code/command-tracker.md` and find the latest line `- /essay-check → YYYY-MM-DD`.

**Cadence**: read in the 3rd column of the command-tracker line (`| /essay-check | YYYY-MM-DD | <N> days |`). If column is absent/unreadable → **fallback 15 days**.

**Conditions to trigger essay-check**:
- command-tracker exists **AND**
- `/essay-check` entry found **AND**
- date in valid YYYY-MM-DD format **AND**
- `today − date ≥ cadence` (overdue ; cadence = column 3, default 15d)

Otherwise (file absent, entry not found, invalid format, or date < cadence) → skip essay-check, **move to Step 7**.

---

**If essay-check overdue**:

Trigger `/essay-check` and await return. (All synthesis, check-in, and {USER_NAME}.md enrichment are managed by the dedicated `essay-check` skill.)

**After essay-check**: Update command-tracker: `/essay-check → YYYY-MM-DD` (today's date). Then move to Step 7.

## Step 7 — Nudge measuring dreaming (conditional — Phase 0)

**Read** `99 - Claude Code/memory/digest.md`.

**Conditions to trigger the nudge**:
- file exists **AND**
- its frontmatter contains `enabled: true`

Otherwise (absent, `enabled: false`, or invalid format) → silently skip, end closeday. *(The nudge auto-disables once Phase 0 dreaming is turned off — no debt to clean up.)*

---

**If active**:

Phase 0 of dreaming tests whether the working digest injected at SessionStart actually helps (cf. `99 - Claude Code/memory/phase0-log.md`, spec §11 — *"without metrics, impossible to decide"*). From today's sessions, **propose** to {USER_NAME} a line to add to the Journal table in `phase0-log.md`:

```
| YYYY-MM-DD | <session(s) of the day, subject> | <✅ / ⚠️ partial / ❌ stale> | <yes/no fetch avoided> | <yes/no useful hit> | <short note> |
```

- If nothing observable (digest not used, day outside vault) → still propose a neutral line (`| … | — | — | — | no notable usage |`): **the trace of absence matters** for the verdict.
- **No write without {USER_NAME} validation** — append to end of Journal table, never overwrite. Never judge "useful hit" in their place without confirmation.
- If {USER_NAME} signals that a live thread changed → propose to update `digest.md` + its `updated:` (optional, on request).

## Rules

1. **Absolute priority to narrative summary** — the skill's main output is a rich, narrative, workstream-grouped summary with weekly lookback and sourced open questions. Steps 4-5-6 (filing, capitalization, essay-check) are **secondary** and must never degrade summary quality. If the model must arbitrate between narrative richness and anticipating lateral steps, choose narrative richness.
2. **No flat lists** — Step 2.3: bullets in "What got done" must be grouped by workstream with complete execution context, never a flat chronological list. "General state" must be a 2-4 sentence narrative, not a summary in bullets.
3. **Always 1-2 sourced open questions** at step 2.2 — never zero, never generic. They must rest on concrete patterns observed in the 3 previous daily notes or thinking sessions of the day.
4. **No write without confirmation** — always present before writing
5. **Standard timeouts** — each interaction has a max (30-45s depending on context). On expiry: default action (skip, continue + note "[action skipped — timeout]")
6. **Missing files graceful** — silently skip if non-blocking (except daily note for today — create if absent)
7. **Append-only** — never overwrite daily note — `## 🌙 Day Summary` sections added at bottom. If exists already → skip to Step 3.
8. **Robust parsing** — unexpected format (ex: `score: "four"`, malformed date) → skip + note "[invalid format]", don't block
9. **Chunking by tranches** — too long: limit: 200 (sessions), offset: 0 → 200 → … to end
10. **{USER_NAME}.md fallback** — if absent, silently skip all enrichment (Step 6 only)
