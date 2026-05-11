---
name: emerge
description: Detect clusters of scattered ideas in vault that form something new together — a project or essay. Unlike drift (individual recurring idea), emerge looks for inter-note connections not yet synthesized, and conclusions vault implies but never stated. Use manually or automatically after /harvestdeep.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces **qualitative narrative output**. Its effectiveness is measured on the **richness of output produced**, not on structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /emerge

Analyze vault to detect clusters of scattered ideas that together form something new — a project, an essay, an implicit direction.

**Key difference from `/drift`**:
- drift = 1 individual idea comes up often
- emerge = N distinct ideas converge toward 1 new structure

**Test of true emergence**: "It's true but I never said it" (not "I already know").

---

## Quick execution summary

**Input**: {USER_NAME} launches `/emerge` or system suggests after `/harvestdeep`

**Output**: Max 5 clusters proposed with score/confidence/source notes, awaiting {USER_NAME} validation before creation

**Time**: ~1-2h complete (depends on vault — Pass 1B/1C are heavy phases)

**Key steps**:
1. **Read references** (5-10 min) — INDEX, {USER_NAME}.md, command-tracker
2. **Transverse pass** (15-20 min) — detect inter-domain candidates
3. **Detail pass** (20-30 min) — apply Methods A/B/C/D to candidates
4. **Fabrication check** (5-10 min) — reject existing ideas
5. **Scoring** (10 min) — assign numeric scores, sort
6. **Presentation** (5 min) — show top 5 to {USER_NAME}
7. **Creation + linking** (15-20 min) — after {USER_NAME} validation

## Trigger

- **Manual**: user says "/emerge", "do an emerge", "what emerges from vault"
- **Automatic**: Harness suggests after `/harvestdeep` complete if vault richness OK (managed by post-harvest hook, not via skill)

---

## Step 1 — Collect raw candidates

Vault scan in 2 passes: first orientation + quick detection, then formal capture.

### Phase 1A — Context and vault health (5-10 min)

Read to establish baseline:
```
1. `04 - Projects/INDEX.md` → active projects (exclude from analysis)
2. `01 - Me/{USER_NAME}.md` → profile, context (to interpret signals)
3. `99 - Claude Code/command-tracker.md` → date of previous /emerge (avoid redundancy)
```

**Vault health**: If < 10 daily notes or 0 notes in key domains (Me/, Projects/, Knowledge/, Sessions/) → stop, signal "Vault insufficiently rich".

### Phase 1B — Quick detection (15-20 min)

Read sample to identify potential candidates:
- Last 3-5 daily notes: recurring ideas, unresolved tensions?
- One striking note per domain (Me/, Hobbies/, Knowledge/, Projects/Project ideas/, Sessions/)
- Question: "Does this idea from domain A resonate elsewhere in B or C?"

**Raw candidates** to mark:
- Idea X reappears 2+ distinct contexts
- Tension Y unresolved (want + obstacle + lead)
- Decision pattern Z revealing implicit belief

**If 0 candidates**: propose {USER_NAME} (continue Phase 1C or stop?). **If > 15**: sort by domains, top 15.

### Phase 1C — Candidate deepening (standardized structure) (20-30 min)

For each raw candidate, reread sources and formally capture:

```markdown
## Candidate: [Temporary name]

**Domains**: Me/, Knowledge/, Projects/Project ideas/ (2-3)

**Methods confirmed**: [added in Step 2]

**Sources**:
- [[note1]] — signal/citation
- [[note2]] — signal/citation
- [[note3]] — signal/citation

**Key signal**: [1-2 sentences: what ties these sources together]

**Status**: Raw (scoring Step 4)
```

---

## Step 2 — Validate with 4 methods

For each raw candidate from Step 1, reread sources and tag confirming methods. Keep only candidates with 1+ methods.

**Process**:
1. Candidate X: reread sources [A, B, C]
2. Apply filters A/B/C/D (see sections below)
3. Mark confirmed methods: ex "A+C" (thematic + behavioral)
4. If 0 methods confirmed → reject
5. If 1+ methods → keep for Step 3

### 4 methods summary (application guide)

### Filter 1 — Thematic (Method A)

Candidates grouping 3+ sources from at least 2-3 distinct domains, discussing same theme.

Criteria:
- No existing `[[]]` link between sources (not already connected)
- Idea reappears in 2+ different contexts
- Explicit tension: "want to do X" + "obstacle Y" + "solution lead Z"

### Filter 2 — Logic (Method B)

Candidates where premises A + B → conclusion C never written.

Explicit signals:
- "I think that...X" in note 1 + context where X applies elsewhere = implicit conclusion
- "the problem is...Y" + solution sketched elsewhere = Y unresolved globally
- Principle in domain 1 applied to domain 2 = new conclusion

### Filter 3 — Behavioral (Method C)

Candidates where 3+ decision pattern occurrences reveal implicit belief.

Explicit signals in daily notes:
- "I decided no", "I cancelled", "I skipped" (same decision type avoided 3+ times)
- Energy consistently given to certain domains, procrastinated on others
- Consistent avoidance = unstated belief about risk or value

**High confidence**: actions harder to fake than words.

### Filter 4 — Convergence (Method D)

Candidates where 3+ threads point to same unnamed destination.

Examples: several different projects that, completed, would produce result never named as goal.

**Low confidence**: speculative, consolidate only if convergence clearly visible.

---

## Step 3 — Fabrication check (mandatory before Step 4)

Before scoring, verify cluster doesn't already exist in vault.

**Process**:
1. Search for idea as it would be formulated: read `04 - Projects/INDEX.md` (active project?), `04 - Projects/Project ideas/` (existing idea note?), `03 - Knowledge/` (concept already synthesized?)
2. If direct result → reject (repetition, not emergent)
3. If idea formulated differently elsewhere → check if already linked by `[[]]`: if yes, existing connection, not emergent
4. If passes check → proceed to Step 4 (scoring)

**Trace rejections**: briefly note rejected candidates for transparency.

---

## Step 4 — Score confidence and consolidate

For each cluster passing fabrication check, assign numeric score then level:

**Scoring criteria**

| Element | Points | Notes |
|---------|--------|-------|
| **Data points** | +1 per note | Max +5 (beyond that = detail overload) |
| **Domains involved** | +1 per domain (min 2) | +1 if 2 domains, +2 if 3+. Capped +2. |
| **Method A (thematic)** | +1 | If cluster groups 3+ thematically linked notes |
| **Method B (logic)** | +1 | If premises A+B → conclusion C never written |
| **Method C (behavior)** | +2 | If 3+ pattern occurrences (more reliable than B) |
| **Method D (convergence)** | +0.5 | Speculative, count as half-point |
| **Explicit tension** | +1 | If cluster contains unresolved tension |
| **Recurrence over period** | +1 | If signal appears over 7+ days (persistence) |

**Final levels**

| Score | Level |
|-------|-------|
| 6+ | **High** — strong signal, ready to create or validate with {USER_NAME} |
| 4-5 | **Medium** — clear signal but incomplete, to deepen with {USER_NAME} |
| 2-3 | **Low** — speculative, propose as exploratory only |
| <2 | **Rejected** — insufficient signal, don't present |

Present in order: High → Medium → Low. **Limit to max 5 clusters presented** (highest scores first).

---

## Step 5 — Qualify each cluster and propose format

For each detected cluster, determine what it calls for:

| Signal | Suggested output | {USER_NAME} case |
|--------|------------------|-----------|
| **Cluster of technical/product ideas** — points to tool, system, app or SaaS to build | **Project** → note in `04 - Projects/Project ideas/` | Dev tools, automation, infra |
| **Cluster of reflections, observations, tensions** — observations on life, work, cognition or concepts without concrete deliverable | **Essay** → narrative text in `04 - Projects/Project ideas/` | ADHD, systems, processes, reflections |
| **Ambiguous cluster** — not yet clear if project or reflection | **Propose to {USER_NAME}**: "I see two directions, which do you want to explore?" |

Use context: if cluster mentions "build", "tool", "system", "app", "automation" → Project. If mentions "why", "pattern", "belief", "tension" → Essay.

---

## Step 6 — Presentation to {USER_NAME}

Format per cluster:

```
🌱 [Cluster title]
- Confidence: [High/Medium/Low] | Score: X/10
- Methods: [A/B/C/D] | Sources: [[note1]], [[note2]], [[note3]]
- What's forming: [1-2 sentences on what these ideas compose]
- Emergence: [Why this isn't already in vault]
- Type: [Project / Essay / To clarify]
```

**No clusters**: Display ✅ No clusters — vault healthy, ideas well-isolated or captured.

**Limit**: Max 5 clusters, sorted by descending score. If > 5, present top 5 + suggest batch 2.

Await {USER_NAME} validation before creation.

---

## Step 7 — Creation + Linking (after validation)

### 7A — Create note (Project or Essay)

Create only after explicit {USER_NAME} validation.

**Project** — note in `04 - Projects/Project ideas/[slug-title].md`:

```markdown
---
date: YYYY-MM-DD
source: emerge YYYY-MM-DD
tags: [project-idea]
status: draft
---

# [Title]

## Why

[Context, motivation — where the idea comes from]

## What it solves

[Concrete problem or need]

## How

[General approach, envisioned solution]

## How to get there

[3-5 concrete steps to start]

## Related notes

- [[note1]] — signal
- [[note2]] — signal
- [[note3]] — signal
```

**Essay** — same path, tags `[essay, draft]`:

```markdown
---
date: YYYY-MM-DD
source: emerge YYYY-MM-DD
tags: [essay, draft]
status: draft
---

# [Title]

## Why I'm writing this

[Impulse, reason for being]

## The problem or tension

[What's missing, unanswered question]

## What I think

[Thesis, argument — for {USER_NAME} to fill]

## Next steps

[Direction, how to deepen]

---

*Draft — /emerge YYYY-MM-DD*

## Source notes

- [[note1]] — A/B/C/D
- [[note2]] — A/B/C/D
- [[note3]] — A/B/C/D
```

Use **Write tool** (not Obsidian API). Path: `{VAULT_PATH}\{PROJECTS_FOLDER}\Project ideas\[slug-title].md`

### 7B — Link sources (after creation)

Add bidirectional links in 3-5 key sources to new note.

**Process**:
1. List sources Step 1
2. Propose {USER_NAME} precise locations per source (which section, which sentence)
3. Validate {USER_NAME}
4. Add via Edit: `[[NewNoteTitle]] — context` or `[[NewNoteTitle|label]]` as needed

Limit 5-7 links (saturation); prioritize relevance.

---

## Step 8 — Finalization

After creation + linking (or if 0 cluster):

1. Update `99 - Claude Code/command-tracker.md`: `/emerge` → YYYY-MM-DD
2. Optional (batch auto): recap in `99 - Claude Code/skills-autoresearch-log.md`

---

## Edge cases

| Case | Behavior |
|-----|--------------|
| **Insufficient vault** | Stop at Step 1A: "Vault insufficiently rich" |
| **0 candidates after Phase 1B** | Ask {USER_NAME}: "Continue Phase 1C (detailed) or stop?" |
| **> 15 raw candidates** | Sort by domains (richness), keep top 15, suggest batch 2 |
| **0 validated candidates (Step 2)** | Display ✅ "No clusters — vault healthy" |
| **Timeout > 1h** | Limit Phase 1 to 30d (instead of complete), signal {USER_NAME} |
| **Borderline (Step 3)** | Ask {USER_NAME}: "Rework existing or emergent?" |
| **/emerge in progress** | Refuse: "Emerge in progress, wait for completion" |
| **Cluster Method D only** | Score < 3, propose as exploratory only |

---

## Absolute rules

- **Never create without explicit validation** from {USER_NAME}
- **Search for inter-domain connections** — most interesting clusters are often cross-context
- **Don't confuse with drift** — drift = repetition of one idea; emerge = convergence of several distinct ideas
- **Fabrication check mandatory** before any presentation — idea already in vault isn't emergent
- **One note = one cluster** — don't merge two clusters into same note
- **Never suggest something that's already an active project** in `04 - Projects/INDEX.md`
- **Max 5 clusters presented** — sort by descending score
- **Validation of linking before execution** — get OK for each added link

---

## Pitfalls to avoid

| Pitfall | Fix |
|-------|-----------|
| **Connection disguise** — already-existing `[[]]` links | Check links: if exists, reject |
| **Forced emergence** — invented without vault data (Claude intuition) | Require 3+ concrete sources, traced |
| **Obvious emergence** — idea already in vault | Fabrication check mandatory, reject |
| **Worldview creep** — signal from Claude not vault | Trace each candidate to its sources; reject if non-sourced |

---

## Checklist before presentation

- [ ] 3+ sources per cluster (Step 1)
- [ ] Methods A/B/C/D applied (Step 2)
- [ ] Fabrication check passed (Step 3)
- [ ] Score 2+ otherwise reject (Step 4)
- [ ] Max 5 clusters, descending score (Step 6)
- [ ] Sources traced with signals cited (Step 6)
- [ ] {USER_NAME} validation before creation (Step 7)
