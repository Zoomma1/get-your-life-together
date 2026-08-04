# ADRs — via /create-adr

{USER_NAME}'s ADRs do **not** live in the repo's `docs/adr/`. They live in the vault and are created through the **`/create-adr`** skill, which handles:

- scope resolution — project ADR → `04 - Projects/<Projet>/claude-code/ADR/`, transverse → `99 - Claude Code/ADR/`
- naming convention, sequential numbering, and `INDEX.md` update

**Never write ADR files by hand. Invoke `/create-adr` with the decision context** (what's the context, what was decided, why, and the rejected alternatives if non-obvious).

## When to offer an ADR

All three of these must be true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record.

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target — the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Stops the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of compliance." "Response times must be under 200ms because of a partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** Considered GraphQL and picked REST for subtle reasons? Record it — otherwise someone suggests GraphQL again in six months.
