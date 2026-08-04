---
name: workon
description: "Loads the context of a Kanban feature, note or ticket and starts a work session on it. Use when the user switches to a specific topic (dev, learning, hobby, organization) after clarifying *what* to do. Do not load skills right away — detect needs from context and let {USER_NAME} decide. Examples: /workon Add tag management, /workon ML project VUT, /workon Luna setup. Non-contexts: recall (searches for notes), specs (generates specs), refine (challenges a ticket), my-world (loads the day)."
---

Loads the context of the subject passed as an argument and prepares a work session on it.

## Step 1 — Identify the subject

The argument passed is: $ARGUMENTS

Search strictly in this order:

1. **Exact title** : a note/ticket/feature whose title matches `$ARGUMENTS` literally (case-insensitive)
   - Search in: personal vault notes, then **all columns** of Kanban `04 - Projects/*/Features/` (Ready, WIP, Specs, Done)
   - If found → retain the exact path and stop
2. **Partial title** : partial matches — first mention of `$ARGUMENTS` in the title counts as a match (ex: "Add tag management" matches "tag" in "Tag system", "management" in "Paint inventory management")
   - Filter by relevance: active projects take priority (FSTG > others)
   - If one result → continue, if multiple → display list (max 5) + request selection
3. **Glob search** (fallback) : if no result → Glob `**/*` on the vault with pattern `$ARGUMENTS`
   - If Glob returns nothing → fallback shell `find "{VAULT_PATH}" -iname "*$ARGUMENTS*"` (tolerates slugs/approximate cases)
   - Announce: "No exact/partial match — I searched more broadly and found..."

**If zero results after fallback** :
→ Display options: "No note found for `$ARGUMENTS`. Do you want to :"
- **Create a new note** → ask the type (Kanban feature, knowledge, hobby, organization?) and the path → create empty file → **relaunch workon** on this new path
- **Search differently** (specify how)
- **Continue without context** (start code explorations/conceptual work directly, without source file)

**Wait for {USER_NAME}'s choice before proceeding to Step 2.**

**Retain the source** (exact path, Kanban column, or note type) — used in Step 5 for closure.

### ⚠️ Real state gate — the kanban can lie

Before working on the ticket, **cross-check the displayed column with the state actually delivered** : project README, `Sessions/`, code, ADR. Real completed work regularly stays stuck in its original column (Ready/WIP) — orphaned sessions, work done in a side session, stale digest. If real state ≠ column, **flag it and propose closure BEFORE** "working" on it.

Risk increases on two ticket profiles :
- **numbered / phased ticket** (`HUSKER-12`, `lore-01`, "Phase 2") — neighboring steps may have been completed without the board reflecting it ;
- **ticket refined a while ago** — the refine may have been followed by untracked implementation.

*(Cause: 2026-06-13, pattern observed on all projects. 2026-06-23, a digest announced HUSKER-12 "next link" when 12 **and** 13 were already Done.)*

### Admin validation = 5 min max

A ticket of type "validate if X works" is handled in ~5 min: yes → check Done, no → open an investigation ticket. **Never more than 10 min** without moving into active search — otherwise it's no longer validation, it's disguised investigation that deserves its own ticket.

## Step 1.5 — Mark start time in the daily note

Once the subject is identified, mark the start time on the corresponding task line in today's daily note.

1. Get current time: `date +"%H:%M"`
2. Search in `{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md` for a `- [ ]` line containing the ticket name or a title fragment (case-insensitive)
3. If found → add `⏱ HH:mm` at end of line (before line break)
   - Example: `- [ ] [[ticket|Title]] — description — (~45min) ⏱ 12:18`
4. If not found → continue silently (the ticket is not in today's plan, not blocking)

This step is silent — no announcement to {USER_NAME}.

## Step 2 — Read and analyze the note

Read the full content of the identified note + all `[[]]` links directly mentioned.

### Identify type and project

- **Kanban feature** : note in `04 - Projects/[X]/Features/` (Ready, WIP, Specs, Done) → identify project `[X]`
- **Vault note** : note outside project structure → knowledge, hobby, organization (no associated project)
- **Empty or broken note** : empty file, orphaned, or dead link → flag immediately

**If note is empty** :
→ Display: "The note exists but is empty. Do you want to develop it first, search differently, or continue without it?"
→ **Wait for {USER_NAME}'s decision.**

### Visual bug — screenshot first

**If the ticket is a visual bug type** (CSS, layout, rendering, display) :
→ Ask immediately: "Can you send me a screenshot?"
→ **Wait for the answer before any code investigation** — do not start the server, install dependencies, or open source files.
→ If screenshot unavailable → mark **Blocked** and wait.

This rule takes priority over any other Step 2 action.

### Check blockers

Identify explicit dependencies (Kanban features only) :
- Keywords: "blocked by", "prerequisite", "to do before", "depends on", "requires"
- `[[]]` links in dependency context (ex: "See also [[X]]" ≠ "Blocked by [[X]]")
- "Blockers", "Dependencies", or "Prerequisites" sections if present
- Project's `Priority.md` file

**If blocker identified** :
→ Display: "This ticket is blocked by [[X]] — work on the blocker first?"
→ **Wait for {USER_NAME}'s confirmation before proceeding to Step 3.**

**If no blocker or vault note** :
→ Continue directly to Step 3.

## Step 3 — Load context

### Case A: Kanban feature

1. **Read the project README** : `04 - Projects/[Project]/claude-code/README.md`
   - **If missing** : announce "Project README missing — take care of filling it or continue without it?"
2. **Load graph-context.md** if present — **always, regardless of ticket** :
   - Search `.claude/graph-context.md` in the local repo
   - If found → read it and include in context summary (god nodes + communities). No relevance filter — unconditional loading.
   - If missing → search `.claude/graph-cache.json` as fallback (raw graphify, less curated). If found → read and extract main nodes.
   - If neither → continue without, propose `/graph` in Step 4 if first contact with this repo
3. **Retrieve the local repo path** :
   - Search in CLAUDE.md or MEMORY.md (ex: `project_fstg_local_path.md`)
   - If found → retain for file searches this session
   - **If not found** → ask: "What is the local path of the repo?" — **wait before continuing**
4. **Summarize in 3-5 lines** :
   - What it's about (business domain, context)
   - Current state: specs generated? code started? tests ready?
   - Next steps: expected clarifications, first actions
5. **Invoke `recall` if relevant** : if the summary reveals key business concepts or necessary references, invoke `recall` with these terms (max 3 keywords)
   - Invoke only if business terms identified — do not do it routinely
6. **Project memory** (optional) : query on the ticket title to find historical work :
   ```bash
   uv run ~/.claude/semantic_search.py "<ticket title>" --top-k 2
   ```
   If results (similarity ≥ 0.45) → display at bottom of context summary :
   ```
   📎 Past sessions on this subject :
   - [YYYY-MM-DD] — <session title> / <section_type>
   ```
   If Postgres/Ollama inaccessible → non-blocking, display: `⚠️ Project memory unavailable (Postgres/Ollama down).`

### Case B: Vault note (knowledge, hobby, organization)

1. **Summarize in 2-3 lines** :
   - Subject and context
   - Current state (draft, structured, needs development)
2. **Load related notes** : read `[[]]` if essential
3. **Do not invoke `recall`** — not needed for a vault note

## Step 4 — Propose an entry point

### Dev branch (Kanban feature)

- Remind TDD approach: "Start with tests?"
- Propose: "Need help with architecture, a quick question, or go straight in?"
- **Skills in reserve** — load only if {USER_NAME} explicitly asks :
  - "Show me the architecture / structure" → no skill (direct pair programming)
  - "What pattern to use?" → no skill (discussion + examples)
  - "Need skill [name]" → load the skill
  - "Go for it" → no skill, let {USER_NAME} code

### Non-dev branch (Vault note)

Propose a concrete action based on type :
- **Knowledge/concept** : "Do you want to deepen, link to other notes, or move to practice?"
- **Hobby** : "Start with [logical step] or [alternative]?"
- **Organization** : "Develop it, organize it, or discuss first?"

**Wait for {USER_NAME}'s answer before loading skills or exploring other contexts.**

## Step 5 — Closure (when {USER_NAME} announces "it's done" or "finished")

### Verification adapted to type (Step 2)

**Kanban feature** :
- Do tests pass without modification? (no post-dev adjustments)
- Does observable behavior match validated specs?
- Code pushed and ready for Kanban Done?

**Vault note (knowledge, hobby, organization)** :
- Is the note in the right hierarchical place?
- `[[]]` links to existing notes created if relevant?
- To be indexed in INDEX.md or MEMORY.md?

Present as :
```
✅ Before closure :
- [ ] [Check 1]
- [ ] [Check 2]
```

> ⚠️ **A done criterion not met → continue, do not close.** If a ticket criterion is identified as missing at closure time, treat it **before** proposing closure. Never present a closure with a known unchecked box, even by honestly flagging it: flag the gap and propose closing anyway, that's delegating to {USER_NAME} an arbitration that isn't one — the ticket defines its own done, it is the authority. *(Cause: 2026-07-27, HUSKER-15 closure proposed with the criterion "mechanism **+ doc**" half-done, doc missing and listed as such in the checklist; {USER_NAME} had to rework — "AH if the done criterion isn't done, we continue". The doc took 10 minutes.)*

### Post-validation actions

Once {USER_NAME} confirms "All good" :

**First** — get current time (`date +"%H:%M"`) and complete the ticket line in the daily note: `⏱ HH:mm→HH:mm ✅` (start time already present from Step 1, add end time + ✅). Not just `✅` — always both. Do this before announcing closure to {USER_NAME}.

> ⚠️ **Overnight crossing** — if a night (or long break) crossed between start and end time, **do not write a misleading wall-clock span** (`⏱ 23:30→09:15` spanning the night). Confirm with {USER_NAME} : just `✅` with no span, or a re-estimated span of actual work. The `⏱ start→end` reflects actual work time, not wall-clock (cf. lesson "⏱ start→end = actual work time, breaks excluded").

**Kanban feature** :
→ "You can move the ticket to Done in the Kanban. ADR to create?" (if structural decision)

> ⚠️ **Closing a ticket = both gestures, always** : **remove it from its current column** AND add it under `## Done` with `[x]`. Checking without moving leaves the ticket in the wrong column and the board lies again.

> 🔓 **Sweep dependent tickets still `Blocked`.** A delivered ticket does not unblock its dependents on its own: they stay `Blocked` with a stale blocker, **invisible to prioritization**. At closure, search who cites this ticket as a blocker (`blocked by [[this-ticket]]`) and propose moving `Blocked → Ready`. *(Cause: 2026-07-21, WPF-07 stayed 6 weeks Blocked by WPF-04 — ✅ 05/06 — and WPF-06 — ✅ 08/06 ; it hid the only contributory ticket to Objective 4, 4 days of blind spot measured when the lever already existed.)*

**Vault note** :
→ "Index it somewhere?" (INDEX.md, MEMORY.md, Skills/INDEX.md)

Confirm: "Closure validated ✓"

## Absolute rules

- **Skills in reserve** : load only if {USER_NAME} explicitly asks ("show me", "what pattern", "need skill X"). Never by anticipation, never by inferred need.
- **Never modify the vault, Kanban, or sources** without {USER_NAME}'s validation. Workon suggests actions, {USER_NAME} executes them.
- **Step 1 search: strict order** (exact → partial → glob fallback). No intelligent multi-source.
- **`recall` (Step 3)** : invoke only if the summary identifies relevant key business terms — never systematically.
- **Edge case: missing README** (Case A, Step 3) — ask before continuing.
- **Edge case: broken/orphaned note** (Step 2) — flag and ask if we retry or search differently.
- **Explicit validations** : Step 1→2 (selection if multiple), Step 2→3 (if blocker), Step 3→4 (if note empty), Step 4→work ({USER_NAME}'s answer).
- **No inference** : if "Start with tests?" gets "yeah", begin. If silence, ask "what do you start with?"
