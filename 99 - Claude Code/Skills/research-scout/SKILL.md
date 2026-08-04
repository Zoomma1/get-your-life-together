---
name: research-scout
description: Daily monitoring focused on vault × Claude Code — what's coming out and trending this week in the ecosystem. Trigger via /research-scout or automatically at the end of /digest.
---

# Skill: /research-scout

Targeted monitoring on what's coming out and trending in the **Claude Code × vault × AI agents** space this week. Format and logic close to `/pulse`, but daily and lightweight — no ticket creation (the `/harvest` handles that).

---

## Step 0 — Duplicate-prevention guard against `/pulse` (before any fetch)

Read the `/pulse` line in `99 - Claude Code/command-tracker.md`.

**If `/pulse` ran less than 48 hours ago** → do not run the skill. Display:

> ⚠️ `/pulse` ran on [date] ([N]h ago) — `/research-scout` works the same terrain (GitHub trending, HN, AI ecosystem). Running it now costs ~5 searches for nearly zero yield. Do you still want me to launch it?

Wait for the response. **Skip by default** if silence or timeout (30 s) — this is a yield guard, not a prohibition: if the user says yes, run normally.

**If the `/pulse` line is missing, unreadable, or older than 48 hours** → continue without flagging anything.

> **Why**: on 2026-07-30, `/pulse` ran in the morning (5 candidates, 3 tickets created) and `/research-scout` ran right after — **no items retained**, the security-agents vein already fully covered. The cost is real (4 WebSearch + sidecar YouTube) and the yield is zero by design, not by chance.
>
> ⚠️ The tracker attests to the *gesture of checking*, not actual execution (cf. lesson "a tracker that says ✅ is not proof"). Here the risk is acceptable: worst case we propose a skip wrongly and {USER_NAME} says no. Never turn this guard into an automatic blocker.

---

## Step 1 — Calculate date and fetch trends (parallel)

**Dynamic date**: calculate today's date and date J-7. Use `YYYY-MM-DD` format in queries — never hardcode a date.

Launch **5 searches in parallel** (4 WebSearch + 1 n8n webhook YouTube):

**A — GitHub trending vault/agents**
```
WebSearch : "GitHub trending Claude Code vault Obsidian agents [current month] [current year]"
```

**B — Recent HN discussions**
```
WebSearch : "Hacker News Claude Code Obsidian PKM agents [current month] [current year]"
```

**C — Anthropic updates**
```
WebSearch : "Anthropic Claude new product tool release [current month] [current year]"
```

**D — AI dev tools ecosystem**
```
WebSearch : "AI developer tools release agents [current month] [current year] new"
```

**E — YouTube trending 72h + curated channels** (direct sidecar)
```bash
curl -s -m 60 "http://docker-host:3001/youtube?hours_old=72&channels=@mattpocockuk"
```

> ⚠️ **Always use `docker-host:3001`, never `n8n-sidecar.homelab.local`.** The NPM vhost is **LAN-only**: `homelab.local` resolves via an AdGuard rewrite to `192.168.1.32`, a private IP unreachable when {USER_NAME} is not on the home network (client site, 4G…) — hence a `curl` exit 6 that has **nothing** to do with the service state. `docker-host` is a MagicDNS hostname: it resolves everywhere Tailscale is up, per [[99 - Claude Code/ADR/ADR-070-adressage-services-homelab-laptop|ADR-070]] (*"usage remote → `docker-host:<port>`"*). Fixed on 2026-08-04, after the LAN-only URL produced repeated `YOUTUBE_FAILED` errors (22/05, 26/05, 28/07) all blamed on the sidecar. Measurement on 04/08: response in **22.3 s** — the `-m 60` has headroom, do not lower it.

The `channels=` param (list of handles separated by commas) surfaces latest videos from curated channels **in addition to** default keywords. Followed channels: `@mattpocockuk` (advanced TypeScript, LLM/agents tooling).

Returns JSON `{ videos: [{ title, url, channel, published_at, transcript, has_transcript, matched_keyword }], total, keywords_searched, channels_searched, errors }`. For a video from a curated channel, `matched_keyword` equals `channel:@handle` (specify the channel as source).

**Sidecar error handling**:
- Resolution failure / connection / timeout / malformed JSON → mark `YOUTUBE_FAILED = true`, continue without blocking
- In Step 4: signal to {USER_NAME} `⚠️ YouTube source skip — sidecar unreachable ([curl code])`
- **Never write "sidecar down" without verifying it.** Exit 6 (resolution) or a timeout says the *call* failed, not that the service is down — on 04/08, "sidecar down" was reported three times for a running container. If diagnosis matters, one command suffices: `nc -z docker-host 3001`.

**Extraction**: for each result (all sources), note:
- Title + URL
- Source: `[GitHub]` `[HN]` `[Anthropic]` `[Tooling]` `[YouTube]` (explicit prefix)
- Publication date — **ignore if > 7 days** for A/B/C/D, **ignore if > 72h** for E (sidecar filters already but double-check)
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
- URL already in the `## 📰 Digest` section of today's daily? → ignore
- Topic already present in `99 - Claude Code/` or `03 - Knowledge/` (quick grep)? → ignore

---

## Step 3 — Filter and select

Retain **3 to 5 items maximum** (all sources combined). Strict criteria:

| Include | Exclude |
|---------|---------|
| Anthropic release (new product, new model, new feature) | "Top X" tutorials, guides, generic "how to" |
| Concrete tool or repo released this week | Content already in vault |
| Community discussion with strong signal (300+ HN, 100+ upvotes) | Articles > 7 days old (24h for YouTube) |
| Pattern or tool in the Claude Code / agents / PKM ecosystem that deserves attention (even if it requires a refactor or adding an MCP) | Substance-free marketing content |
| **YouTube video** with substantial `insights` (transcript extraction reveals a pattern, tool, field feedback) | **YouTube video** pure monetization (clickbait titles, < 30% useful content vs length, generic presenter type "5 things you should know") |

**YouTube video-specific filtering**: if ≥ 70% of results E look like clickbait or generic monetized content (quick title + insights analysis) → retain zero videos rather than fill with noise. Quality trumps quantity.

**If fewer than 2 relevant items** (all sources combined) → end silently, insert nothing.

---

## Step 4 — Present for validation

Table format close to `/pulse`. If `YOUTUBE_FAILED = true` → display at top `⚠️ YouTube source skip — n8n workflow down or not yet created`.

```
🔭 Research intel — [N] items — week of [date]

| # | Item | Source | Vault angle |
|---|------|--------|-------------|
| 1 | [Title](url) | HN / GitHub / Reddit / Anthropic / Tooling | [Claude Code / Vault / Agents / Release] |
| 2 | [Video title](url) — *insights: [1-sentence summary]* | YouTube — channel "[Name]" | [Claude Code / Agents / Vault] |

→ Which numbers do you keep? ("1 3", "all", "skip")
```

**Video differentiation**: for items marked `[YouTube]`, add the `insights` summary (1 sentence) right after the title, so {USER_NAME} can decide without clicking. Specify the channel in source.

Timeout 45s → skip everything.

---

## Step 5 — Write to daily note

Target date: if time < 04:00 → yesterday's note, else today.

**If items accepted**, add to the end of `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\[target date].md`:

```markdown
## 🔭 Research intel

| Item | Angle |
|------|-------|
| **[Title](url)** | [Claude Code / Vault / Agents / Release] |
| **[Video title](url)** — *[channel]* — insights: [1-sentence summary] | [YouTube / Claude Code] |
```

For YouTube video items `[YouTube]`: include the channel in italics + the insights summary (1 sentence) in the `Item` cell, so the table is self-contained ({USER_NAME} rereads their daily note without clicking).

Confirm: "✅ [N] item(s) added to Research intel." If any came from YouTube: "(including [N] videos)"

**If all skipped** → confirm "Research intel — nothing retained." without writing anything.

**If `YOUTUBE_FAILED = true`** : add to the end of the confirmation message `⚠️ YouTube source skip this run — check n8n / youtube-search workflow.`
