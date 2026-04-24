---
name: connect
description: Find non-obvious conceptual bridges between two specific vault domains via text search. Unlike emerge (inductive — what emerges from the vault?), connect is deductive — what do these two specific domains share? Unlike vault-link (operational — creates links), connect is analytical — finds connections first, {USER_NAME} decides next. E.g.: /connect Warhammer dev, /connect ADHD workflow.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimisation**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips the narrative instructions (grouping, context, highlights, open questions, tone, narration). Preserving qualitative content takes priority over reducing line count.

# Skill: /connect

Explores two vault domains and reveals what they share without {USER_NAME} having yet formulated it — common patterns, parallel tensions, conceptual bridges. Present the bridges, let {USER_NAME} decide which links to create.

## Trigger

```
/connect [domain A] [domain B]    → e.g.: /connect Warhammer dev
/connect ADHD workflow            → two broad terms accepted
/connect "From Sprue to Glory" ADHD → quotes for compound names
```

---

## Step 1 — Map each domain

For each domain, build a picture of what exists in the vault via **text search** (Grep on titles, note bodies, `[[]]` links).

### Search method

1. Grep the domain term across the entire vault — collect `.md` files that mention it (limit to 50 results)
2. Identify **hub notes**: either the title is an exact match of the domain, or the note is mentioned 3+ times in the grep results
3. Read these hub notes and follow outgoing `[[]]` links to a depth determined at the next step
4. Identify recurring notes, concepts, people, tensions and open questions in each domain
5. Stop if a note is visited twice (cycle detection)

### Adapt depth based on coverage (Depth Asymmetry)

Documentary balance determines how many hops to explore for each domain:

| Coverage | Domain A | Domain B | Depth |
|----------|---------|---------|-------|
| **Balanced** | > 15 results | > 15 results | Both max 2 hops |
| **Asymmetric** | > 20 results | 5-15 results | A: 2 hops, B: 3 hops + search hidden hubs |
| **One sparse** | > 15 results | < 5 results | A: 1 hop (essential), B: 3 hops (margins) |
| **Both sparse** | < 10 results | < 10 results | Both max 3 hops |

**Reason**: interesting connections are found at the margins of the minority domain; under-documented domains require maximum depth.

---

## Step 2 — Find overlaps

Compare the two maps to identify shared elements. This is an **analytical step**: you document what exists, without creating or modifying anything. Look for:

- **Shared references** — notes or concepts that appear in both domains (natural bridges via `[[]]` links)
- **Shared people** — mentioned in both domains, possibly in different roles
- **Shared themes** — same recurring term, same question, same type of tension in note bodies (not just titles)
  - Example: "iteration" appears in hobby (painting in layers) and dev (agile refactoring) → shared theme
- **Shared patterns** — same problem structure, e.g.: blockage → dependency → delay (same type of obstacle)
- **Shared tags** — identical `#tag` tags in both domains

---

## Step 3 — Trace the bridges

For each identified overlap, deepen to **max 3 hops** from the bridge note. This is still an **analytical step**: document the paths, create nothing.

Trace the shortest path between the two hub notes via `[[]]` links — the intermediate notes often sit at the intersection without fully belonging to either domain. These are your strongest bridges.

---

## Step 4 — Synthesise

### Format for each bridge

```
Bridge [#]: [Bridge title]
In [Domain A]: [how this concept appears]
In [Domain B]: [how it appears differently]
The connection: [what links them and why it is interesting]
Depth: [Surface / Structural / Foundational]
Implication: [what this suggests for one or both domains]
```

**Bridge depth**:
- **Surface** — same terminology, superficial overlap (may dissolve)
- **Structural** — same problem or solution structure, persistent
- **Foundational** — same underlying belief, same core principle (invariant)

### The strongest bridge

Identify the single most interesting bridge — the one that reframes how you think about both domains simultaneously.

### Missing Links

Connections that *should* exist but have not yet been created. **Propose in prose** — e.g. "A 'Mastery via iteration' note could link hobby + dev" — never create or modify links without {USER_NAME}'s validation.

### The question this raises

What new question becomes visible by seeing these two domains connected, that was impossible to formulate as long as they remained separate?

After presenting the question, assess whether it is ticket-worthy according to this threshold:
- **Yes**: the question opens a new field of reflection OR challenges an existing assumption
- **No**: the question remains rhetorical or requires no follow-up

If yes → propose the ticket in prose (e.g. "Would you like to create an Idea ticket?") and wait for {USER_NAME}'s explicit response. Never create, modify, or add to a ticket without validation.

---

## Edge cases

### Disjoint domains

If after complete mapping, **no overlap is found** (truly disjoint domains):

```
CONNECT: [Domain A] <-> [Domain B]
Trend: No overlap

Result: No bridge detected after thorough search.
Domains remain structurally independent.
Implication: [optional] Reflection on why this separation exists.
```

Do not force a non-existent bridge. Reporting the absence is useful.

### Domain not found (0 Grep results)

```
CONNECT: [Domain A] <-> [Domain B]
Status: [Domain B] — No mention in vault

Result: Cannot map [Domain B]. Domain non-existent or under-documented.
Suggestion: Check the term used or create a hub note for [Domain B].
```

### Partially documented domain (1-4 Grep results)

```
CONNECT: [Domain A] <-> [Domain B]
Trend: [Domain B] — Minimal coverage (3 results)

Result: [Domain B] is poorly documented but identifiable. Explored 3 complete hops.
Bridges found: [list]
Limitation: Possible connections beyond these 3 hops remain invisible.
Suggestion: Enrich [Domain B] in the vault if the connection seems promising.
```

### Identical domains (A == B)

Do not run the search. Report directly:

```
CONNECT: [Domain] <-> [Domain]
Status: Identical domains

Result: Both entries point to the same domain. No bridge to find.
Suggestion: Check whether you meant to connect [Domain] to another.
```

### Malformed or very short domain (< 2 characters)

```
CONNECT: [Domain A] <-> [Domain B]
Status: Parsing error or invalid domain

Result: [Domain B] is too short or malformed. Grep would produce too much noise.
Suggestion: Use a 2+ character term, or quotes for compound names.
Example: /connect "From Sprue to Glory" Productivity
```

---

## Output format

```
CONNECT: [Domain A] <-> [Domain B]
Coverage: [Balanced / Asymmetric / One sparse / Both sparse]
Status: [OK / Partial / Disjoint / Identical / Invalid]

[Bridges found — from strongest to weakest]
Bridge [#]: [Title]
  In [Domain A]: [appearance]
  In [Domain B]: [different appearance]
  The connection: [what links them and why it is interesting]
  Depth: [Surface / Structural / Foundational]
  Implication: [what this suggests]

[The strongest bridge and its implication]
[Missing links — in prose]
[The emerging question — ticket-worthy assessment]
```

**Example**:
```
CONNECT: Warhammer <-> Productivity
Coverage: Asymmetric (Warhammer 45 results, Productivity 8)
Status: OK

Bridge 1: Pile of Shame — Accumulation and friction
  In Warhammer: unpainted miniatures, growing visual backlog
  In Productivity: deferred tasks, psychological accumulation
  The connection: same dynamic of growing inertia in the face of quantity
  Depth: Structural
  Implication: both domains benefit from the same progressive reduction framework

The strongest bridge: Pile of Shame. Reframes how to think about inertia in two distinct domains.
Missing: A 'Accumulation and friction' note could make this link explicit.

The question: Does my relationship with the Pile of Shame in two domains reflect the same aversion to imperfection?
Ticket-worthy: Yes — challenges my assumption that inertia has different causes depending on context.
```

---

## Absolute rules

- **Pure analytical** — Steps 1-3 are exploratory; present discovered bridges without creating, modifying, or deciding on actions
- **Vault only** — bridges come from existing notes and their links, not from Claude's synthesis or model
- **Do not force** — a superficial overlap is not a bridge; discard if not supported by at least one note, link or concrete theme
- **Depth Asymmetry mandatory** — apply the coverage table to determine hops, never estimate
- **Explicit validation** — for any action (link creation, ticket, modification), wait for {USER_NAME}'s explicit approval
- **Missing links in prose** — propose missing connections as textual suggestions, never create the notes
