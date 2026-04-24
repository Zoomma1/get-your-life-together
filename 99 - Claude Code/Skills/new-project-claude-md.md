---
name: new-project-claude-md
description: Generates Claude Code files for a new project — project CLAUDE.md (< 50 lines, strict filter) and claude-code/README.md (codebase context). Analyzes local repo if a path is provided.
---

Executes the workflow for generating Claude Code files for a new project.

## Step 1 — Collect info or detect a path

**Option A : Local path provided**
- Victor provides a path → verify that folder exists and contains source code
- Skip directly to step 2 (analyze codebase)

**Option B : No path**
- Ask Victor:
  - Project name
  - Primary tech stack (ex: "Express + TypeScript + Prisma + Angular")
  - Real key commands: dev, test, build, migrate
  - Local ports if applicable
  - GitHub repo URL (optional)
- Skip to step 3 (generate without analysis)

## Step 2 — Analyze codebase (if local path available)

From the provided local path, search and read in this order (try each file; continue if missing):

**Config files to read:**
1. `package.json` → name, scripts (dev, test, build, migrate), main dependencies
2. `pom.xml` → if Java, groupId, artifactId, dependencies
3. `docker-compose.yml` or `docker-compose.yaml` → services, ports, startup order
4. `.env.example` or `.env.sample` → required environment variables
5. `prisma/schema.prisma` → if Prisma ORM
6. Entry point: `src/index.ts`, `src/main.ts`, `src/app.ts`, `main.py`, etc.
7. `README.md` existing → startup instructions

**Analyze folder structure:**
- Identify primary structure: `src/` direct or monorepo (`client/`, `server/`, `frontend/`, `backend/`) ?
- List first-level folders under identified source folder
- Identify layers: routes, services, controllers, features, models, etc.
- Spot front vs back if monorepo

**Fallback if files missing:**
- If no `package.json` AND no `pom.xml` → ask Victor for stack manually
- If no docker-compose → search ports in scripts or `.env.example`
- If no `.env.example` → mark ports/vars as `[To confirm with Victor]`

**Deduce from this reading:**
- Tech stack (framework, ORM, test runner, etc.)
- Real key commands (from npm/Maven/Gradle scripts)
- Local ports (from docker-compose, .env or scripts)
- Key files with their role (entry points, config, shared services)
- Gotchas: required startup order, required env vars, custom commands

## Step 3 — Generate project CLAUDE.md

Apply strict filter: **"Would Claude make an error without this line?"**

**Include:**
- Non-obvious or non-standard commands (ex : required startup order, custom commands)
- Conventions differing from language or framework defaults
- Methodological rules if applicable (TDD, DDD, etc.)
- Environment gotchas (required variables, services to start first, etc.)
- Non-standard ports

**Exclude:**
- Standard language conventions (indentation, basic naming)
- API docs or endpoint descriptions
- Anything Claude can infer directly from code
- Information already in project README Claude Code

**Target format (< 50 lines) :**

```markdown
# CLAUDE.md — [Project name]

## Commands

| Command | Folder | Action |
|---------|--------|--------|
| `[dev command]` | `[folder]/` | Start dev |
| `[test command]` | `[folder]/` | Run tests |
| `[migrate command]` | `[folder]/` | Apply DB migrations |

## Architecture

[3-5 lines max describing structure]

## Mandatory rules

[Only non-obvious and project-specific]
```

If no non-obvious mandatory rule exists → omit section rather than invent.

**Target path:** `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/CLAUDE.md`

## Step 4 — Generate claude-code/README.md

Use template `{VAULT_PATH}/Ressources/Templates/Claude Code - Project template.md` as structural base.

Fill each section with collected information:

- **Header** : name + short description + repo URL if known
- **Stack** : complete table with all identified layers
- **Running the project** : real commands in correct order (include startup order gotchas)
- **Architecture** : folder structure as observed, separated front/back if monorepo
- **Key files** : table of important files with their actual role
- **Associated skills** : select from `99 - Claude Code/Skills/INDEX.md` relevant skills for detected stack
- **Non-fillable sections** → keep the callout `> [!danger] To be completed by Victor`

**Target path:** `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/claude-code/README.md`

## Step 5 — Propose and validate

Display both generated files to Victor in chat:
- `CLAUDE.md` in markdown code block with lang `markdown`
- `claude-code/README.md` in markdown code block with lang `markdown`

Clearly indicate target paths before each block.

Wait for Victor's explicit validation (ex: "ok", "looks good", "change X") before moving to step 6.

## Step 6 — Create structure and write files

Once Victor validates (or requests changes, iterate step 5 → 6):

1. Verify parent folder `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/` exists — create if needed
2. Create `claude-code/` subfolder if doesn't exist
3. Write `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/CLAUDE.md` (file Write)
4. Write `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/claude-code/README.md` (file Write)
5. Confirm both complete paths to Victor with summary: "✓ Files created: CLAUDE.md + claude-code/README.md"

## Absolute rules

- **Mandatory validation** : never write files before Victor's explicit validation (wait for "ok", "looks good", or explicit refactor)
- **Strict CLAUDE.md filter** : if information wouldn't pass the test "Would Claude make an error without this line?", exclude it
- **No invention** : never invent commands, ports or conventions — if uncertain, mark `[To confirm with Victor]`
- **Mandatory template** : always start from template `{VAULT_PATH}/Ressources/Templates/Claude Code - Project template.md` for README
- **Fallback if file missing** : if config file doesn't exist, search in proposed step 2 order — if all missing, mark info as `[To confirm with Victor]`
