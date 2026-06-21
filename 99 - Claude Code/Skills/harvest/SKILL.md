---
name: harvest
description: Scan the daily notes to extract ideas to capitalize on and links to process. Use when the user says "harvest", "do the harvest", "scan my notes", or when /harvest is late in the command-tracker, or at the end of a session if daily notes have been mentioned.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet is mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips down narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill : Vault Harvest

This skill transforms daily notes into structured capital. After validation by {USER_NAME}, Claude Code creates notes and tickets directly into the vault via MCP.

## Triggering

- the user says "harvest", "do the harvest", "scan my notes"
- {USER_NAME} specifies a period: "harvest of the week" (last completed Monday-Sunday), "harvest since last Monday", "harvest of the last 3 days"
- Without specification → propose "last 7 days" and wait for validation (do not apply by default)

**Mandatory period confirmation before reading** : whether the period is specified by {USER_NAME} OR inferred by default, **always display the resolved window** (`from YYYY-MM-DD to YYYY-MM-DD — N daily notes`) and **wait for explicit OK** before launching reads. Pattern to avoid: starting the read immediately based on an ambiguous date (e.g.: "since Monday" → which week?). If the last daily note is earlier than the supposed start date, signal the discrepancy and propose the actual window.

## Vault structure — valid destinations

| Type of content | Destination |
|----------------|-------------|
| Personal reflection, life idea | `01 - Me/` |
| [Hobby], technical notes | `02 - Hobbies/[Hobby]/` |
| Guitar, music | `02 - Hobbies/Guitar/` |
| 3D Printing | `02 - Hobbies/3D Printing/` |
| Concept dev, pattern, tool | `03 - Knowledge/Dev/` |
| Tool, plugin, Claude Code practice / AI ecosystem | `03 - Knowledge/Claude code/` |
| Travel notes, places | `03 - Knowledge/Travel/` |
| Other general knowledge | `03 - Knowledge/` |
| Future project idea (tech to learn, personal need, SaaS idea) | `04 - Projects/Project ideas/` |
| Unclassifiable idea, pending filing | `09 - Inbox/` |
| Claude Code skill to create or update | `99 - Claude Code/Skills/` — **only for active skill files, not for knowledge notes** |
| Reflection on Claude/vault architecture | `99 - Claude Code/` or `09 - Inbox/` |
| Completed note to archive (ticket Done, spec completed) | `Archive/` — see ADR-003 |

**Never suggest a folder that doesn't exist in this list.**

## Active projects — source of truth

Read `04 - Projects/INDEX.md` at the beginning of each harvest to know the active projects and their Kanbans. If an identified task concerns a project listed → create the ticket in the **Idea** column of the corresponding Kanban. If the project is not in the INDEX → flag the unknown project for Step 4 (do not create the ticket before {USER_NAME} validation).

Universal Kanban structure: `Idea → Ready → WIP → Done` (Blocked column available for tickets blocked by external dependency)

**Special Kanbans :**
- `Claude Code Kanban` — Single Kanban for all tasks without a specific project: daily life, vault/Claude Code, skills, ADR, workflows. Ticket notes go in `09 - Inbox/tickets/`.

**Hobby WIP Limit** : In Step 1 Group A, count WIP tickets by type (`#warhammer`, `#guitar`, `#3d`, `#jdr`) in `02 - Hobbies/Hobby Kanban.md`. If a type reaches 2 WIP, signal to {USER_NAME} in Step 4. Never create a hobby ticket directly in WIP if the limit is reached — create in Backlog or Ready instead.

## Links — permanent rule

Read `99 - Claude Code/treated-links.md` at the beginning of each harvest. Never re-propose a URL listed in this file. Ignore only the exact URLs listed — not entire domains.

**If a URL is in treated-links but mentioned again in recent daily notes** : ignore it (do not refetch). If the context suggests changed content (e.g.: updated version, link shared for a different reason), ask {USER_NAME} if it's a voluntary re-submission before processing it.

---

## Step 1 — Read context

**Group A — References (parallel reads, independent of period)**

Launch these four reads in parallel — they do not depend on daily notes:
1. Read `99 - Claude Code/treated-links.md` → retrieve list of already processed URLs
2. List existing titles in `01 - Me/`, `09 - Inbox/`, `99 - Claude Code/Skills/` → to deduplicate future ideas
3. Read `04 - Projects/INDEX.md` → identify active projects and their Kanbans
4. Read `02 - Hobbies/Hobby Kanban.md` (if exists) → count WIP tickets by type: `#warhammer`, `#guitar`, `#3d`, `#jdr` → store counters (used in step 4)

**Group A Fallback** : If `Hobby Kanban.md` doesn't exist → store empty counters (ignore WIP alert in step 4).

**Group B — Period confirmation + daily notes content (sequential after Group A)**

1. **Confirm the period with {USER_NAME}** (unless already specified at triggering):
   - Propose: "week" (last completed calendar Monday-Sunday) / "X last days" / "since date Y (exact)"
   - If {USER_NAME} accepts "last 7 days" by default → apply without delay
   - If {USER_NAME} specifies a period → apply it
2. **Once period is confirmed, read in parallel** :
   - All daily notes of the period in `00 - Daily notes/` → extract ideas, tasks, URLs, images, signals
   - Corresponding sessions in `99 - Claude Code/Sessions/` → capture decisions and undocumented tasks
   - `data/mood-tracker-data.json` (if exists) → filter entries where `dateTime` falls in period → store in `MOOD_PERIOD`

**Group B Fallback** : If `mood-tracker-data.json` doesn't exist or is invalid JSON → `MOOD_PERIOD = []` (mood section omitted in step 4). If no daily note found → signal and stop. If a daily note has no explicit date → treat it as being from the day of the filename (e.g.: `2026-04-06.md` → date = 2026-04-06).

**Deduplication rule** : Never propose an idea or note whose subject already exists in the vault (verify via Group A results).


---

## Step 2 — Detect ideas, tasks and signals

Scan the content to identify:
- A subject mentioned 2+ distinct times over the period **that doesn't already exist in the vault** (e.g.: same idea in 2 different daily notes)
- A technique, tool, concept noted in passing
- A personal reflection that recurs
- An intention formulated but not followed by action
- A task related to an active project (whose name appears in `04 - Projects/INDEX.md`)
- **Unknown project identified** : If a task targets a project NOT listed in INDEX.md, flag it for Step 4 (do not create the ticket before {USER_NAME} validation)
- **True negative signals only** : explicit stress, exhaustion, bad patch, isolation, shortened nights, general loss of desire — never signal positive or ambiguous mentions (e.g.: "I sleep less but feel good" is NOT an alert signal)
- **Work patterns** : if a trend emerges over the period (systematically low energy certain days, more productive sessions at certain times, recurring disruptors, new ritual) → propose an enrichment of the "Work mode and energy" section in `01 - Me/{USER_NAME}.md` — never write directly in it, always propose to {USER_NAME}

Categorize each signal:
- **Ideas to capitalize** → create a note in the vault
- **Project tasks** → create a ticket in the Kanban of the concerned project (Idea column)
- **Vault/Claude Code tasks** → ticket in `Claude Code Kanban` (Idea column)
- **Negative alert signals** → propose an update to `01 - Me/Alert signals.md` — never write directly in it
- **Unknown projects** → list in Step 4 presentation (do not create without {USER_NAME} validation)

## Step 3 — Process links and images

### Embedded images

Detect all `![[filename.ext]]` in daily notes of the period (extensions: png, jpg, jpeg, gif, webp).

For each detected image:
1. Find the file in the vault — search in `Ressources/Attachements/` first, then recursive glob if not found
2. Verify if the n8n container is running:
   ```bash
   docker ps --filter name=n8n --filter status=running --format "{{.Names}}"
   ```
3. If empty → start:
   ```bash
   docker start n8n
   ```
   Wait 3-5 seconds.
4. Read the image in base64 and call the webhook:
   - **Windows (PowerShell)** :
     ```powershell
     $bytes = [System.IO.File]::ReadAllBytes("{VAULT_PATH}\Ressources\Attachements\[filename]")
     $b64 = [Convert]::ToBase64String($bytes)
     $body = @{ type = "image"; filename = "[filename]"; mediaType = "image/[ext]"; data = $b64 } | ConvertTo-Json -Depth 3
     Invoke-WebRequest -Uri "http://100.75.159.73:5678/webhook/fallback-link" -Method POST -ContentType "application/json" -Body $body
     ```
   - **macOS/Linux (bash)** :
     ```bash
     B64=$(base64 -w0 "/Me/Tha vault/Ressources/Attachements/[filename]")
     curl -s -X POST http://100.75.159.73:5678/webhook/fallback-link \
       -H "Content-Type: application/json" \
       -d "{\"type\": \"image\", \"filename\": \"[filename]\", \"mediaType\": \"image/[ext]\", \"data\": \"$B64\"}"
     ```

5. n8n returns `{ title, content }` → create a note in the appropriate destination based on the context of the daily note
6. Stop the container after processing all images:
   ```bash
   docker stop n8n
   ```

**mediaType** : `image/png` for `.png`, `image/jpeg` for `.jpg`/`.jpeg`, `image/gif` for `.gif`, `image/webp` for `.webp`

If the file is not found in the vault → signal to {USER_NAME}, do not block the rest of the harvest.

### URLs

Detect all URLs in daily notes of the period, except exact URLs already processed in memory.

**Delegate the fetch of each URL to a dedicated agent** — 1 agent per URL, all launched in parallel. Systematically include the following instructions in each agent prompt:
1. **defuddle first** : fetch `https://defuddle.md/<url>` via WebFetch → if valid response (clean markdown, > 100 chars) → use this content and the defuddle frontmatter (`title`, `author`, `site`) for metadata
2. **WebFetch Fallback** : if defuddle fails (error, auth page, SPA, < 100 chars) → fetch the original URL via WebFetch
3. **n8n Fallback** : if WebFetch fails → verify that the N100 is reachable: `curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://100.75.159.73:5678/` — if not-200 → ⚠️ N100 down, skip fallback. Otherwise call `http://100.75.159.73:5678/webhook/fallback-link` with `{ url, type: "youtube" | "article" }` → return the `{ title, content }` received
4. An agent in failure does not block others — signal the failed URL in the final summary

### Nominal case — successful fetch
```
🔗 [url]
→ Content retrieved ✓
→ Suggested destination : [path]
→ Generated summary (see below)
```

### Fallback case — failed fetch
For YouTube URLs in short format (`youtu.be/ID`) : automatically retry with `https://www.youtube.com/watch?v=ID` before declaring fallback.

If still inaccessible, attempt automatic fallback via n8n:

1. Verify that the N100 is reachable:
   ```bash
   curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://100.75.159.73:5678/
   ```
   If not-200 → ⚠️ N100 down — signal to {USER_NAME} and proceed to NotebookLM fallback.
2. Determine the type: `youtube` if the URL contains `youtube.com` or `youtu.be`, otherwise `article`
3. Call the webhook:
   ```bash
   curl -s -X POST http://100.75.159.73:5678/webhook/fallback-link \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"[URL]\", \"type\": \"[type]\"}"
   ```
4. If n8n returns `{ title, content }` → create the note directly, no need for NotebookLM prompt
5. If n8n fails or timeout (connection refused, 500, etc.) → propose NotebookLM fallback below

If n8n fails or timeout, propose a NotebookLM fallback:

**NotebookLM Fallback — [hobby] Video / tutorial :**
```
Summarize this video by listing: the painting techniques mentioned, 
the paints and colors used with their role (base, wash, layer, etc.), 
the steps in order, and practical advice. Be factual and concise.
```

**NotebookLM Fallback — Tech / dev / tool Video :**
```
Summarize this video by listing: the problem solved, the tools or concepts 
presented, the key steps, and important points to remember for 
a developer. Be factual and concise.
```

**NotebookLM Fallback — General / podcast Video :**
```
Summarize this video/podcast covering: the main subject, the key ideas 
in order, notable examples or demonstrations, and conclusions 
or recommendations. Be factual and concise.
```

Present the link pending fallback:
```
🔗 [url]
→ Access blocked / no transcript available / n8n in error
→ Proposed fallback: [adapted NotebookLM prompt]
→ {USER_NAME} can: provide an HTML export, paste content, or ignore the link
→ Pending validation to create the note
```

If {USER_NAME} doesn't provide content, ignore the link and list it as unprocessed in the final summary.

## Step 4 — Grouped validation

Present a complete summary. **Priority presentation order: tickets and evolution leads first, Knowledge notes next.** The primary goal of harvest is to detect action opportunities, not to produce encyclopedic notes.

```
## Harvest [period]

### Tickets to create
- [ ] [Task 1] → [Project] Kanban — Idea column
- [ ] [Task 2] → Claude Code Kanban — Idea column

### Ideas to capitalize
- [ ] [Idea 1] → [destination]
- [ ] [Idea 2] → [destination]

### ⚠️ Unknown projects identified
> Omit if no unknown project found.
- [Task X] mentions "[Project Name]" — absent from INDEX.md. Validate that you want me to add this ticket or create the project first?

### 🌤️ Mood of the week
> Omit if `MOOD_PERIOD` contains less than 3 entries.
- Average rating: [X.X/5] ([icon: 😀 ≥4, 🙂 3-3.9, 😐 2-2.9, 😔 <2])
- Dominant emotions: [top 3-5 most frequent emotions with count]

### Alert signals detected
- [ ] "[exact excerpt from daily note]" → propose addition to [[Alert signals]]

### ⚠️ Hobby WIP Limits
> Omit this section if no type reaches 2 WIP.
- ⚠️ You already have 2 [#type] in WIP — think about prioritizing or moving a project to Backlog before starting a new one.

### Images to process
- [ ] ![[image1.png]] → vision OK → [destination]
- [ ] ![[image2.jpg]] → file not found

### Links to process
- [ ] [url 1] → fetch OK → [destination]
- [ ] [url 2] → fallback needed
- [ ] [url 3] → not processed (ignored)

Validate all / indicate what you want to ignore / provide missing fallbacks.
```

**Wait for {USER_NAME} validation on Step 4 (summary) before creating anything.**

## Step 5 — Creation via MCP and linking

Only for elements validated by {USER_NAME}.

**Prerequisite** : Verify vault access before creating — attempt a test read on `04 - Projects/INDEX.md` (already read in Step 1). If the read fails, signal to {USER_NAME} that MCP is unavailable and list the exact content to create manually.

**Create validated files and tickets directly by {USER_NAME}** — launch creations without additional confirmation requests. MCP calls are atomic per file. Signal creation errors explicitly.

For each ticket to create, apply the `create-ticket` skill — it handles the note file AND insertion in the kanban. For each Knowledge note, create the file via Write or MCP as appropriate (no intermediate request to {USER_NAME}).

**After creation**, update related existing notes via parallel agents:

For each newly created note (Knowledge notes only, not tickets), launch 1 background agent in parallel:
- Input: slug of the new note + tags + title keywords (2-4 terms)
- The agent applies recall logic: scan `03 - Knowledge/` recursive — scoring title=3, content=2, backlink=2, threshold ≥ 2, max 3 candidate notes
- For each candidate note, the agent prepares:
  - **A)** `[[slug-new-note]] — [reason]` to add in `## See also`
  - **B)** 1 bullet to add in the most relevant section of the body
- The agent returns its proposals (or nothing if score < 2)

Wait for all agents to complete. Aggregate and deduplicate (an existing note can be a candidate of multiple new notes). Present to {USER_NAME} for validation:
```
📎 Proposed updates for existing notes :
- [[existing-note-1]] ← [[new-note-A]] :
  → See also : [[new-note-A]] — [reason]
  → Body (section "## Key points") : "- [bullet]"
```

**These proposals are only suggestions** — apply only after {USER_NAME} validation. If no candidate found for a note → pass silently.

Also propose links between the new notes themselves if they are related — after {USER_NAME} validation.

### Structure of a technique note (hobby)
```markdown
---
date: YYYY-MM-DD
source: [url or "daily note YYYY-MM-DD"]
tags: [warhammer, painting, technique]
---

# [Name of technique]

## Key points
- ...

## Paints mentioned
- ...

## Personal notes
> [what {USER_NAME} added in their daily note]
```

### Structure of a concept note (Knowledge)
```markdown
---
date: YYYY-MM-DD
source: [url or "daily note YYYY-MM-DD"]
tags: [dev, concept]
---

# [Name of concept]

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
[What was identified in the daily note]
```

## Step 6 — Finalization and tracker

After creation of all files and tickets (including {USER_NAME} validation) :

1. **Update `treated-links.md`** : Add processed or ignored URLs to the existing list:
   ```markdown
   - [url] — source: daily YYYY-MM-DD, status: created / ignored / fallback-needed
   ```
   
2. **Update the command-tracker** : 
   - Open `99 - Claude Code/command-tracker.md`
   - Line `/harvest` → replace the date with today's date in `YYYY-MM-DD` format

3. **Final summary** : Display the number of notes created, tickets created, links processed, and signal pending items (NotebookLM fallbacks, missing images, etc.)

## Absolute rules

- **Never create without validation** — wait for {USER_NAME} response on Step 4 (summary)
- **Never modify daily notes** — they remain as-is
- **Never write to `Alert signals.md` directly** — always propose to {USER_NAME}
- **Create via MCP without additional request** — creations follow Step 4 validation
- **Valid destinations only** — use the vault structure table above
- **Explicit fallback** — if a link is inaccessible, say so clearly and wait
- **One note = one idea** — do not merge two subjects in the same note
- **treated-links.md** — updated in Step 6 with processed or ignored links
- **Never re-propose existing content** — check CLAUDE.md and vault before proposing
- **Claude Code Kanban** — create a ticket here for all personal/vault tasks without associated project. Notes in `09 - Inbox/tickets/`, never directly in `09 - Inbox/`
- **Hobby Kanban WIP** — never create in WIP if limit is reached. Create in Backlog or Ready instead and signal to {USER_NAME}
- **Unknown projects** — flag in Step 4 (do not create the ticket before {USER_NAME} validation)
- **Graceful fallback** — if `mood-tracker-data.json` or `Hobby Kanban.md` don't exist, continue without these data (section omitted)
