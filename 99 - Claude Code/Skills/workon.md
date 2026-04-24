---
name: workon
description: Load the context of a Kanban feature, note, or ticket and start a work session on it. Use when Victor switches to a specific topic (dev, learning, hobby, organization) after clarifying *what* to do. Do not load skills from the start — detect needs based on context and let Victor decide. Examples: /workon Add tag management, /workon ML project VUT, /workon Luna setup. Non-contexts: recall (search notes), specs (generate specs), refine (challenge a ticket), my-world (load the day).
---

Load the context of the subject passed as argument and prepare a work session on it.

## Step 1 — Identify the subject

The argument passed is: $ARGUMENTS

Search strictly in this order:

1. **Exact title**: a note/ticket/feature whose title matches literally `$ARGUMENTS` (case insensitive)
   - Search in: personal vault notes, then **all columns** of Kanban `04 - Projects/*/Features/` (Ready, WIP, Specs, Done)
   - If found → retain exact path and stop
2. **Partial title**: partial matches — first mention of `$ARGUMENTS` in the title counts as match (ex: "Add tag management" matches "tag" in "Tag system", "management" in "Paint inventory management")
   - Filter by relevance: active projects first (FSTG > others)
   - If one result → continue, if multiple → display list (max 5) + ask for selection
3. **Glob search** (fallback): if no result → Glob `**/*` on vault with pattern `$ARGUMENTS`
   - Announce: "No exact/partial match — I searched more broadly and found..."

**If zero result after fallback** :
→ Display options: "No note found for `$ARGUMENTS`. Do you want to:"
- **Create a new note** → ask type (Kanban feature, knowledge, hobby, organization?) and path → create empty file → **restart workon** on this new path
- **Search differently** (clarify how)
- **Continue without context** (start code exploration/conceptual directly, without source file)

**Wait for Victor's choice before continuing to Step 2.**

**Retain the source** (exact path, Kanban column, or note type) — used in Step 5 for closure.

## Step 2 — Read and analyze the note

Read the full content of the identified note + all directly mentioned `[[]]` links.

### Identify the type and project

- **Kanban Feature**: note in `04 - Projects/[X]/Features/` (Ready, WIP, Specs, Done) → identify project `[X]`
- **Vault note**: note outside project structure → knowledge, hobby, organization (no associated project)
- **Empty or broken note**: empty file, orphaned, or dead reference → signal immediately

**If note is empty** :
→ Display: "The note exists but is empty. Do you want to develop it first, search differently, or continue without it?"
→ **Wait for Victor's decision.**

### Check for blockers

Identify explicit dependencies (Kanban features only):
- Keywords: "blocked by", "prerequisite", "must do first", "depends on", "requires"
- `[[]]` links in dependency context (ex: "See also [[X]]" ≠ "Blocked by [[X]]")
- Sections "Blockers", "Dependencies", or "Prerequisites" if present
- Project `Priority.md` file

**If blocker identified** :
→ Display: "This ticket is blocked by [[X]] — do we work on the blocker first?"
→ **Wait for Victor's confirmation before continuing to Step 3.**

**If no blocker or vault note** :
→ Continue directly to Step 3.

## Step 3 — Load context

### Case A: Kanban Feature

1. **Read project README**: `04 - Projects/[Project]/claude-code/README.md`
   - **If missing**: announce "Project README missing — fill it in or continue without it?"
2. **Load graph-context.md** if present:
   - Search for `.claude/graph-context.md` in local repo
   - If found → read and include in context summary (god nodes + communities)
   - If missing → continue without, offer `/graph` in Step 4 if first contact with this repo
3. **Get local repo path**:
   - Search in CLAUDE.md or MEMORY.md (ex: `project_fstg_local_path.md`)
   - If found → retain for file searches this session
   - **If not found** → ask: "What is the local repo path?" — **wait before continuing**
4. **Summarize in 3-5 lines**:
   - What it's about (business domain, context)
   - Current state: specs generated? code started? tests ready?
   - Next steps: clarifications needed, first actions
5. **Invoke `recall` if relevant**: if summary reveals key domain concepts or necessary references, invoke `recall` with these terms (max 3 keywords)
   - Invoke only if domain terms identified — don't do it routinely
6. **Project memory** (optional): query on ticket title to find historical work:
   ```bash
   uv run ~/.claude/semantic_search.py "<ticket title>" --top-k 2
   ```
   If results (similarity ≥ 0.45) → display at bottom of context summary:
   ```
   📎 Previous sessions on this topic:
   - [YYYY-MM-DD] — <session title> / <section_type>
   ```
   If Postgres/Ollama unreachable → non-blocking, display: `⚠️ Project memory unavailable (Postgres/Ollama down).`

### Case B: Vault note (knowledge, hobby, organization)

1. **Summarize in 2-3 lines**:
   - Subject and context
   - Current state (draft, structured, needs development)
2. **Load related notes**: read `[[]]` if essential
3. **Don't invoke `recall`** — not necessary for vault note

## Step 4 — Propose an entry point

### Dev Branch (Kanban Feature)

- Remind of TDD approach: "Start with tests?"
- Propose: "Need help with architecture, quick question, or go straight?"
- **Skills in reserve** — load only if Victor explicitly says:
  - "Show me the architecture / structure" → no skill (direct pair programming)
  - "What pattern to use?" → no skill (discussion + examples)
  - "Need skill [name]" → load the skill
  - "Go for it" → no skill, let Victor code

### Dev-Free Branch (Vault note)

Propose concrete action based on type:
- **Knowledge/concept**: "Want to deepen, link to other notes, or move to practice?"
- **Hobby**: "Start with [logical step] or [alternative]?"
- **Organization**: "Develop it, organize it, or discuss first?"

**Wait for Victor's response before loading skills or exploring other contexts.**

## Step 5 — Closure (when Victor announces "done" or "finished")

### Verifications adapted to type (Step 2)

**Kanban Feature**:
- Do tests pass without modification? (no post-dev adjustment)
- Does observable behavior match validated specs?
- Code pushed and ready for Kanban Done?

**Vault note (knowledge, hobby, organization)**:
- Is the note in the right hierarchical location?
- Links `[[]]` to existing notes created if relevant?
- Index in INDEX.md or MEMORY.md?

Present as:
```
✅ Before closure:
- [ ] [Verification 1]
- [ ] [Verification 2]
```

### Post-validation actions

Once Victor confirms "All good":

**Kanban Feature**:
→ "You can move the ticket to Done in the Kanban. ADR to create?" (if structuring decision)

**Vault note**:
→ "Index somewhere?" (INDEX.md, MEMORY.md, Skills/INDEX.md)

Confirm: "Closure validated ✓"

## Absolute rules

- **Skills in reserve**: load only if Victor explicitly asks ("show me", "what pattern", "need skill X"). Never by anticipation, never by inference of need.
- **Never modify vault, Kanban, or sources** without Victor's validation. Workon suggests actions, Victor executes.
- **Search Step 1: strict order** (exact → partial → glob fallback). No multi-source intelligence.
- **`recall` (Step 3)**: invoke only if summary identifies key domain terms — never systematically.
- **Edge case: missing README** (Case A, Step 3) — ask before continuing.
- **Edge case: broken/orphaned note** (Step 2) — signal and ask if we resume or search differently.
- **Explicit validations**: Step 1→2 (selection if multiple), Step 2→3 (if blocker), Step 3→4 (if note empty), Step 4→work (Victor's response).
- **No inference**: if "Start with tests?" gets "yeah", start. If silence, ask "what do you start with?"
