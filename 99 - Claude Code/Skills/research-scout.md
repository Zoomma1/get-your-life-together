---
name: research-scout
description: Daily monitoring focused on vault × Claude Code — what's trending and launching this week in the ecosystem. Trigger via /research-scout or automatically at end of /digest.
---

# Skill : /research-scout

Targeted monitoring on what's launching and trending in the **Claude Code × vault × AI agents** space this week. Format and logic close to `/pulse`, but daily and lightweight — no ticket creation (`/harvest` handles that).

---

## Step 1 — Calculate date and fetch trends (parallel)

**Dynamic date** : calculate today's date and date J-7. Use `YYYY-MM-DD` format in queries — never hardcode a date.

Run 4 searches in parallel:

**A — GitHub trending vault/agents**
```
WebSearch : "GitHub trending Claude Code vault Obsidian agents [current month] [current year]"
```

**B — Recent HN discussions**
```
WebSearch : "Hacker News Claude Code Obsidian PKM agents [current month] [current year]"
```

**C — Anthropic news**
```
WebSearch : "Anthropic Claude new product tool release [current month] [current year]"
```

**D — AI dev tools ecosystem**
```
WebSearch : "AI developer tools release agents [current month] [current year] new"
```

**Extraction** : for each result, note:
- Title + URL
- Publication date — **ignore if > 7 days** (compare with J-7 calculated at start)
- Category : [Claude Code] [Vault/PKM] [AI Agents] [Anthropic Release] [Dev Tooling]

---

## Step 2 — Gap analysis against existing setup

Read in parallel:
1. `99 - Claude Code/Skills/INDEX.md` — active skills
2. `99 - Claude Code/Claude Code Kanban.md` — Idea, Blocked, Ready columns (already in backlog)

For each result from Step 1:
- Already covered by active skill? → ignore
- Already in kanban backlog? → ignore
- URL already in today's daily note `## 📰 Digest` section? → ignore
- Topic already present in `99 - Claude Code/` or `03 - Knowledge/` (quick Grep)? → ignore

---

## Step 3 — Filter and select

Retain **3 to 5 items maximum**. Strict criteria:

| Include | Exclude |
|---------|---------|
| Anthropic release (new product, new model, new feature) | Tutorials "top X", guides, generic "how to" |
| Concrete tool or repo launched this week | Content already in vault |
| Community discussion with strong signal (300+ HN, 100+ upvotes) | Articles > 7 days |
| Pattern or tool in Claude Code / agents / PKM ecosystem worth watching (even if it requires refactor or adding MCP) | Marketing content without substance |

**If fewer than 2 relevant items** → finish silently, insert nothing.

---

## Step 4 — Present for validation

Format table close to `/pulse`:

```
🔭 Research intel — [N] items — week of [date]

| # | Item | Source | Vault angle |
|---|------|--------|-------------|
| 1 | [Title](url) | HN / GitHub / Reddit | [Claude Code / Vault / Agents / Release] |
| 2 | ... | ... | ... |

→ Which numbers do you keep? ("1 3", "all", "skip")
```

Timeout 45s → skip all.

---

## Step 5 — Write to daily note

Target date: if hour < 04:00 → yesterday's note, otherwise today.

**If items accepted**, add to bottom of `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\[target date].md`:

```markdown
## 🔭 Research intel

| Item | Angle |
|------|-------|
| **[Title](url)** | [Claude Code / Vault / Agents / Release] |
```

Confirm: "✅ [N] item(s) added to Research intel."

**If everything skipped** → confirm "Research intel — nothing retained." without writing anything.
