---
name: digest
description: "Fetches the monitoring sources configured in digest-sources.md and writes a condensed summary in the daily note. Recommended workflow: run in the evening with /closeday in a dedicated session — the digest is written in the daily note for the next day (created with the template if it doesn't exist yet). Trigger when the user says \"/digest\", \"digest\", \"digest tech\", \"give me the news\", \"day's watch\", \"do the digest\". DO NOT run in the same session as /today (9 parallel agents = ~70% of 5h quota)."
---

# Skill `/digest`

Generates a monitoring summary (8-10 items max) from configured sources and inserts it in today's daily note, before the plan section.

## Triggering

```
/digest                  → all configured categories
/digest [category]       → a single category (ex: /digest Finance, /digest Tech)
```

**Explicit invocation only** — no search for "active project context".

---

## Step 0 — Load vault parameters

Read `99 - Claude Code/config/vault-settings.md` to extract:
- `date_format` — date format for daily notes (default: `YYYY-MM-DD`)
- `daily_notes_folder` — folder for daily notes (default: `00 - Daily notes`)

Store in `DATE_FORMAT` and `NOTES_FOLDER`. Use these values everywhere a date or daily note path is needed.

---

## Step 1 — Load sources

Read `99 - Claude Code/config/digest-sources.md`.

**If the file exists** → extract defined categories and sources. Each section `## [Category] [emoji]` defines a category. Each line ` - [Name] | [URL] | [fetch prompt]` defines a source in that category.

**If the file is missing** → use default sources:

| Category | Emoji | Name | URL | Fetch prompt |
|----------|-------|------|-----|--------------|
| Tech & Dev | 🛠️ | Hacker News | `https://news.ycombinator.com/` | "List the titles of the first 15 stories with their score, the full article URL (not the HN link, the external URL) and the source domain" |
| Tech & Dev | 🛠️ | Dev.to | `https://dev.to/` | "List trending articles: title, author, tags, summary in 1 sentence" |
| IA & Claude | 🤖 | Anthropic news | `https://www.anthropic.com/news` | "List latest publications: title, date, summary in 1 sentence" |

Store sources in `SOURCES` (list) and categories in `CATEGORIES` (ordered list, deduplicated).

**If variant is called** (`/digest [category]`) → filter `SOURCES` to keep only sources whose category matches (case-insensitive).

---

## Step 2a — Calculate target date and locate the daily note

**Target date** (calculate first):
- If `hour >= 17:00` → `target_date = today + 1 day` (preparation for tomorrow morning)
- Otherwise → `target_date = today`

Build the path according to `DATE_FORMAT` and `NOTES_FOLDER` with `target_date`.

**If the note exists** → continue to Step 2b.

**If the note does not exist** → create it with the daily note template (`Ressources/Templates/Daily notes template.md`), replacing Templater variables with values calculated for `target_date`:
- `tp.date.now("YYYY-MM-DD")` → ISO date of `target_date`
- `tp.date.now("YYYY")` → year
- `tp.date.now("MMMM")` → month in letters (French)
- `tp.date.now("WW")` → ISO week number
- `tp.date.now("dddd DD MMMM YYYY")` → ex: `Saturday 25 April 2026`

Leave `energy`, `score`, `work_hours`, `personal_hours`, `hobby_hours` empty (frontmatter). Then continue to Step 2b.

## Step 2b — Check if digest already exists

Open the daily note and check for a `## 📰 Digest` section:

- If not → continue to Step 3
- If yes → **stop and propose in chat**:
  ```
  A digest already exists for YYYY-MM-DD.

  Option A: Replace it
  Option B: Cancel
  ```
  **Wait for explicit response** (A or B).

---

## Step 3 — Fetch sources

For each source in `SOURCES`, fetch with defuddle first:
1. Build the defuddle URL: `https://defuddle.md/<url_source>`
2. Fetch via WebFetch → if valid response (clean markdown, > 100 chars) → use this content
3. Otherwise → fallback WebFetch on the original URL

> ⚠️ **Do not launch all defuddles in parallel.** Fetch in **batches of 5 maximum**, one batch at a time. `defuddle.md` rate-limits: on 2026-07-28, 18 fetches launched at once produced **9 consecutive HTTP 429s** — the fallback WebFetch direct, which should only be a safety net, became the nominal path for half the sources. The fallback doesn't compensate: it returns less clean content (CSS/JS, navigation), which then triggers the fallback WebSearch in cascade. If 429s persist despite batching → switch to **strict sequential** on defuddle.

### If a fetch fails

```
[Source] is inaccessible (timeout/error).

Option A: Continue with available sources
Option B: Run digest again later
```

**Wait for explicit response** (A or B):
- If A → continue, add at bottom of digest: `*[Source] inaccessible today*`
- If B → stop

### If content is not exploitable — `curl` raw first, WebSearch last resort

After each successful fetch (defuddle or WebFetch), evaluate if content is exploitable:

- **Not exploitable**: content mostly CSS/JS (many `{`, `}`, CSS properties, `--` variables), empty page, or model response indicating absence of articles
- **Exploitable**: natural text with titles, dates, or identifiable article summaries

**If not exploitable → 1. `curl` the raw resource BEFORE anything else (mandatory):**

```bash
curl -s -m 25 -L -A "Mozilla/5.0" <url_source> -o <scratchpad>/src.html -w "http=%{http_code} bytes=%{size_download}\n"
```

Then **count what's actually there** (`wc -c`, `grep -c` on the site's article URL pattern). An extractor's verdict is about **its own failure**, never about the source's state. Three outcomes:

| `curl` result | What it means | Action |
|---|---|---|
| **200 + content present** | Extractor failed, not the source | Parse HTML directly (titles + `href`), then `WebFetch` on 2-3 selected articles for date + summary. **Do not degrade to WebSearch.** |
| **4xx / 5xx stable** | URL dead or blocked — not today's incident | Report with exact code + propose `digest-sources.md` patch. Never report as "inaccessible today". |
| **200 but actually empty** (JS-rendered) | Source renders nothing without JS | Only then, fallback WebSearch below |

**2. Fallback WebSearch — last resort only:**
1. Extract domain from source URL (ex: `hugodecrypte.kessel.media`)
2. Launch WebSearch with query `site:[domain]`
3. Apply original fetch prompt to WebSearch results
4. **Check date of each result before summarizing** — WebSearch readily returns articles months old without noting it. Any undated result or > 7d is discarded, not summarized.
5. If WebSearch also returns zero valid articles → treat as inaccessible (Option A/B above)

No message to {USER_NAME} during fallback — the source is processed normally in the digest.

> ⚠️ **Root cause (2026-08-04)**: Warhammer Community classified as "non-extractible content" based on defuddle (metadata only on home **and** on `/news/`), then WebSearch fallback which returned articles from **June** presented as fresh — the 🎲 anchor section nearly dropped for nothing. The `curl` showed **HTTP 200, 392 KB, 19 articles from today**, including the Rumour Engine dated today: the source was sound from the start. The same `curl` requalified two other verdicts from the run: Changelog wasn't in intermittent 502 but **stable 404** (dead URL), and Baeldung didn't have "a page without dates" but a **403 Cloudflare**. Three conclusions out of three were wrong, all derived from the symptom rendered by the extractor.

---

## Step 4 — Deduplication against last 7 days

Before any selection, exclude what {USER_NAME} has already seen. A digest that repeats yesterday's item wastes their attention — a monitoring's value is the increment, not the reminder.

1. Read the `## 📰 Digest` blocks from daily notes of the **last 7 days** (`target_date - 1` to `target_date - 7`, files `{NOTES_FOLDER}/<date>.md` per `DATE_FORMAT`). Missing daily note or no digest → ignore that day, non-blocking.
2. Build `SEEN` = set of already-published items: retain both the URL **and** the subject (normalized title / main entity).
3. Any candidate whose URL is in `SEEN`, **or** which covers the same subject as an item in `SEEN` (same release, same incident, same announcement — not just a common keyword), is excluded before Step 5.

A logical sequence is allowed (ex: "v2.0 RC" yesterday → "v2.0 stable" today = real evolution, not duplicate). The criterion is: *Does {USER_NAME} learn something new?*

---

## Step 5 — Select and synthesize

Selection happens at two levels. The point of `/digest` is not to pile up links: it's to guarantee {USER_NAME}'s daily monitoring core, and add tech ecosystems **only when it's worth it**.

### Level 1 — Anchor sections (always present)

`Tech & Dev 🛠️`, `News & Hobby 🎲`, `News & Personal 📰` are sections {USER_NAME} reads every day. They are **never evicted** by language sections: aim for **1 to 2 items each**, provided their source is accessible (otherwise note of inaccessibility at bottom, cf. Step 3). If `/digest [category]` filters to a single category, this anchor rule doesn't apply — respect the filter.

### Level 2 — Language / ecosystem sections (strict quality sort)

`Java`, `Rust`, `Spring Boot`, `Angular`, `React`, `TypeScript`, `DevOps`: **0 or 1 item per section**, never filler. Include an item only if it's truly worth a detour for someone coding in that stack. A section with no strong signal today is **omitted entirely** (no orphan title). Better 3 solid language sections than 7 lukewarm.

### Quality criteria (apply to both levels)

| Include | Exclude |
|---------|---------|
| Major releases (v2.0, model release, breaking change) | Clickbait ("10 tips", "you won't believe") |
| Learning patterns (architecture, best practice, post-mortem) | Pure marketing, promotional content |
| Significant debates (500+ HN score, 100+ comments) | Articles > 7 days |
| Major news in source's domain | Duplicates (already filtered Step 4) |

### Volume safeguard

**`CAP_TOTAL` = 8 to 10 items maximum, all levels combined.** Beyond 10, {USER_NAME} doesn't read — selection becomes counterproductive. If valid candidates exceed 10 after quality sort: keep 1-2 anchor items per section, then fill with strongest language items up to `CAP_TOTAL`. Going under 8 is acceptable if few items pass the sort; never inflate to reach 8.

---

## Step 6 — Format the digest

Build one section per category in `CATEGORIES`, in order of `digest-sources.md` (or default order if missing):

```markdown
## 📰 Digest — DD/MM/YYYY

### [emoji] [Category]
- **[Title](url)** — [summary 1-2 sentences] — *[source]*

### [emoji] [Category 2]
- **[Title](url)** — [summary 1-2 sentences] — *[source]*
```

Rules:
- Title bold with clickable link, factual summary (1-2 sentences), source in italics
- Omit entirely a category if no item retained (no orphan title)
- If only one category filtered (`/digest [category]`) → one section only

---

## Step 7 — Insert into daily note

Locate insertion point **in order of preference**:
1. Just **before** `## 📅 Plan du jour`
2. If missing, just **after** the first `---`
3. If no `---`, after YAML frontmatter block

Insert full digest block. Confirm:

```
✅ Digest inserted in daily note for YYYY-MM-DD
→ [N] items — [categories used]
```

---

## Step 8 — Research intel (automatic)

After confirming digest insertion, execute `/research-scout` skill:
read `99 - Claude Code/Skills/research-scout.md` and execute its steps.

Non-blocking: if /research-scout finds nothing or {USER_NAME} skips everything, digest is already complete — no further action.

---

## Absolute rules

- **Never overwrite** existing content — only insert digest block
- **Zero autonomous action on blockers** — always propose A/B and wait for explicit response
- **Anchor sections non-evictable** — Tech & Dev / News & Hobby / News & Personal present at each run if source accessible; language sections never replace them
- **`CAP_TOTAL` = 8-10 items max**, never beyond — quality > quantity; going under 8 is OK, inflating to reach 8 is not
- **7-day deduplication mandatory** — no item already published (URL or same subject) in digests from last 7 days
- **Language sections: 0-1 item, omitted if signal weak** — never forced filler
- **Factual only** — no opinion, no personal interpretation
- **Links mandatory** — each item in markdown `[Title](url)`
- **If no valid item** → Option A (insert empty digest with note) / Option B (cancel)
