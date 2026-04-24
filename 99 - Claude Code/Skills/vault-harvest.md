---
name: vault-harvest
description: Scan daily notes to extract ideas to capitalize and links to process. Use when Victor says "harvest", "do the harvest", "scan my notes", or when /harvest is overdue in command-tracker, or at session end if daily notes were mentioned.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected from aggressive optimization**
>
> This skill produces **narrative qualitative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). The preservation of qualitative content takes priority over line reduction.

# Skill : Vault Harvest

This skill transforms daily notes into structured capital. After Victor's validation, Claude Code creates notes and tickets directly in the vault via MCP.

## Trigger

- Victor says "harvest", "do the harvest", "scan my notes"
- Victor specifies a period : "harvest of the week" (last completed Monday-Sunday), "harvest since last Monday", "harvest of last 3 days"
- Without specification → propose "last 7 days" and wait for validation (don't apply by default)

## Vault structure — valid destinations

| Content type | Destination |
|----------------|-------------|
| Personal reflection, life idea | `01 - Me/` |
| Warhammer, painting, technique | `02 - Hobbies/Warhammer/` |
| Guitar, music | `02 - Hobbies/Guitar/` |
| 3D printing | `02 - Hobbies/3D Printing/` |
| Dev concept, pattern, tool | `03 - Knowledge/Dev/` |
| Tool, plugin, Claude Code practice / IA ecosystem | `03 - Knowledge/Claude code/` |
| Travel notes, places | `03 - Knowledge/Travel/` |
| Other general knowledge | `03 - Knowledge/` |
| Future project idea (tech to learn, personal need, SaaS idea) | `04 - Projects/Project ideas/` |
| Unclassifiable idea, awaiting filing | `09 - Inbox/` |
| Claude Code skill to create or update | `99 - Claude Code/Skills/` — **only for active skill files, not knowledge notes** |
| Reflection on Claude/vault architecture | `99 - Claude Code/` or `09 - Inbox/` |
| Completed note to archive (Done ticket, spec completed) | `Archive/` — see ADR-003 |

**Never suggest a folder not in this list.**

## Active projects — source of truth

Read `04 - Projects/INDEX.md` at the start of each harvest to know active projects and their Kanbans. If an identified task concerns a listed project → create the ticket in the **Idea** column of the corresponding Kanban. If the project is not in the INDEX → flag unknown project for Step 4 (don't create ticket before Victor's validation).

Universal Kanban structure : `Idea → Ready → WIP → Done` (optional `Blocked` column for externally blocked tickets)

**Special kanbans :**
- `Claude Code Kanban` — unique kanban for all non-project tasks : daily life, vault/Claude Code, skills, ADR, workflows. Ticket notes go in `09 - Inbox/tickets/`, never in `09 - Inbox/` directly.

**Hobby WIP limit** : In Step 1 Group A, count WIP tickets by type (`#warhammer`, `#guitar`, `#3d`, `#jdr`) in `02 - Hobbies/Hobby Kanban.md`. If a type reaches 2 WIP, signal to Victor in Step 4. Never create hobby ticket directly in WIP if limit is reached — create in Backlog or Ready instead.

## Links — permanent rule

Read `99 - Claude Code/treated-links.md` at the start of each harvest. Never re-propose a URL listed in this file. Ignore only exact URLs listed — not entire domains.

**If a URL is in treated-links but mentioned again in recent daily notes** : ignore it (don't refetch). If context suggests changed content (ex: updated version, link shared for different reason), ask Victor if it's intentional re-proposal before processing.

---

## Step 1 — Read context

**Group A — References (parallel reads, independent of period)**

Launch these four reads in parallel — they don't depend on daily notes :
1. Read `99 - Claude Code/treated-links.md` → get list of already-processed URLs
2. List existing titles in `01 - Me/`, `09 - Inbox/`, `99 - Claude Code/Skills/` → to deduplicate future ideas
3. Read `04 - Projects/INDEX.md` → identify active projects and their Kanbans
4. Read `02 - Hobbies/Hobby Kanban.md` (if exists) → count WIP tickets by type : `#warhammer`, `#guitar`, `#3d`, `#jdr` → store counters (used in step 4)

**Group A fallback** : If `Hobby Kanban.md` doesn't exist → store empty counters (omit WIP alert in step 4).

**Group B — Period confirmation + daily note content (sequential after Group A)**

1. **Confirm period with Victor** (unless already specified at trigger) :
   - Propose : "week" (last completed Monday-Sunday) / "X last days" / "since date Y (exact)"
   - If Victor accepts "last 7 days" by default → apply immediately
   - If Victor specifies a period → apply it
2. **Once period confirmed, read in parallel** :
   - All daily notes from period in `00 - Daily notes/` → extract ideas, tasks, URLs, images, signals
   - Corresponding sessions in `99 - Claude Code/Sessions/` → capture decisions and undocumented tasks
   - `data/mood-tracker-data.json` (if exists) → filter entries whose `dateTime` falls in period → store in `MOOD_PERIOD`

**Group B fallback** : If `mood-tracker-data.json` doesn't exist or is invalid JSON → `MOOD_PERIOD = []` (mood section omitted in step 4). If no daily notes found → signal and stop. If a daily note has no explicit date → treat it as being from the date in filename (ex: `2026-04-06.md` → date = 2026-04-06).

**Deduplication rule** : Never propose an idea or note whose subject already exists in the vault (verify via Group A results).

---

## Step 2 — Detect ideas, tasks and signals

Scan content to identify :
- A subject mentioned 2+ distinct times over the period **that doesn't already exist in vault** (ex: same idea in 2 different daily notes)
- A technique, tool, concept noted in passing
- A personal reflection that recurs
- An intention expressed but not followed by action
- A task related to an active project (whose name appears in `04 - Projects/INDEX.md`)
- **Unknown project identified** : If a task targets a project NOT listed in INDEX.md, flag it for Step 4 (don't create ticket before Victor's validation)
- **True negative signals only** : explicit stress, exhaustion, rough patch, isolation, shortened nights, general loss of interest — never signal positive or ambiguous mentions (ex: "I sleep less but feel good" is NOT an alert)
- **Work patterns** : if a trend emerges over the period (systematically low energy certain days, more productive sessions at certain times, recurring blockers, new ritual) → propose an enrichment of "Work mode and energy" section in `{PERSONAL_FOLDER}/{USER_NAME}.md` — never write directly, always propose to Victor

Categorize each signal :
- **Ideas to capitalize** → create a note in the vault
- **Project tasks** → create a ticket in the concerned project's Kanban (Idea column)
- **Vault/Claude Code tasks** → ticket in `Claude Code Kanban` (Idea column)
- **Negative alert signals** → propose update to `01 - Me/Alert signals.md` — never write directly
- **Unknown projects** → list in Step 4 presentation (don't create ticket before Victor's validation)

## Step 3 — Process links and images

### Embedded images

Detect all `![[filename.ext]]` in daily notes from the period (extensions : png, jpg, jpeg, gif, webp).

For each detected image :
1. Find file in vault — search `Ressources/Attachements/` first, then recursive glob if not found
2. Check if n8n container is running :
   ```bash
   docker ps --filter name=n8n --filter status=running --format "{{.Names}}"
   ```
3. If empty → start :
   ```bash
   docker start n8n
   ```
   Wait 3-5 seconds.
4. Read image as base64 and call webhook :
   - **Windows (PowerShell)** :
     ```powershell
     $bytes = [System.IO.File]::ReadAllBytes("{VAULT_PATH}\Ressources\Attachements\[filename]")
     $b64 = [Convert]::ToBase64String($bytes)
     $body = @{ type = "image"; filename = "[filename]"; mediaType = "image/[ext]"; data = $b64 } | ConvertTo-Json -Depth 3
     Invoke-WebRequest -Uri "{N8N_WEBHOOK_URL}/webhook/fallback-link" -Method POST -ContentType "application/json" -Body $body
     ```
   - **macOS/Linux (bash)** :
     ```bash
     B64=$(base64 -w0 "/Me/Tha vault/Ressources/Attachements/[filename]")
     curl -s -X POST {N8N_WEBHOOK_URL}/webhook/fallback-link \
       -H "Content-Type: application/json" \
       -d "{\"type\": \"image\", \"filename\": \"[filename]\", \"mediaType\": \"image/[ext]\", \"data\": \"$B64\"}"
     ```

5. n8n returns `{ title, content }` → create note in appropriate destination based on daily note context
6. Stop container after processing all images :
   ```bash
   docker stop n8n
   ```

**mediaType** : `image/png` for `.png`, `image/jpeg` for `.jpg`/`.jpeg`, `image/gif` for `.gif`, `image/webp` for `.webp`

If file not found in vault → signal to Victor, don't block rest of harvest.

### URLs

Detect all URLs in daily notes from the period, except exact URLs already processed in memory.

**Delegate each URL fetch to a dedicated agent** — 1 agent per URL, all launched in parallel. Always include fallback n8n instructions in each agent prompt :
- On WebFetch failure : call `{N8N_WEBHOOK_URL}/webhook/fallback-link` with `{ url, type: "youtube" | "article" }`
- Check n8n running first (`docker ps --filter name=n8n`), start if needed (`docker start n8n`)
- Return `{ title, content }` received from n8n rather than inferring via WebSearch
- One agent failure doesn't block others — signal failed URL in final summary

### Nominal case — fetch succeeded
```
🔗 [url]
→ Content retrieved ✓
→ Suggested destination : [path]
→ Summary generated (see below)
```

### Fallback case — fetch failed
For short YouTube URLs (`youtu.be/ID`) : automatically retry with `https://www.youtube.com/watch?v=ID` before declaring fallback.

If still inaccessible, attempt automatic fallback via n8n :

1. Check if n8n container is running :
   ```bash
   docker ps --filter name=n8n --filter status=running --format "{{.Names}}"
   ```
2. If empty (not running) → start container :
   ```bash
   docker start n8n
   ```
   Wait 3-5 seconds for webhook to be ready.
3. Determine type : `youtube` if URL contains `youtube.com` or `youtu.be`, else `article`
4. Call webhook :
   ```bash
   curl -s -X POST {N8N_WEBHOOK_URL}/webhook/fallback-link \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"[URL]\", \"type\": \"[type]\"}"
   ```
5. If n8n returns `{ title, content }` → create note directly, no need for NotebookLM prompt
6. Always stop container after use (even on error) :
   ```bash
   docker stop n8n
   ```
7. If n8n fails or timeout (connection refused, 500, etc.) → propose NotebookLM fallback below

If n8n fails or timeout, propose NotebookLM fallback :

**Fallback NotebookLM — Warhammer / painting video :**
```
Summarize this video by listing : painting techniques mentioned, 
paints and colors used with their role (base, wash, layer, etc.), 
steps in order, and practical tips. Be factual and concise.
```

**Fallback NotebookLM — Tech / dev / tool video :**
```
Summarize this video by listing : the problem solved, tools or 
concepts presented, key steps, and important points to remember 
for a developer. Be factual and concise.
```

**Fallback NotebookLM — General / podcast video :**
```
Summarize this video/podcast covering : main topic, key ideas 
in order, notable examples or demonstrations, and conclusions 
or recommendations. Be factual and concise.
```

Present link awaiting fallback :
```
🔗 [url]
→ Access blocked / no transcript available / n8n error
→ Fallback proposed : [NotebookLM prompt adapted]
→ Victor can : provide HTML export, paste content, or skip link
→ Awaiting validation to create note
```

If Victor doesn't provide content, skip link and list it as unprocessed in final summary.

## Step 4 — Grouped validation

Present complete summary :

```
## Harvest [period]

### Ideas to capitalize
- [ ] [Idea 1] → [destination]
- [ ] [Idea 2] → [destination]

### Tickets to create
- [ ] [Task 1] → Kanban [Project] — Idea column
- [ ] [Task 2] → Claude Code Kanban — Idea column

### ⚠️ Unknown projects identified
> Omit if no unknown projects found.
- [Task X] mentions "[Project name]" — absent from INDEX.md. Confirm you want me to add this ticket or create the project first?

### 🌤️ Mood for the week
> Omit if `MOOD_PERIOD` has fewer than 3 entries.
- Average rating : [X.X/5] ([icon : 😀 ≥4, 🙂 3-3.9, 😐 2-2.9, 😔 <2])
- Dominant emotions : [top 3-5 most frequent with counts]

### Alert signals detected
- [ ] "[exact excerpt from daily note]" → propose addition to [[Alert signals]]

### ⚠️ Hobby WIP limits
> Omit this section if no type reaches 2 WIP.
- ⚠️ You already have 2 [#type] in WIP — consider prioritizing or moving a project to Backlog before starting a new one.

### Images to process
- [ ] ![[image1.png]] → vision OK → [destination]
- [ ] ![[image2.jpg]] → file not found

### Links to process
- [ ] [url 1] → fetch OK → [destination]
- [ ] [url 2] → fallback needed
- [ ] [url 3] → unprocessed (ignored)

Validate all / indicate what you want to skip / provide missing fallbacks.
```

**Wait for Victor's validation on Step 4 (summary) before creating anything.**

## Step 5 — Creation via MCP and linking

Only for elements validated by Victor.

**Prerequisite** : Verify vault access before creating — attempt test read on `04 - Projects/INDEX.md` (already read in Step 1). If read fails, signal to Victor that MCP is unavailable and list exact content to create manually.

**Create validated files and tickets directly** — launch creations without new confirmation request. MCP calls are atomic per file. Explicitly signal creation errors.

For each ticket to create, apply the `create-ticket` skill — it handles both note file AND kanban insertion. For each Knowledge note, create file via Write or MCP depending on context (no intermediate request to Victor).

**After creation**, update linked existing notes via parallel agents :

For each newly created note (Knowledge notes only, not tickets), launch 1 background agent in parallel :
- Input : new note slug + tags + title keywords (2-4 terms)
- Agent applies recall logic : scan `03 - Knowledge/` recursively — scoring title=3, content=2, backlink=2, threshold ≥ 2, max 3 candidate notes
- For each candidate note, agent prepares :
  - **A)** `[[new-note-slug]] — [reason]` to add in `## See also`
  - **B)** 1 bullet to add in most pertinent section of body
- Agent returns proposals (or nothing if score < 2)

Wait for all agents to complete. Aggregate and deduplicate (one existing note may be candidate of several new notes). Present to Victor for validation :
```
📎 Proposed updates to existing notes :
- [[existing-note-1]] ← [[new-note-A]] :
  → See also : [[new-note-A]] — [reason]
  → Body (section "## Key points") : "- [bullet]"
```

**These proposals are suggestions only** — apply only after Victor's validation. If no candidate found for a note → pass silently.

Also propose links between new notes themselves if related — after Victor's validation.

### Structure of a technique note (Warhammer)
```markdown
---
date: YYYY-MM-DD
source: [url or "daily note YYYY-MM-DD"]
tags: [warhammer, painting, technique]
---

# [Technique name]

## Key points
- ...

## Paints mentioned
- ...

## Personal notes
> [what Victor added in daily note]
```

### Structure of a concept note (Knowledge)
```markdown
---
date: YYYY-MM-DD
source: [url or "daily note YYYY-MM-DD"]
tags: [dev, concept]
---

# [Concept name]

## In one sentence
...

## Key points
- ...

## Link with my projects
- ...
```

### Structure of an Inbox note (unclassifiable idea)
```markdown
---
date: YYYY-MM-DD
source: daily note YYYY-MM-DD
tags: [inbox]
---

# [Idea title]

## Context
> [exact excerpt from daily note]

## To explore
...
```

### Structure of a Kanban ticket
```markdown
---
title: [Ticket title]
date: YYYY-MM-DD
type: 💡
status: Idea
project: [Project name]
source: harvest YYYY-MM-DD
---

## Description
[What was identified in daily note]
```

## Step 6 — Finalization and tracker

After creation of all files and tickets (Victor's validation included) :

1. **Update `treated-links.md`** : Add processed or ignored URLs to existing list :
   ```markdown
   - [url] — source: daily YYYY-MM-DD, status: created / ignored / fallback-needed
   ```
   
2. **Update command-tracker** : 
   - Open `99 - Claude Code/command-tracker.md`
   - Line `/harvest` → replace date with today's date in format `YYYY-MM-DD`

3. **Final summary** : Display count of notes created, tickets created, links processed, and signal pending items (NotebookLM fallbacks, missing images, etc.)

## Absolute rules

- **Never create without validation** — wait for Victor's response on Step 4 (summary)
- **Never modify daily notes** — they stay as-is
- **Never write to `Alert signals.md` directly** — always propose to Victor
- **Create via MCP without additional request** — creations follow Step 4 validation
- **Valid destinations only** — use vault structure table above
- **Explicit fallback** — if link inaccessible, say so clearly and wait
- **One note = one idea** — don't merge two subjects in same note
- **treated-links.md** — updated in Step 6 with processed or ignored links
- **Never re-propose existing** — verify CLAUDE.md and vault before proposing
- **Claude Code Kanban** — create ticket here for all personal/vault tasks without associated project. Notes in `09 - Inbox/tickets/`, never in `09 - Inbox/` directly
- **Hobby Kanban WIP** — never create in WIP if limit reached. Create in Backlog or Ready instead and signal to Victor
- **Unknown projects** — flag in Step 4 (don't create ticket before Victor's validation)
- **Graceful fallback** — if `mood-tracker-data.json` or `Hobby Kanban.md` don't exist, continue without these data (section omitted)
