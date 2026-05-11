---
name: research-scout
description: Daily watch focused on what's coming out and trending in the **Claude Code × vault × AI agents** space this week. Format and logic close to `/pulse`, but daily and lightweight — no ticket creation (the `/harvest` handles that).
---

# Skill: /research-scout

Targeted watch on what's coming out and trending in the **Claude Code × vault × AI agents** space this week. Format and logic close to `/pulse`, but daily and lightweight — no ticket creation (the `/harvest` handles that).

---

## Step 1 — Calculate the date and fetch trends (parallel)

**Dynamic date**: calculate today's date and J-7 date. Use `YYYY-MM-DD` format in queries — never hardcode a date.

Run **5 searches in parallel** (4 WebSearch + 1 n8n webhook YouTube):

**A — GitHub trending vault/agents**
```
WebSearch: "GitHub trending Claude Code vault Obsidian agents [current month] [current year]"
```

**B — HN recent discussions**
```
WebSearch: "Hacker News Claude Code Obsidian PKM agents [current month] [current year]"
```

**C — Anthropic news**
```
WebSearch: "Anthropic Claude new product tool release [current month] [current year]"
```

**D — AI dev tools ecosystem**
```
WebSearch: "AI developer tools release agents [current month] [current year] new"
```

**E — YouTube trending 72h** (sidecar direct)
```bash
curl -s -m 60 "http://localhost:3001/youtube?hours_old=72"
```

Returns JSON `{ videos: [{ title, url, channel, published_at, transcript, has_transcript, matched_keyword }], total, errors }`.

**Sidecar error handling**:
- Container down / timeout / malformed JSON → set `YOUTUBE_FAILED = true`, continue without blocking
- In Step 4: signal to {USER_NAME} `⚠️ YouTube source skip — n8n sidecar down`

**Extraction**: for each result (all sources), note:
- Title + URL
- Source: `[GitHub]` `[HN]` `[Anthropic]` `[Tooling]` `[YouTube]` (explicit prefix)
- Publication date — **ignore if > 7 days** for A/B/C/D, **ignore if > 72h** for E (sidecar already filters but double-check)
- Category: [Claude Code] [Vault/PKM] [AI Agents] [Anthropic Release] [Dev Tooling]
- **For E only**: `channel` + `insights` (summary extracted from transcript by the workflow)

---

## Step 2 — Gap analysis against existing setup

Read in parallel:
1. `99 - Claude Code/Skills/INDEX.md` — active skills
2. `99 - Claude Code/Claude Code Kanban.md` — Idea, Blocked, Ready columns (what's already in backlog)

For each result from Step 1:
- Already covered by an active skill? → ignore
- Already in kanban backlog? → ignore
- URL already in the `## 📰 Digest` section of today's daily note? → ignore
- Topic already present in `99 - Claude Code/` or `03 - Knowledge/` (quick grep)? → ignore

---

## Step 3 — Filter and select

Retain **3 to 5 items maximum** (all sources combined). Strict criteria:

| Include | Exclude |
|---------|---------|
| Anthropic release (new product, new model, new feature) | "top X" tutorials, guides, generic "how to" |
| Concrete tool or repo released this week | Content already present in the vault |
| Community discussion with strong signal (300+ HN, 100+ upvotes) | Articles > 7 days old (24h for YouTube) |
| Pattern or tool in the Claude Code / agents / PKM ecosystem worth keeping on radar (even if it requires a refactor or adding an MCP) | Content marketing without substance |
| **YouTube video** with substantial `insights` (transcript extraction reveals a pattern, tool, field feedback) | **YouTube video** monetized pure (clickbait titles, content < 30% useful vs length, generic presenter like "5 things you should know") |

**Specific YouTube video filtering**: if ≥ 70% of results E look like clickbait or generic monetized content (quick title + insights analysis) → retain no videos rather than fill with noise. Quality over quantity.

**If fewer than 2 relevant items** (all sources combined) → end silently, insert nothing.

---

## Step 4 — Present for validation

Table format close to `/pulse`. If `YOUTUBE_FAILED = true` → display at top `⚠️ YouTube source skip — n8n workflow down or not yet created`.

```
🔭 Research intel — [N] items — week of [date]

| # | Item | Source | Vault angle |
|---|------|--------|-------------|
| 1 | [Title](url) | HN / GitHub / Reddit / Anthropic / Tooling | [Claude Code / Vault / Agents / Release] |
| 2 | [Video title](url) — *insights: [1-sentence summary]* | YouTube — "[Channel]" | [Claude Code / Agents / Vault] |

→ Which numbers do you keep? ("1 3", "all", "skip")
```

**Video differentiation**: for `[YouTube]` items, add the `insights` summary (1 sentence) directly after the title, so {USER_NAME} decides without clicking. Specify the channel in source.

Timeout 45s → skip everything.

---

## Step 5 — Write in the daily note

Target date: if hour < 04:00 → yesterday's watch, otherwise today.

**If items are accepted**, add to the bottom of `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\[target date].md`:

```markdown
## 🔭 Research intel

| Item | Angle |
|------|-------|
| **[Title](url)** | [Claude Code / Vault / Agents / Release] |
| **[Video title](url)** — *[channel]* — insights: [1-sentence summary] | [YouTube / Claude Code] |
```

For `[YouTube]` video items: include the channel in italics + the insights summary (1 sentence) in the `Item` cell, so the table is self-contained ({USER_NAME} rereads their daily note without clicking).

Confirm: "✅ [N] item(s) added to Research intel." If some came from YouTube: "(including [N] videos)"

**If everything was skipped** → confirm "Research intel — nothing retained." without writing anything.

**If `YOUTUBE_FAILED = true`**: add to the end of the confirmation message `⚠️ YouTube source skip this run — check n8n / youtube-search workflow.`
