---
name: connect
description: Find non-obvious conceptual bridges between two specific vault domains via text search. Unlike emerge (inductive — what emerges from the vault?), connect is deductive — what do these two specific domains share? Unlike vault-link (operational — creates links), connect is analytical — finds connections first, {USER_NAME} decides next. Ex: /connect Warhammer dev, /connect ADHD workflow.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **narrative qualitative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips out narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /connect

Explore two vault domains and reveal what they share without {USER_NAME} having formulated it yet — common patterns, parallel tensions, conceptual bridges. Present the bridges, let {USER_NAME} decide which links to create.

## Trigger

```
/connect [domain A] [domain B]    → ex: /connect Warhammer dev
/connect ADHD workflow              → two broad terms accepted
/connect "From Sprue to Glory" ADHD → quotes for compound names
```

---

## Step 1 — Map each domain

For each domain, build a picture of what exists in the vault via **text search** (Grep titles, note bodies, `[[]]` links).

### Search method

1. Grep the domain term across the entire vault — collect `.md` files mentioning it (limit to 50 results)
2. Identify **hub notes**: either the title is an exact match for the domain, or the note is mentioned 3+ times in grep results
3. Read these hub notes and follow outgoing `[[]]` links at a depth to be determined in the next step
4. Identify recurring notes, concepts, people, tensions, and open questions in each domain
5. Stop if a note is visited twice (cycle detection)

### Adjust depth based on coverage (Depth Asymmetry)

Documentational balance determines how many hops to explore for each domain:

| Coverage | Domain A | Domain B | Depth |
|----------|----------|----------|-------|
| **Balanced** | > 15 results | > 15 results | Both max 2 hops |
| **Asymmetric** | > 20 results | 5-15 results | A: 2 hops, B: 3 hops + search for hidden hubs |
| **One sparse** | > 15 results | < 5 results | A: 1 hop (essential), B: 3 hops (margins) |
| **Both sparse** | < 10 results | < 10 results | Both max 3 hops |

**Reason**: Interesting connections are found at the margins of the minority domain; under-documented domains need maximum depth.

---

## Step 2 — Find overlaps

Compare the two maps to identify common elements. This is an **analytical step**: you document what exists, without creating or modifying anything. Search for:

- **Shared references** — notes or concepts appearing in both domains (natural bridges via `[[]]` links)
- **Shared people** — mentioned in both domains, possibly in different roles
- **Shared themes** — same recurring term, same question, same type of tension in note bodies (not just titles)
  - Example: "iteration" appears in hobby (painting by layers) and dev (agile refactoring) → shared theme
- **Shared patterns** — same problem structure, ex: blockage → dependency → delay (same type of obstacle)
- **Shared tags** — identical `#tag` across both domains

---

## Step 3 — Trace the bridges

For each overlap identified, deepen via **max 3 hops** from the bridge note. This is still an **analytical step**: document paths, don't create anything.

Trace the shortest path between the two hub notes via `[[]]` links — intermediate notes often sit at the intersection without fully belonging to either domain. These are your strongest bridges.

---

## Step 4 — Synthesize

### Format for each bridge

```
Bridge [#]: [Bridge title]
In [Domain A]: [how this concept appears]
In [Domain B]: [how it appears differently]
The connection: [what links them and why it's interesting]
Depth: [Surface / Structural / Foundational]
Implication: [what this suggests for one or both domains]
```

**Bridge depth**:
- **Surface** — same terminology, superficial overlap (can dissipate)
- **Structural** — same problem or solution structure, persistent
- **Foundational** — same underlying belief, same principle (invariant)

### The strongest bridge

Identify the single strongest bridge — the one that reframes how you think about both domains simultaneously.

### Missing Links

Connections that *should* exist but haven't been created yet. **Propose in prose** — ex: "A note 'Mastery via iteration' could link hobby + dev" — never create or modify links without {USER_NAME}'s validation.

### The question it raises

What new question becomes visible by seeing these two domains connected, that was impossible to formulate while they remained separate?

After presenting the question, evaluate if it's ticket-worthy by this threshold:
- **Yes**: the question opens a new field of reflection OR challenges an existing assumption
- **No**: the question is rhetorical or doesn't ask for follow-up

If yes → propose the ticket in prose (ex: "Want to create an Idea ticket?") and wait for explicit {USER_NAME} response. Never create, modify, or add to a ticket without validation.

---

## Edge cases

### Disjoint domains

If after complete mapping, **no overlaps are found** (truly disjoint domains):

```
CONNECT: [Domain A] <-> [Domain B]
Trend: No overlap

Result: No bridges detected after thorough search.
Domains remain structurally independent.
Implication: [optional] Reflection on why this separation exists.
```

Don't force a non-existent bridge. Reporting absence is useful.

### One domain unfound (0 Grep results)

```
CONNECT: [Domain A] <-> [Domain B]
Status: [Domain B] — No mentions in vault

Result: Cannot map [Domain B]. Domain nonexistent or under-documented.
Suggestion: Check the term spelling or create a hub note for [Domain B].
```

### One domain partially documented (1-4 Grep results)

```
CONNECT: [Domain A] <-> [Domain B]
Trend: [Domain B] — Minimal coverage (3 results)

Result: [Domain B] is sparse but identifiable. Explored 3 hops fully.
Bridges found: [list]
Limitation: Possible connections beyond these 3 hops remain invisible.
Suggestion: Deepen [Domain B] in the vault if the connection seems promising.
```

### Identical domains (A == B)

Don't run the search. Report directly:

```
CONNECT: [Domain] <-> [Domain]
Status: Identical domains

Result: Both entries point to the same domain. No bridges to find.
Suggestion: Check if you meant to connect [Domain] with something else.
```

### Malformed domain or very short (< 2 characters)

```
CONNECT: [Domain A] <-> [Domain B]
Status: Parsing error or invalid domain

Result: [Domain B] is too short or malformed. Grep would produce too much noise.
Suggestion: Use a term 2+ characters, or quotes for compound names.
Example: /connect "From Sprue to Glory" Productivity
```

---

## Output format

```
CONNECT: [Domain A] <-> [Domain B]
Coverage: [Balanced / Asymmetric / One sparse / Both sparse]
Status: [OK / Partial / Disjoint / Identical / Invalid]

[Bridges found — strongest to weakest]
Bridge [#]: [Title]
  In [Domain A]: [appearance]
  In [Domain B]: [different appearance]
  The connection: [what links them and why it's interesting]
  Depth: [Surface / Structural / Foundational]
  Implication: [what this suggests]

[The strongest bridge and its implication]
[Missing links — in prose]
[The question that emerges — ticket-worthiness evaluation]
```

**Example**:
```
CONNECT: Warhammer <-> Productivity
Coverage: Asymmetric (Warhammer 45 results, Productivity 8)
Status: OK

Bridge 1: Pile of Shame — Accumulation and friction
  In Warhammer: unpainted miniatures, visual backlog growing
  In Productivity: deferred tasks, psychological accumulation
  The connection: same dynamic of growing inertia facing quantity
  Depth: Structural
  Implication: both domains benefit from the same framework of gradual reduction

The strongest bridge: Pile of Shame. Reframes how to think about inertia in two distinct domains.
Missing: A note 'Accumulation and friction' could make this link explicit.

The question: Does my relationship to the Pile of Shame in two domains reflect the same aversion to imperfection?
Ticket-worthy threshold: Yes — challenges my assumption that inertia has different causes by context.
```

---

## Absolute rules

- **Purely analytical** — Steps 1-3 are exploratory; you present discovered bridges without creating, modifying, or deciding actions
- **Vault only** — bridges come from existing notes and their links, not from Claude's synthesis or model
- **Don't force** — superficial overlap is not a bridge; discard if not supported by at least one note, one link, or one concrete theme
- **Depth Asymmetry mandatory** — apply the coverage table to determine hops, never estimate by sight
- **Explicit validation** — for any action (creating links, tickets, modifications), wait for explicit {USER_NAME} approval
- **Missing links in prose** — suggest missing connections as text suggestions, never create notes
