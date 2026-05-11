---
name: workon
description: Load the context of a Kanban feature, note, or ticket and start a working session on it. Use when the user switches to a specific topic (dev, learning, hobby, organization) after clarifying *what* to do. Don't load skills upfront — detect needs from context and let {USER_NAME} decide. Examples: /workon Add tag management, /workon ML projet VUT, /workon Luna setup. Non-contexts: recall (searches notes), specs (generates specs), refine (challenges a ticket), my-world (loads the day).
---

Load the context of the subject passed as argument and prepare a working session on it.

## Step 1 — Identify the subject

The argument passed is: $ARGUMENTS

Search strictly in this order:

1. **Exact title**: a note/ticket/feature whose title matches `$ARGUMENTS` literally (case-insensitive)
   - Search in: personal vault notes, then **all columns** of Kanban `04 - Projects/*/Features/` (Ready, WIP, Specs, Done)
   - If found → retain exact path and stop
2. **Partial title**: partial matches — first mention of `$ARGUMENTS` in the title counts as a match (ex: "Add tag management" matches "tag" in "Tag system", "management" in "Paint inventory management")
   - Filter by relevance: active projects first (FSTG > others)
   - If one result → continue, if multiple → display list (max 5) + ask for selection
3. **Glob search** (fallback): if no results → Glob `**/*` on the vault with pattern `$ARGUMENTS`
   - Announce: "No exact/partial match — I searched more broadly and found..."

**If zero results after fallback**:
→ Display options: "No note found for `$ARGUMENTS`. Do you want to:"
- **Create a new note** → ask for type (Kanban feature, knowledge, hobby, organization?) and path → create empty file → **relaunch workon** on this new path
- **Search differently** (specify how)
- **Continue without context** (start code/conceptual explorations directly, without source file)

**Wait for {USER_NAME}'s choice before proceeding to Step 2.**

**Retain the source** (exact path, Kanban column, or note type) — used in Step 5 for closure.

## Step 1.5 — Mark start time in the daily note

Once the subject is identified, mark the start time on the corresponding task line in today's daily note.

1. Get current time: `date +"%H:%M"`
2. Search in `{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md` for a `- [ ]` line containing the ticket name or a fragment of the title (case-insensitive)
3. If found → add `⏱ HH:mm` at end of line (before line break)
   - Example: `- [ ] [[ticket|Title]] — description — (~45min) ⏱ 12:18`
4. If not found → continue without signal (ticket not in today's plan, not blocking)

This step is silent — no announcement to {USER_NAME}.

## Step 2 — Read and analyze the note

Read the complete note content + all directly mentioned `[[]]` links.

### Identify the type and project

- **Kanban feature**: note in `04 - Projects/[X]/Features/` (Ready, WIP, Specs, Done) → identify project `[X]`
- **Vault note**: note outside project structure → knowledge, hobby, organization (no associated project)
- **Empty or broken note**: empty file, orphaned, or dead reference → signal immediately

**If note is empty**:
→ Display: "The note exists but is empty. Do you want to develop it first, search differently, or continue without it?"
→ **Wait for {USER_NAME}'s decision.**

### Visual bug — screenshot first

**If ticket is visual bug type** (CSS, layout, rendering, display):
→ Ask immediately: "Can you send me a screenshot?"
→ **Wait for answer before any code investigation** — don't launch server, install dependencies, or open source files.
→ If screenshot unavailable → mark **Blocked** and wait.

This rule takes priority over all other Step 2 phases.

### Check blockers

Identify explicit dependencies (Kanban features only):
- Keywords: "blocked by", "prerequisite", "do before", "depends on", "requires"
- `[[]]` links in dependency context (ex: "See also [[X]]" ≠ "Blocked by [[X]]")
- "Blockers", "Dependencies", or "Prerequisites" sections if present
- Project's `Priority.md` file

**If blocker identified**:
→ Display: "This ticket is blocked by [[X]] — do we work on the blocker first?"
→ **Wait for {USER_NAME}'s confirmation before proceeding to Step 3.**

**If no blockers or vault note**:
→ Continue directly to Step 3.

## Step 3 — Load context

### Case A: Kanban feature

1. **Read project README**: `04 - Projects/[Project]/claude-code/README.md`
   - **If absent**: announce "Project README missing — fill it out or continue without?"
2. **Load graph-context.md if present** — **always, regardless of ticket**:
   - Search `.claude/graph-context.md` in local repo
   - If found → read and include in context summary (god nodes + communities). No relevance filter — unconditional load.
   - If absent → search `.claude/graph-cache.json` as fallback (raw graphify, less curated). If found → read and extract main nodes.
   - If neither → continue without, suggest `/graph` in Step 4 if first contact with this repo
3. **Get local repo path**:
   - Search in CLAUDE.md or MEMORY.md (ex: `project_fstg_local_path.md`)
   - If found → retain for file searches this session
   - **If not found** → ask: "What is the local repo path?" — **wait before continuing**
4. **Summarize in 3-5 lines**:
   - What it's about (business domain, context)
   - Current state: specs generated? code started? tests ready?
   - Next steps: expected clarifications, first actions
5. **Invoke `recall` if relevant**: if summary reveals key business concepts or necessary references, invoke `recall` with these terms (max 3 keywords)
   - Invoke only if business terms identified — never routine
6. **Project memory** (optional): query on ticket title to find historical work:
   ```bash
   uv run ~/.claude/semantic_search.py "<ticket title>" --top-k 2
   ```
   If results (similarity ≥ 0.45) → display at bottom of context summary:
   ```
   📎 Past sessions on this topic:
   - [YYYY-MM-DD] — <session title> / <section_type>
   ```
   If Postgres/Ollama inaccessible → non-blocking, display: `⚠️ Project memory unavailable (Postgres/Ollama down).`

### Case B: Vault note (knowledge, hobby, organization)

1. **Summarize in 2-3 lines**:
   - Subject and context
   - Current state (draft, structured, to develop)
2. **Load related notes**: read `[[]]` if essential
3. **Don't invoke `recall`** — not necessary for vault note

## Step 4 — Propose entry point

### Dev branch (Kanban feature)

- Remind TDD approach: "Do we start with tests?"
- Suggest: "Need help with architecture, a quick question, or go direct?"
- **Skills on standby** — load only if {USER_NAME} explicitly asks:
  - "Show me the architecture / structure" → no skill (pair programming direct)
  - "What pattern to use?" → no skill (discussion + examples)
  - "Need skill [name]" → load the skill
  - "Go for it" → no skill, let {USER_NAME} code

### Non-dev branch (Vault note)

Suggest concrete action based on type:
- **Knowledge/concept**: "Want to deepen, link to other notes, or move to practice?"
- **Hobby**: "Start with [logical step] or [alternative]?"
- **Organization**: "Develop it, organize it, or discuss first?"

**Wait for {USER_NAME}'s answer before loading skills or exploring other contexts.**

## Step 5 — Closure (when user announces "done" or "finished")

### Checks adapted to type (Step 2)

**Kanban feature**:
- Do tests pass without modification? (no post-dev adjustment)
- Does observable behavior match validated specs?
- Code pushed and ready for Kanban Done?

**Vault note (knowledge, hobby, organization)**:
- Is note in right hierarchical location?
- Are `[[]]` links to existing notes created if relevant?
- To index in INDEX.md or MEMORY.md?

Present as:
```
✅ Before closure:
- [ ] [Check 1]
- [ ] [Check 2]
```

### Post-validation actions

Once {USER_NAME} confirms "All good":

**First** — get current time (`date +"%H:%M"`) and complete ticket line in daily note: `⏱ HH:mm→HH:mm ✅` (start time already present from Step 1, add end time + ✅). Not just `✅` — always both. Do before announcing closure to {USER_NAME}.

**Kanban feature**:
→ "You can move the ticket to Done in Kanban. ADR to create?" (if architectural decision)

**Vault note**:
→ "Index somewhere?" (INDEX.md, MEMORY.md, Skills/INDEX.md)

Confirm: "Closure validated ✓"

## Absolute rules

- **Skills on standby**: load only if {USER_NAME} explicitly asks ("show me", "what pattern", "need skill X"). Never by anticipation, never by need inference.
- **Never modify vault, Kanban, or sources** without {USER_NAME}'s validation. Workon suggests actions, {USER_NAME} executes.
- **Step 1 search: strict order** (exact → partial → glob fallback). No intelligent multi-source.
- **`recall` (Step 3)**: invoke only if summary identifies relevant business terms — never routine.
- **Edge case: README absent** (Case A, Step 3) — ask before continuing.
- **Edge case: broken/orphaned note** (Step 2) — signal and ask if we retry or search differently.
- **Explicit validations**: Step 1→2 (selection if multiple), Step 2→3 (if blocker), Step 3→4 (if empty), Step 4→work (answer from {USER_NAME}).
- **No inference**: if "Do we start with tests?" gets "yeah", start. If silence, ask "what do you start with?"
