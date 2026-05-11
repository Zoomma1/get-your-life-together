---
name: digest
description: Fetch monitoring sources configured in digest-sources.md and write a condensed summary into the daily note. Recommended workflow: launch in the evening with /closeday in a dedicated session — digest writes to tomorrow's daily note (created with template if it doesn't exist yet). Trigger when the user says "/digest", "digest", "digest tech", "give me the news", "today's monitoring", "do the digest". DO NOT launch in same session as /today (9 parallel agents = ~70% of 5h quota).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured on the **richness of output produced**, not on structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill `/digest`

Generates a monitoring summary (5-8 articles) from configured sources and inserts it into today's daily note, before the plan section.

## Trigger

```
/digest                  → all configured categories
/digest [category]       → single category (ex: /digest Finance, /digest Tech)
```

**Explicit invocation only** — no search for "active project context".

---

## Step 0 — Load vault parameters

Read `99 - Claude Code/config/vault-settings.md` to extract:
- `date_format` — daily notes date format (default: `YYYY-MM-DD`)
- `daily_notes_folder` — daily notes folder (default: `00 - Daily notes`)

Store in `DATE_FORMAT` and `NOTES_FOLDER`. Use these values wherever a date or daily note path is needed.

---

## Step 1 — Load sources

Read `99 - Claude Code/config/digest-sources.md`.

**If file exists** → extract defined categories and sources. Each section `## [Category] [emoji]` defines a category. Each line ` - [Name] | [URL] | [fetch prompt]` defines a source in that category.

**If file is absent** → use default sources:

| Category | Emoji | Name | URL | Fetch prompt |
|----------|-------|------|-----|---------------|
| Tech & Dev | 🛠️ | Hacker News | `https://news.ycombinator.com/` | "List the titles of the first 15 stories with their score, the full article URL (not the HN link, external URL) and source domain" |
| Tech & Dev | 🛠️ | Dev.to | `https://dev.to/` | "List trending articles: title, author, tags, summary in 1 sentence" |
| AI & Claude | 🤖 | Anthropic news | `https://www.anthropic.com/news` | "List latest publications: title, date, summary in 1 sentence" |

Store sources in `SOURCES` (list) and categories in `CATEGORIES` (ordered list, deduplicated).

**If variant called** (`/digest [category]`) → filter `SOURCES` to keep only sources whose category matches (case insensitive).

---

## Step 2a — Calculate target date and locate daily note

**Target date** (calculate first):
- If `hour >= 17:00` → `target_date = today + 1 day` (preparation for tomorrow morning)
- Otherwise → `target_date = today`

Build path according to `DATE_FORMAT` and `NOTES_FOLDER` with `target_date`.

**If note exists** → continue to Step 2b.

**If note does not exist** → create it with daily note template (`Ressources/Templates/Daily notes template.md`), replacing Templater variables with calculated values for `target_date`:
- `tp.date.now("YYYY-MM-DD")` → ISO date of `target_date`
- `tp.date.now("YYYY")` → year
- `tp.date.now("MMMM")` → month in letters (French)
- `tp.date.now("WW")` → ISO week number
- `tp.date.now("dddd DD MMMM YYYY")` → ex: `Saturday 25 April 2026`

Leave `energy`, `score`, `work_hours`, `personal_hours`, `hobby_hours` empty (frontmatter). Then continue to Step 2b.

## Step 2b — Verify if digest already exists

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

Fetch all sources from `SOURCES` in parallel, each with its defined fetch prompt.

### If a fetch fails

```
[Source] is inaccessible (timeout/error).

Option A: Continue with available sources
Option B: Retry digest later
```

**Wait for explicit response** (A or B):
- If A → continue, add at bottom of digest: `*[Source] inaccessible today*`
- If B → stop

### If content is non-exploitable — fallback WebSearch

After each successful fetch, evaluate if content is exploitable:

- **Non-exploitable**: content mostly CSS/JS (many `{`, `}`, CSS properties, variables `--`), empty page, or model response indicating no articles
- **Exploitable**: natural text with titles, dates, or identifiable article summaries

**If non-exploitable → automatic fallback (silent):**
1. Extract domain from source URL (ex: `hugodecrypte.kessel.media`)
2. Launch WebSearch with query `site:[domain]`
3. Apply original fetch prompt to WebSearch results
4. If WebSearch also returns zero articles → treat as inaccessible (Option A/B above)

No message to {USER_NAME} during fallback — source is processed normally in digest.

---

## Step 4 — Select and synthesize

From retrieved content, select **5 to 8 items total**:

**Quality criteria (always apply):**
| Include | Exclude |
|---------|----------|
| Major releases (v2.0, model release, breaking change) | Clickbait ("10 tips", "you won't believe") |
| Learning patterns (architecture, best practice) | Pure marketing, promotional content |
| Significant debates (score 500+ HN, 100+ comments) | Articles > 7 days old |
| Major news in source domain | Duplicates (same topic 2x) |

**Target distribution**: balance between configured categories — if 2 categories → ~50/50, if 3 → ~33/33/33. Adjust based on availability.

---

## Step 5 — Format digest

Build one section per category in `CATEGORIES`, in order from `digest-sources.md` (or default order if absent):

```markdown
## 📰 Digest — DD/MM/YYYY

### [emoji] [Category]
- **[Title](url)** — [summary 1-2 sentences] — *[source]*

### [emoji] [Category 2]
- **[Title](url)** — [summary 1-2 sentences] — *[source]*
```

Rules:
- Title in bold with clickable link, summary factual (1-2 sentences), source in italic
- Omit entirely a category if no items retained (no orphaned title)
- If single filtered category (`/digest [category]`) → single section only

---

## Step 6 — Insert into daily note

Locate insertion point **in order of preference**:
1. Just **before** `## 📅 Plan du jour`
2. If absent, just **after** first `---`
3. If no `---`, after YAML frontmatter block

Insert complete digest block. Confirm:

```
✅ Digest inserted into daily note for YYYY-MM-DD
→ [N] items — [categories used]
```

---

## Step 7 — Research intel (automatic)

After confirming digest insertion, execute `/research-scout` skill:
read `99 - Claude Code/Skills/research-scout.md` and execute its steps.

Non-blocking: if /research-scout finds nothing or {USER_NAME} skips everything, digest is already complete — no further action.

---

## Absolute rules

- **Never overwrite** existing content — only insert digest block
- **Zero autonomous action on blockers** — always propose A/B and wait for explicit response
- **5-8 items max** — quality > quantity; OK if < 5 valid items
- **Factual only** — no opinion, no personal interpretation
- **Mandatory links** — each item in markdown `[Title](url)`
- **If no valid items** → Option A (insert empty digest with note) / Option B (cancel)
