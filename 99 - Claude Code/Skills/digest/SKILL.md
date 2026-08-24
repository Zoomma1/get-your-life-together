---
name: digest
description: "Fetch the sources configured in digest-sources.md and write a condensed summary in the daily note. Recommended workflow: run in the evening with /closeday in a dedicated session — the digest writes to tomorrow's daily note (created with the template if it doesn't exist yet). Trigger when the user says \"/digest\", \"digest\", \"digest tech\", \"give me the news\", \"daily watch\", \"do the digest\". DO NOT run in the same session as /today (9 parallel agents = ~70% of the 5h quota)."
---

# Skill `/digest`

Generates a watchlist summary (8-10 items max) from configured sources and inserts it into today's daily note, before the plan section.

## Triggering

```
/digest                  → all configured categories
/digest [category]       → single category only (ex: /digest Finance, /digest Tech)
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

**If the file exists** → extract the defined categories and sources. Each section `## [Category] [emoji]` defines a category. Each line ` - [Name] | [URL] | [fetch prompt]` defines a source in that category.

**If the file is missing** → use the default sources:

| Category | Emoji | Name | URL | Fetch prompt |
|----------|-------|------|-----|--------------|
| Tech & Dev | 🛠️ | Hacker News | `https://news.ycombinator.com/` | "List the titles of the top 15 stories with their score, the complete article URL (not the HN link, the external URL) and the source domain" |
| Tech & Dev | 🛠️ | Dev.to | `https://dev.to/` | "List the trending articles: title, author, tags, summary in 1 sentence" |
| AI & Claude | 🤖 | Anthropic news | `https://www.anthropic.com/news` | "List the latest publications: title, date, summary in 1 sentence" |

Store sources in `SOURCES` (list) and categories in `CATEGORIES` (ordered, deduplicated list).

**If variant called** (`/digest [category]`) → filter `SOURCES` to keep only sources whose category matches (case-insensitive).

---

## Step 2a — Calculate target date and locate the daily note

**Target date** (calculate first):
- If `hour >= 17:00` → `target_date = today + 1 day` (preparation for tomorrow morning)
- Otherwise → `target_date = today`

Build the path according to `DATE_FORMAT` and `NOTES_FOLDER` with `target_date`.

**If the note exists** → continue to Step 2b.

**If the note does not exist** → create it with the daily note template (`Ressources/Templates/Daily notes template.md`), replacing Templater variables with calculated values for `target_date`:
- `tp.date.now("YYYY-MM-DD")` → ISO date of `target_date`
- `tp.date.now("YYYY")` → year
- `tp.date.now("MMMM")` → month in letters (French)
- `tp.date.now("WW")` → ISO week number
- `tp.date.now("dddd DD MMMM YYYY")` → ex: `Saturday 25 April 2026`

Leave `energy`, `score`, `work_hours`, `personal_hours`, `hobby_hours` empty (frontmatter). Then continue to Step 2b.

## Step 2b — Check if digest already exists

Open the daily note and check for the presence of a `## 📰 Digest` section:

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
1. Build the defuddle URL: `https://defuddle.md/<source_url>`
2. Fetch via WebFetch → if valid response (clean markdown, > 100 chars) → use that content
3. Otherwise → fallback WebFetch on the original URL

> ⚠️ **Do not launch all defuddle calls in parallel.** Fetch in **batches of 5 maximum**, one batch at a time. `defuddle.md` rate-limits: on 2026-07-28, 18 fetches launched at once produced **9 consecutive HTTP 429s** — the fallback WebFetch direct, which should only remain a safety net, became the nominal path for half the sources. The fallback does not compensate: it returns less clean content (CSS/JS, navigation), which then triggers the WebSearch fallback in cascade. If 429s persist despite batching → switch to **strict sequential** on defuddle.

### If a fetch fails

```
[Source] is inaccessible (timeout/error).

Option A: Continue with available sources
Option B: Rerun the digest later
```

**Wait for explicit response** (A or B):
- If A → continue, add at bottom of digest: `*[Source] inaccessible today*`
- If B → stop

### If content is not usable — `curl` raw first, WebSearch as last resort

After each successful fetch (defuddle or WebFetch), evaluate if the content is usable:

- **Not usable**: content mostly CSS/JS (many `{`, `}`, CSS properties, `--` variables), empty page, or model response indicating no articles
- **Usable**: natural text with titles, dates, or identifiable article summaries

**If not usable → 1. `curl` the raw resource BEFORE anything else (mandatory):**

```bash
curl -s -m 25 -L -A "Mozilla/5.0" <source_url> -o <scratchpad>/src.html -w "http=%{http_code} bytes=%{size_download}\n"
```

Then **count what is really there** (`wc -c`, `grep -c` on the site's article URL pattern). An extractor's verdict is about **its own failure**, never the state of the source. Three outcomes:

| `curl` result | What it means | Action |
|---|---|---|
| **200 + content present** | Extractor failed, not the source | Parse the HTML directly (titles + `href`), then `WebFetch` the 2-3 retained articles for date + summary. **Do not degrade to WebSearch.** |
| **4xx / 5xx stable** | URL dead or blocked — not a today incident | Signal with exact code + propose the patch to `digest-sources.md`. Never report as "inaccessible today". |
| **200 but truly empty** (JS-rendered) | Source renders nothing without JS | Only then fallback to WebSearch below |

**2. Fallback WebSearch — last resort only:**
1. Extract the domain from the source URL (ex: `hugodecrypte.kessel.media`)
2. Launch WebSearch with query `site:[domain]`
3. Apply the original fetch prompt on WebSearch results
4. **Check the date of each result before summarizing** — WebSearch readily returns articles several months old without flagging it. Any undated result or > 7d old is discarded, not summarized.
5. If WebSearch also returns zero valid articles → treat as inaccessible (Option A/B above)

No message to {USER_NAME} during fallback — the source is treated normally in the digest.

> ⚠️ **Root cause (2026-08-04)**: Warhammer Community classified as "non-extractible content" based on defuddle (metadata only on home **and** on `/news/`), then WebSearch fallback which returned articles from **June** presented as fresh — the 🎲 anchor section almost got dropped for nothing. `curl` showed **HTTP 200, 392 KB, 19 articles from today**, including the Rumour Engine dated that day: the source was healthy all along. The same `curl` requalified two other verdicts from the run: Changelog wasn't in intermittent 502 but in **stable 404** (dead URL), and Baeldung didn't have "a page without dates" but a **Cloudflare 403**. Three conclusions on three were false, all drawn from the symptom rendered by the extractor.

### ⚠️ Never pair title and date by index — verify the date on the article URL

When parsing a listing page produces **two separate lists** (one of titles, one of dates), they may not be aligned: these are two independent extractions from the same HTML, and nothing guarantees they have the same length or order. Pairing `titles[i]` with `dates[i]` then produces an item **dated wrongly**, without any error — the title is true, the date is true, the association is false.

**The action**: whenever a date is used to decide (filter < 48h / < 7d, dedup, "fresh" or not), take it **from the article itself** — `WebFetch` on its URL — not from the listing page's index.

**Recognizable signal**: a **future** or inconsistent date in the extracted list ("Sep 2026" on Aug 11). This is not a display artifact, it's proof that the two lists have slid relative to each other.

> ⚠️ **Root cause (2026-08-11)**: on InfoQ, title and date come from independent HTML lists; index-based cross-reference produced future dates, caught only because they were absurd. A false but *plausible* date would have passed. ⚠️ **Affects all 5 InfoQ sources** in `digest-sources.md` — Java, Angular, React, TypeScript, DevOps — not just the one where this appeared.

---

## Step 4 — Deduplication against the last 7 days

Before any selection, exclude what {USER_NAME} has already seen. A digest that repeats yesterday's item wastes their attention — watchlist value is the increment, not the reminder.

1. Read the `## 📰 Digest` blocks from daily notes of the **last 7 days** (`target_date - 1` to `target_date - 7`, files `{NOTES_FOLDER}/<date>.md` per `DATE_FORMAT`). Daily note missing or without digest → skip that day, not blocking.
2. Build `SEEN` = the set of already-appeared items: retain the URL **and** the subject (normalized title / main entity).
3. Any candidate whose URL is in `SEEN`, **or** which covers the same topic as an item in `SEEN` (same release, same incident, same announcement — not just a shared keyword), is excluded before Step 5.

A logical sequence is allowed (ex: "v2.0 RC" yesterday → "v2.0 stable" today = real evolution, not a duplicate). The criterion is: *Does {USER_NAME} learn something new?*

---

## Step 5 — Select and synthesize

Selection happens in two tiers. The point of `/digest` is not to pile up links: it's to guarantee {USER_NAME}'s core watchlist daily, and to add tech ecosystems **only when it's worth it**.

### Tier 1 — Anchor sections (always present)

`Tech & Dev 🛠️`, `News & Hobby 🎲`, `News & Personal 📰` are sections {USER_NAME} reads every day. They are **never evicted** by language sections: aim for **1 to 2 items each**, provided their source is accessible (otherwise note inaccessibility at bottom, cf. Step 3). If `/digest [category]` filters on a single category, this anchor rule does not apply — respect the filter.

### Tier 2 — Language / ecosystem sections (strict quality sort)

`Java`, `Rust`, `Spring Boot`, `Angular`, `React`, `TypeScript`, `DevOps`: **0 or 1 item per section**, never padding. Include an item only if it's truly worth the detour for someone coding in that stack. A section with no strong signal that day is **omitted entirely** (no orphaned heading). Better 3 solid language sections than 7 lukewarm ones.

### Quality criteria (apply to both tiers)

| Include | Exclude |
|---------|---------|
| Major releases (v2.0, model release, breaking change) | Clickbait ("10 tips", "you won't believe") |
| Learning patterns (architecture, best practice, post-mortem) | Pure marketing, promotional content |
| Significant debates (500+ HN score, 100+ comments) | Articles > 7 days old |
| Major news in the source's domain | Duplicates (already filtered Step 4) |

### Volume safeguard

**`CAP_TOTAL` = 8 to 10 items maximum, all tiers combined.** Beyond 10, {USER_NAME} does not read — selection becomes counter-productive. If valid candidates exceed 10 after quality sort: keep 1-2 anchor items per section, then fill with strongest language items up to `CAP_TOTAL`. Going below 8 is acceptable if few items pass the filter; never pad to reach 8.

---

## Step 6 — Format the digest

Build one section per category in `CATEGORIES`, in the order of `digest-sources.md` (or default order if missing):

```markdown
## 📰 Digest — DD/MM/YYYY

### [emoji] [Category]
- **[Title](url)** — [summary 1-2 sentences] — *[source]*

### [emoji] [Category 2]
- **[Title](url)** — [summary 1-2 sentences] — *[source]*
```

Rules:
- Title in bold with clickable link, factual summary (1-2 sentences), source in italics
- Omit a category entirely if no items retained (no orphaned headings)
- If single category filtered (`/digest [category]`) → single section

---

## Step 7 — Insert into daily note

Locate the insertion point **in order of preference**:
1. Just **before** `## 📅 Plan for today`
2. If missing, just **after** the first `---`
3. If no `---`, after the YAML frontmatter block

Insert the complete digest block. Confirm:

```
✅ Digest inserted into the daily note for YYYY-MM-DD
→ [N] items — [categories used]
```

---

## Step 8 — Research intel (automatic)

After confirming digest insertion, execute the `/research-scout` skill:
read `99 - Claude Code/Skills/research-scout.md` and execute its steps.

Non-blocking: if /research-scout finds nothing or {USER_NAME} skips everything, the digest is already done — no further action.

---

## Absolute rules

- **Never overwrite** existing content — only insert the digest block
- **Zero autonomous action on blockers** — always propose A/B and wait for explicit response
- **Anchor sections non-evictable** — Tech & Dev / News & Hobby / News & Personal present at each run if source accessible; language sections never replace them
- **`CAP_TOTAL` = 8-10 items max**, never beyond — quality > quantity; going below 8 is OK, padding to reach 8 is not
- **7-day deduplication mandatory** — no item already appeared (URL or same topic) in digests from the last 7 days
- **Language sections: 0-1 item, omitted if weak signal** — never forced padding
- **Factual only** — no opinion, no personal interpretation
- **Links mandatory** — each item as markdown `[Title](url)`
- **If no valid items** → Option A (insert empty digest with note) / Option B (cancel)
