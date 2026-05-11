---
name: process
description: Give a URL → Claude fetches the content and creates a structured note in 03 - Knowledge/ immediately. Use when the user says "/process [url]" or "process this link", "capitalize this article/video". Bypasses harvest for immediate processing.
---

# Skill `/process`

Transforms an external link into a Knowledge note in the vault, without going through inbox or waiting for `/harvest`.

## Triggering

```
/process [url]
/process [url] --target [subfolder]
/process [url] --tag [custom-tag]
```

- Without `--target` → Claude chooses the subfolder based on domain
- Without `--tag` → Claude generates tags from content
- URL required — without URL, ask {USER_NAME} to provide it
- If {USER_NAME} cancels at any time (Ctrl+C) → stop immediately and signal the cancellation

---

## Step 1 — Content Retrieval and Validation

**Pre-validation:**
- Verify the URL is well-formed (starts with `http://` or `https://`)
- Reject `localhost`, `127.0.0.1`, or local file (`file://`) URLs
- If validation fails → signal "Invalid URL, try again with a public URL"

**Nominal fetch — defuddle first:**
1. Build the defuddle URL: `https://defuddle.md/<original_url>`
2. Fetch via WebFetch
3. If valid response (clean markdown, > 100 chars) → use defuddle content. Retrieve defuddle frontmatter (`title`, `author`, `site`, `word_count`) to pre-fill note metadata.
4. If invalid response (error, auth page, JS SPA, < 100 chars) → fallback to classic WebFetch on original URL

**YouTube case:**
For shortcut `youtu.be/ID` or parameter `?v=ID` → normalize to `https://www.youtube.com/watch?v=ID`.
WebFetch retrieves title + description (no transcript without YouTube API). Minimum 100 characters of content required.

**Fetch failed (timeout, 4xx, 5xx, content < 100 chars):**
Propose to {USER_NAME} in this order:

1. **Fallback n8n** — if active:
   ```bash
   docker ps --filter name=n8n --filter status=running --format "{{.Names}}"
   ```
   If stopped, start and wait 3 seconds:
   ```bash
   docker start n8n && sleep 3
   ```
   Launch the webhook (include detected type from Step 2: `youtube`, `article`, `image`, etc.):
   ```bash
   curl -s -X POST {N8N_WEBHOOK_URL}/webhook/fallback-link \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"[URL]\", \"type\": \"[type]\"}"
   ```
   Parse response: if `{ "title": "...", "content": "..." }` with content >= 100 chars → continue.
   Otherwise → propose NotebookLM. Stop n8n after use:
   ```bash
   docker stop n8n
   ```

2. **Fallback NotebookLM** — if {USER_NAME} accepts, present the prompt adapted to detected type (see below) and let {USER_NAME} copy-paste the summary.

**NotebookLM prompts:**

Article/doc:
```
Summarize this content: the problem/topic, concepts/tools, key points, conclusions.
Be factual and concise.
```

Tech/dev video:
```
Summarize: problem solved, tools/concepts, key steps, important points for a dev.
Be factual and concise.
```

Warhammer/painting video:
```
Summarize: techniques mentioned, paints/colors (base, wash, layer, etc.),
steps in order, practical tips. Be factual and concise.
```

---

## Step 2 — Identify Type and Domain

From the content obtained, determine:
- **Type**: `article`, `video`, `forum`, `doc`, `podcast`
- **Domain**: see table below

**Domain mapping → destination subfolder:**

| Detected domain | Destination subfolder |
|----------------|--------------------------|
| Claude Code, LLM, prompt engineering, MCP, AI agents | `03 - Knowledge/Claude code/` |
| Dev, code, architecture, patterns, frameworks, dev tools | `03 - Knowledge/Dev/` |
| General AI, ML, models, AI research | `03 - Knowledge/IA/` |
| Business, product, startup, management, strategy | `03 - Knowledge/Business/` |
| Travel, places, culture | `03 - Knowledge/Travel/` |
| Warhammer, painting, miniatures | `02 - Hobbies/Warhammer/` |
| Other / unclassifiable | `03 - Knowledge/` (root) |

If `--target` provided → use that path directly. Create the folder if it doesn't exist (`mkdir -p`). Accept any valid path under `03 - Knowledge/` or `02 - Hobbies/`.

---

## Step 3 — Check for Duplicates

List existing files in target subfolder.

If a similar note already exists:
→ Present to {USER_NAME}: "Existing note found: [[note-name]]. Create anyway or enrich the existing one?"
→ Wait for their answer before continuing.

---

## Step 4 — Create the Note

Generate slug from title (kebab-case, lowercase, no accents, max 5-6 words).

Create `03 - Knowledge/[subfolder]/[slug].md`:

```markdown
---
date: YYYY-MM-DD
source: [url]
tags: [domain, keywords]
status: new
---

# [Title]

## In one sentence
[Summary in 1 sentence]

## Key points
- ...

## Use case with my workflow
- ...

## See also
- [[existing-note]] — [reason in one sentence]
```

**Filling in:**
- `tags`: domain + 2-4 content keywords. If `--tag [custom]` → add at end of list (accept as-is)
- `## Key points`: 3-7 bullets, factual
- `## Use case with my workflow`: concrete links (FSTG, vault, projects) — omit if no obvious link
- `## See also`: search for linked notes in vault. At least 1 link if relevant exists, otherwise omit this section.

**Content validation:**
- Minimum 100 characters of useful content (title + summary)
- Otherwise → signal "Insufficient content" and propose NotebookLM

---

## Step 5 — Announce the Result

**Success — note created:**
```
✅ Note created: 03 - Knowledge/[subfolder]/[slug].md
→ Type: [type]
→ Tags: [tags]
→ See also: [[note-1]], [[note-2]] (if found)
```

**Definition of success:**
- File created and written to disk
- Valid frontmatter (date, source, tags, status)
- Minimum content: title + 1-sentence summary + at least 3 key points
- Custom tag (if `--tag` provided) present in frontmatter

**Failure cases:**
- [Duplicate detected] → signal and ask for confirmation before overwriting
- [Insufficient content] → propose NotebookLM or manual enrichment
- [Fetch failed] → signal the error with reason (timeout, 404, etc.) and propose NotebookLM

---

## Absolute Rules

- **Never create without retrieved content** — don't generate from URL alone
- **Never overwrite existing note** — ask for confirmation if duplicate
- **Valid destinations only** — use domain → subfolder mapping
- **Slug from title** — never from URL
- **Explicit fallbacks** — signal failure and propose options (n8n or NotebookLM)
- **Warhammer → Hobbies** — never in Knowledge
- **Pair-programming** — wait for {USER_NAME} validation at critical points (duplicate, fallback, cancellation)
