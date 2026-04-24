---
name: digest
description: Fetches monitoring sources configured in digest-sources.md (default sources if not configured: Hacker News, Anthropic, Dev.to) and writes a condensed summary to today's daily note before the plan section. Trigger when Victor says "/digest", "digest", "digest tech", "give me the news", "today's monitoring", "do the digest", or before `/today` at the start of the day to integrate monitoring into the plan.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **narrative qualitative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips out narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill `/digest`

Generates a monitoring summary (5-8 articles) from configured sources and inserts it into today's daily note, before the plan section.

## Triggering

```
/digest                  → all configured categories
/digest [category]      → single category only (ex: /digest Finance, /digest Tech)
```

**Explicit invocation only** — no search for "active project context".

---

## Step 0 — Load vault parameters

Read `99 - Claude Code/config/vault-settings.md` to extract:
- `date_format` — date format for daily notes (default: `YYYY-MM-DD`)
- `daily_notes_folder` — folder for daily notes (default: `00 - Daily notes`)

Store in `DATE_FORMAT` and `NOTES_FOLDER`. Use these values wherever a date or daily note path is needed.

---

## Step 1 — Load sources

Read `99 - Claude Code/config/digest-sources.md`.

**If the file exists** → extract defined categories and sources. Each section `## [Category] [emoji]` defines a category. Each line ` - [Name] | [URL] | [fetch prompt]` defines a source in that category.

**If the file is missing** → use default sources:

| Category | Emoji | Name | URL | Fetch prompt |
|----------|-------|------|-----|--------------|
| Tech & Dev | 🛠️ | Hacker News | `https://news.ycombinator.com/` | "List the titles of the first 15 stories with their score, the full URL of the article (not the HN link, the external URL) and the source domain" |
| Tech & Dev | 🛠️ | Dev.to | `https://dev.to/` | "List trending articles: title, author, tags, 1-sentence summary" |
| AI & Claude | 🤖 | Anthropic news | `https://www.anthropic.com/news` | "List latest publications: title, date, 1-sentence summary" |

Store sources in `SOURCES` (list) and categories in `CATEGORIES` (ordered list, deduplicated).

**If variant called** (`/digest [category]`) → filter `SOURCES` to keep only sources whose category matches (case insensitive).

---

## Step 2a — Locate the daily note

Today's date → construct the path according to `DATE_FORMAT` and `NOTES_FOLDER`:
- `YYYY-MM-DD` → `[NOTES_FOLDER]/2026-04-11.md`
- `DD-MM-YYYY` → `[NOTES_FOLDER]/11-04-2026.md`

- If the note exists → continue to Step 2b
- If it does not exist → present the digest in the chat: *"Your daily note doesn't exist yet — here's the digest, create the note with `/today` to integrate it."*

## Step 2b — Check if digest already exists

Open the daily note and check for a `## 📰 Digest` section:

- If no → continue to Step 3
- If yes → **stop and propose in chat**:
  ```
  A digest already exists for YYYY-MM-DD.

  Option A: Replace it
  Option B: Cancel
  ```
  **Wait for explicit response** (A or B).

---

## Step 3 — Fetch sources

Fetch all sources from `SOURCES` in parallel, each with its defined fetch prompt.

### If a fetch fails

```
[Source] is inaccessible (timeout/error).

Option A: Continue with available sources
Option B: Restart the digest later
```

**Wait for explicit response** (A or B):
- If A → continue, add at the bottom of the digest: `*[Source] inaccessible today*`
- If B → stop

### If content is unusable — fallback to WebSearch

After each successful fetch, evaluate if the content is usable:

- **Not usable**: content mostly CSS/JS (many `{`, `}`, CSS properties, `--` variables), empty page, or model response indicating no articles
- **Usable**: natural text with titles, dates, or identifiable article summaries

**If not usable → automatic fallback (silent):**
1. Extract domain from source URL (ex: `hugodecrypte.kessel.media`)
2. Launch WebSearch with query `site:[domain]`
3. Apply original fetch prompt to WebSearch results
4. If WebSearch also returns zero articles → treat as inaccessible (Option A/B above)

No message to Victor during fallback — the source is processed normally in the digest.

---

## Step 4 — Select and synthesize

From retrieved content, select **5 to 8 items in total**:

**Quality criteria (always apply):**
| Include | Exclude |
|---------|---------|
| Major releases (v2.0, model release, breaking change) | Clickbait ("10 tips", "you won't believe") |
| Learning patterns (architecture, best practice) | Pure marketing, promotional content |
| Significant debates (500+ HN score, 100+ comments) | Articles > 7 days old |
| Major news in the source's domain | Duplicates (same topic 2x) |

**Target distribution**: balance across configured categories — if 2 categories → ~50/50, if 3 → ~33/33/33. Adjust based on availability.

---

## Step 5 — Format the digest

Build a section per category in `CATEGORIES`, in the order of `digest-sources.md` (or default order if missing):

```markdown
## 📰 Digest — DD/MM/YYYY

### [emoji] [Category]
- **[Title](url)** — [1-2 sentence summary] — *[source]*

### [emoji] [Category 2]
- **[Title](url)** — [1-2 sentence summary] — *[source]*
```

Rules:
- Title in bold with clickable link, factual summary (1-2 sentences), source in italics
- Omit an entire category if no items retained (no orphaned title)
- If single filtered category (`/digest [category]`) → single section

---

## Step 6 — Insert into the daily note

Locate the insertion point **in order of preference**:
1. Just **before** `## 📅 Plan of the day`
2. If missing, just **after** the first `---`
3. If no `---`, after the YAML frontmatter block

Insert the complete digest block. Confirm:

```
✅ Digest inserted into daily note of YYYY-MM-DD
→ [N] items — [categories used]
```

---

## Step 7 — Research intel (automatic)

After confirming digest insertion, execute the `/research-scout` skill:
read `99 - Claude Code/Skills/research-scout.md` and execute its steps.

Non-blocking: if /research-scout finds nothing or Victor skips everything, the digest is already complete — no further action needed.

---

## Absolute rules

- **Never overwrite** existing content — only insert the digest block
- **Zero autonomous action on blockers** — always propose A/B and wait for explicit response
- **5-8 items max** — quality > quantity; OK if < 5 valid items
- **Factual only** — no opinion, no personal interpretation
- **Mandatory links** — each item as markdown `[Title](url)`
- **If no valid items** → Option A (insert empty digest with note) / Option B (cancel)
