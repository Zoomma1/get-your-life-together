---
name: pulse
description: Weekly setup monitoring × trends — scrapes GitHub trending + HN, analyzes current setup, identifies gaps and creates missing tickets in Claude Code kanban. Invoke when user says "setup monitoring", "what's new to integrate", "pulse", "check the trends", "/pulse", or at the beginning of the week.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in ways that strip narrative instructions (regrouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /pulse

Weekly monitoring that crosses tech trends with current setup. Result: 3-5 tickets created in Claude Code kanban for the most relevant improvements.

Recommended frequency: once per week (typically Saturday or Monday morning).

---

## Step 1 — Fetch trends (parallel)

Launch two searches in parallel:

**Search A — GitHub trending (week)**
```
WebSearch : "GitHub trending projects this week [current month year]"
WebSearch : "GitHub trending weekly [current month year]"
```
Target: [shareuhack.com GitHub trending weekly], [gitstars.substack.com], [trendshift.io].
Fetch the most recent page found: defuddle first (`https://defuddle.md/<url>`), fallback WebFetch if invalid (< 100 chars, error).

**Search B — HN + Claude Code ecosystem**
```
WebSearch : "Hacker News trending Claude Code [current month year]"
WebSearch : "site:reddit.com/r/ClaudeCode trending [current month year]"
```

**Extraction**: for each source, note projects with:
- Name + short description
- Number of stars or HN score
- Category: [AI/LLM] [Dev Tooling] [Infrastructure] [Vault/PKM] [Productivity]

**Source = tunnel to paid training** (Skool, "link in description", masterclass, no concrete exploitable implementation) → low value. Flag it during fetch and conclude quickly — no in-depth analysis of marketing content.

---

## Step 2 — Scan current setup

**Prerequisite — resolve paths via `vault-config.json`**: read `~/.claude/vault-config.json` to fetch `vaultPath`, then build all paths as `{vaultPath}/{FOLDER}/...`. **Never hardcode** absolute paths to vault in searches/reads — structure may change between machines.

Read in parallel:

1. `{vaultPath}/99 - Claude Code/Skills/INDEX.md` — list of active skills
2. `~/.claude/settings.json` — activated plugins, hooks
3. Claude Code Kanban columns **Idea** and **Spec** — what's already in backlog

**Extraction**: build two lists:
- What the setup already does (active skills + plugins)
- What's already in backlog (titles of Idea/Spec tickets)

**Security / defense-in-depth candidate**: map current setup **before** evaluating candidate. Mapping often reveals internal gaps independent of candidate (systematic bonus).

---

## Step 3 — Gap analysis

Cross-reference trends (Step 1) with setup (Step 2).

For each trending project/pattern:
1. Is it already covered by an active skill or plugin? → ignore
2. Is it already in backlog (Idea/Spec)? → ignore
3. Is it relevant for {USER_NAME}'s workflow (vault, dev, ML, productivity)? → candidate

**Tying a repo to a setup family** = justify by **≥2 indices** drawn from read source (never by a single pitch keyword — "sandbox", "agent", "RAG"). A single keyword does not make a match.

**"Skills X" pattern** (e.g., "patterns for agent skills"): evaluate each pattern against **entire existing skills ecosystem**, not just skills named in ticket. Include **creating a new skill** as a possible issue.

**Relevance criteria** (at least one):
- Direct friction reduction in daily workflow
- Natural extension of existing skill
- Token or session time savings
- Integration with active project (FSTG, MPA-MLF, Rustlings, Ludisep)

Sort candidates by decreasing relevance. Select **3 to 5 maximum**.

If fewer than 3 relevant candidates → signal "few relevant updates this week" and stop without creating tickets.

---

## Step 4 — Present candidates to {USER_NAME}

Before creating tickets, present the list of selected candidates:

```
## Pulse candidates — [date]

| # | Improvement | Inspiration | Relevance |
|---|-------------|-------------|-----------|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |

→ Should I create tickets for all? Or do you want to remove some?
```

Wait for {USER_NAME}'s validation before moving to Step 5.

---

## Step 5 — Create tickets

For each validated candidate, apply the `create-ticket` skill:

```
create-ticket with:
- title: "[descriptive title]"
- type: "💡 Idea" (or "⏫ Improvement" if it's an improvement to existing)
- project: null (→ "Personal")
- column: "Idea"
- context: "[connection with source trend in 1 sentence]"
```

Create tickets sequentially (kanban is modified each time).

---

## Step 6 — Summary

Display:
```
## Pulse — [date]

**Sources scanned:** GitHub trending week + HN + r/ClaudeCode
**Candidates identified:** N (M ignored — already in setup or backlog)
**Tickets created:** K

| Ticket | Inspiration |
|--------|-------------|
| [title] | [source] |
```

---

## Step 7 — Update command-tracker

- Open `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- Line `/pulse` → replace date with today's date in format `YYYY-MM-DD`

---

## Rules

- Never create a ticket already present in setup or backlog — verify in Step 2
- Never exceed 5 tickets per run — filter rigorously
- Always present candidates before creating (Step 4) — no silent creation
- If WebFetch fails on a source → note "source unavailable" and continue with others
- **Pulse tickets = exploration only** — never direct implementation; the ticket results in a Knowledge note OR an implementation ticket, only if {USER_NAME} explicitly requests
