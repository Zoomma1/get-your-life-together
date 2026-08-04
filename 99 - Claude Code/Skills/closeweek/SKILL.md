---
name: closeweek
description: Weekly summary — synthesis of achievements, learnings (insight-oriented), detected patterns, capitalization of recurring patterns in {USER_NAME}.md, revisit of the "To watch" watchlist, and projection for the following week. Creates a note in Weekly/. Triggered when the user says "closeweek", "weekly summary", "we're wrapping up the week" or via `/closeweek [YYYY-WXX]`.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: Close Week

The objective of this summary is not to recount the week but to detect patterns before they become drifts — prioritize what is actionable or revealing.

## ⚠️ Verbose feedback mandatory during execution

Announce **each step executed** as the run progresses — {USER_NAME} must see what's happening live, not wait for a black box:

```
→ Step 1/9: determine execution mode (final / draft)
→ Step 2/9: collect material (daily notes, sessions, spelling)
   ✓ 6 daily notes read
   ✓ 4 sessions found
   ⚠ Step 2.4 spelling: skip — Postgres unreachable
→ Step 3/9: analyze actual durations
   ✓ 18 tickets with ⏱→✅ extracted
   ✓ ticket-durations.md updated
→ Step 4/9: write the note
   ⚠ Section "Blockers & Patterns" omitted — no pattern detected
→ Step 5/9: pattern capitalization → {USER_NAME}.md
   ⚠ Skip — no recurring pattern qualified
→ Step 6/9: revisit "To watch" watchlist
   ✓ 2 watchlist patterns reread — 1 confirmed, 1 pending
→ Step 7/9: tracker + light reread CLAUDE.md
→ Step 8/9: create the note in Weekly/
→ Step 9/9: chat recap
```

**Rule**: each sub-step skipped silently (empty spelling collection, omitted optional sections, edge cases) must have an **explicit line** explaining why. A step that doesn't pop → we must see why, not guess it.

## Triggering & Reminders

**Direct invocation (vocalized)**:
- {USER_NAME} speaks trigger: "closeweek", "weekly summary", "we're wrapping up the week", "what's the summary"
- Claude Code detects and launches the skill automatically

**Manual invocation (command)**:
- `/closeweek` alone → processes current ISO week (calendar week of today)
- `/closeweek 2026-W14` → processes specific week (ex: previous week for catch-up)

**Automatic reminder**:
- During `/today`: check `command-tracker.md` → if gap > 7 days since last `/closeweek`, display message "Last closeweek: W##, N days ago. Relaunch?" (do not automatically trigger closeweek, just notify {USER_NAME})

---

## Step 1 — Determine execution mode

**Calculate target week**: argument YYYY-WXX passed or current ISO week by default. Deduce Monday (J0) and Sunday (J6) to delimit files to consult.

**Decide on flow based on situation**:

| Condition                                                            | Action                                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Argument prior to current week (ex: today is W14, argument is W12) | **Final mode**: create/overwrite `YYYY-WXX.md`                                                                                                                                        |
| Current week (today ∈ W) AND today = Sunday         | **Final mode**: create/overwrite `YYYY-WXX.md`                                                                                                                                        |
| Current week (today ∈ W) AND today ≠ Sunday         | **Draft mode**: create `YYYY-WXX-draft.md` with header "*(Partial summary — to finalize Sunday)*". Continue normally after creation.                                           |
| Note `YYYY-WXX.md` already exists (final mode)                          | Display existing content. Propose to {USER_NAME}: `[A] add missing elements`, `[R] replace completely`, `[C] create new version (YYYY-WXX-v2.md)`. Wait for response. |
| Missing weeks detected (between last closeweek and target)    | Display list in ascending order. Propose: `[T] process missing weeks first` or `[S] skip and process target week`. Wait for response.                             |

**If missing weeks validated `[T]`**: process the oldest one first (call closeweek recursively on each), then return to target week.

---

## Step 2 — Collect material

**Sequential reader** (in this order):

1. Read last closeweek prior to target in `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\` → extract unclosed threads and recurring learnings
2. Read daily notes for the week in `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\` (files `YYYY-MM-DD.md` in target Monday-Sunday range)
   - Extract from frontmatter of each note: `energy`, `score`, `ressenti` (if present) → store for Energy section (Step 4)
   - **Count Telegram entries for the week** → `telegram_count`. Count blocks of classification `#### HH:MM — <type> / ...` under `### 📱 Telegram` (one block = one logged exchange; don't count raw message lines, a burst of 3 messages in one minute remains one exchange). Also store distribution by `<type>` (`idea` / `task` / `update` / `dump` / other). This counter is a **sensor for oral channel extinction**, not a target to reach — see Step 4, Energy section.
3. Read sessions for the week in `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` (files `YYYY-MM-DD.md` in target Monday-Sunday range)
   - ⚠️ **A session's timestamp is not work time** — it carries the time of `/recapsession` or `/clear` that wrote it. Never infer a pattern of schedules (evening overrun, nocturnal resumption, rhythm of the week) without cross-checking with stated condition (Telegram, daily note, feelings). *(Full detail in `closeday/SKILL.md` Step 1; pattern "evening overrun" disproven on 07/27 on exactly this pitfall.)*

**Edge case: 0 daily notes found**
- Display: "0 daily notes found for W##. Proceed?"
- Propose: `[P] proceed from sessions alone` or `[A] cancel summary`. Wait for response.
- If `[P]`: display "Lightweight summary (sources: sessions only)". Continue with Step 3 (analyze durations) then Step 4 (write).

**Classify material by observable impact**:

| Level | Definition | Action |
|--------|-----------|--------|
| **1** | Structuring decision (changes orientation/org/direction) | Always include |
| **2** | New pattern/workflow/habit detected | Always include |
| **3** | Standalone achievement (contextual insight) | Include if relevant |
| **4** | Routine (no notable surprise) | Omittable |

**Unclosed threads** and **recurring** learnings surface at the top of the summary.

**Guardrail structuring project — count nights before classifying**: a thread that produces **2+ consecutive evening/night sessions** delivering ordered phases (Phase 0 → 1 → 2 → 3) is not a nocturnal sub-event. It's a **structuring project**. Explicitly count consecutive evening/night sessions on the same thread during collection; if **≥ 2 nights** → qualify the thread as a structuring project and surface it in **🔗 Connecting theme** + **💡 Learnings** (Step 4), not leave it as a flat bullet in **✅ Done**. A project built over multiple nights has meaning to extract, not just a deliverable to list.

**Guardrail for {USER_NAME} — cold reread if validated late after physical crash**: a closeweek validated at **10pm+ after a physical crash** (fatigue, crushed end of day) = skimmed reading, risk of missing project qualification or a pattern. In that case, do not anchor in `{USER_NAME}.md` (Step 5) immediately — propose to {USER_NAME} to **cold reread the next day** before any anchoring.

**Edge case: Empty week (no level 1-2 content)**
- Write short minimal summary (3-4 items). Include line: "Stable week — few events or consolidated routines."

**If sessions numerous (3+ per day)**: synthesize by day or project (ex: "Monday: Project A setup + tests", "Wednesday: Project B + meeting"). Don't enumerate each session.

### Spelling collection

In parallel with main material reading — result stored for Step 9.

**1. Postgres sessions** — retrieve sessions for the week:
```bash
psql postgresql://claude:claude@docker-host:5432/claude_sessions \
  -t -A -F'|||' \
  -c "SELECT date, title, raw_md FROM sessions WHERE date BETWEEN '[Monday YYYY-MM-DD]' AND '[Sunday YYYY-MM-DD]' ORDER BY date, time"
```
If 0 results → ignore, continue.

**2. Daily notes reflections** — extract `## 💡 Ideas & Reflections` sections from daily notes already read this week (exact title in {USER_NAME} template). Concatenate into single text block.

**3. Haiku agents in parallel** — launch 1 agent per session `raw_md` + 1 agent for aggregated Reflections block. Exact prompt:
> "Identify spelling errors, incorrect agreements or faulty phrasings in French in this text. Return only a JSON list: [{\"erreur\": \"...\", \"correction\": \"...\", \"regle\": \"...\"}]. Maximum 5 items. If no faults detected → return []."

**4. Aggregate** — merge all JSON outputs, count occurrences of each error, retain the 2-3 most frequent → variable `ortho_items`.
If `ortho_items` empty → omit silently in Step 9.

### Long-term recurrence detection (optional, fail silent)

For each **level 1-2 pattern** identified in material (Detected Patterns, Blockers):
```bash
uv run ~/.claude/semantic_search.py "<pattern in 3-5 words>" --top-k 3 --since <Monday-4weeks>
```
If similarity ≥ 0.45 on sessions **prior to** target week → recurring pattern across weeks:
1. **Antiquity**: date of first occurrence found
2. **What followed**: relaunch `--type accompli --since <date first occurrence>` to see outcomes
3. **Store** in variable `pattern_recurrents`: list of `{pattern, first_date, outcome}`

If Postgres/Ollama unreachable → `pattern_recurrents = []`, non-blocking, display: `⚠️ Recurrence detection unavailable (Postgres/Ollama down) — patterns sourced from last closeweek only.`

---

## Step 3 — Analyze actual durations

**Why**: since `/workon` patch on 2026-05-03, each ticket bears `⏱ HH:mm→HH:mm ✅` in the daily note. These observed durations calibrate future estimates in `/today` (which reads `ticket-durations.md` each time it generates a plan). Without this step, `/today` stays on ballpark estimates (45min default).

**Source**: daily notes for the week already read in Step 2.2. Do not reload — reuse content in memory.

### 3.1 — Extract durations

For each daily note of the week, parse checked lines with start + end timestamps:

- **Pattern**: `- [x] ... ⏱ (\d{2}:\d{2})→(\d{2}:\d{2}) ✅`
- **Cross-midnight**: if end < start (ex: `⏱ 23:45→00:30`) → add 24h to end before subtraction. Duration = 45min, not -23h15.
- **Duration**: `(end - start)` in minutes.

Ignore lines without the arrow `→` (old formats `⏱ HH:mm` alone or `✅ HH:mm` separate) — no extractable duration, don't attempt to infer.

### 3.2 — Classify by type

For each ticket extracted, determine its type from the `[[TicketName]]` link and line context:

| Type | Detection signals |
|------|---------------------|
| **CC maintenance** | Ticket in `99 - Claude Code/Claude Code Kanban.md` — patch hook, config, lessons, cleanup |
| **CC skill** | Ticket in `99 - Claude Code/Claude Code Kanban.md` — skill creation or overhaul |
| **FSTG** | Ticket in `04 - Projects/From Sprue to Glory/` |
| **HUSKER** | Ticket in `04 - Projects/Husker/` or slug starts with `husker-` |
| **GYLT** | Ticket in `04 - Projects/Get Your Life Together/` or slug starts with `gylt-` |
| **Personal practical** | Section `### 🎯 Personal` outside dev projects (admin, courses, organizing) |
| **Hobby** | Section `### 🎨 Hobby` |
| **Vault maintenance** | Section `### 🔄 Vault maintenance` (vault commands `/harvest`, `/link`, etc.) |

If a ticket doesn't clearly match any category → type `Other`. Don't invent sub-types.

### 3.3 — Calculate stats by type

For each type represented this week:
- **Nb tickets**: number of entries
- **Average**: sum of durations / nb tickets
- **Median**: sort ascending + center value (or average of 2 centers if nb even)
- **Min / Max**: extremes observed this week

Format durations as `Xmin` if < 60min, otherwise `XhYmin` (ex: `1h20`, `45min`, `2h`).

### 3.4 — Update `ticket-durations.md`

Path: `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ticket-durations.md`

**If the file doesn't exist** → create it with header + initial table.

**If the file exists** → don't overwrite. Merge:
1. Read existing table (historical types)
2. For each type present this week: recalculate **cumulative** stats (history + new tickets) — `ticket-durations.md` retains individual tickets at end of file, reread them to recalculate.
3. For types not touched this week: keep as-is
4. Append section "Individual tickets (week WXX)" at end of file (raw history, never purged)

**Format**:
```markdown
# Actual ticket durations

*Updated YYYY-MM-DD (closeweek W##)*

Data calibrated from `⏱→✅` tickets in daily notes since 2026-05-03.

| Type | Nb tickets | Average | Median | Min | Max |
|------|-----------|---------|---------|-----|-----|
| CC maintenance | 12 | 28min | 25min | 10min | 45min |
| CC skill | 5 | 52min | 45min | 30min | 1h20 |
| Personal practical | 4 | 1h45 | 1h45 | 1h30 | 2h |
| ...

## Individual tickets

### Week W18 (2026-04-27 → 2026-05-03)
- 2026-04-28 — [[ticket-x]] — 32min — CC maintenance
- ...

### Week W19 (2026-05-04 → 2026-05-10)
- ...
```

### 3.5 — Edge cases

- **No ticket with `⏱→✅` this week**: don't touch `ticket-durations.md`. Log in verbose feedback: `⚠ No timestamped tickets this week — skip ticket-durations.md update`
- **Type with < 3 tickets in cumulative**: keep the line in the table but it's `/today` that will detect insufficiency (signal "insufficient data for [type]" on `/today` side, not here)
- **File `ticket-durations.md` corrupted (parsing fail)**: don't overwrite. Log `⚠ ticket-durations.md unreadable — skip update. To rebuild manually.` Continue the rest of closeweek.

---

## Step 4 — Write the note

**Template**:

```markdown
# Week WXX — YYYY
*From [Monday DD/MM] to [Sunday DD/MM]*
*[Partial summary — to finalize Sunday]* ← add if draft mode

## Continuity from previous week
[Unclosed threads, recurring learnings from W-1]
← Omit this section if no thread to pursue

## ✅ Done
- ...

## 💡 Learnings
*Phrase as "X reveals that...", "X means that..." — not bare factual recap.*
- ...

## 🔁 Blockers & Patterns
*What worked, what blocked, emerging patterns.*
- Working: ...
- Blocker: ...
- Pattern detected: ...
  *If pattern recurring (variable `pattern_recurrents`) :*
  `→ Recurring since YYYY-MM-DD — outcome observed: [what followed, 1 sentence]`
← Omit entirely if no blocker/pattern this week

## 🔗 Connecting theme
*Meta-pattern linking achievements/blockers in 1 sentence.*
← Omit if absent

## 🔋 Energy of the week
| Day | Energy | Score | Feeling |
|------|---------|-------|---------|
| Mon | [X]/5 | [X]/5 | *[feeling]* |
| Tue | ... | ... | ... |
| Wed | ... | ... | ... |
| Thu | ... | ... | ... |
| Fri | ... | ... | ... |
| Sat | ... | ... | ... |
| Sun | ... | ... | ... |
← Omit days without daily note. Omit Score or Feeling column if no daily note of the week contains that field.

**📱 Oral channel — [telegram_count] entries this week** *(distribution: idea X · task X · update X · dump X)*
← One line, always present when at least one daily note has been read. Also report counts of **previous 2 weeks** if they appear in their Weekly notes, as `W28 8 · W29 5 · W30 2`.

**Why this counter exists**: Telegram is the only vault channel capturing **spoken** words — what was said to {USER_NAME}, meeting feedback, immediate feeling. Everything else in the vault captures what they **produce**. The failure mode of an oral capture habit is **silence**, and silence looks exactly like a calm week: the `#writing` habit died early July 2026 (13 checked in June, 0 in July) without any closeday, closeweek or portrait seeing it. The counter makes extinction visible in weeks instead of months.

**Reading — don't turn into a target**:
- A low number on an **off, vacation, or low-meeting week** is not a signal. The channel follows social load, not a target quantity.
- **Signal to surface in `🔁 Blockers & Patterns`**: monotone decrease over **3 consecutive weeks** with ≥ 3 days of `work_hours > 5` each, **or** a `telegram_count = 0` on a full working week.
- Never propose "catching up" on missing entries nor create an automatic catch-up ticket. The work belongs to {USER_NAME} (arbitration on 07/27: *"the work to do is on me"*) — closeweek's role stops at not lying about the result.

## ➡️ Following week
- ...
← Omit if empty

← Omit entirely if level 0
```

**Writing rules**:
- Optional sections (Continuity, Blockers & Patterns, Connecting theme, Following week): omit **silently** if empty — never leave section title empty
- Insight > recap: each point must imply something for next steps
- Little content (< 3 items total): short summary + explain why (ex: "Stable week — few events")

---

## Step 5 — Pattern capitalization → {USER_NAME}.md

**Objective**: anchor recurring patterns detected this week in `01 - Me/{USER_NAME}.md §Observed patterns` — don't wait for the monthly.

**Eligibility criterion**: a pattern is proposed for anchoring if **at least one** of these conditions is true:
- Present in `pattern_recurrents` (variable Step 2 — inter-week recurrence with similarity ≥ 0.45)
- Mentioned in ≥ 2 distinct daily notes of the week (similar phrasings even if not identical)
- Linked to an unclosed thread pursued since W-1 or W-2 (continuity observed over 3 weeks)

**If no pattern qualified** → skip silently, verbose line: `⚠ Skip — no recurring pattern qualified`. Go to Step 6.

**If patterns qualified**:

1. Read `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` — locate most recent `### Observed patterns` section (by date).
2. Present to {USER_NAME}:

```
Recurring patterns qualified this week:

1. [Short pattern — 1 sentence]
   Occurrences: [daily YYYY-MM-DD, daily YYYY-MM-DD, pattern_recurrents since YYYY-MM-DD]
   Proposal to anchor in {USER_NAME}.md §Observed patterns (current month):
   → "[Proposed wording, 2-3 sentences with dated sources]"

2. [Pattern 2 — ...]
```

3. Wait for {USER_NAME} validation per pattern. Accept: "1", "all", "1 and 3", "yes", "ok". Refuse: "no", "skip", silence/timeout (45s) → skip this pattern.
4. For each validated pattern:
   - If section `### Observed patterns ([current month])` exists → add bullet under this section
   - Else → create section `### Observed patterns (closeweek W## — YYYY-MM)` at head of Patterns zone (before existing monthly sections)
   - Bullet format: `- **[Short pattern]** — [Description, 2-3 sentences with dated sources]. Pattern to watch: [optional — falsification condition or next check]`
5. **Always pair-programming**: no writing without explicit validation. Global refusal ("no", "skip all") → don't write anything, verbose line `⚠ Proposed patterns refused — no anchoring {USER_NAME}.md`.

**If {USER_NAME}.md missing/unreadable** → display `⚠ {USER_NAME}.md inaccessible — pattern capitalization deferred`, don't block rest of skill.

---

## Step 6 — Revisit "To watch" watchlist

**Objective**: revisit patterns marked `To watch` in `{USER_NAME}.md` — confirm, disprove, or leave pending. Prevents the watchlist from ballooning without ever being settled.

**Source**: `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md`

**Detection**: grep bullets containing one of these phrasings:
- `Pattern to watch`
- `To watch:`
- `to watch —`
- `To watch post-`
- `To watch on return`

(Case-insensitive. Capture variations while staying strict on word "watch".)

**If watchlist empty** → skip silently, verbose line: `⚠ Skip — watchlist empty`. Go to Step 7.

**If watchlist non-empty**:

1. For each pattern in the watchlist, present to {USER_NAME}:

```
Watchlist patterns "To watch" — reread W##:

1. [Short pattern extracted from bullet]
   Source: {USER_NAME}.md §[section] (anchored YYYY-MM-DD or estimated from bullet context)
   Question: confirmed / disproven / still pending / already settled elsewhere?

2. [...]
```

2. Wait for response per pattern. Accept: "1 confirmed", "2 pending", "1 disproven, 2 settled", "all pending". Refuse: silence/timeout (60s) → treat all non-answered as "pending".

3. Per response:
   - **Confirmed** → propose modifying the bullet: remove "To watch" mention and add `Confirmed YYYY-MM-DD (closeweek W##)`. Wait for OK before edit.
   - **Disproven** → propose 2 options: `[R] remove bullet entirely` or `[A] archive pattern with "Disproven YYYY-MM-DD (closeweek W##) — [short reason]"`. Wait for choice before edit.
   - **Pending** → do nothing. Bullet stays as-is, will be reproposed next closeweek.
   - **Already settled elsewhere** → ask where (other essay, ADR, [[wiki link]]), propose removing "To watch" mention + add `Settled in [[link]] YYYY-MM-DD`. Wait for OK.

4. **Strict pair-programming**: each {USER_NAME}.md edit waits for explicit validation. Refusal → keep as-is, note in verbose `⚠ Pattern N: edit refused`.

**If {USER_NAME}.md missing/unreadable** → display `⚠ {USER_NAME}.md inaccessible — watchlist not revisited`, don't block.

---

## Step 7 — Tracker + light reread CLAUDE.md

**Action 1: Update command-tracker.md BEFORE creating note**

Read `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`. Add or update line:
```
/closeweek [YYYY-WXX] → executed [YYYY-MM-DD HH:MM]
```

**Action 2: Light reread global CLAUDE.md** *(advisory, weekly)*

Quickly reread `~/.claude/CLAUDE.md` (= `99 - Claude Code/CLAUDE.md`) + `99 - Claude Code/vault-context.md`. Spot any rule **obsolete, redundant or misplaced** per routing rule: stays in CLAUDE.md = always active all contexts; else → hook (event), skill (invocation) or project context.

- Nothing to report → verbose line `✓ CLAUDE.md reread — All clear`.
- Drift spotted → signal to {USER_NAME} in Step 9 (recap), **don't modify anything** (pair-programming). For deep pass, point to ticket `passe-claude-md-inspiration-karpathy-maintenance-reguliere`.
- **Deep pass cadence**: quarterly or after major model update — tracked in `command-tracker.md` (line `claude-md-pass`).

**Action 3: Nudge lessons.md distillation** *(advisory, weekly)*

`lessons.md` is injected **at each prompt** by hook `lessons-loader`; it's a sluice, not an archive. Count lessons: `grep -c '^- \*\*' "99 - Claude Code/lessons.md"`. If **> 20 lessons** (re-bloat threshold) → signal to {USER_NAME} in Step 9 (recap): *"`lessons.md` = N lessons, above threshold. Launch `/lessons-distill` to route stabilized lessons to their home (SKILL.md / CLAUDE.md / ADR / Knowledge / prune)."* **Don't launch distillation during closeweek** (heavy pass) — just nudge. Below threshold → verbose line `✓ lessons.md below threshold (N lessons) — no nudge`. See [[passe-distillation-lessons-md-graduer-foyer]].

Implicit confirmation: if read + write succeed, continue to Step 8.

---

## Step 8 — Create the note

**Final path**: `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\YYYY-WXX.md` or `YYYY-WXX-draft.md` per mode (Step 1)

**Generate the note** with written content (Step 4).

**Success signal to {USER_NAME}**:
- Display direct link to created note
- Message: "Week W## summary created" (or "draft created — finalize on Sunday")

---

## Step 9 — Chat recap

After note creation, display directly in chat (not in the note):

**1. Narrative recap of the week** — 3-5 lines max, oriented toward sense and movement, not task list. Include connecting theme if present.

**2. Priority table for W+1** — format:

| Priority | Subject |
|----------|-------|
| 🔴 Urgent/blocking | ... |
| 🟠 Important | ... |
| 🟡 To advance if possible | ... |

Source priorities from `➡️ Following week` section of the note + unclosed threads detected in Step 2.

**4. Spelling** (if `ortho_items` non-empty):

```
### ✍️ Spelling — this week
- "observed error" → correction (rule in 1 sentence)
```

Maximum 3 items. Neutral, factual tone. Omit silently if `ortho_items` empty.

**Rule**: chat recap is always displayed, even in draft mode.

---

## Draft → final conversion

**Sunday after 11:59pm** (or {USER_NAME} reread earlier):

Launch `/closeweek 2026-W14` on same week. System detects existing draft (Step 1, condition 4). {USER_NAME} chooses `[R] replace completely` → new write replaces the draft.

Alternatively, {USER_NAME} can relaunch Wednesday and choose `[A] add missing` to enrich draft then relaunch Sunday `[R]`.

---

## Absolute rules

- **{USER_NAME}.md capitalization**: this skill proposes anchoring of recurring patterns (Step 5) and watchlist revisit (Step 6). The monthly (`/closemonth`) remains responsible for deep consolidation (patterns ≥ 3 occurrences, section overhaul). Weekly capitalizes on the go, monthly synthesizes.
- No writing to `01 - Me/{USER_NAME}.md` without explicit {USER_NAME} validation — always present proposal before edit
- Process one week at a time if multiple weeks behind — propose the order (Step 1, condition 5)
- Insight > recap: value = what the week implies, not what it contains

---

## Edge cases — Resolution

| Scenario | Response |
|----------|---------|
| Launched Monday–Saturday current week | Draft mode (Step 1). Note `YYYY-WXX-draft.md` created. Signal: "To finalize on Sunday: `/closeweek` or `/closeweek YYYY-WXX` → `[R]`". |
| 0 daily notes week | Step 2: display choice `[P]/[A]`. If `[P]`: message "Lightweight summary (sessions only)". Continue. |
| ISO calendar spanning 2 months (ex W13 = Mar-Apr) | Use ISO W13, mention date range in header (ex "From 24/03 to 30/03"). |
| Draft exists for target week | Step 1, condition 4: propose `[A]/[R]/[C]`. Wait for response before continuing. |
| command-tracker.md missing/broken | Infer from file creation dates: list all `YYYY-WXX.md` in `Weekly/`, extract MAX(modification date), deduce current W. Display "Tracker missing — reconstruction based on files. Continue?" Wait for confirmation. |
| ISO calculation error (invalid dates) | Display: "Cannot calculate ISO week for [argument]. Check YYYY-WXX format or date argument. Relaunch?" Wait for new argument. |
| No level 1-2 content (empty week) | Write short minimal summary (3-4 items) + line "Stable week — few events or consolidated routines." |

---

## Pair-programming

- No autonomous action: every decision (final/draft mode, missing weeks processing, 0 daily notes procedure) waits for explicit {USER_NAME} validation
- Tracker before note: `command-tracker.md` update happens first (Step 7), before note creation (Step 8)
- Proposed choices are clear and contextualized: never "Continue?" without explicit option
