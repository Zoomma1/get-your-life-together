---
name: process
description: Give a URL → Claude fetches content and creates a structured note in 03 - Knowledge/ immediately. Use when Victor says "/process [url]" or "process this link", "capitalize this article/video". Bypasses inbox for immediate processing.
---

# Skill `/process`

Transforms an external link into a Knowledge note in the vault, without going through inbox or waiting for `/harvest`.

## Triggering

```
/process [url]
/process [url] --target [subfolder]
/process [url] --tag [custom-tag]
```

- Without `--target` → Claude chooses subfolder by domain
- Without `--tag` → Claude generates tags from content
- URL required — without URL, ask Victor to provide it
- If Victor cancels anytime (Ctrl+C) → stop immediately and signal cancellation

---

## Step 1 — Fetch and validate content

**Pre-validation:**
- Verify URL is well-formed (starts with `http://` or `https://`)
- Reject URLs: `localhost`, `127.0.0.1`, or local files (`file://`)
- If validation fails → signal "Invalid URL, retry with a public URL"

**Nominal fetch:**
Use `WebFetch` on validated URL.

**YouTube shortcut:**
For `youtu.be/ID` or parameter `?v=ID` → normalize to `https://www.youtube.com/watch?v=ID`.
WebFetch gets title + description (no transcript without YouTube API). Minimum 100 chars content required.

**Fetch failed (timeout, 4xx, 5xx, content < 100 chars):**
Propose to Victor in this order:

1. **n8n fallback** — if active:
   ```bash
   docker ps --filter name=n8n --filter status=running --format "{{.Names}}"
   ```
   If stopped, start and wait 3 seconds:
   ```bash
   docker start n8n && sleep 3
   ```
   Run webhook (include type detected in Step 2: `youtube`, `article`, `image`, etc.) :
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

2. **NotebookLM fallback** — if Victor accepts, present prompt tailored to detected type (see below) and let Victor copy-paste summary.

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

## Step 2 — Identify type and domain

From obtained content, determine:
- **Type** : `article`, `video`, `forum`, `doc`, `podcast`
- **Domain** : see table below

**Domain → destination subfolder mapping:**

| Domain detected | Destination subfolder |
|-----------------|------------------------|
| Claude Code, LLM, prompt engineering, MCP, AI agents | `03 - Knowledge/Claude code/` |
| Dev, code, architecture, patterns, frameworks, dev tools | `03 - Knowledge/Dev/` |
| General AI, ML, models, AI research | `03 - Knowledge/IA/` |
| Business, product, startup, management, strategy | `03 - Knowledge/Business/` |
| Travel, places, culture | `03 - Knowledge/Travel/` |
| Warhammer, painting, figurines | `02 - Hobbies/Warhammer/` |
| Other / unclassifiable | `03 - Knowledge/` (root) |

If `--target` provided → use path directly. Create folder if needed (`mkdir -p`). Accept any valid path under `03 - Knowledge/` or `02 - Hobbies/`.

---

## Step 3 — Check for duplicates

List existing files in target subfolder.

If similar note already exists:
→ Present to Victor: "Existing note found: [[note-name]]. Create anyway or enrich existing?"
→ Wait for response before continuing.

---

## Step 4 — Create the note

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
[1-sentence summary]

## Key points
- ...

## Use case with my workflow
- ...

## See also
- [[existing-note]] — [reason in one sentence]
```

**Filling:**
- `tags` : domain + 2-4 keywords from content. If `--tag [custom]` → add at end of list (accept as-is)
- `## Key points` : 3-7 bullets, factual
- `## Use case with my workflow` : concrete links (FSTG, vault, projects) — omit if no obvious link
- `## See also` : search for related notes in vault. At least 1 link if relevant exists, otherwise omit this section.

**Content validation:**
- Minimum 100 chars useful content (title + summary)
- Otherwise → signal "Insufficient content" and propose NotebookLM

---

## Step 5 — Announce result

**Success — note created:**
```
✅ Note created : 03 - Knowledge/[subfolder]/[slug].md
→ Type : [type]
→ Tags : [tags]
→ See also : [[note-1]], [[note-2]] (if found)
```

**Success definition:**
- File created and written to disk
- Valid frontmatter (date, source, tags, status)
- Minimum content: title + 1-sentence summary + at least 3 key points
- Custom tag (if `--tag` provided) present in frontmatter

**Failure cases:**
- [Duplicate detected] → signal and ask confirmation before overwriting
- [Insufficient content] → propose NotebookLM or manual enrichment
- [Fetch failed] → signal error with reason (timeout, 404, etc.) and propose NotebookLM

---

## Absolute rules

- **Never create without fetched content** — don't generate from URL alone
- **Never overwrite existing note** — ask confirmation if duplicate
- **Valid destinations only** — use domain → subfolder mapping
- **Slug from title** — never from URL
- **Explicit fallbacks** — signal failure and propose options (n8n or NotebookLM)
- **Warhammer → Hobbies** — never in Knowledge
- **Pair-programming** — wait for Victor validation at critical points (duplicate, fallback, cancellation)
