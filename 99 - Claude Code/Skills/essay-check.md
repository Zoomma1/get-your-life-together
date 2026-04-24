---
name: essay-check
description: Synthesis of essays finalised since the last check — reads essays from `03 - Knowledge/Essays/` modified since last_check, identifies 2-3 sourced patterns with their relationship to {USER_NAME}.md (New/Confirms/Contradicts/Nuances), poses 1 sourced open question, proposes a {USER_NAME}.md patch (§ observed patterns) after validation. Triggered by `/closeday` Step 6 every 7 days or as a standalone `/essay-check`.
---

# Skill: Essay Check

## Trigger

- Via `/closeday` Step 6 if the command-tracker indicates `/essay-check` overdue ≥7 days
- Direct command: `/essay-check`

## Step 1 — Collect essays to process

1. Read `99 - Claude code/command-tracker.md` → extract the date from the line `| /essay-check | YYYY-MM-DD | 7 days |`
2. If entry absent or date invalid → fallback `last_check = today - 30 days`
3. Glob `03 - Knowledge/Essays/**/*.md` (recursive to cover any subfolders)
4. Filter by `mtime > last_check` — essays created **or** modified since the last check
5. Exclude `INDEX.md` if it exists in the folder

**If list empty** → message to {USER_NAME}: "No essay modified since YYYY-MM-DD — nothing to synthesise." + **update tracker to today's date** (the check took place) + end skill.

**Otherwise** → announce the list to {USER_NAME}:
> Essay check — N essays to read since YYYY-MM-DD:
> - [[essay-1]] — modified YYYY-MM-DD
> - [[essay-2]] — modified YYYY-MM-DD

## Step 2 — Reading and analysis

Read **in parallel**:
- Each filtered essay (full content)
- `{PERSONAL_FOLDER}/{USER_NAME}.md` — to know the already documented patterns (section "Observed patterns")

Identify 2-3 emerging themes that are **formalised** in the essay (not just mentioned in passing) and that match one of these categories:

- **[New]** — pattern absent from `{USER_NAME}.md`
- **[Confirms]** — existing `{USER_NAME}.md` pattern, new source that consolidates it
- **[Contradicts]** — existing `{USER_NAME}.md` pattern challenged by the essay
- **[Nuances]** — existing pattern completed or limited by an area the essay explores

For each theme, note:
- Essay(s) concerned
- Key phrase or short passage extracted (1-2 sentences max)
- Category above

**Critical rule**: focus on what is *formalised* in an essay (thought committed to paper), not recurring unprocessed ideas (domain of `/drift`) or weekly actions (domain of `/closeweek`).

## Step 3 — Synthesis + open question

Present to {USER_NAME} **in chat** (no vault writing at this stage):

```
Essay check — N essays read since YYYY-MM-DD:
- [[essay-1]] — modified YYYY-MM-DD
- [[essay-2]] — modified YYYY-MM-DD

Detected patterns:

1. [Pattern title] — [New|Confirms|Contradicts|Nuances]
   [1-2 sentence summary of what the pattern says].
   Sourced in [[essay X]]: "[extracted key phrase]"

2. [...]
3. [...]

1 question to dig into (sourced on a specific pattern):
[Non-generic question, anchored on an emerging theme — e.g. contradiction between two essays, new pattern that deserves a status, nuance that opens a fuzzy area]
```

**Rules for the question**:
- Always 1 question, never zero, never more than 1 (the skill must remain lightweight)
- Sourced on a specific pattern identified in Step 2
- Not generic ("how do you feel?") — specify on the essay's formulation

Wait for {USER_NAME}'s response (45s timeout).

**Timeout / no response** → skip Step 4 without writing, go directly to Step 5 (tracker update), end.

## Step 4 — {USER_NAME}.md patch (conditional)

After {USER_NAME}'s response, for each pattern they validate or enrich:

| Category | Proposed action |
|----------|----------------|
| **[New]** | Add a new bullet in `§ "Observed patterns (harvest YYYY-MM)"` — create the current month's subsection if absent |
| **[Confirms]** | Enrich existing pattern: new source + date, refined formulation if needed |
| **[Contradicts]** | Revise pattern with explicit nuance (keep previous pattern + add new point) |
| **[Nuances]** | Add a child bullet under the existing pattern |

Present the **exact diff** (old → new) to {USER_NAME} patch by patch, wait for OK before each Edit.

**45s timeout** per patch → skip this patch, continue to next.
**Explicit refusal** ("no" / "skip") → do not write this patch, note reason if provided (may be useful at next check).

## Step 5 — Update command-tracker

**Always**, even if:
- No patch was accepted
- Timeout in Step 3 or 4
- Empty list in Step 1

Edit `99 - Claude code/command-tracker.md`:
```
| /essay-check    | YYYY-MM-DD         | 7 days                |
```
Today's date (ISO format).

The check took place, even if nothing was written — it's the cadence that counts, not systematic writing.

## Rules

1. **Essays scope only** — `03 - Knowledge/Essays/*.md` and subfolders. Explicitly exclude: dumps (`00 - Daily notes/`), thinking sessions, essay drafts in `04 - Projects/Project ideas/essay-*.md` (not yet formalised).
2. **Always present before writing** — each `{USER_NAME}.md` patch waits for explicit OK. No silent batch.
3. **Strict mtime filter** — never re-process an essay already covered in a previous check (avoids duplicate enrichments in {USER_NAME}.md).
4. **No overlap with /closeweek or /drift** — focus on what is *formalised* in an essay, not recurring unprocessed ideas or weekly actions.
5. **Fallback {USER_NAME}.md absent** → skip Step 4 silently, just do the chat synthesis + update tracker.
6. **Standard 45s timeout** per interaction — skip or continue without writing depending on the step.
7. **Append-only in {USER_NAME}.md** — never delete an existing pattern, only enrich/nuance (history preserved). For [Contradicts], add the contradiction under the existing pattern instead of rewriting.
8. **Tracker updated even if nothing is written** — the check is counted from the moment it is triggered.
