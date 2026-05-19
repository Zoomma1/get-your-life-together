---
name: setup
description: Configure a Claude Code vault from scratch — generates a personal profile, CLAUDE.md, installs hooks and creates the 99 - Claude Code/ structure.
---

**Configure a Claude Code vault from scratch** — generates a personal profile, CLAUDE.md, installs hooks and creates the `99 - Claude Code/` structure.

**Invocation**: `/setup` — run once during installation, or re-run to regenerate CLAUDE.md without overwriting existing notes.

---

## Prerequisites

- Obsidian installed with the vault open
- Claude Code installed (`claude` available on the command line)
- Node.js installed (`node` available on the command line)

---

## Step 0 — Environment detection

Before any questions, silently collect:

```bash
# Absolute path of the vault (Claude Code current working directory)
pwd

# Claude home path
# Windows: %USERPROFILE%\.claude
# Mac/Linux: ~/.claude

# OS
node -e "console.log(process.platform)"
```

Store:
- `VAULT_PATH` — absolute path of the vault
- `CLAUDE_HOME` — absolute path to the user's `.claude` folder
- `OS_PLATFORM` — `win32` / `darwin` / `linux`

If `VAULT_PATH` does not contain a `99 - Claude Code/` folder → confirm with the user: *"I'm going to create the structure in `[VAULT_PATH]`. Is this the right vault?"*

---

## Step 1 — Personal profile (interactive essay)

Announce: *"I'll ask you questions in several rounds to create your personal profile. This file will help Claude get to know you and personalise its responses. There are no right or wrong answers — reply as freely as you like."*

Use this prompt to conduct the interview:

---

Proceed in rounds of questions. Start broad, then progressively refine:
- Round 1: who I am (identity, background, current situation)
- Round 2: what I do (work, projects, studies)
- Round 3: what I enjoy (hobbies, passions, interests)
- Round 4: how I think and work (methods, values, decision-making style)
- Round 5: specific questions based on what you learned from previous rounds

Rules:
- Maximum 5 questions per round, asked all at once
- Wait for answers before moving to the next round
- Questions in the next round must build on what the person said, not be generic
- No rephrasing of answers between rounds — go straight to the next questions
- If 5 rounds are not enough, freely add more
- At the end, write the essay in LANGUE, third person, structured in thematic sections, dense and factual — not lyrical

---

Once the essay is written:
- Store the first name / username in `NOM`
- **Ask for validation**: *"Here is your profile. Would you like to adjust anything before I save it?"*
- Write the essay to `[ME_FOLDER]/{{NOM}}.md` only after validation

---

## Step 2 — Claude preferences

Ask the following questions **all at once**:

1. **Working mode** — How do you want Claude to work with you?
   - **(A) Pair — default**: Claude guides and explains, you decide and act. Claude does nothing without your explicit request.
   - **(B) Autonomous**: Claude implements directly and summarises what it has done.

2. **Response style** — Which style do you prefer?
   - **(A) Short and direct — default**: concise, structured responses (lists, tables), straight to the point.
   - **(B) Detailed**: complete responses with context and examples.

3. **Language** — In which language do you want Claude to respond? (default: English)

4. **Daily note date format** — Which format do you use to name your daily notes?
   - **(A) YYYY-MM-DD — default**: 2026-04-11.md (ISO format, recommended)
   - **(B) DD-MM-YYYY**: 11-04-2026.md
   - **(C) MM-DD-YYYY**: 04-11-2026.md
   - **(D) Other**: specify the format

5. **Daily notes folder** — What is your daily notes folder called? (default: `00 - Daily notes`)

6. **Personal folder** — What is your personal notes folder called? (default: `01 - Me`)

7. **Hobbies folder** — What is your hobbies / leisure folder called? (default: `02 - Hobbies`)

8. **Knowledge folder** — What is your knowledge base called? (default: `03 - Knowledge`)

9. **Projects folder** — What is your projects folder called? (default: `04 - Projects`)

10. **Inbox folder** — What is your temporary capture folder called? (default: `09 - Inbox`)

11. **Digest sources** — The `/digest` skill monitors news sources for you each morning. Which sources do you want to follow? Examples: tech (Hacker News, Dev.to), AI (Anthropic blog), finance, world news, design... You can also say "none for now".

Store responses in `MODE_TRAVAIL`, `STYLE_REPONSE`, `LANGUE`, `DATE_FORMAT`, `DAILY_NOTES_FOLDER`, `PERSONAL_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`, `DIGEST_SOURCES`.

---

## Step 3 — File generation

### 3.1 — `99 - Claude Code/` structure

Create the following folders if they do not exist:

```
[VAULT_PATH]/99 - Claude Code/
  Skills/
  Sessions/
  config/
  memory/
  ADR/
```

Create the following files if they do not exist:

**`99 - Claude Code/MEMORY.md`**:
```markdown
# MEMORY.md — Index

<!-- Index of persistent memories — generated and updated automatically by Claude -->
```

**`99 - Claude Code/command-tracker.md`**:
```markdown
# Command Tracker

Updated automatically by each skill after execution.
Read by `/today` to detect overdue commands.

| Command      | Last run | Recommended frequency |
| ------------ | -------- | --------------------- |
| /harvest     | —        | 7 days                |
| /map         | —        | 7 days                |
| /link        | —        | 7 days                |
| /harvestdeep | —        | 30 days               |
| /drift       | —        | 7 days                |
| /emerge      | —        | 15 days               |
| /closeweek   | —        | 7 days                |
| /closemonth  | —        | 30 days               |
| /my-world    | —        | 1 day                 |
| /stranger    | —        | 30 days               |
| /trace       | —        | 30 days               |
| /evaluateskills | —     | 30 days               |
```

### 3.1b — User folders

For each of the following folders, **check for existence before any action**:

| Variable | Path to check |
|----------|---------------|
| `DAILY_NOTES_FOLDER` | `[VAULT_PATH]/[DAILY_NOTES_FOLDER]/` |
| `PERSONAL_FOLDER` | `[VAULT_PATH]/[PERSONAL_FOLDER]/` |
| `HOBBIES_FOLDER` | `[VAULT_PATH]/[HOBBIES_FOLDER]/` |
| `KNOWLEDGE_FOLDER` | `[VAULT_PATH]/[KNOWLEDGE_FOLDER]/` |
| `PROJECTS_FOLDER` | `[VAULT_PATH]/[PROJECTS_FOLDER]/` |
| `INBOX_FOLDER` | `[VAULT_PATH]/[INBOX_FOLDER]/tickets/` |

Rule: **if the folder exists → do not touch it, use it as-is**. If absent → create it.

For `[PROJECTS_FOLDER]` only: if the folder is created (did not previously exist), also create `[PROJECTS_FOLDER]/INDEX.md`:

```markdown
# Projects Index

Read automatically by `/today`, `/workon`, `/create-ticket`, `/drift`, `/harvestdeep`.

## Format

Add one line per active project:

| Project | Path | Kanban |
|---------|------|--------|
| Example | `[PROJECTS_FOLDER]/Example/` | `[PROJECTS_FOLDER]/Example/Kanban.md` |

## Active projects

<!-- Add projects here during setup or manually -->
```

If `[PROJECTS_FOLDER]/INDEX.md` already exists → do not overwrite it.

---

### 3.1d — vault-settings.md

Create `99 - Claude Code/config/vault-settings.md`:

```markdown
# Vault Settings

date_format: [DATE_FORMAT]
daily_notes_folder: [DAILY_NOTES_FOLDER]
personal_folder: [PERSONAL_FOLDER]
hobbies_folder: [HOBBIES_FOLDER]
knowledge_folder: [KNOWLEDGE_FOLDER]
projects_folder: [PROJECTS_FOLDER]
inbox_folder: [INBOX_FOLDER]
langue: [LANGUE]
```

Where:
- `[DATE_FORMAT]` → format chosen in Step 2 (e.g. `YYYY-MM-DD`, `DD-MM-YYYY`)
- `[DAILY_NOTES_FOLDER]` → chosen folder name (e.g. `00 - Daily notes`)
- `[LANGUE]` → language chosen in Step 2 (e.g. `EN`, `FR`, `ES`)

### 3.2 — CLAUDE.md

Read `99 - Claude Code/Templates/CLAUDE.md.template`.

Interpolate placeholders:
- `{{NOM}}` → value of `NOM`
- `{{LANGUE}}` → value of `LANGUE`
- `{{PERSONAL_FOLDER}}` → value of `PERSONAL_FOLDER`
- `{{MODE_TRAVAIL}}` → block corresponding to the chosen option (A or B):

  **Option A (pair)**:
  ```
  Claude acts as a **guide and pair**, not an autonomous assistant.
  - Explain the approach, let {{NOM}} decide and act
  - Suggest directions, not ready-made solutions
  - Ask questions when multiple approaches exist

  **When {{NOM}} says "do it"**: act directly + summary of what was done and why.
  **Never act without explicit request**: no undiscussed files, no chained tasks without validation.
  ```

  **Option B (autonomous)**:
  ```
  Claude acts **autonomously and directly**.
  - Implement without waiting for validation at each step
  - Summarise what was done at the end of a task
  - Ask only when a structural decision arises
  ```

- `{{STYLE_REPONSE}}` → corresponding block:

  **Option A (short)**:
  ```
  Short, direct responses — get to the point, no filler sentences.
  Structured format: tables, lists, code blocks where relevant.
  Explain the why, not just the how.
  ```

  **Option B (detailed)**:
  ```
  Detailed responses with full context and examples.
  Prose format with clear structure.
  ```

Write the result to `[CLAUDE_HOME]/CLAUDE.md`.

**If the file already exists** → ask for confirmation: *"A CLAUDE.md already exists. Should I replace it?"*

### 3.3 — vault-config.json

Create `[CLAUDE_HOME]/vault-config.json`:

```json
{
  "vaultPath": "[VAULT_PATH]",
  "userName": "[NOM]"
}
```

### 3.4 — digest-sources.md

If `DIGEST_SOURCES` is not "none" → create `99 - Claude Code/config/digest-sources.md`:

```markdown
# Digest Sources

Sources monitored by /digest each morning.

## Active sources

[list of chosen sources]

## Expected format
- Hacker News: top stories of the day
- Anthropic blog: new articles
- Dev.to: trending articles
- Others: adapt per source
```

---

## Step 4 — Hook installation

Display the command and ask for confirmation before each action.

### 4.1 — Copy hooks

```bash
# Create hooks folder if needed
mkdir -p [CLAUDE_HOME]/hooks

# Copy the 3 hooks from 99 - Claude Code/
cp "[VAULT_PATH]/99 - Claude Code/hooks/recap-session.js" "[CLAUDE_HOME]/hooks/"
cp "[VAULT_PATH]/99 - Claude Code/hooks/retention-purge.js" "[CLAUDE_HOME]/hooks/"
cp "[VAULT_PATH]/99 - Claude Code/hooks/secret-guard.js" "[CLAUDE_HOME]/hooks/"
```

### 4.2 — settings.json

Read `99 - Claude Code/Templates/settings.json.template`.

Interpolate:
- `{{VAULT_PATH}}` → absolute path of the vault
- `{{CLAUDE_HOME}}` → absolute path to `.claude`

**If `[CLAUDE_HOME]/settings.json` already exists** → merge only the `hooks` and `permissions.allow` sections without overwriting other existing settings. Ask for confirmation first.

**If absent** → write the interpolated template directly.

### 4.3 — CLAUDE.md symlink

Create a symlink so that `99 - Claude Code/CLAUDE.md` points to `[CLAUDE_HOME]/CLAUDE.md`:

**Windows**:
```bash
cmd /c mklink "[VAULT_PATH]\99 - Claude Code\CLAUDE.md" "[CLAUDE_HOME]\CLAUDE.md"
```

**Mac/Linux**:
```bash
ln -sf "[CLAUDE_HOME]/CLAUDE.md" "[VAULT_PATH]/99 - Claude Code/CLAUDE.md"
```

If `99 - Claude Code/CLAUDE.md` already exists (symlink or file) → delete it before creating the symlink.

---

## Step 5 — Summary and next steps

Display a summary of what was created:

```
✅ Personal profile      [ME_FOLDER]/[NOM].md
✅ CLAUDE.md             ~/.claude/CLAUDE.md (+ vault symlink)
✅ vault-config.json     ~/.claude/vault-config.json
✅ Hooks installed       recap-session.js, retention-purge.js, secret-guard.js
✅ Vault structure       99 - Claude Code/ (Skills, Sessions, config, memory, ADR)
✅ Command tracker       99 - Claude Code/command-tracker.md
[if digest] ✅ Digest sources  99 - Claude Code/config/digest-sources.md
✅ Skill stubs           ~/.claude/commands/ ([N] files)
```

### 5.1 — Create stubs for all skills

> The `setup` stub itself is created by the bootstrap script (`install.sh` /
> `install.ps1`) **before** `/setup` can run — that is what makes `/setup`
> invocable on a fresh clone. This step regenerates every stub idempotently.
> **The stub format below must stay byte-for-byte identical to the one the
> bootstrap script writes** — any divergence makes a `/setup` re-run rewrite
> the bootstrap's stubs and reintroduces drift.

For each `.md` file in `[VAULT_PATH]/99 - Claude Code/Skills/` (except `INDEX.md`):

Read the skill's `description:` value from its YAML frontmatter, then create
`[CLAUDE_HOME]/commands/[skill-name].md` with this content:

```
---
description: [skill's description value, verbatim from its frontmatter]
---
Read the [name] skill from `[VAULT_PATH]/99 - Claude Code/Skills/[name].md` and execute it.
```

If a skill has no `description:` in its frontmatter, omit the frontmatter
block and write only the `Read the … execute it.` line.

Example (`~/.claude/commands/today.md`):
```
---
description: Generate a day plan adapted to your energy, work/personal/hobby hours and recent feedback
---
Read the today skill from `[VAULT_PATH]/99 - Claude Code/Skills/today.md` and execute it.
```

**Note**: if a stub already exists for a skill, do not overwrite it — move to the next.

Display the number of stubs created at the end.

Then indicate next steps:
1. Install Obsidian if not done — open this folder as a vault
2. Run `/today` to get started

---

## Absolute rules

- **Never overwrite** `[ME_FOLDER]/[NOM].md` if the file exists — ask for confirmation
- **Never overwrite** `settings.json` without merging — always preserve existing settings
- **Always ask for confirmation** before any operation on `~/.claude/` (outside the vault)
- **Idempotent**: re-running `/setup` regenerates CLAUDE.md and vault-config.json, does not touch existing notes
