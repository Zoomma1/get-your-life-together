---
name: research-scout
description: Daily watch focused on vault × Claude Code — what's coming out and trending this week in the ecosystem. Trigger via /research-scout or automatically at the end of /digest.
---

# Skill: /research-scout

Targeted watch on what's coming out and trending in the **Claude Code × vault × AI agents** space this week. Format and logic similar to `/pulse`, but daily and lightweight — no ticket creation (that's `/harvest`'s job).

---

## Step 1 — Calculate date and fetch trends (parallel)

**Dynamic date**: calculate today's date and the date 7 days ago. Use `YYYY-MM-DD` format in queries — never hardcode a date.

Launch **5 searches in parallel** (4 WebSearch + 1 n8n webhook YouTube):

**A — GitHub trending vault/agents**
```
WebSearch: "GitHub trending Claude Code vault Obsidian agents [current month] [current year]"
```

**B — Recent HN discussions**
```
WebSearch: "Hacker News Claude Code Obsidian PKM agents [current month] [current year]"
```

**C — Anthropic updates**
```
WebSearch: "Anthropic Claude new product tool release [current month] [current year]"
```

**D — AI dev tools ecosystem**
```
WebSearch: "AI developer tools release agents [current month] [current year] new"
```

**E — YouTube trending 72h** (sidecar direct)
```bash
curl -s -m 60 "http://n8n-sidecar.homelab.local/youtube?hours_old=72"
```

Returns JSON `{ videos: [{ title, url, channel, published_at, transcript, has_transcript, matched_keyword }], total, errors }`.

**Sidecar error handling**:
- Container down / timeout / malformed JSON → mark `YOUTUBE_FAILED = true`, continue without blocking
- In Step 4: notify {USER_NAME} `⚠️ YouTube source skip — n8n-sidecar down`

**Extraction**: for each result (all sources), note:
- Title + URL
- Source: `[GitHub]` `[HN]` `[Anthropic]` `[Tooling]` `[YouTube]` (explicit prefix)
- Publication date — **skip if > 7 days** for A/B/C/D, **skip if > 72h** for E (sidecar already filters but double-check)
- Category: [Claude Code] [Vault/PKM] [AI Agents] [Anthropic Release] [Dev Tooling]
- **For E only**: `channel` + `insights` (summary extracted from transcript by the workflow)

---

## Step 2 — Gap analysis against existing setup

Read in parallel:
1. `99 - Claude Code/Skills/INDEX.md` — active skills
2. `99 - Claude Code/Claude Code Kanban.md` — Idea, Blocked, Ready columns (what's already in backlog)

For each result from Step 1:
- Already covered by an active skill? → skip
- Already in kanban backlog? → skip
- URL already in the `## 📰 Digest` section of today's daily note? → skip
- Topic already present in `99 - Claude Code/` or `03 - Knowledge/` (quick grep)? → skip

---

## Step 3 — Filter and select

Keep **3 to 5 items maximum** (all sources combined). Strict criteria:

| Include | Exclude |
|---------|---------|
| Anthropic release (new product, new model, new feature) | Tutorials "top X", guides, generic "how to" |
| Concrete tool or repo released this week | Content already in the vault |
| Community discussion with strong signal (300+ HN, 100+ upvotes) | Articles > 7 days old (24h for YouTube) |
| Pattern or tool in the Claude Code / agents / PKM ecosystem worth flagging (even if it requires a refactor or adding an MCP) | Marketing content without substance |
| **YouTube video** with substantive `insights` (transcript extraction reveals a pattern, a tool, field feedback) | **YouTube video** pure monetization (clickbait titles, content < 30% useful vs length, generic presenter "5 things you should know" type) |

**YouTube video filtering specifics**: if ≥ 70% of E results look like clickbait or generic monetized content (quick title + insights analysis) → retain no videos rather than fill with noise. Quality over quantity.

**If fewer than 2 relevant items** (all sources combined) → finish silently, insert nothing.

---

## Step 4 — Present for validation

Table format similar to `/pulse`. If `YOUTUBE_FAILED = true` → display at the top `⚠️ YouTube source skip — n8n workflow down or not yet created`.

```
🔭 Research intel — [N] items — week of [date]

| # | Item | Source | Vault angle |
|---|------|--------|-------------|
| 1 | [Title](url) | HN / GitHub / Reddit / Anthropic / Tooling | [Claude Code / Vault / Agents / Release] |
| 2 | [Video title](url) — *insights: [1-line summary]* | YouTube — channel "[Name]" | [Claude Code / Agents / Vault] |

→ Which numbers do you keep? ("1 3", "all", "skip")
```

**Video differentiation**: for `[YouTube]` items, add the `insights` summary (1 sentence) directly after the title, so {USER_NAME} can decide without clicking. Specify the channel in the source.

Timeout 45s → skip everything.

---

## Step 5 — Write to daily note

Target date: if time < 04:00 → yesterday's note, otherwise today.

**If items accepted**, add to the bottom of `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\[target date].md`:

```markdown
## 🔭 Research intel

| Item | Angle |
|------|-------|
| **[Title](url)** | [Claude Code / Vault / Agents / Release] |
| **[Video title](url)** — *[channel]* — insights: [1-line summary] | [YouTube / Claude Code] |
```

For `[YouTube]` video items: include the channel in italics + the insights summary (1 sentence) in the `Item` cell, so the table is self-contained ({USER_NAME} re-reads their daily note without clicking).

Confirm: "✅ [N] item(s) added to Research intel." If any came from YouTube: "(including [N] videos)"

**If all skipped** → confirm "Research intel — nothing retained." without writing anything.

**If `YOUTUBE_FAILED = true`**: add to the end of the confirmation message `⚠️ YouTube source skip this run — check n8n / youtube-search workflow.`
