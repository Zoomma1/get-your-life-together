---
name: pair-coding
description: Pedagogical pair-coding mode — technical framing before TDD, numbered roadmap, systematic review after each step, recalibration when user gets lost. Trigger when user says "let's pair code", "pedagogical mode", "I want to learn by coding", or starts dev ticket with active learning intent (understand each line, not vibe coding). Invoke with `/pair-coding [[ticket]]`. Don't trigger in pure agentic mode where {USER_NAME} delegates entirely.
---

# Skill /pair-coding — pedagogical pair-coding

Session mode where **{USER_NAME} codes, Claude guides**. No copy-paste-ready code except on request. Goal: {USER_NAME} understands each line produced.

---

## Invocation contract

At mode opening, announce in 2 lines:

> *Pedagogical pair-coding mode activated on [[ticket]]. I frame, you code — I don't generate complete code unless you ask. Systematic review after each step.*

---

## Step 0 — Framing before code (mandatory)

Before writing a single line, pose and validate **5 technical decisions** with {USER_NAME}:

1. **MVP scope** — what's strictly necessary for this step? What's out of scope?
2. **Conventions** — routing, naming, response format, error handling on server side
3. **Error strategy** — which HTTP codes, which error cases to handle explicitly vs let propagate
4. **Test approach** — TDD (test first) or test after? What isolation level (unit vs integration)?
5. **Response format** — expected JSON shape, success codes, body or no body

**Framing deliverable**: a numbered roadmap (Step 1 → N) that {USER_NAME} validates before starting. Each step = one coherent unit that compiles and tests independently.

*Why: explicit roadmap allows clean cuts at any point and resumption without friction 2-3 days later. Validated on [example-project]: 3 clean cuts, 0 friction on resume.*

---

## Roadmap step format

Present each step with this structure:

```
**Step N — [step name]**
What we do: [short description, language-agnostic]
Approach: TDD (test first) | or other if context justifies
  a) Write the test (red)
  b) Make the test pass (green)
  c) Launch and verify
What you'll learn: [2-3 concrete points]
Pedagogical note: [expected friction to name, ex: "Docker must be ON for this test"]
Fallback: "if you get stuck on X, ask"
```

The *Fallback* is important: reduces psychological friction to asking for help.

---

## TDD discipline — fixed rules

### Review mandatory after each step

Even if test is green, **reread modified files before next step**. This is the pattern that pays most.

On [example-project], 5 real bugs caught in review:
- Step 2: variable created but unused → false green
- Step 3: wrong method signature (`Docker::connect` vs `docker.ping()`)
- Step 5: variable `project` never defined + `query!` instead of `query_as!`
- Step 9: test URL `/api/project` without `s` at end
- Step 10: wrong handler and wrong URL in 404 test

### 🚨 False greens on error tests (404 / NotFound)

Recurring pattern: a 404 test passes **by accident** because the route doesn't match, not because the handler returns `NotFound`.

**Verification rule**: if you comment/delete the handler, test must fail. If it still passes, that's a false green.

**Always use a URL that matches the route but with nonexistent id** (ex: `/api/projects/99999`), never a URL that doesn't route at all.

### Explicitly signal red→green

Verify test fails before writing production code. If the first run isn't a failure matching expectations, the test doesn't measure the right thing.

### `.ok()` on cleanup masks bugs silently

When cleanup uses a calculated formula (ex: `husker_{project_id}` instead of `husker_{name}`), `.ok()` swallows "not found" error → cleanup ineffective, orphaned resources. Always verify cleanup formula exactly matches server-side creation logic.

---

## Recalibration when user gets lost

### "Compile first, test after"

When {USER_NAME} drowns in test complexity (DTOs + handler + Router + cleanup at once): **temporarily drop the test**, make prod code compile in isolation to unblock, then return to test once code is stable. Avoids "I don't know where I am" spiral.

### 3 design options when choice is structural

Present **(a) minimal / (b) balanced / (c) robust** with explicit trade-offs. User decides consciously, not by default.

*Validated step 10 [example-project] (DELETE idempotence): {USER_NAME} chose option (c) in 1 message instead of open debate.*

### Honest estimate + 3 options when user wants to keep going tired

If user says "wiped", "tired", "late":

> **(A)** Stop here — clean break, resumption without friction tomorrow
> **(B)** One thing securing a real risk (~20min) — recommended
> **(C)** Finish it all now — not recommended (+30% duration, false greens likely)

Argue C's quality risk. Never let {USER_NAME} choose C without hearing the argument.

### Opportunistic refactor "while it's small"

When move is trivial now (5-10 lines) but costly later, propose immediate refactor with argument "clean kitchen before cooking".

*Validated 2x [example-project]: `AppState → state.rs` (step 4) and test move `→ projects/tests.rs` (step 9, file at 320 lines).*

---

## Continuity between sessions

At each clean cut (session end or fatigue), write **structured recap**:

```
### Done
### Modified files
### Decisions made
### Next concrete step (numbered)
### Status
```

Safety net even if context preserved. Resumption in <1 min even 2-3 days later.

*Validated 2x [example-project]: resume 30/04 on recap 28/04, 01/05 on recap 30/04. Zero friction.*

---

## Concept catalog to name as they appear

Explicitly name these concepts when they appear — beginners get stuck without knowing how to call them.

**Reference Rust (enrich with other stacks as sessions progress):**

| Concept | What to say |
|---|---|
| Constructor vs instance method | `Type::method()` creates, `var.method()` uses |
| `&str` vs `&String` | Prefer `&str` (auto-deref accepts `&String` too) |
| `?` vs `.map(\|_\| ())` | `?` = early return, `.map` = transform success value |
| `Result::ok()` | Swallows E silently — intentional for cleanup, dangerous elsewhere |
| `fetch_optional` + `match` | Mandatory pattern for any endpoint possibly returning 404 |
| Pattern match on lib error | `Err(SomeError { status_code: 404, .. }) => ...` — `..` ignores unused fields |
| Destructuring in signature | `State(state): State<AppState>` extracts inner field directly |
| Rust 2018+ modules | `mod foo;` loads `src/foo.rs` or `src/foo/mod.rs` — combinable with subfolder |
| `Router::clone()` | Cheap (Arc internally) — necessary in tests with `oneshot()` |
| `StatusCode` alone as return | axum converts to full response without body |

---

## Idempotence pattern — destructive operations (REST)

For any handler modifying external state (DELETE, UPDATE):

- **DELETE must be idempotent**: retry same DELETE = same result
- **Docker → DB order on DELETE**: if Docker fails, DB row remains, retry possible
- **"Already deleted" on external dependency = success**, not error
- **Any other error** propagates as 502 (external dependency) or 500 (DB)

*Validated step 10 [example-project] — option (c) idempotence on `delete_project`.*
