---
name: graph
description: Generate or update a dev project's knowledge graph via graphify, then produce a curated graph-context.md (~40 lines) from GRAPH_REPORT.md for loading into Claude context. Invoke when: first session on a new dev project, or manual update after major refactor. E.g., /graph, /graph --update
---

Generates a knowledge graph via graphify then produces curated and annotated `graph-context.md`.

## Step 1 — Identify target

Ask for the repo path. Output → `.claude/graph-context.md`

**Wait for the response before continuing.**

## Step 2 — Check existing files

Check if `graph-context.md` exists at the target location.

**If yes** → check if `graphify-out/GRAPH_REPORT.md` exists as well:
- **GRAPH_REPORT.md present** → propose three options: "A graph-context.md and a GRAPH_REPORT.md exist. **Recure** (synthesis from existing report, no re-run graphify) / **Update** (--update, modified files only) / **Start fresh**?"
  - If "Recure" → go directly to **Step 4** (manual synthesis from existing GRAPH_REPORT.md)
- **GRAPH_REPORT.md absent** → ask: "A graph-context.md exists. **Update** (--update, modified files only) or **Start fresh**?"

**Wait for the response.**

**If no** → check if `graphify-out/GRAPH_REPORT.md` already exists at the target workspace root.

- **GRAPH_REPORT.md present** → graphify already ran but curation didn't happen. Go directly to **Step 4** (manual synthesis from existing report — no need to re-run).
- **GRAPH_REPORT.md absent** → continue to Step 3 (run graphify).

## Step 3 — Run graphify

Display the command, explain in one sentence, **wait for {USER_NAME}'s OK**:

```bash
cd "<repo-path>" && graphify . [--update]
```

Run after confirmation. Wait for completion.

## Step 4 — Curation of graph-context.md

Read `graphify-out/GRAPH_REPORT.md` and produce a draft `graph-context.md` curated following this exact format:

```markdown
# graph-context — [NAME] (YYYY-MM-DD)
# Generated from graphify-out/GRAPH_REPORT.md (run YYYY-MM-DD)
# [X] nodes · [Y] edges · [Z] communities[· Stack: ... if dev project]

## God Nodes (central abstractions)
1. `[Name]` — [N] edges ([contextual annotation: role in project/vault])
...

## Main communities
- **[Group]**: [members or description]
...

## Key hyperedges
- **[Feature/Group]**: [linked members]
...

## Surprising connections (INFERRED)
- `[A]` → `[B]` ([short context])
...
```

**Curation rules:**
- God Nodes: keep top 10, add contextual annotation to each (not just edge count — explain role)
- Communities: group by functional domain, don't list exhaustively (aim for ~10 groups max)
- Hyperedges: keep only significant groups (complete feature, stack, business cluster)
- Surprising connections: INFERRED only, max 5, ignore obvious false positives (e.g., Istanbul → source files)
- Target size: ~40 lines — if more, re-group

Present draft to {USER_NAME}: "Here's the draft — want to annotate or adjust before I write?"

**Wait for validation (or "looks good") before writing the file.**

## Step 5 — Writing and post-run

Write the validated `graph-context.md` to the target location.

### First run (no --update)
Propose: "Want to install the pre-commit hook so the graph updates automatically after each commit?"

If yes → display the command to run from the repo root:
```bash
graphify hook install
```
Clarify: the hook uses AST without LLM for TS/JS files — instant rebuild.

## 🚫 Absolute rule

**Never run graphify on the vault** (`{VAULT_PATH}`). The vault is permanently excluded — LLM cost and execution time are disproportionate compared to INDEX.md files that serve the same purpose. If {USER_NAME} asks for `/graph` on the vault, refuse and explain.

## Technical notes

- `.graphifyignore` at root for exclusions (gitignore syntax) — e.g., FSTG: `client/coverage/` + `graphify-out/`
- Don't use `tee` to capture stdout — GRAPH_REPORT.md is the source, not CLI output
