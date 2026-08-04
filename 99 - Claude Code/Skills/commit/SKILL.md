---
name: commit
description: "Guided commit on explicit /commit request — first launches a code-review of the uncommitted diff (review gate, effort sized to the diff), then breaks down changes into atomic commits ordered by layer, enforces two validations (file selection, then message), manages the branch (creation/switching with stash), then executes git add + git commit. Use whenever the user says /commit, \"commit this\", \"do the commit\", or wants to commit finished work. Never push, merge, rebase or reset. Never commit outside of this skill."
allowed-tools: Bash(git add *) Bash(git commit *) Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git branch *) Bash(git switch *) Bash(git checkout *) Bash(git stash *) Bash(git rev-parse *)
---

# /commit — guided commit

This skill executes commits **on behalf of {USER_NAME}**, which is an exception to his rule "only {USER_NAME} masters Git". This exception holds only because two explicit validations frame each commit: {USER_NAME} retains control over **what** is committed and **with what message**. If one of the two validations does not take place, the commit is not made. That's the whole point of the skill — losing these safeguards would amount to committing blindly.

> **Fallback outside vault (skill not loaded)**: in an external dev repo where `/commit` is not invocable (e.g. `evaluation-line-chart`, a repo outside vault without this skill), the rule "commit only via `/commit`" is replayed **manually**, with the same two gates: (1) display the files in the diff + the proposed breakdown → **explicit OK** from {USER_NAME}, then (2) propose the message → **explicit OK**, then `git add` + `git commit`. Never a one-pass commit without these two named validations. It's the spirit of the skill reproduced by hand, not a derogation from the Git rule. (Observed 2026-07-09, TMAFR-1094.)

## Invariants (non-negotiable)

These rules exist because the commands below are destructive or outgoing, and {USER_NAME} wants to remain sole master of them:

- 🚫 **Never** `git push`, `git merge`, `git rebase`, `git reset`. If one is necessary, **suggest** it to {USER_NAME}, do not execute it.
- 🚫 **Never** commit without the two validations (files + message).
- 🚫 **Never** commit outside of this skill (no commit "in passing" in another task).
- ✅ `git add`, `git commit`, `git switch`, `git checkout -b`, `git stash` are allowed — but **only** in the flow below.

`reset` is excluded intentionally: to commit only part of the changes, **stage selectively** (`git add <files>` or `git add -p`) instead of staging everything then deselecting. So we never unstage globally.

## Step 0 — Launch a code-review (review gate)

Committing means freezing into history. We review **before**, while the diff is fresh and uncommitted: applying a fix is trivial, rewriting a commit is not.

First verify we're in a repo:

```
git rev-parse --is-inside-work-tree
```

If the command fails (outside git repo), stop immediately ("Not in a git repo — nothing to commit"). Emit **no** mutant git command.

Then launch `/code-review` on the uncommitted diff (working tree + range), **sizing the effort to the diff**:
- Diff **trivial** (typo, mechanical rename, version bump, a few lines without logic) → skip the review, announce it ("trivial diff, I'm skipping the review") and move on to Step 1.
- Diff **100 % documentary** (all files under `docs/`, or `README*`, `CLAUDE.md`, `CONVENTIONS.md`, `*.md` doc files — **no** code files, executable config, or tests) → **propose** skipping the gate ("pure doc diff, I propose skipping the review — you confirm?") rather than launching it by default. The cost of an agent review exceeds its value on prose: it can neither compile nor execute nor compare to behavior. Still a **proposal**, not automatic skip — {USER_NAME} may want the review on normative docs (a `CONVENTIONS.md` that changes a team rule is not prose). (Cause: 2026-08-03, review explicitly skipped by {USER_NAME} on the tmafr README refactor — the skill had launched it systematically.)
- Diff **substantive** (business logic, endpoint, migration, destructive deletion, refactor) → review at adapted level (`high` by default; `ultra` if {USER_NAME} explicitly requests it — expensive).

**Gate**: present prioritized findings and **await {USER_NAME}'s decision** — which findings to fix *before* commit vs route to backlog/ticket. Do not proceed to Step 1 until the decision is given.
- If pre-commit corrections are decided → apply them, re-check (tests/lint green), **then** resume at Step 1 on the updated diff.
- If everything is routed to backlog / nothing to fix → move to Step 1.

The review is a **quality gate**, not a Git gate: it never replaces the two validations (files, message) of Steps 2-3.

## Step 1 — Branch correctly (branch gate)

{USER_NAME} often forgets to leave `main` before working. This step's role is to catch that case before commit, not to manage branching exhaustively.

```
git fetch --all --prune
git branch --show-current
git status --short
```

> ⚠️ **Always `fetch --all --prune` before reasoning about branches** — the local state of remotes lies as soon as a merge happens elsewhere (PR merged by a colleague, merge via GitHub/GitLab interface, work on another machine). Without fetch, we propose committing on a branch **already merged to the remote**, or creating a branch that already exists. The `--prune` also removes dead remote-tracking references, which suggest living branches. Cost: a few seconds. (Cause: 2026-08-03, the fetch revealed that `feat/xano-client-support` was already merged to `origin/main` — without it, the fix would have gone as a duplicate on a phantom branch.)

- **If the current branch is a main branch** (`main`, `master`, `develop`): flag the risk and **propose a feature branch** whose name is deduced from the diff / the conversation (e.g. `feat/tag-management`). Ask {USER_NAME} for validation (**gate** — do nothing without his agreement).
- **If we're already on a feature branch**: verify that the **diff scope matches the branch**. If the branch name carries a ticket identifier (`husker-14`, `TMAFR-1271`…) but the diff clearly concerns another ticket (`husker-17`, different prefix), **flag the branch/scope divergence** and propose a coherent switch/creation before breakdown (**gate** — do not commit on the wrong branch without {USER_NAME}'s agreement). If scope and branch agree, continue without proposing anything.

When {USER_NAME} validates a switch, handling uncommitted changes depends on the case:

| Case | Command | Why |
|------|---------|-----|
| **Create** a new branch from the current one | `git switch -c <name>` | Uncommitted changes follow automatically — no need to stash. |
| **Switch** to an **existing** branch with a dirty working tree | `git stash` → `git switch <name>` → `git stash pop` | `switch` would refuse (or overwrite) otherwise. Stash transports changes to the target. |

After a `stash pop`, check `git status`: if pop conflict occurs, stop and flag it to {USER_NAME} (do not attempt to resolve blindly).

## Step 2 — Break down into atomic commits (gate 1: files)

Present the complete state before any decision:

```
git status --short
git diff           # unstaged changes
git diff --staged  # already staged, if any
```

Propose an **atomic commits breakdown** — one commit = one coherent logical change. Order by dependency layer, so a review reads bottom-to-top:

```
Docs → DB migrations → Core/domain → Services → Presentation/UI → Tests
```

When the same file carries two distinct concerns, split it with `git add -p`.

**Edge cases to handle in the proposal** (do not commit silently):
- Files that should not be versioned (`.env`, secrets, `node_modules/`, `__pycache__/`, `.DS_Store`, build artifacts, logs) → propose adding them to `.gitignore` and committing the `.gitignore` first. Do not include them in a commit.
- Files `.claude/` → these are project files, commit them normally.
- Artifacts regenerated by a git hook (post-checkout/post-commit) **and** versioned — typically `graphify-out/` (graph.json, GRAPH_REPORT.md, graph.html): if the repo versions them, **do not** mix them into the logical change. Propose a separate commit `chore(graphify): refresh knowledge-graph` (or equivalent scope). If they are not versioned → ignore them (do not commit). Flag that the diff may be noise from non-deterministic regeneration (Leiden community relabeling) rather than a code consequence — it's up to {USER_NAME} to decide commit vs `git restore`.
- Collateral file unrelated semantically to the commit's logical change (e.g. a config file touched in passing): even if it shows in the diff presented at gate 1, never include it by default in a commit under the pretense it was already mentioned — propose it explicitly separately (separate commit or exclusion) and await named confirmation, not implicit global validation.

Present the proposed breakdown (which files in which commit, in which order) and **await {USER_NAME}'s validation** (gate 1). He can reorder, merge, or exclude files.

## Step 3 — Write the message for each commit (gate 2)

The message follows the Angular convention, in **a single line**:

- structure: `type(scope): subject`
- types: `feat` · `fix` · `refactor` · `test` · `docs` · `chore` · `perf` · `build` · `ci`
- **Never** multi-line body, never bullets
- **Never** `fixed by XXXX` in the subject (global ban — {USER_NAME} decision 2026-07-20), even when the commit fixes another's ticket
- **never** `Co-Authored-By` trailer (unnecessary noise — {USER_NAME} decision)

Deduce the `type` from the commit's content and the `scope` from the repo's local convention:

```
git log --oneline -20
```

(Spot the dominant scope in the history — e.g. `hubspot-kanban` in Theoboost — to stay consistent.)

**Example 1**
Changes: adding JWT authentication on the service side
→ `feat(auth): add JWT-based authentication`

**Example 2**
Changes: fixing a margin calculation (ticket opened by a colleague — no `fixed by`)
→ `fix(billing): correct margin rounding`

Propose the message for each commit and **await {USER_NAME}'s validation** (gate 2). For multiple atomic commits, present the complete list of messages at once so he validates the whole set.

## Step 4 — Execute

Once the two gates pass, for **each** commit from the breakdown, in order:

```
git add <files from this commit>     # or git add -p for intra-file breakdown
git commit -m "<validated message>"
```

Stage just before committing each group (no global staging upfront) — that keeps file-by-file control without ever needing `reset`.

> ⚠️ **Never redirect stderr on a `git add`** — no `2>/dev/null` or `2>&1 | …` that swallows the error. A `git add` on a path that no longer exists **fails silently** once stderr is masked: the command looks successful, nothing is staged, and the `git commit` that follows goes out without the file. The failure only shows at Step 5's `git status` — or not at all. (Cause: 2026-08-01, `green-gate.py` had changed path, the `git add` failure went unnoticed until `git status`.)

## Step 5 — Confirm

```
git log --oneline -<n>   # n = number of commits created
git status               # must be clean (or show only files intentionally left aside)
```

Display the created commits. If {USER_NAME} left changes outside commit intentionally, remind him. **Do not** propose push — it's his decision, out of scope.
