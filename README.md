# Get Your Life Together

> An Obsidian vault driven by Claude Code — for brains that don't work the way systems expect.

---

## What is it?

A second brain, ready to use. Open the vault in Obsidian, connect it to Claude Code, and you get a personal assistant that knows your life, your projects, your ideas.

Every morning, `/today` generates a day plan around your energy and schedule. Every evening, `/closeday` wraps it up. In between: notes, captures, things delegated to Claude.

Who it's for:
- Atypical brain (ADHD, autism, high cognitive load) and standard systems never stick
- Someone who forgets what they wanted to do ten minutes after thinking it
- Projects everywhere, notes scattered, a head that moves too fast
- Or just: Someone who wants to stop carrying everything alone inside their head

No coding required.

---

## How to use

### 1. Install Obsidian

[Obsidian](https://obsidian.md) is the app that displays and organizes your vault. Free.

### 2. Install Claude Code

[Claude Code](https://claude.ai/code) runs the commands. Available as a CLI and as a VS Code/JetBrains extension. Once installed, open it in the vault folder.

### 3. Clone the vault

Simply run this command in your terminal to get the vault files, run it from the directory where you want to create the vault, if you are lost navigating within a terminal check this: [How to navigate the terminal](https://medium.com/@twkriege/navigating-your-computer-using-the-terminal-the-first-intimidating-lesson-in-learning-to-code-ed81601f5389). You can name the folder whatever you want (here, `my-vault`):

```bash
git clone https://github.com/Zoomma1/get-your-life-together my-vault
```

Open the `my-vault/` folder in Obsidian: **File > Open Vault > select the folder**.

### 4. Run `/setup`

In Claude Code, from inside the vault folder:

```
/setup
```

`/setup` configures the vault to your situation: your name, your folders, your habits. Run it once.

### 5. Your first command

```
/today
```

Loads your day's context: agenda, active projects, pending tasks. Run it every morning.

---

## What's inside

Skills are commands you invoke from Claude Code. The ones you'll use first:

| Skill | When |
|-------|------|
| `/today` | Every morning. Day plan adapted to your energy |
| `/my-world` | When you've lost track. Big picture, no planning |
| `/closeday` | Every evening. Recap and carry-over |
| `/create-ticket` | Capture an idea or task without breaking your focus |
| `/recall` | Find something in the vault without digging manually |
| `/workon` | Load a project's context and get to work |
| `/stranger` | See yourself from the outside. Based only on what you've written |

There are about forty more, covering vault analysis, introspection, knowledge management, project tracking.

---

## Philosophy

Most productivity systems assume a certain kind of brain. GTD, time-blocking, todo apps: designed for people who don't forget things mid-sentence, who don't stall from cognitive overload, who can hold a plan together for more than twenty minutes.

This vault doesn't make that assumption.

The idea is simple: don't carry things in your head. Capture them, let Claude hold them, get them back when you need them. It sounds obvious, but it's surprisingly hard to find a setup that actually works that way without requiring a week of configuration first.

---

## Reference

### Prerequisites

- [Obsidian](https://obsidian.md) — to visualize and navigate the vault
- [Claude Code](https://claude.ai/code) — CLI or IDE extension (the engine behind all skills)
- [Node.js](https://nodejs.org) ≥ 18 — required for Claude Code hooks

### Vault structure

```
vault/
├── [NOTES_FOLDER]/          ← daily journal (configurable via /setup)
├── [ME_FOLDER]/             ← personal notes, profile
├── [HOBBIES_FOLDER]/        ← hobby projects
├── [KNOWLEDGE_FOLDER]/      ← capitalized knowledge base
├── [PROJECTS_FOLDER]/       ← active projects (kanban, tickets, README)
├── 05 - Studies/            ← (optional) studies
├── 06 - Work/               ← (optional) work
├── [INBOX_FOLDER]/          ← temporary capture
└── 99 - Claude Code/
    ├── Skills/
    ├── config/
    │   ├── vault-settings.md   ← all parameters (folders + date format)
    │   └── digest-sources.md
    ├── ADR/
    ├── Sessions/
    ├── command-tracker.md
    └── MEMORY.md
```

### All skills

#### Daily

| Skill | Description |
|-------|-------------|
| `/today` | Loads the day's context — daily note, emails, active projects, overdue commands |
| `/my-world` | Loads the global context — last 5 daily notes, recent sessions, no planning |
| `/closeday` | Closes the day — recap, task transfer, kanban update |
| `/closeyesterday` | Closes yesterday — when `/closeday` wasn't run the night before |

#### Weekly / Monthly

| Skill | Description |
|-------|-------------|
| `/closeweek` | Weekly review from daily notes and sessions |
| `/closemonth` | Monthly review — projects, learnings, drift |

#### Vault analysis

| Skill | Description |
|-------|-------------|
| `/map` | Topological map — clusters, dead zones, critical bridges |
| `/link` | Proposes `[[]]` links between notes (pair-programming) |
| `/emerge` | Detects idea clusters that form something new |
| `/drift` | Recurring uncapitalized ideas from the last 15 days |
| `/harvestdeep` | Full vault analysis over 30 days — patterns, signals, inbox |
| `/harvest` | Quick capitalization of the last 7 days |

#### Knowledge

| Skill | Description |
|-------|-------------|
| `/process` | Turns a resource (link, PDF, video) into a structured Knowledge note |
| `/recall` | Finds the 1-3 most relevant notes to the current context |
| `/ghost` | Answers a question in your voice, drawing from the vault |
| `/trace` | Traces the evolution of an idea over time |
| `/compound` | Answers a strategic question at three moments in the vault |
| `/connect` | Finds conceptual bridges between two domains of the vault |
| `/digest` | Aggregates and summarizes external sources (RSS, web) |

#### Projects

| Skill | Description |
|-------|-------------|
| `/workon` | Loads a ticket/feature context and starts a work session |
| `/create-ticket` | Creates a ticket (note file + kanban insertion) |
| `/specs` | Generates specs for a ticket |
| `/refine` | Challenges a ticket before implementation |

#### Introspection

| Skill | Description |
|-------|-------------|
| `/stranger` | Portrait by an outside observer — based only on the vault |
| `/ideas` | Extracts actionable ideas from vault patterns (30 days) |

#### Meta

| Skill | Description |
|-------|-------------|
| `/setup` | Initial vault configuration (profile, CLAUDE.md, hooks) |
| `/recapsession` | Writes the recap of the current Claude Code session |
| `/resumelastsession` | Reloads the context of the last session |
| `/evaluateskills` | Evaluates skill quality — detects ambiguities and gaps |

### Typical workflow

```
Morning       → /today         (day context)
Throughout    → /workon        (focus on a topic)
              → /recall        (search the vault)
              → /create-ticket (capture an idea)
Evening       → /closeday      (close the day)

Week
  Friday      → /closeweek
  Sunday      → /drift         (recurring ideas)
              → /vault-link    (link orphans)

Month
  End of month → /map          (structural state)
               → /harvestdeep  (30-day patterns)
               → /closemonth
               → /stranger     (outside portrait)
```

### Advanced configuration

#### Change date format or folder names

Edit `99 - Claude Code/config/vault-settings.md`:

```
date_format: YYYY-MM-DD
daily_notes_folder: 00 - Daily notes
personal_folder: 01 - Me
hobbies_folder: 02 - Hobbies
knowledge_folder: 03 - Knowledge
projects_folder: 04 - Projects
inbox_folder: 09 - Inbox
```

All skills read this file automatically.

#### Add sources for /digest

Edit `99 - Claude Code/config/digest-sources.md` — add RSS or web URLs to aggregate.

#### Skill tracking

`99 - Claude Code/command-tracker.md` lists the last run of each skill. `/today` automatically flags overdue commands.

### Adding a project

```
[PROJECTS_FOLDER]/
└── My Project/
    ├── claude-code/
    │   └── README.md     ← context for Claude
    ├── Kanban.md         ← source of truth for tickets
    └── Todos/            ← individual tickets
```

Then add the project to `[PROJECTS_FOLDER]/INDEX.md` so `/today`, `/workon` and `/create-ticket` detect it automatically.
