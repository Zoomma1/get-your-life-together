---
name: pulse
description: Weekly setup × trends monitoring — scans GitHub trending + HN, analyses the current setup, identifies gaps and creates missing tickets in the Claude Code kanban. Invoke when {USER_NAME} says "setup monitoring", "what's new to integrate", "pulse", "check trends", "/pulse", or at the start of the week.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimisation**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips the narrative instructions (grouping, context, highlights, open questions, tone, narration). Preserving qualitative content takes priority over reducing line count.

# Skill: /pulse

Weekly monitoring that crosses tech trends with the current setup. Result: 3-5 tickets created in the Claude Code kanban for the most relevant improvements.

Recommended frequency: once a week (typically Saturday or Monday morning).

---

## Step 1 — Fetch trends (parallel)

Launch two searches in parallel:

**Search A — GitHub trending (weekly)**
```
WebSearch: "GitHub trending projects this week [current month year]"
WebSearch: "GitHub trending weekly [current month year]"
```
Target: [shareuhack.com GitHub trending weekly], [gitstars.substack.com], [trendshift.io].
Fetch the most recent page found with WebFetch.

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
2. `~/.claude/settings.json` (path: `~/.claude/settings.json`) — active plugins, hooks
3. Claude Code Kanban **Idea** and **Spec** columns — what is already in backlog

**Extraction**: build two lists:
- What the setup already does (active skills + plugins)
- What is already in backlog (Idea/Spec ticket titles)

---

## Step 3 — Gap analysis

Cross-reference trends (Step 1) with setup (Step 2).

For each trending project/pattern:
1. Is it already covered by an active skill or plugin? → ignore
2. Is it already in backlog (Idea/Spec)? → ignore
3. Is it relevant for {USER_NAME}'s workflow (vault, dev, ML, productivity)? → candidate

**Relevance criteria** (at least one):
- Direct reduction of daily friction
- Natural extension of an existing skill
- Token or session time savings
- Integration with an active project

Sort candidates by descending relevance. Select **3 to 5 maximum**.

If fewer than 3 relevant candidates → signal "few relevant new things this week" and stop without creating tickets.

---

## Step 4 — Present candidates to {USER_NAME}

Before creating tickets, present the list of selected candidates:

```
## Pulse candidates — [date]

| # | Improvement | Inspiration | Relevance |
|---|-------------|-------------|-----------|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |

→ Shall I create tickets for all? Or do you want to remove some?
```

Wait for {USER_NAME}'s validation before proceeding to Step 5.

---

## Step 5 — Create tickets

For each validated candidate, apply the `create-ticket` skill:

```
create-ticket with:
- title: "[descriptive title]"
- type: "💡 Idea" (or "⏫ Improvement" if it's an improvement of something existing)
- project: null (→ "Personal")
- column: "Idea"
- context: "[link to the trend source in 1 sentence]"
```

Create tickets sequentially (the kanban is modified each time).

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

## Rules

- Never create a ticket already present in the setup or backlog — check in Step 2
- Never exceed 5 tickets per run — filter rigorously
- Always present candidates before creating (Step 4) — no silent creation
- If WebFetch fails on a source → note "source unavailable" and continue with others
