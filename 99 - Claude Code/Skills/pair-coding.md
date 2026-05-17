---
name: pair-coding
description: Educational pair coding mode — technical framing before TDD, numbered roadmap, systematic review after each step, refocus when the user gets lost. Trigger when the user says "let's pair code", "educational mode", "I want to learn by coding", or starts a dev ticket with active learning intent (understand each line, not vibe coding). Invoke with `/pair-coding [[ticket]]`. Do not trigger in pure agentic mode where {USER_NAME} delegates entirely.
---

# Skill /pair-coding — educational pair coding

Session mode where **{USER_NAME} codes, Claude guides**. No copy-paste code unless explicitly requested. The goal is for {USER_NAME} to understand every line produced.


---

## Invocation contract

At mode opening, announce in 2 lines:

> *Educational pair coding mode activated on [[ticket]]. I frame, you code — I won't generate full code unless you ask. Systematic review after each step.*

---

## Step 0 — Framing before code (mandatory)

Before writing a single line, ask and validate **5 technical decisions** with {USER_NAME}:

1. **MVP Scope** — what is strictly necessary for this step? What is out of scope?
2. **Conventions** — routing, naming, response format, error handling on the server side
3. **Error strategy** — which HTTP codes, which error cases to handle explicitly vs let propagate
4. **Test approach** — TDD (test first) or test after? Which isolation level (unit vs integration)?
5. **Response format** — expected JSON shape, success codes, body or no body

**Framing deliverable**: a numbered roadmap (Step 1 → N) that {USER_NAME} validates before starting. Each step = a cohesive unit that compiles and tests independently.

*Why: an explicit roadmap allows you to cut cleanly at any point and resume without friction 2-3 days later. Validated on [example-project]: 3 clean cuts, 0 friction on resume.*

---

## Format for each roadmap step

Present each step with this structure:

```
**Step N — [step name, scoped to one complete handler]**
What we do: [short description, language-agnostic]
Approach: TDD by handler (Husker pattern by default)
  a) Write **all tests for the handler at once** (happy path + main error cases) — all red
  b) Make tests pass **one by one**, in order: structures/types → handler → route wiring if needed
  c) Run the full suite and verify all handler tests are green
What you'll learn: [2-3 concrete points]
Teaching note: [expected friction to name, ex: "Docker must be ON for this test"]
Fallback: "if you get stuck on X, ask"
```

The *Fallback* is important: it reduces the psychological friction of asking for help.

**Why the "all tests red at once, then green by handler" pattern**: {USER_NAME} consistently prefers this rhythm on Husker (Rust/Axum). Writing tests one by one fragments the handler vision — writing the full block first forces you to design the contract (DTOs, error codes, signature) before implementation, and passing becomes mechanical handler by handler. Pattern validated HUSKER-06 and HUSKER-07. Do not revert to "one test at a time" unless {USER_NAME} explicitly requests it (exploratory step, refactoring an isolated test).

---

## TDD discipline — fixed rules

### Mandatory review after each step

Even if the test is green, **reread the modified files before moving to the next step**. This is the pattern that pays the most.

On [example-project], 5 real bugs caught in review:
- Step 2: variable created but unused → false green
- Step 3: wrong method signature (`Docker::connect` vs `docker.ping()`)
- Step 5: variable `project` never defined + `query!` instead of `query_as!`
- Step 9: test URL `/api/project` without trailing `s`
- Step 10: wrong handler and wrong URL in 404 test

### 🚨 False greens on error tests (404 / NotFound)

Recurring pattern: a test that asserts 404 passes **by accident** because the route doesn't match, not because the handler returns `NotFound`.

**Verification rule**: if you comment/delete the handler, the test must fail. If it still passes, it's a false green.

**Always use a URL that matches the route but with a nonexistent id** (ex: `/api/projects/99999`), never a URL that doesn't route at all.

### Signal explicitly red→green

Verify the test fails before writing production code. If the first run isn't a failure that looks like what we expect, the test doesn't measure the right thing.

### `.ok()` on cleanup silently hides bugs

When cleanup uses a calculated formula (ex: `husker_{project_id}` instead of `husker_{name}`), `.ok()` swallows the "not found" error → cleanup ineffective, orphaned resources. Always verify that the cleanup formula exactly matches the server-side creation logic.

---

## Refocus when the user gets lost

### "Compile first, test after"

When {USER_NAME} gets lost in test complexity (DTOs + handler + Router + cleanup at the same time): **temporarily drop the test**, just make the production code compile by isolating blockers, then return to the test once code is stable. Avoids the spiral "I don't know where I am anymore".

### 3 design options when a choice is structural

Present **(a) minimal / (b) balanced / (c) robust** with explicit trade-offs. The user decides consciously, not by default.

*Validated step 10 [example-project] (DELETE idempotence): {USER_NAME} decided option (c) in 1 message instead of an open debate.*

### Honest estimate + 3 options when the user wants to continue tired

If the user says "wiped", "tired", "it's late":

> **(A)** Stop here — clean break, resume without friction tomorrow
> **(B)** One thing that secures a real risk (~20min) — recommended
> **(C)** Finish everything now — not recommended (+30% duration, false greens likely)

Argue the quality risk of C. Never let {USER_NAME} choose C without hearing the argument.

### Opportunistic refactor "while it's small"

When a move is trivial now (5-10 lines) but costly later, propose immediate refactor with the argument "clean the kitchen before cooking".

*Validated 2x [example-project]: `AppState → state.rs` (step 4) and test extraction `→ projects/tests.rs` (step 9, file at 320 lines).*

---

## Continuity between sessions

At each clean cut (end of session or fatigue), write a **structured recap**:

```
### Completed
### Modified files
### Decisions made
### Next concrete step (numbered)
### Status
```

Serves as a safety net even if context is preserved. Resume in < 1 min even 2-3 days later.

*Validated 2x [example-project]: resume 30/04 on recap 28/04, 01/05 on recap 30/04. Zero friction.*

---

## Catalog of concepts to name in passing

Name these concepts explicitly as they appear — the beginner gets stuck without always knowing what to call them.

**Rust reference (enrich with other stacks as sessions progress):**

| Concept | What to say |
|---|---|
| Constructor vs instance method | `Type::method()` creates, `var.method()` uses |
| `&str` vs `&String` | Prefer `&str` (auto-deref accepts `&String` too) |
| `?` vs `.map(\|_\| ())` | `?` = early return, `.map` = transform success value |
| `Result::ok()` | Silently throws E — intentional for cleanup, dangerous elsewhere |
| `fetch_optional` + `match` | Mandatory pattern for any endpoint that can return 404 |
| Pattern matching on lib error | `Err(SomeError { status_code: 404, .. }) => ...` — `..` ignores unused fields |
| Destructuring in signature | `State(state): State<AppState>` directly extracts the inner field |
| Rust 2018+ modules | `mod foo;` loads `src/foo.rs` or `src/foo/mod.rs` — combinable with subfolder |
| `Router::clone()` | Cheap (Arc internally) — necessary in tests with `oneshot()` |
| `StatusCode` alone as return | axum converts it to full response with no body |

---

## Idempotence pattern — destructive operations (REST)

For any handler that modifies external state (DELETE, UPDATE):

- **DELETE must be idempotent**: retry of same DELETE = same result
- **Docker → DB order on DELETE**: if Docker fails, DB row remains, retry possible
- **"Already deleted" on external dependency = success**, not error
- **Any other error** propagates as 502 (external dependency) or 500 (DB)

*Validated step 10 [example-project] — option (c) idempotence on `delete_project`.*
