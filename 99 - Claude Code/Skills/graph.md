---
name: graph
description: Generates or updates the knowledge graph of a dev project via graphify, then produces a curated graph-context.md (~40 lines) from GRAPH_REPORT.md for loading in Claude context. Invoke when: first session on new dev project, or manual update after major refactor. Ex: /graph, /graph --update
---

Generates a knowledge graph via graphify then produces a curated and annotated `graph-context.md`.

## Step 1 — Identify the target

Ask for the repo path. Output → `.claude/graph-context.md`

**Wait for response before continuing.**

## Step 2 — Check existing

Verify if `graph-context.md` exists at the target location.

**If yes** → ask: "A graph-context.md exists. **Update** (--update, modified files only) or **start fresh**?"

**Wait for response.**

**If no** → check if `graphify-out/GRAPH_REPORT.md` already exists at target workspace root.

- **GRAPH_REPORT.md present** → graphify has already run but curation hasn't. Skip directly to **Step 4** (manual synthesis from existing report — no need to re-run).
- **GRAPH_REPORT.md absent** → continue to Step 3 (run graphify).

## Step 3 — Run graphify

Display the command, explain in one sentence, **wait for OK from Victor**:

```bash
cd "<repo-path>" && graphify . [--update]
```

Run after confirmation. Wait for completion.

## Step 4 — Curate graph-context.md

Read `graphify-out/GRAPH_REPORT.md` and produce a draft `graph-context.md` following this exact format:

```markdown
# graph-context — [NAME] (YYYY-MM-DD)
# Generated from graphify-out/GRAPH_REPORT.md (run YYYY-MM-DD)
# [X] nodes · [Y] edges · [Z] communities [· Stack: ... if dev project]

## God Nodes (central abstractions)
1. `[Name]` — [N] edges ([contextual annotation: role in project/vault])
...

## Main communities
- **[Group]** : [members or description]
...

## Key hyperedges
- **[Feature/Group]** : [linked members]
...

## Surprising connections (INFERRED)
- `[A]` → `[B]` ([short context])
...
```

**Curation rules:**
- God Nodes: keep top 10, add contextual annotation to each (not just edge count — explain the role)
- Communities: group by functional domain, don't list exhaustively (aim for ~10 max groups)
- Hyperedges: keep only significant groups (complete feature, stack, business cluster)
- Surprising connections: INFERRED only, max 5, ignore obvious false positives (ex: Istanbul → source files)
- Target size: ~40 lines — if more, re-group

Present draft to Victor: "Here's the draft — want to annotate or adjust before I write it?"

**Wait for validation (or "looks good") before writing file.**

## Step 5 — Write and post-run

Write validated `graph-context.md` to target location.

### First run (no --update)
Propose: "Want to install the pre-commit hook so the graph updates automatically after each commit?"

If yes → display command to run from repo root:
```bash
graphify hook install
```
Clarify: the hook uses AST without LLM for TS/JS files — instant rebuild.

## 🚫 Absolute rule

**Never run graphify on the vault** (`{VAULT_PATH}`). The vault is permanently excluded — LLM cost and execution time disproportionate to INDEX.md files that fulfill the same role. If Victor requests `/graph` on the vault, refuse and explain.

## Technical notes

- `.graphifyignore` at root for exclusions (gitignore syntax) — ex FSTG: `client/coverage/` + `graphify-out/`
- Don't use `tee` to capture stdout — GRAPH_REPORT.md is the source, not CLI output
