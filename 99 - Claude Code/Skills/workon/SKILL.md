---
name: workon
description: "Loads the context for a Kanban feature, note or ticket and starts a work session on it. Use when the user switches to a specific topic (dev, learning, hobby, organization) after clarifying *what* to do. Don't load skills from the start — detect needs from the context and let {USER_NAME} decide. Examples: /workon Add tag management, /workon ML projet VUT, /workon Luna setup. Non-contexts: recall (finds notes), specs (generates specs), refine (challenges a ticket), my-world (loads the day)."
---

Loads the context for the topic passed as argument and prepares a work session on it.

## Step 1 — Identify the topic

The argument passed is: $ARGUMENTS

Search strictly in this order:

1. **Exact title**: a note/ticket/feature whose title matches `$ARGUMENTS` literally (case-insensitive)
   - Search in: personal vault notes, then **all columns** of Kanban `04 - Projects/*/Features/` (Ready, WIP, Specs, Done)
   - If found → retain the exact path and stop
2. **Partial title**: partial matches — first mention of `$ARGUMENTS` in the title counts as a match (ex: "Add tag management" matches "tag" in "Tag system", "management" in "Paint inventory management")
   - Filter by relevance: active projects first ([project-A] > others)
   - If one result → continue, if multiple → display list (max 5) + ask for selection
3. **Glob search** (fallback): if no result → Glob `**/*` on the vault with the pattern `$ARGUMENTS`
   - If Glob returns nothing → fallback shell `find "{VAULT_PATH}" -iname "*$ARGUMENTS*"` (tolerates slugs/approximate cases)
   - Announce: "No exact/partial match — I searched more broadly and found..."

**If zero results after fallback** :
→ Display options: "No note found for `$ARGUMENTS`. Do you want to:"
- **Create a new note** → ask for the type (Kanban feature, knowledge, hobby, organization?) and path → create empty file → **relaunch workon** on this new path
- **Search differently** (specify how)
- **Continue without context** (start explorations directly code/conceptual, without source file)

**Wait for {USER_NAME}'s choice before continuing to Step 2.**

**Retain the source** (exact path, Kanban column, or note type) — used in Step 5 for closure.

### ⚠️ Real-state gate — the kanban can lie

Before working on the ticket, **cross-reference the displayed column with the actually-delivered state**: README project, `Sessions/`, code, ADR. Work actually done regularly remains stuck in its original column (Ready/WIP) — orphaned sessions, work done in an ancillary session, stale digest. If actual state ≠ column, **flag and propose closure BEFORE** "working" on it.

Risk increases on two ticket profiles:
- **numbered/phased ticket** (`[example-project]-12`, `lore-01`, "Phase 2") — neighboring steps may have been closed without the board reflecting it;
- **ticket refined a while ago** — refinement may have been followed by untracked implementation.

*(Cause: 2026-06-13, pattern observed on all projects. 2026-06-23, a digest announced [example-project]-12 "next link" when 12 **and** 13 were already Done.)*

### Admin validation = 5 min max

A ticket of type "validate if X works" is processed in ~5 min: yes → check Done, no → open an investigation ticket. **Never more than 10 min** without moving to active search — otherwise it's not validation, it's investigation in disguise that deserves its own ticket.

## Step 1.5 — Mark start time in the daily note

Once the topic is identified, mark the start time on the corresponding task line in today's daily note.

1. Get current time: `date +"%H:%M"`
2. Search in `{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md` for a `- [ ]` line containing the ticket name or a title fragment (case-insensitive)
3. If found → add `⏱ HH:mm` at end of line (before line break)
   - Example: `- [ ] [[ticket|Title]] — description — (~45min) ⏱ 12:18`
4. If not found → continue silently (the ticket isn't in today's plan, not blocking)

This step is silent — no announcement to {USER_NAME}.

> ⚠️ **Estimate that dropped from one report to the next → flag before starting.** If the line found has a noticeably lower estimate than previous daily notes for the same ticket, it's a **compressed** ticket to fit the slot, not a better-understood ticket. Say it in one line to {USER_NAME} and propose to **re-break it on its real technical unknowns** rather than attacking with a false estimate. Rule set on the `/today` side in Step 3 § "Who decides today's budget" — here's the consumption side.

## Step 2 — Read and analyze the note

Read the complete content of the identified note + all `[[]]` links directly mentioned.

### Identify type and project

- **Kanban Feature**: note in `04 - Projects/[X]/Features/` (Ready, WIP, Specs, Done) → identify project `[X]`
- **Vault note**: note outside project structure → knowledge, hobby, organization (no associated project)
- **Empty or broken note**: empty file, orphaned, or dead reference → flag immediately

**If note empty** :
→ Display: "The note exists but is empty. Do you want to develop it first, search differently, or continue without it?"
→ **Wait for {USER_NAME}'s decision.**

### Visual bug — screenshot first

**If the ticket is a visual bug** (CSS, layout, rendering, display) :
→ Ask immediately: "Can you send me a screenshot?"
→ **Wait for response before any code investigation** — don't launch server, install dependencies, or open source files.
→ If screenshot unavailable → mark **Blocked** and wait.

This rule takes priority over all other Step 2 steps.

### Check blockers

Identify explicit dependencies (Kanban features only):
- Keywords: "blocked by", "prerequisite", "to do before", "depends on", "requires"
- `[[]]` links in dependency context (ex: "See also [[X]]" ≠ "Blocked by [[X]]")
- Sections "Blockers", "Dependencies", or "Prerequisites" if present
- Project `Priority.md` file

**If blocker identified** :
→ Display: "This ticket is blocked by [[X]] — work on the blocker first?"
→ **Wait for {USER_NAME}'s confirmation before continuing to Step 3.**

**If no blocker or vault note** :
→ Continue directly to Step 3.

## Step 3 — Load context

### Case A: Kanban Feature

1. **Read project README**: `04 - Projects/[Project]/claude-code/README.md`
   - **If missing**: announce "Project README missing — take care to fill it or continue without?"
2. **Load graph-context.md if present** — **always, regardless of ticket**:
   - Search `.claude/graph-context.md` in the local repo
   - If found → read and include in context summary (god nodes + communities). No relevance filter — unconditional load.
   - If missing → search for `.claude/graph-cache.json` as fallback (raw graphify, less curated). If found → read and extract main nodes.
   - If neither → continue without, propose `/graph` in Step 4 if first contact with this repo
3. **Get local repo path**:
   - Search in CLAUDE.md or MEMORY.md (ex: `project_fstg_local_path.md`)
   - If found → retain for file searches this session
   - **If not found** → ask: "What's the local path for the repo?" — **wait before continuing**
4. **Summarize in 3-5 lines**:
   - What it's about (business domain, context)
   - Current state: specs generated? code started? tests ready?
   - Next steps: expected clarifications, first actions
5. **Invoke `recall` if relevant**: if summary reveals key business concepts or necessary references, invoke `recall` with those terms (max 3 keywords)
   - Invoke only if business terms identified — don't do it by routine
6. **Project memory** (optional): query on ticket title to find historical work:
   ```bash
   uv run ~/.claude/semantic_search.py "<ticket title>" --top-k 2
   ```
   If results (similarity ≥ 0.45) → display at bottom of context summary:
   ```
   📎 Past sessions on this topic:
   - [YYYY-MM-DD] — <session title> / <section_type>
   ```
   If Postgres/Ollama unreachable → non-blocking, display: `⚠️ Project memory unavailable (Postgres/Ollama down).`

### Case B: Vault note (knowledge, hobby, organization)

1. **Summarize in 2-3 lines**:
   - Topic and context
   - Current state (draft, structured, to develop)
2. **Load related notes**: read `[[]]` if essential
3. **Don't invoke `recall`** — not needed for a vault note

## Step 4 — Propose an entry point

### Dev Branch (Kanban Feature)

- Remind of TDD approach: "Start with tests?"
- Propose: "Need help on architecture, a quick question, or go direct?"
- **Skills in reserve** — load only if the user says explicitly:
  - "Show me the architecture / structure" → no skill (direct pair programming)
  - "What pattern to use?" → no skill (discussion + examples)
  - "Need skill [name]" → load the skill
  - "Go ahead" → no skill, let {USER_NAME} code

### Non-dev Branch (Vault note)

Propose concrete action based on type:
- **Knowledge/concept**: "Want to deepen, link to other notes, or move to practice?"
- **Hobby**: "Start with [logical step] or [alternative]?"
- **Organization**: "Develop it, organize it, or discuss first?"

**Wait for {USER_NAME}'s response before loading skills or exploring other contexts.**

## Step 5 — Closure (when user announces "done" or "finished")

### Checks adapted to type (Step 2)

**Kanban Feature**:
- Tests pass without modification? (no post-dev adjustment)
- Observable behavior matches validated specs?
- Code pushed and ready for Kanban Done?

**Vault note (knowledge, hobby, organization)**:
- Is the note in the right place hierarchically?
- Created `[[]]` links to existing notes if relevant?
- To index in INDEX.md or MEMORY.md?

Present as:
```
✅ Before closure:
- [ ] [Check 1]
- [ ] [Check 2]
```

> ⚠️ **A done criterion not met → continue, don't close.** If a ticket criterion is identified as missing at closure time, handle it **before** proposing closure. Never present closure with a known unchecked box, even honestly signaling it: flag the gap and still propose closing, that's delegating an arbitrage that's not one — the ticket defines its own done, it holds. *(Cause: 2026-07-27, [example-project]-15 closure proposed with criterion "mechanism **+ doc**" half-done, doc missing and listed as such in checklist; {USER_NAME} had to reopen — "AH if done criterion isn't met, we continue". Doc took 10 minutes.)*

### Post-validation actions

Once {USER_NAME} confirms "All good":

**First** — get current time (`date +"%H:%M"`) and complete the ticket line in daily note: `⏱ HH:mm→HH:mm ✅` (start time already there from Step 1, add end time + ✅). Not just `✅` — always both. Do this before announcing closure to {USER_NAME}.

> ⚠️ **Overnight gap** — if a night (or long break) fell between start and closure time, **don't write a misleading wall-clock span** (`⏱ 23:30→09:15` covering the night). Ask {USER_NAME} confirmation: just `✅` without span, or a re-estimated span of actual work. The `⏱ start→end` reflects actual work, excluding breaks.

**Kanban Feature**:
→ "You can move the ticket to Done in the Kanban. ADR to create?" (if structuring decision)

> ⚠️ **Closing a ticket = both gestures, always**: **remove from current column** AND add under `## Done` with `[x]`. Checking without moving leaves the ticket in the wrong column and the board lies again.

> 🔓 **Sweep blocked dependents.** A delivered ticket doesn't unblock its dependents by itself: they stay `Blocked` with a stale blocker, **invisible to prioritization**. At closure, search who cites this ticket as blocker (`blocked by [[this-ticket]]`) and propose moving `Blocked → Ready`. *(Cause: 2026-07-21, WPF-07 stuck 6 weeks in Blocked by WPF-04 — ✅ 05/06 — and WPF-06 — ✅ 08/06; it hid the only contributor ticket for Objective 4, 4 days of blind spot measured when the lever already existed.)*

**Vault note**:
→ "Index it somewhere?" (INDEX.md, MEMORY.md, Skills/INDEX.md)

Confirm: "Closure validated ✓"

## Absolute rules

- **Skills in reserve**: load only if {USER_NAME} asks explicitly ("show me", "what pattern", "need skill X"). Never by anticipation, never by need inference.
- **Never modify vault, Kanban, or sources** without {USER_NAME} validation. Workon suggests actions, {USER_NAME} executes them.
- **Step 1 search: strict order** (exact → partial → glob fallback). No smart multi-source.
- **`recall` (Step 3)**: invoke only if summary identifies key relevant business terms — never systematically.
- **Edge case: missing README** (Case A, Step 3) — ask before continuing.
- **Edge case: broken/orphaned note** (Step 2) — flag and ask if we resume or search differently.
- **Explicit validations**: Step 1→2 (selection if multiple), Step 2→3 (if blocker), Step 3→4 (if note empty), Step 4→work (response from {USER_NAME}).
- **No inference**: if "Start with tests?" gets "yeah", begin. If silence, ask "you start with what?"
