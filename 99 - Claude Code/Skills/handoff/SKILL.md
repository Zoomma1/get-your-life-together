---
name: handoff
description: Generates a chat-only session-handoff prompt to switch sessions without losing context. Synthesizes the current session into a 5-section prompt (state, next action, references, decisions, skills) to paste into a fresh session after /clear or compaction, mid-task. Trigger when the user says "/handoff", "handoff", "prepare the handoff", "pass me the relay", "transition doc", "I'm going to clear", or when the drift canary has signaled a drift. Distinct from /recapsession (archived session summary to disk) and /resumelastsession (reloads the last day).
argument-hint: optional handoff focus (ex: "keep focus on the payment bug")
---

# Skill: Handoff — session-handoff prompt

## Purpose

When a session becomes long (polluted context, compaction looming) or a drift is detected (canary 🐙 gone), you need to `/clear` and then **properly resume the current task** in a fresh session. `/handoff` produces the **handoff prompt** to paste: a compact summary that references existing artifacts rather than copying them, and reminds what should not be re-litigated.

**Output: chat-only, ephemeral.** The skill **writes no files** — it displays the prompt in chat, {USER_NAME} copies it. No persistence, no redaction (local single-reader vault).

### Deduplication boundaries (don't confuse)

| Skill | Role | Persistence |
|-------|------|-------------|
| **`/handoff`** | Handoff **mid-task** → prompt to paste in a new session | None (chat) |
| `/recapsession` | **Session summary** (accomplishments, decisions, state) | Writes `Sessions/[date].md` |
| `/resumelastsession` | **Reloads** last session from disk | Reads `Sessions/` |

`/handoff` ≠ archive (that's `/recapsession`'s job) and ≠ replay of the past (that's `/resumelastsession`). It's a disposable bridge between two sessions on **the same ongoing task**.

## Triggering

- the user says "/handoff", "handoff", "prepare the handoff", "pass me the relay", "transition doc", "I'm going to clear"
- Nudge possible from the drift canary ([[add-drift-detection-canary-rule-to-claude-md-session]]) : if the 🐙 has gone, suggest `/handoff` before `/clear`.
- **Triggered on explicit request from {USER_NAME}** — one of the phrases above, or `/handoff`. The skill is model-invocable: if the user says "I'm going to clear" or "pass me the relay", launch it without waiting for them to type the command.
- ⛔ **Never autonomous timing detection.** Do not trigger on a lengthening session, seemingly polluted context, looming compaction, or sense of drift — only on a handoff phrase. An unsolicited handoff interrupts a task in progress for nothing.

## Step 1 — Frame the focus (optional argument)

If {USER_NAME} passes an argument (`/handoff keep focus on the payment bug`) → that's the **handoff framing**: orient the entire prompt around that focus (the "Next action" section as priority). If the argument is **ambiguous** (unsure what it refers to in the session) → stop and ask for clarification before generating.

Without argument → cover the current task state as-is.

## Step 2 — Synthesize the current session into 5 sections

Read the current conversation and extract **exactly these 5 sections**. Be concrete and compact — a prompt, not a report.

1. **Current task state** — where we are, what's done vs. in progress. One to three sentences.
2. **Next concrete action** — the very next step, immediately actionable (not "continue the work" but "write test X in file Y").
3. **References to artifacts** — paths/files touched, tickets, URLs, branches. **Reference, don't copy** content (cf. Pocock skill: point to PRD/plan/ADR/issue/diff by path or URL).
4. **Decisions made not to re-litigate** — choices already settled in the session, so the fresh session doesn't reopen them.
5. **Suggested skills for next** — vault skills likely useful on handoff (e.g., `/commit`, `/create-ticket`, `/workon`…).

If a section is empty (nothing to say) → write it anyway with "(nothing to report)" rather than omit it — the 5 sections are contractual.

## Step 3 — Emit the prompt (chat-only, no files)

Display the prompt in a **code block** (for clean copy-paste), preceded by a handoff instruction line. Format:

````markdown
```
Session handoff — ongoing task.[ Focus: <argument if provided>.]

## Current state
...

## Next action
...

## References (don't copy, just consult)
- <path/url> — <what>
- ...

## Settled decisions (don't re-litigate)
- ...

## Suggested skills for next
- /<skill> — <why>
```
````

**Never write this prompt to a file** (not scratchpad, not `Sessions/`, not a note). It lives only in chat.

## Step 4 — Self-check

Before concluding, verify:
- [ ] The **5 sections** are present (even if empty → "(nothing to report)").
- [ ] References **point to** artifacts (paths/URLs), they don't **copy** them.
- [ ] If focus argument provided → the prompt is oriented around that focus.
- [ ] **No files were created** (zero Write/Edit during run).

## Absolute rules

- **Zero files.** Output strictly chat. If {USER_NAME} wants to archive → that's `/recapsession`, not `/handoff`.
- **Reference, don't copy** — an existing artifact (ticket, diff, ADR, note) is pointed to by path/URL, never in full copy.
- **5 contractual sections** — always the 5, even if empty.
- **No redaction** — local single-reader vault, out of scope.
- **On explicit request only** — triggers on a handoff phrase from {USER_NAME}, never on autonomous session state evaluation. Does not replace `/recapsession` or `/resumelastsession`.
- **Ambiguous argument → ask**, don't guess the focus.
