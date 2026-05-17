---
name: pulse
description: Weekly tech watch setup × trends — scans GitHub trending + HN, analyzes current setup, identifies gaps and creates missing tickets in the Claude Code kanban. Invoke when the user says "tech watch setup", "what's new to integrate", "pulse", "check trends", "/pulse", or early in the week.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips out narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /pulse

Weekly tech watch that crosses tech trends with current setup. Result: 3-5 tickets created in the Claude Code kanban for the most relevant improvements.

Recommended frequency: once per week (typically Saturday or Monday morning).

---

## Step 1 — Fetch trends (parallel)

Launch two searches in parallel:

**Search A — GitHub trending (weekly)**
```
WebSearch: "GitHub trending projects this week [current month year]"
WebSearch: "GitHub trending weekly [current month year]"
```
Target: [shareuhack.com GitHub trending weekly], [gitstars.substack.com], [trendshift.io].
Fetch the most recent page found: defuddle first (`https://defuddle.md/<url>`), fallback WebFetch if invalid (< 100 chars, error).

**Search B — HN + Claude Code ecosystem**
```
WebSearch: "Hacker News trending Claude Code [current month year]"
WebSearch: "site:reddit.com/r/ClaudeCode trending [current month year]"
```

**Extraction**: for each source, note projects with:
- Name + short description
- Number of stars or HN score
- Category: [AI/LLM] [Dev tooling] [Infra] [Vault/PKM] [Productivity]

---

## Step 2 — Scan current setup

Read in parallel:

1. `99 - Claude Code/Skills/INDEX.md` — list of active skills
2. `~/.claude/settings.json` — active plugins, hooks
3. Claude Code kanban columns **Idea** and **Spec** — what's already in backlog

**Extraction**: build two lists:
- What the setup already does (active skills + plugins)
- What's already in backlog (titles of Idea/Spec tickets)

---

## Step 3 — Gap analysis

Cross trends (Step 1) with setup (Step 2).

For each trending project/pattern:
1. Is it already covered by an active skill or plugin? → ignore
2. Is it already in backlog (Idea/Spec)? → ignore
3. Is it relevant to {USER_NAME}'s workflow (vault, dev, ML, productivity)? → candidate

**Relevance criteria** (at least one):
- Direct reduction of daily friction
- Natural extension of an existing skill
- Token or session time savings
- Integration with an active project (FSTG, MPA-MLF, Rustlings, Ludisep)

Sort candidates by decreasing relevance. Select **3 to 5 maximum**.

If fewer than 3 relevant candidates → report "little relevant news this week" and stop without creating tickets.

---

## Step 4 — Present candidates to {USER_NAME}

Before creating tickets, present the list of selected candidates:

```
## Pulse candidates — [date]

| # | Improvement | Inspiration | Relevance |
|---|-------------|-------------|-----------|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |

→ Do I create tickets for all? Or do you want to remove some?
```

Wait for {USER_NAME} validation before moving to Step 5.

---

## Step 5 — Create tickets

For each validated candidate, apply the `create-ticket` skill:

```
create-ticket with:
- title: "[descriptive title]"
- type: "💡 Idea" (or "⏫ Improvement" if it's an improvement to existing)
- project: null (→ "Personal")
- column: "Idea"
- context: "[link with source trend in 1 sentence]"
```

Create tickets sequentially (the kanban is modified each time).

---

## Step 6 — Summary

Display:
```
## Pulse — [date]

**Sources scanned:** GitHub trending weekly + HN + r/ClaudeCode
**Candidates identified:** N (M ignored — already in setup or backlog)
**Tickets created:** K

| Ticket | Inspiration |
|--------|-------------|
| [title] | [source] |
```

---

## Step 7 — Update command-tracker

- Open `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- `/pulse` line → replace date with today's date in format `YYYY-MM-DD`

---

## Rules

- Never create a ticket already present in setup or backlog — verify in Step 2
- Never exceed 5 tickets per run — filter rigorously
- Always present candidates before creating (Step 4) — no silent creation
- If WebFetch fails on a source → note "source unavailable" and continue with others
- **Pulse tickets = exploration only** — never direct implementation; the ticket results in a Knowledge note OR an implementation ticket, only if {USER_NAME} explicitly asks
