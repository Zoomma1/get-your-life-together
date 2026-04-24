---
name: explore-codebase
description: Analyze a codebase architecture and produce a structured report (stack, organization, key points) in the chat. Trigger as soon as Victor provides a repo path to explore, says "analyze this project", "what does this code do", "look at the architecture of [project]", "explore this repo", or wants to document an old dev project before creating a Past Project note.
---

# Skill `/explore-codebase`

Explores a repo and produces a structured architecture report in the chat.

## Input

`$ARGUMENTS` = absolute path of the repo to analyze.

If no path provided → ask: "What is the repo path?" and wait.

---

## Step 1 — Verify the path

Verify that the path exists. If missing → "Path not found: [path]. Correct?" and wait.

---

## Step 2 — README (optional)

Use Glob to search for `README*` at the repo root (depth 1 only).

- If found → read the first 50 lines and extract a 2-3 sentence summary
- If missing → note "Missing" and continue

---

## Step 3 — Configuration & Stack

Use Glob to search for config files at the root:
`package.json`, `pom.xml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `build.gradle`, `composer.json`, `Gemfile`, `.csproj`, `pyproject.toml`, etc.

For each file found:
- Read the content (max 100 lines)
- Extract: primary language, framework/runtime, 5–10 key dependencies
- If multiple configs → classify by priority (ex: package.json + Dockerfile → Node + Docker)

If **no config found** → note "No config detected — structural analysis only" and continue to Step 4.

---

## Step 4 — Folder structure

Use Glob to explore the structure with `**/*` (depth 2-3 suggested).

Exclude: `node_modules/`, `.git/`, `.github/`, `dist/`, `build/`, `target/`, `__pycache__/`, `.venv/`, `venv/`, `.next/`, `.nuxt/`, `out/`, `coverage/`.

Produce a condensed tree (max 15 lines) showing:
- Main folders and their typical content
- Paths to sources (ex: `src/`, `lib/`, `app/`, `backend/`)
- Entry files if detected

---

## Step 5 — Entry points (optional)

Use Grep to search `main.*`, `index.*`, `App.*`, `server.*` at the root and in `src/` (max 10 results).

Select max 2 relevant files. Read the first 50 lines of each to understand the entry point.

---

## Step 6 — Architecture & Patterns

By examining the structure, config, and entry points, identify the architectural pattern:

- **MVC** : controllers/, models/, views/
- **Layered** : controllers/, services/, repositories/, entities/
- **Feature-based** : features/feature-A/, features/feature-B/
- **Monolithic** : everything in src/ without clear separation
- **Monorepo** : packages/, workspaces/, multiple package.json
- **Other** : describe briefly

Justify in 1 sentence based on evidence in the structure.

---

## Step 7 — Final report

Assemble the report by combining all previous elements. Produce in chat this exact format:

```
## [Project name]

**Stack** : [language(s) + framework(s) + runtime]
**Architecture** : [identified pattern] — [1 sentence justification]

**Structure** :
[condensed tree, 10-15 lines]

**Key dependencies** : [5-10 main libs, or "No config detected"]

**Notable points** :
- [observation on patterns, structure, tech choices]
- [visible technical debt or obvious limitation]
- [example: "Monorepo without Lerna/pnpm", "TypeScript strict mode disabled", etc.]
- [max 5 points]

**README** : [2-3 sentence summary, or "Missing"]
```

---

## Absolute rules

- Never create a file, never modify the analyzed repo
- Report only in the chat — no vault note created
- Analysis remains descriptive: do not recommend changes or critique project choices
- If a step lacks data (no README, no config, no clear entry point) → continue anyway — the report is partial but complete
