---
name: digest
description: "Fetch configured sources from digest-sources.md and write a condensed summary in the daily note. Recommended workflow: run at evening with /closeday in a dedicated session — the digest writes to the next day's daily note (created with template if it doesn't exist yet). Trigger when the user says \"/digest\", \"digest\", \"digest tech\", \"give me the news\", \"daily briefing\", \"run the digest\". DO NOT run in the same session as /today (9 parallel agents = ~70% of 5h quota)."
---

# Skill `/digest`

Generates a briefing summary (8-10 items max) from configured sources and inserts it in today's daily note, before the plan section.

## Trigger

```
/digest                  → all configured categories
/digest [category]       → single category (ex: /digest Finance, /digest Tech)
```

**Explicit invocation only** — no "active project context" search.

---

## Step 0 — Load vault parameters

Read `99 - Claude Code/config/vault-settings.md` to extract:
- `date_format` — date format for daily notes (default: `YYYY-MM-DD`)
- `daily_notes_folder` — folder for daily notes (default: `00 - Daily notes`)

Store in `DATE_FORMAT` and `NOTES_FOLDER`. Use these values everywhere a date or daily note path is needed.

---

## Step 1 — Load sources

Read `99 - Claude Code/config/digest-sources.md`.

**If the file exists** → extract defined categories and sources. Each `## [Category] [emoji]` section defines a category. Each line ` - [Name] | [URL] | [fetch prompt]` defines a source in this category.

**If the file is missing** → use default sources:

| Category | Emoji | Name | URL | Fetch prompt |
|----------|-------|------|-----|----------------|
| Tech & Dev | 🛠️ | Hacker News | `https://news.ycombinator.com/` | "List the titles of the first 15 stories with their score, the complete article URL (not the HN link, the external URL) and the source domain" |
| Tech & Dev | 🛠️ | Dev.to | `https://dev.to/` | "List trending articles: title, author, tags, one-sentence summary" |
| AI & Claude | 🤖 | Anthropic news | `https://www.anthropic.com/news` | "List the latest publications: title, date, one-sentence summary" |

Store sources in `SOURCES` (list) and categories in `CATEGORIES` (ordered, deduplicated list).

**If variant called** (`/digest [category]`) → filter `SOURCES` to keep only sources whose category matches (case-insensitive).

---

## Step 2a — Calculate target date and locate daily note

**Target date** (calculate first):
- If `time >= 17:00` → `target_date = today + 1 day` (preparation for tomorrow morning)
- Otherwise → `target_date = today`

Build path according to `DATE_FORMAT` and `NOTES_FOLDER` with `target_date`.

**If note exists** → proceed to Step 2b.

**If note does not exist** → create it with daily note template (`Ressources/Templates/Daily notes template.md`), replacing Templater variables with calculated values for `target_date`:
- `tp.date.now("YYYY-MM-DD")` → ISO date of `target_date`
- `tp.date.now("YYYY")` → year
- `tp.date.now("MMMM")` → month in letters (French)
- `tp.date.now("WW")` → ISO week number
- `tp.date.now("dddd DD MMMM YYYY")` → ex: `samedi 25 avril 2026`

Leave `energy`, `score`, `work_hours`, `personal_hours`, `hobby_hours` empty (frontmatter). Then proceed to Step 2b.

## Step 2b — Check if digest already exists

Open the daily note and check for a `## 📰 Digest` section:

- If not → proceed to Step 3
- If yes → **stop and propose in chat**:
  ```
  A digest already exists for YYYY-MM-DD.

  Option A: Replace it
  Option B: Cancel
  ```
  **Wait for explicit answer** (A or B).

---

## Step 3 — Fetch sources

For each source in `SOURCES`, fetch in parallel with defuddle first:
1. Build defuddle URL: `https://defuddle.md/<source_url>`
2. Fetch via WebFetch → if valid response (clean markdown, > 100 chars) → use this content
3. Otherwise → fallback WebFetch to original URL

### If a fetch fails

```
[Source] is inaccessible (timeout/error).

Option A: Continue with available sources
Option B: Relaunch digest later
```

**Wait for explicit answer** (A or B):
- If A → continue, add at bottom of digest: `*[Source] inaccessible today*`
- If B → stop

### If content is unusable — fallback WebSearch

After each successful fetch (defuddle or WebFetch), evaluate if content is usable:

- **Not usable**: mostly CSS/JS content (many `{`, `}`, CSS properties, `--` variables), blank page, or model response indicating no articles
- **Usable**: natural text with titles, dates, or identifiable article summaries

**If not usable → automatic silent fallback:**
1. Extract domain from source URL (ex: `hugodecrypte.kessel.media`)
2. Launch WebSearch with query `site:[domain]`
3. Apply original fetch prompt to WebSearch results
4. If WebSearch also returns zero articles → treat as inaccessible (Option A/B above)

No message to {USER_NAME} during fallback — the source is handled normally in the digest.

---

## Step 4 — Deduplication against last 7 days

Before any selection, exclude what {USER_NAME} has already seen. A digest repeating yesterday's item wastes attention — a briefing's value is the increment, not the reminder.

1. Read `## 📰 Digest` sections from daily notes of the **last 7 days** (`target_date - 1` to `target_date - 7`, files `{NOTES_FOLDER}/<date>.md` per `DATE_FORMAT`). Missing daily note or no digest → ignore that day, non-blocking.
2. Build `SEEN` = set of already-published items: retain the URL **and** the subject (normalized title / main entity).
3. Any candidate whose URL is in `SEEN`, **or** which covers the same subject as an item in `SEEN` (same release, same incident, same announcement — not just a common keyword), is excluded before Step 5.

A logical continuation is allowed (ex: "v2.0 RC" yesterday → "v2.0 stable" today = real update, not a duplicate). The criterion is: *Does {USER_NAME} learn something new?*

---

## Step 5 — Select and synthesize

Selection happens in two levels. The point of `/digest` is not to stack links: it's to ensure {USER_NAME}'s daily briefing, and add tech ecosystems **only when it's worth it**.

### Level 1 — Anchor sections (always present)

`Tech & Dev 🛠️`, `News & Hobby 🎲`, `News & Personal 📰` are sections {USER_NAME} reads every day. They are **never evicted** by language sections: aim for **1 to 2 items each**, provided their source is accessible (otherwise inaccessibility note at bottom, see Step 3). If `/digest [category]` filters to a single category, this anchor rule doesn't apply — respect the filter.

### Level 2 — Language / ecosystem sections (strict quality sort)

`Java`, `Rust`, `Spring Boot`, `Angular`, `React`, `TypeScript`, `DevOps`: **0 or 1 item per section**, never filler. Include an item only if it's really worth the detour for someone coding in that stack. A section with no strong signal today is **omitted entirely** (no orphaned title). Better 3 solid language sections than 7 lukewarm ones.

### Quality criteria (apply to both levels)

| Include | Exclude |
|---------|---------|
| Major releases (v2.0, model release, breaking change) | Clickbait ("10 tips", "you won't believe") |
| Learning patterns (architecture, best practice, post-mortem) | Pure marketing, promotional content |
| Significant debates (500+ HN score, 100+ comments) | Articles > 7 days old |
| Major news in the source's domain | Duplicates (already filtered Step 4) |

### Volume guardrail

**`CAP_TOTAL` = 8 to 10 items maximum, all levels combined.** Beyond 10, {USER_NAME} won't read — selection becomes counter-productive. If valid candidates exceed 10 after quality sort: keep 1-2 anchor items per section, then fill with strongest language items up to `CAP_TOTAL`. Going below 8 is OK if few items pass the filter; never inflate to reach 8.

---

## Step 6 — Format digest

Build one section per category in `CATEGORIES`, in order of `digest-sources.md` (or default order if missing):

```markdown
## 📰 Digest — DD/MM/YYYY

### [emoji] [Category]
- **[Title](url)** — [1-2 sentence summary] — *[source]*

### [emoji] [Category 2]
- **[Title](url)** — [1-2 sentence summary] — *[source]*
```

Rules:
- Title in bold with clickable link, factual summary (1-2 sentences), source in italics
- Omit a category entirely if no items retained (no orphaned title)
- If single filtered category (`/digest [category]`) → single section

---

## Step 7 — Insert into daily note

Locate insertion point **in order of preference**:
1. Just **before** `## 📅 Daily Plan`
2. If absent, just **after** first `---`
3. If no `---`, after YAML frontmatter block

Insert complete digest block. Confirm:

```
✅ Digest inserted in daily note of YYYY-MM-DD
→ [N] items — [categories used]
```

---

## Step 8 — Research intel (automatic)

After confirming digest insertion, execute skill `/research-scout`:
read `99 - Claude Code/Skills/research-scout/SKILL.md` and execute its steps.

Non-blocking: if /research-scout finds nothing or {USER_NAME} skips everything, digest is already done — no further action.

---

## Absolute rules

- **Never overwrite** existing content — only insert the digest block
- **Zero autonomous action on blockers** — always propose A/B and wait for explicit answer
- **Anchor sections non-evictable** — Tech & Dev / News & Hobby / News & Personal present at each run if source accessible; language sections never replace them
- **`CAP_TOTAL` = 8-10 items max**, never beyond — quality > quantity; going below 8 is OK, inflating to reach 8 is not
- **Mandatory 7-day deduplication** — no item already published (URL or same subject) in digests from last 7 days
- **Language sections: 0-1 item, omitted if weak signal** — never forced filler
- **Factual only** — no opinion, no personal interpretation
- **Mandatory links** — each item in markdown `[Title](url)`
- **If no valid items** → Option A (insert empty digest with note) / Option B (cancel)
