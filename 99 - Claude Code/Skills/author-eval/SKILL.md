---
name: author-eval
description: "Generates a complete eval.json for a Claude Code skill via 2-pass pipeline — local draft with Ollama (qwen2.5-coder:14b, $0, ~3min) then Sonnet refinement (claude -p headless, $0 via Max subscription). Launches final verify-eval for validation. Use when you want to cover a skill that doesn't yet have an eval.json, or in batch across multiple skills. Target: increase coverage of the skill auto-evaluation loop (ticket auto-evals-binaires-evaluateskills). Ex: /author-eval closeweek, /author-eval (no arg → interactive list), /author-eval --random 5 (batch)."
---

# Skill: /author-eval

Generates an `eval.json` for a Claude Code skill in two passes:
1. **Local draft** via Ollama (`qwen2.5-coder:14b`) — free, ~3 min/skill, draft quality.
2. **Sonnet refinement** via `claude -p` headless ($0 via Max subscription) — fixes fragile assertions, completes to ≥25, balances deterministic/llm.
3. **Final validation** via `runner.py --verify-eval` — confirms parser-clean against healthy skill.

The skill orchestrates — technical logic is in `99 - Claude Code/eval-loop/runner/{author_eval.py, refine_eval.py, runner.py}`.

## Step 1 — Resolve target slug

The argument is: `$ARGUMENTS`

Three modes:

1. **Explicit slug** (ex: `/author-eval closeweek`) — verify that `99 - Claude Code/Skills/<slug>.md` exists. If not → signal and stop. If `99 - Claude Code/eval-loop/evals/<slug>.json` already exists → ask {USER_NAME}: "Eval exists, overwrite or skip?"

2. **Flag `--random N`** (ex: `/author-eval --random 5`) — random selection of N skills **without existing eval.json**. List chosen slugs and ask for confirmation before batch.

3. **No argument** — list skills without eval.json (`comm -23 <sorted skills> <sorted evals>` or equivalent), present numbered list, ask {USER_NAME} which one to tackle (or multiple).

Convention: exclude `INDEX.md` from listing.

## Step 2 — Verify prerequisites

Before any launch:
- **Ollama up**: `curl -s http://localhost:11434/api/tags` should respond 200 with JSON containing a `models` array.
- **Model available**: `qwen2.5-coder:14b` must appear in `ollama list`. If missing → ask {USER_NAME} if they want `ollama pull qwen2.5-coder:14b` (~9 GB, ~3-5 min).
- **`claude -p` accessible**: `which claude` should return a path.

If a prerequisite is missing, signal and stop — no silent fallback.

## Step 3 — Pass 1: Ollama Draft

For each retained slug, execute:

```bash
cd "{VAULT_PATH}/99 - Claude Code/eval-loop/runner"
uv run python author_eval.py <slug> [--overwrite]
```

- Typical duration: ~3 min/skill on Mac M-series (model loaded in memory after first call).
- Script automatically chains a `verify-eval` pass at the end → draft report.
- If JSON parse fails → raw is saved as `<slug>.raw.txt` for debug. Signal to {USER_NAME} and proceed to next skill in batch mode.

## Step 4 — Pass 2: Sonnet Refinement

After each successful Ollama draft, execute:

```bash
uv run python refine_eval.py <slug>
```

- Script captures `--verify-eval --show-reasons` report, sends eval+skill+report to `claude -p --model sonnet`, parses output, overwrites eval, relaunches final verify-eval.
- Typical duration: ~30-60s/skill.
- Cost: $0 (covered by Max subscription, 5h window reset).

## Step 5 — Synthetic report

Present a summary table:

```
| Skill | Ollama Draft | Refine Sonnet | Final Verify |
|-------|--------------|---------------|--------------|
| closeweek | 27 assertions, 5 fragile | 31 assertions, 0 fragile | ✅ clean |
| ... | ... | ... | ... |
```

Then propose to {USER_NAME}:
1. **Inspect an eval** precisely (`cat 99 - Claude Code/eval-loop/evals/<slug>.json`)
2. **Re-refine** a specific skill (refine pass only, no re-draft)
3. **Next batch** (random selection or list)
4. **Stop**

## Step 6 — Session memory (optional)

If batch of 3+ skills, suggest to {USER_NAME} to add a line to the log in `99 - Claude Code/eval-loop/runner/runs/batch-YYYY-MM-DD.log` (created by launch bash script).

## Absolute rules

1. **Never fix the skill `.md` to pass an assertion**. Assertions are the subject of the authoring pass; the skill is ground truth (cf. SCHEMA.md "mandatory verification pass" + [[ADR-083-verify-eval-outillage-3e-categorie-investigation]]).
2. **Always chain draft → refine** unless {USER_NAME} explicitly asks to stop after draft (ex: to assess raw Ollama quality).
3. **No silent batch > 5 skills** without {USER_NAME} validation — cumulative RAM cost, duration, and prompt robustness not guaranteed across all skills.
4. **Preserve existing eval if refine fails**: don't overwrite with invalid output. Keep draft and signal.
5. **Tooling heuristic**: if multiple batch skills have same fragile symptoms (same recurring error message) → suspect runner/parser before refining individually (cf. ADR-083).

## Sources

- Skill created: 2026-05-26 (implementation session `--verify-eval` + Ollama tooling)
- Ticket: [[auto-evals-binaires-evaluateskills]]
- Schema: `99 - Claude Code/eval-loop/SCHEMA.md`
- Scripts: `runner.py` (verify), `author_eval.py` (Ollama draft), `refine_eval.py` (Sonnet)
- Related ADR: [[ADR-083-verify-eval-outillage-3e-categorie-investigation]]
