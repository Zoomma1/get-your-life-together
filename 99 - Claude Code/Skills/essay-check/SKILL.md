---
name: essay-check
description: Synthesis of formalized essays since last check — reads essays in `03 - Knowledge/Essays/` modified since last_check, identifies 2-3 sourced patterns and their relationship to {USER_NAME}.md (New/Confirms/Contradicts/Nuances), asks 1 sourced open question, proposes {USER_NAME}.md patch (§ observed patterns) after validation. Triggered by `/closeday` Step 6 every 7d or standalone `/essay-check`.
---

# Skill: Essay Check

## Trigger

- Via `/closeday` Step 6 if command-tracker indicates `/essay-check` overdue ≥7d
- Direct command: `/essay-check`

## Step 1 — Collect essays to process

1. Read `99 - Claude code/command-tracker.md` → extract date from line `| /essay-check | YYYY-MM-DD | 7 days |`
2. If entry absent or invalid date → fallback `last_check = today - 30 days`
3. Glob `03 - Knowledge/Essays/**/*.md` (recursive to cover any subdirs)
4. Filter by `mtime > last_check` — essays created **or** modified since last check
5. Exclude `INDEX.md` if it exists in folder

**If list empty** → message to {USER_NAME}: "No essays modified since YYYY-MM-DD — nothing to synthesize." + **update tracker to today's date** (check occurred) + end skill.

**Otherwise** → announce list to {USER_NAME}:
> Essay check — N essays to read since YYYY-MM-DD:
> - [[essay-1]] — modified YYYY-MM-DD
> - [[essay-2]] — modified YYYY-MM-DD

## Step 2 — Reading and analysis

Read **in parallel**:
- Each filtered essay (full content)
- `01 - Me/{USER_NAME}.md` — to know already-documented patterns (section "Observed patterns")

Identify 2-3 emerging themes that are **formalized** in essay (not just mentioned in passing) and match one of these categories:

- **[New]** — pattern absent from `{USER_NAME}.md`
- **[Confirms]** — pattern in `{USER_NAME}.md` existing, new source consolidating it
- **[Contradicts]** — pattern in `{USER_NAME}.md` existing challenged by essay
- **[Nuances]** — existing pattern completed or limited by area essay explores

For each theme, note:
- Essay(s) involved
- Key sentence or short passage (1-2 sentences max)
- Category above

**Critical rule**: focus on what's *formalized* in an essay (stated thought), not recurring ideas uncaptured (drift domain) nor weekly actions (closeweek domain).

## Step 3 — Synthesis + open question

Present to {USER_NAME} **in chat** (no vault writing at this stage):

```
Essay check — N essays read since YYYY-MM-DD:
- [[essay-1]] — modified YYYY-MM-DD
- [[essay-2]] — modified YYYY-MM-DD

Detected patterns:

1. [Pattern title] — [New|Confirms|Contradicts|Nuances]
   [1-2 sentence summary of what pattern says].
   Sourced in [[essay X]]: "[extracted key phrase]"

2. [...]
3. [...]

1 question to explore (sourced on specific pattern):
[Non-generic question anchored on emerging theme — ex: contradiction between two essays, new pattern deserving status, nuance opening fuzzy zone]
```

**Rules for question**:
- Always 1 question, never zero, never more than 1 (skill stays lightweight)
- Sourced on specific identified pattern
- Not generic ("how do you feel?") — specify based on essay formulation

Await {USER_NAME} response (timeout 45s).

**Timeout / no response** → skip Step 4 without writing, go directly to Step 5 (update tracker), end.

## Step 4 — Patch {USER_NAME}.md (conditional)

After {USER_NAME} response, for each pattern they validate or enrich:

| Category       | Proposed action                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------- |
| **[New]**   | Add new bullet in `§ "Observed patterns (harvest YYYY-MM)"` — create month's subsection if absent |
| **[Confirms]**  | Enrich existing pattern: new source + date, refined formulation if needed      |
| **[Contradicts]** | Revise pattern with explicit nuance (keep prior pattern + add new point) |
| **[Nuances]**    | Add child bullet under existing pattern                                                      |

Present **exact diff** (old → new) to {USER_NAME} patch by patch, await OK before each Edit.

**Timeout 45s** per patch → skip that patch, continue next.
**Explicit refusal** ("no" / "skip") → don't write that patch, note reason if provided (useful for next check).

## Step 5 — Update command-tracker

**Always**, even if:
- No patches accepted
- Timeout at Step 3 or 4
- Empty list at Step 1

Edit `99 - Claude code/command-tracker.md`:
```
| /essay-check    | YYYY-MM-DD         | 7 days               |
```
Today's date (ISO format).

Check occurred, even if nothing written — cadence matters, not systematic writing.

## Rules

1. **Essays scope only** — `03 - Knowledge/Essays/*.md` and subdirs. Explicitly exclude: dumps (`00 - Daily notes/`), thinking sessions, essay drafts in `04 - Projects/Project ideas/essay-*.md` (not yet formalized).
2. **Always present before writing** — each `{USER_NAME}.md` patch awaits explicit OK. No silent batch.
3. **Strict mtime filter** — never re-process essay already handled in prior check (avoids enrichment duplication).
4. **No overlap with /closeweek or /drift** — focus on what's *formalized* in essay, not recurring uncaptured ideas nor weekly actions.
5. **Fallback if {USER_NAME}.md missing** → skip Step 4 silently, just chat synthesis + update tracker.
6. **Standard timeout 45s** per interaction — skip or continue without writing per stage.
7. **Append-only in {USER_NAME}.md** — never delete existing pattern, only enrich/nuance (history preserved). For [Contradicts], add contradiction under existing pattern instead of rewriting.
8. **Tracker updated even if nothing written** — check counts from when triggered.
