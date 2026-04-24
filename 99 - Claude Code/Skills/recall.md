---
name: recall
description: Search vault for 1-3 relevant notes to the context. Manual call via /recall [subject] or /recall (infer from conversation). Return silence if no qualified match.
---

# Skill `/recall`

Targeted search in vault: find the really useful notes for the current context.

## Trigger

```
/recall              → infer keywords from current conversation
/recall [subject]    → targeted search on this subject
/recall auth FSTG    → multiple terms possible (implicit AND)
```

---

## Step 1 — Extract keywords (3 to 6)

**If argument provided**: use ALL terms, space-separated (ex: `/recall auth FSTG` = search "auth" AND "FSTG").

**If no argument**: infer from conversation (by priority):
1. Titles or paths mentioned in last 5 exchanges
2. Explicit project names (FSTG, ML, HomeLabServeur, etc.)
3. Technical terms repeated 2+ times in last request

**Keep 3 to 6 distinct keywords** — neither too broad ("code") nor too specific (variable names).

**Override if**:
- Conversation has no context (empty or "hello" only)
- Inferred terms are too generic after filtering → display "Insufficient context to infer keywords."

---

## Step 2 — Search in vault

### Directories to scan (always all)

- `{VAULT_PATH}\{KNOWLEDGE_FOLDER}\` (recursive)
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\ADR\`
- `{VAULT_PATH}\{PROJECTS_FOLDER}\[Active Project]\claude-code\` (if in context)
- `{VAULT_PATH}\{PROJECTS_FOLDER}\[Active Project]\` (if in context; real path, not "04 - My projects")
- `{VAULT_PATH}\{HOBBIES_FOLDER}\` (if hobby subject detected)

**Don't scan**: `00 - Daily notes/`, `09 - Inbox/`, `Archive/`, `99 - Claude Code/Sessions/`.

### Execution limits

- Per directory: max 50 `.md` files (keep 50 most recently modified)
- Globally: max 200 files read total (stopword after)

### Search algorithm

1. **List files** with Glob `**/*.md`, limit by mtime if necessary
2. **Score each file** (take max score, not cumulative):
   - If keyword in title → confirm (20 lines) → score 3
   - Else if keyword in first 10 lines → score 2
   - Else if already-read note contains `[[file-name]]` → score 2
   - Else if keyword beyond line 10 → score 1
3. **Exclude** notes already signaled this session
4. **Sort** by descending score, keep **1 to 3 best**

### Fast scoring (MAX, not cumulative)

| Source | Score | Condition |
|--------|-------|-----------|
| Title | 3 | Keyword in name + confirmed (20 lines) |
| Content | 2 | Keyword in first 10 lines |
| Backlink | 2 | `[[note-name]]` cited in session |
| Body | 1 | Keyword beyond line 10 |

**Take the best score** for each file. Tie case: favor more matched keywords.

---

## Step 3 — Filter and present

**Keep 1 to 3 notes max.**

**Minimum threshold**: signal only if score ≥ 2 (else silence).

Format:
```
📎 Relevant vault notes:
- [[note-name]] — [one sentence: why useful now]
- [[other-note]] — [why]
```

**If no match ≥2** → total silence (no "no results").

---

## Step 2bis — Semantic search of sessions (optional)

**Condition**: launch only if Step 1 keywords are technical or project-related (Waddle, FSTG, Husker, pgvector…). Skip if request is purely personal/organization.

Call:
```bash
uv run ~/.claude/semantic_search.py "<joined keywords>" --top-k 3
```

**If command fails** (Postgres or Ollama unreachable) → non-blocking, continue to Step 3, but display: `⚠️ Semantic search of sessions unavailable (Postgres/Ollama down) — vault results only.`

**If results** (similarity ≥ 0.45) → add separate block after vault notes:
```
📎 Relevant sessions:
- [YYYY-MM-DD] — <session title> / <section_type>
```
Max 3 sessions. Don't mix with vault notes — distinct blocks.

---

## Absolute rules

- **1 to 3 max** — never more
- **Silence if no match ≥2** — quality > quantity
- **Don't re-signal** a note already mentioned this session
- **Don't scan** Daily notes, Inbox, Archive, Sessions
- **False positives**: if match exists but isn't semantically related (ex: "color" in art vs code), exclude after verification
- **Glob/Timeout error**: display nothing, log silently
- **Access denied**: if directory isn't accessible (permissions), continue with others without blocking
