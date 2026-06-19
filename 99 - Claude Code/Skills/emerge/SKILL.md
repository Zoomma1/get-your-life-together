---
name: emerge
description: Detect clusters of scattered ideas in the vault that together form something new — a project or an essay. Unlike drift (a single recurring idea), emerge searches for inter-note connections that have not yet been synthesized, and conclusions that the vault implies but has never drawn. Use manually or automatically after a /harvestdeep.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured on the **richness of the output produced**, not on structural compactness.
>
> **For `/evaluateskills`** : in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, key moments, open questions, tone, narration). Preservation of qualitative content takes priority over line reduction.

# Skill: /emerge

Analyzes the vault to detect clusters of scattered ideas that, together, form something new — a project, an essay, an implicit direction.

**Key difference with `/drift`** : 
- drift = 1 individual idea recurs often
- emerge = N distinct ideas converge toward 1 new structure

**Test of true emergence** : "It's true but I never said it" (not "I already knew it").

---

## Quick Execution Summary

**Input** : {USER_NAME} launches `/emerge` or system proposes after `/harvestdeep`

**Output** : Max 5 clusters proposed with score/confidence/source notes, awaiting {USER_NAME} validation before creation

**Time** : ~1-2h complete (depends on vault — Passes 1B/1C are the heavy phases)

**Key steps** :
1. **Read references** (5-10 min) — INDEX, {USER_NAME}.md, command-tracker
2. **Transverse pass** (15-20 min) — detect cross-domain candidates
3. **Detail pass** (20-30 min) — apply Methods A/B/C/D to candidates
4. **Fabrication check** (5-10 min) — reject existing ideas
5. **Scoring** (10 min) — assign numeric scores, sort
6. **Presentation** (5 min) — show top 5 to {USER_NAME}
7. **Creation + linking** (15-20 min) — after {USER_NAME} validation

## Trigger

- **Manual** : the user says "/emerge", "do an emerge", "what's emerging from the vault"
- **Automatic** : Harness proposes after `/harvestdeep` complete if vault richness OK (managed by post-harvest hook, not via the skill)

---

## Step 1 — Collect raw candidates

Vault scan in 2 passes: first orientation + rapid detection, then formal capture.

### Phase 1A — Context and vault health (5-10 min)

Read to establish baseline:
```
1. `04 - Projects/INDEX.md` → active projects (exclude from analysis)
2. `01 - Me/{USER_NAME}.md` → profile, context (for interpreting signals)
3. `99 - Claude Code/command-tracker.md` → date of previous /emerge (avoid redundancy)
```

**Vault health** : If < 10 daily notes or 0 notes in key domains (Me/, Projects/, Knowledge/, Sessions/) → stop, signal "Vault insufficiently rich".

### Phase 1B — Rapid detection (15-20 min)

Read a sample to identify potential candidates:
- Last 3-5 daily notes: recurring ideas, unresolved tensions?
- One notable note per domain (Me/, Hobbies/, Knowledge/, Projects/Project ideas/, Sessions/)
- Question: "Does this idea from domain A resonate elsewhere in B or C?"

**Raw candidates** to flag:
- Idea X reappears in 2+ distinct contexts
- Tension Y unresolved (want + obstacle + lead)
- Decision pattern Z revealing implicit belief

**If 0 candidates** : propose to {USER_NAME} (continue Phase 1C or stop?). **If > 15** : sort by domains, top 15.

### Phase 1C — Deepening candidates (standardized structure) (20-30 min)

For each raw candidate, reread sources and capture formally:

```markdown
## Candidate: [Temporary name]

**Domains** : Me/, Knowledge/, Projects/Project ideas/ (2-3)

**Methods confirmed** : [to be added in Step 2]

**Sources** : 
- [[note1]] — signal/citation
- [[note2]] — signal/citation
- [[note3]] — signal/citation

**Key signal** : [1-2 sentences: what connects these sources together]

**Status** : Raw (scoring Step 4)
```

---

## Step 2 — Validate with the 4 methods

For each raw candidate from Step 1, reread sources and tag the methods that confirm the signal. Keep only candidates with 1+ methods.

**Process** :
1. Candidate X: reread sources [A, B, C]
2. Apply filters A/B/C/D (see sections below)
3. Mark confirmed methods: e.g. "A+C" (thematic + behavioral)
4. If 0 methods confirmed → reject
5. If 1+ methods → keep for Step 3

### Summary of 4 methods (application guide)

### Filter 1 — Thematic (Method A)

Candidates grouping 3+ sources from at least 2-3 distinct domains, speaking about the same theme.

Criteria:
- No existing `[[]]` link between sources (not already connected)
- Idea reappears in 2+ different contexts
- Explicit tension: "want to do X" + "obstacle Y" + "solution lead Z"

### Filter 2 — Logic (Method B)

Candidates where premises A + B → conclusion C never written.

Explicit signals:
- "I think that...X" in note 1 + context where X applies elsewhere = implicit conclusion
- "the problem is...Y" + solution sketched elsewhere = Y not globally resolved
- Principle in domain 1 applied to domain 2 = new conclusion

### Filter 3 — Behavioral (Method C)

Candidates where decision pattern 3+ occurrences reveals implicit belief.

Explicit signals in daily notes:
- "I decided not", "I canceled", "I skipped" (same type of decision avoided 3+ times)
- Energy systematically given to certain domains, procrastinated on others
- Consistent avoidance = unstated belief about risk or value

**High confidence** : actions harder to fake than words.

### Filter 4 — Convergence (Method D)

Candidates where 3+ threads point toward same unnamed destination.

Examples: multiple different projects which, completed, would produce a result never named as a goal.

**Low confidence** : speculative, consolidate only if convergence clearly visible.

---

## Step 3 — Fabrication check (mandatory before Step 4)

Before scoring, verify that a cluster does not already exist in the vault.

**Process** :
1. Search for the idea as it would be formulated: read `04 - Projects/INDEX.md` (active project?), `04 - Projects/Project ideas/` (existing idea note?), `03 - Knowledge/` (concept already synthesized?)
2. If direct match → reject (repetition, not emergent)
3. If idea formulated differently elsewhere → verify if already linked by `[[]]`: if yes, existing connection, not emergent
4. If passes check → proceed to Step 4 (scoring)

**Trace rejections** : briefly note rejected candidates for transparency.

---

## Step 4 — Score confidence and consolidate

For each cluster that passed fabrication check, assign a numeric score then a level:

**Scoring criteria**

| Element | Points | Notes |
|---------|--------|-------|
| **Data points** | +1 per note | Max +5 (beyond that = more detail data unnecessary) |
| **Domains involved** | +1 per domain (min 2) | +1 if 2 domains, +2 if 3+. Capped +2. |
| **Method A (thematic)** | +1 | If cluster groups 3+ notes thematically |
| **Method B (logic)** | +1 | If premises A+B → conclusion C never written |
| **Method C (behavior)** | +2 | If pattern 3+ occurrences (more reliable than B) |
| **Method D (convergence)** | +0.5 | Speculative, count as half-point |
| **Explicit tension** | +1 | If cluster contains unresolved tension |
| **Recurrence over period** | +1 | If signal appears over 7+ days (persistence) |

**Final levels**

| Score | Level |
|-------|--------|
| 6+ | **High** — strong signal, ready to create or validate with {USER_NAME} |
| 4-5 | **Medium** — clear signal but incomplete, to deepen with {USER_NAME} |
| 2-3 | **Low** — speculative, propose as exploratory only |
| <2 | **Rejected** — insufficient signal, do not present |

Present in order: High → Medium → Low. **Limit to max 5 clusters presented** (highest scores first).

---

## Step 5 — Qualify each cluster and propose format

For each detected cluster, determine what it calls for:

| Signal | Suggested Output | {USER_NAME} Case |
|--------|------------------|-----------|
| **Cluster of technical / product ideas** — points to a tool, system, app or SaaS to build | **Project** → note in `04 - Projects/Project ideas/` | Dev tools, automation, infra |
| **Cluster of reflections, observations, tensions** — observations about life, work, cognition or concepts without concrete deliverable | **Essay** → narrative text in `04 - Projects/Project ideas/` | ADHD, systems, processes, reflections |
| **Ambiguous cluster** — not yet clear if it's a project or a reflection | **Propose to {USER_NAME}** : "I see two directions, which one do you want to explore?" |

Use context: if cluster mentions "build", "tool", "system", "app", "automation" → Project. If mentions "why", "pattern", "belief", "tension" → Essay.

---

## Step 6 — Presentation to {USER_NAME}

Format per cluster:

```
🌱 [Cluster title]
- Confidence: [High/Medium/Low] | Score: X/10
- Methods: [A/B/C/D] | Sources: [[note1]], [[note2]], [[note3]]
- What is forming: [1-2 sentences on what these ideas compose]
- Emergence: [Why this is not already in the vault]
- Type: [Project / Essay / To clarify]
```

**No clusters** : Display ✅ No cluster — vault healthy, ideas well isolated or capitalized.

**Limit** : Max 5 clusters, sorted by descending score. If > 5, present top 5 + propose batch 2.

Await {USER_NAME} validation before creation.

---

## Step 7 — Creation + Linking (after validation)

### 7A — Create the note (Project or Essay)

Only create after explicit {USER_NAME} validation.

**Project** — note in `04 - Projects/Project ideas/[slug-title].md` :

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

**Essay** — same path, tags `[essay, draft]` :

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

## What I think about it

[Thesis, argument — to be filled in by {USER_NAME}]

## Next steps

[Direction, how to deepen]

---

*Draft — /emerge YYYY-MM-DD*

## Source notes

- [[note1]] — A/B/C/D
- [[note2]] — A/B/C/D
- [[note3]] — A/B/C/D
```

Use **Write tool** (not Obsidian API). Path : `{VAULT_PATH}\{PROJECTS_FOLDER}\Project ideas\[slug-title].md`

### 7B — Link the sources (after creation)

Add bidirectional links in 3-5 key sources to the new note.

**Process** :
1. List sources from Step 1
2. Propose {USER_NAME} precise locations per source (which section, which sentence)
3. Validate {USER_NAME}
4. Add via Edit: `[[ParentNoteName]] — context` or `[[ParentNoteName|label]]` as needed

Limit 5-7 links (saturation); prioritize relevance.

### 7C — Trace in Idea Kanban (after creation)

A note created in `04 - Projects/Project ideas/` but absent from the kanban
remains a **dead file** : invisible from the board, never prioritized.
This is exactly what produced 9 orphaned essays (all `source: emerge`).
Creation is only complete when the note is also traced.

**Process** :
1. Target: `## Idea` column of `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Claude Code Kanban.md`
2. Construct the line by type:
   - **Essay** : `- [ ] [[04 - Projects/Project ideas/<slug>|Essay — <title>]] — 📝 essay idea (draft, emerge YYYY-MM-DD)`
   - **Project** : `- [ ] [[04 - Projects/Project ideas/<slug>|<title>]] — 💡 project idea (draft, emerge YYYY-MM-DD)`
3. Announce the exact line to {USER_NAME} and validate (same requirement as linking 7B)
4. Insert via Edit at the end of Idea column, just before `## Blocked`

The link points to the existing source file — never duplicate the note.

---

## Step 8 — Finalization

After creation + linking (or if 0 cluster):

1. Update `99 - Claude Code/command-tracker.md` : `/emerge` → YYYY-MM-DD
2. Optional (auto batch): recap in `99 - Claude Code/skills-autoresearch-log.md`

---

## Edge cases

| Case | Behavior |
|-----|--------------|
| **Insufficient vault** | Stop at Step 1A: "Vault insufficiently rich" |
| **0 candidates after Phase 1B** | Ask {USER_NAME} : "Continue Phase 1C (detail) or stop?" |
| **> 15 raw candidates** | Sort by domains (richness), keep top 15, propose batch 2 |
| **0 validated candidates (Step 2)** | Display ✅ "No cluster — vault healthy" |
| **Timeout > 1h** | Limit Phase 1 to 30d (instead of complete), signal {USER_NAME} |
| **Borderline (Step 3)** | Ask {USER_NAME} : "Rework existing or emergent?" |
| **/emerge in progress** | Refuse: "Emerge in progress, wait for completion" |
| **Cluster Method D alone** | Score < 3, propose exploratory only |

---

## Absolute rules

- **Never create without explicit validation** from {USER_NAME}
- **Search for cross-domain connections** — the most interesting clusters are often cross-context
- **Don't confuse with drift** — drift = repetition of one idea; emerge = convergence of multiple distinct ideas
- **Fabrication check mandatory** before any presentation — an idea already in the vault is not emergent
- **One note = one cluster** — don't merge two clusters into the same note
- **Never propose something already an active project** in `04 - Projects/INDEX.md`
- **Max 5 clusters presented** — sort by descending score
- **Validate linking before execution** — ask OK for each link added

---

## Pitfalls to avoid

| Pitfall | Correction |
|--------|-----------|
| **Connection disguise** — existing links `[[]]` | Check links: if exists, reject |
| **Forced emergence** — invented without vault data (Claude intuition) | Require 3+ concrete sources, traced |
| **Obvious emergence** — idea already in vault | Mandatory fabrication check, reject |
| **Worldview creep** — signal comes from Claude not vault | Trace each candidate to its sources; reject if unsourced |
| **Orphaned note** — file created in Project ideas outside kanban | Step 7C mandatory: trace in Idea column, otherwise creation incomplete |

---

## Checklist before presentation

- [ ] 3+ sources per cluster (Step 1)
- [ ] Methods A/B/C/D applied (Step 2)
- [ ] Fabrication check passed (Step 3)
- [ ] Score 2+ otherwise reject (Step 4)
- [ ] Max 5 clusters, descending score (Step 6)
- [ ] Sources traced with signals cited (Step 6)
- [ ] Validation {USER_NAME} before creation (Step 7)
- [ ] Note traced in Kanban Idea — file not orphaned (Step 7C)
