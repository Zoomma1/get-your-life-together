---
name: new-project-claude-md
description: Generate Claude Code files for a new project — project CLAUDE.md (<50 lines, strict filter) and claude-code/README.md (codebase context). Analyze local repo if a path is provided.
---

Execute the workflow to generate Claude Code files for a new project.

## Step 1 — Collect info or detect a path

**Option A: Local path provided**
- {USER_NAME} provides a path → verify folder exists and contains source code
- Move directly to step 2 (codebase analysis)

**Option B: No path**
- Ask {USER_NAME}:
  - Project name
  - Main technical stack (ex: "Express + TypeScript + Prisma + Angular")
  - Real key commands: dev, test, build, migrate
  - Local ports if applicable
  - GitHub repo URL (optional)
- Move to step 3 (generation without analysis)

## Step 2 — Analyze the codebase (if local path available)

From the local path provided, search and read in this order (try each file; continue if absent):

**Config files to read:**
1. `package.json` → name, scripts (dev, test, build, migrate), main dependencies
2. `pom.xml` → if Java, groupId, artifactId, dependencies
3. `docker-compose.yml` or `docker-compose.yaml` → services, ports, startup order
4. `.env.example` or `.env.sample` → required environment variables
5. `prisma/schema.prisma` → if using Prisma ORM
6. Entry point: `src/index.ts`, `src/main.ts`, `src/app.ts`, `main.py`, etc.
7. `README.md` existing → startup instructions

**Analyze folder structure:**
- Identify main structure: `src/` direct or monorepo (`client/`, `server/`, `frontend/`, `backend/`)?
- List first-level folders under identified source directory
- Identify layers: routes, services, controllers, features, models, etc.
- Spot front vs back if monorepo

**Fallback if files missing:**
- If no `package.json` AND no `pom.xml` → ask {USER_NAME} for stack manually
- If no docker-compose → search for ports in scripts or `.env.example`
- If no `.env.example` → mark ports/vars as `[To confirm by {USER_NAME}]`

**Deduce from this reading:**
- Technical stack (framework, ORM, test runner, etc.)
- Real key commands (from npm/Maven/Gradle scripts)
- Local ports (from docker-compose, .env or scripts)
- Key files with their roles (entry points, config, shared services)
- Gotchas: mandatory startup order, required env vars, custom commands

## Step 3 — Generate project CLAUDE.md

Apply strict filter: **"Would Claude make an error without this line?"**

**Include:**
- Non-obvious or non-standard commands (ex: mandatory startup order, custom commands)
- Conventions differing from language/framework defaults
- Methodological rules if applicable (TDD, DDD, etc.)
- Environment gotchas (required vars, services to start before, etc.)
- Ports if non-standard

**Exclude:**
- Standard language conventions (indentation, basic naming)
- API documentation or endpoint descriptions
- Anything Claude can directly infer from code
- Information already in project README or Claude Code README

**Target format (<50 lines):**

```markdown
# CLAUDE.md — [Project name]

## Commands

| Command | Folder | Action |
|---------|--------|--------|
| `[dev command]` | `[folder]/` | Launch dev |
| `[test command]` | `[folder]/` | Launch tests |
| `[migrate command]` | `[folder]/` | Apply DB migrations |

## Architecture

[Structure in 3-5 lines max]

## Mandatory rules

[Only what is non-obvious and project-specific]
```

If no non-obvious rules exist → omit the section rather than invent.

**Target path:** `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/CLAUDE.md`

## Step 4 — Generate claude-code/README.md

Use template `{VAULT_PATH}/Ressources/Templates/Claude Code - Project template.md` as structural base.

Fill each section with collected information:

- **Header**: name + short description + repo URL if known
- **Stack**: complete table with all identified layers
- **Launch the project**: real commands in correct order (include startup order gotchas)
- **Architecture**: folder structure as observed, separated front/back if monorepo
- **Key files**: table of important files with their actual role
- **Associated skills**: select from `99 - Claude Code/Skills/INDEX.md` skills relevant to detected stack
- **Non-fillable sections** → keep callout `> [!danger] To complete by {USER_NAME}`

**Target path:** `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/claude-code/README.md`

## Step 5 — Propose and validate

Display both generated files to {USER_NAME} in chat:
- `CLAUDE.md` in markdown code block with lang `markdown`
- `claude-code/README.md` in markdown code block with lang `markdown`

Clearly indicate target paths before each block.

Wait for explicit validation from {USER_NAME} (ex: "ok", "looks good", "change X") before moving to step 6.

## Step 6 — Create structure and write files

Once {USER_NAME} has validated (or requested changes, iterate step 5 → 6):

1. Verify parent folder `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/` exists — create if needed
2. Create `claude-code/` subfolder if not present
3. Write `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/CLAUDE.md` (file Write)
4. Write `{VAULT_PATH}/{PROJECTS_FOLDER}/[Project]/claude-code/README.md` (file Write)
5. Confirm both complete paths to {USER_NAME} with summary: "✓ Files created: CLAUDE.md + claude-code/README.md"

## Absolute rules

- **Validation mandatory**: never write files before explicit {USER_NAME} validation (wait for "ok", "looks good", or explicit refactor)
- **Strict filter CLAUDE.md**: if info doesn't pass "Would Claude make an error without this line?", exclude it
- **No invention**: never invent commands, ports or conventions — if uncertain, mark `[To confirm by {USER_NAME}]`
- **Template mandatory**: always start from template `{VAULT_PATH}/Ressources/Templates/Claude Code - Project template.md` for README
- **Fallback if file missing**: if config file doesn't exist, search in proposed order at step 2 — if all missing, mark info as `[To confirm by {USER_NAME}]`
