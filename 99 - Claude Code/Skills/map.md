---
name: map
description: Topological vault mapping — clusters, dead zones (under-represented CLAUDE.md priorities), fragile critical bridges. Run before /emerge or /harvestdeep, or monthly from 200 notes. Analysis only, creates/modifies nothing. Actions via /link (orphans), /emerge (emergence), /harvestdeep (temporal patterns).
---

# Skill: /map

Analyses the topological structure of the vault: where ideas concentrate, where dead zones form, which clusters depend on a single bridge note. The main insight is the **dead zone** — a subject that is a priority in CLAUDE.md but under-documented in the vault, revealing uncrystallised thinking.

**Recommended order in a vault analysis session:**
1. `/map` → current structural state (clusters, gaps, orphans)
2. `/emerge` → detects idea clusters that form something new
3. `/harvestdeep` → patterns over 30 days of daily notes (temporal view)

**Key difference from other skills:**
- `/vault-link` → operational: creates links between existing notes
- `/emerge` → semantic: detects idea clusters that form something new
- `/harvestdeep` → temporal: patterns over 30 days of daily notes
- `/map` → **topological**: current state of structure, cluster health, structural gaps

**Recommended frequency:** monthly, or when the vault exceeds ~200 notes.

---

## Step 1 — Structural scan

Use Glob and Grep to collect structure data without reading everything. Delegating the scan to parallel agents preserves the main context for the subsequent transverse analysis and avoids timeouts.

**Note:** Steps 1a-1d are parallelisable. The final aggregation (before Step 2) brings all results together.

### 1a. Distribution by folder — parallel agents per folder

Launch one agent per root folder. Each agent runs `Glob("**/*.md")` on its path.

**Folders to scan:** `00 - Daily notes/`, `01 - Me/`, `02 - Hobbies/`, `03 - Knowledge/`, `04 - Projects/`, `05 - ISEP/`, `06 - Work/`, `09 - Inbox/`, `99 - Claude Code/`

**Return contract (per agent):**
```json
{
  "folder": "absolute/path/",
  "count": N,
  "notes": ["path1.md", "path2.md"],
  "status": "success|empty|error",
  "error_msg": "optional (if error)"
}
```

**Edge case handling:**
- **Agent timeout (>30s)**: relaunch that specific folder alone (without parallel). If it fails again: return `status: "error"` and continue (partial aggregation).
- **Empty folder**: return `status: "empty"`, count: 0.
- **Vault total <20 notes**: merge batches 1b-1c into a single agent pass (parallel overhead useless).

### 1b. Orphans — 1 agent per batch of 15-20 notes

From the 1a lists, form batches of notes in `02 - Hobbies/`, `03 - Knowledge/`, `04 - Projects/`, `05 - ISEP/`, `06 - Work/`. **Exclude `00 - Daily notes/`** (ephemeral links by nature) and `09 - Inbox/` (temporary capture zone).

For each batch, launch an agent with this prompt:

```
For each note in the list (full path):
- Grep(filename_without_extension, path="C:\\Me\\Tha vault") 
  → 0 results = orphan (no note references this file)
Return: { "orphans": ["path/to/note.md"], "batch_size": N, "status": "success|error" }
```

### 1c. Deadends and hubs — 1 agent per batch of 15-20 notes (same batches as 1b)

For each batch of notes (same selection as 1b):

```
For each note in the list (full path):
- Grep("\\[\\[", path="path/to/note.md") 
  → 0 results = deadend (no [[...]] in the note)
- Also count incoming references: how many files contain [[note_name]]?
Return: { 
  "deadends": ["path1.md"], 
  "hubs": [{"note": "path.md", "inbound_count": 5}],
  "batch_size": N, 
  "status": "success|error" 
}
```

### 1d. Unresolved links — 1 dedicated agent

Launch an agent that greps all [[...]] in the vault, then validates each target:

```
Grep("\\[\\[[^\\]]+\\]\\]", path="C:\\Me\\Tha vault") → all [[...]] links
Extract unique references, then for each link:
- Check via Glob if the target file exists
- If NOT_FOUND: record as unresolved link, count references
Prioritise links modified <1 month (recency)
Return: { 
  "unresolved_links": [
    {"link": "[[NoteName]]", "referenced_by_count": 2, "references": ["file1.md", "file2.md"]}
  ],
  "total_unresolved": N,
  "status": "success|error" 
}
```

### 1f. INDEX.md health — 1 dedicated agent

Launch an agent that checks the state of each `INDEX.md` in the vault:

```
Glob("**/INDEX.md", path="C:\\Me\\Tha vault") → list all INDEX.md files (exclude Archives/)

For each INDEX.md found:
1. Read the file, extract listed slugs (pattern [[slug]] or [[slug|alias]])
2. Glob(`parent_folder/*.md`) → list real files in the same folder (exclude INDEX.md itself)
3. Compare:
   - Slugs in INDEX with no corresponding .md file → "dead entry"
   - .md files in folder absent from INDEX → "missing entry"

Return: {
  "index_file": "path/INDEX.md",
  "dead_entries": ["[[non-existent-slug]]"],
  "missing_entries": ["new-file.md"],
  "status": "ok|stale|broken"
}
```

- **`ok`**: no delta
- **`stale`**: missing entries only (new unindexed notes)
- **`broken`**: dead entries (referenced notes that no longer exist)

### 1e. Orphan tickets — sequential bash script

Run alone (not in parallel):
```bash
bash "/mnt/c/Me/Tha vault/99 - Claude Code/scripts/check-orphan-tickets.sh"
```

Store result in `ORPHAN_TICKETS` (list of slugs, may be empty).

**Error handling:** If bash fails → mark `ORPHAN_CHECK_FAILED = true`, continue (not blocking).

### Aggregation (main orchestrator)

Wait for all agent returns (with fallback on timeouts). Consolidate before Step 2:
- **Total notes:** sum of counts (1a), minus `00 - Daily notes/`
- **Orphans:** unique list of notes with no incoming reference
- **Deadends:** unique list of notes with no outgoing reference
- **Hubs:** TOP 10 by inbound_count
- **Unresolved links:** list sorted by referenced_by_count descending
- **INDEX.md health:** list of INDEX files with status `stale` or `broken` (`ok` ones ignored)

Steps 2, 3, 4 remain in the main context — they require a transverse view that only the orchestrator has.

---

## Step 2 — Identify clusters

From the hubs identified in 1c, trace link chains via BFS to form thematic clusters.

**BFS clustering algorithm:**
1. **Hub selection**: Use TOP 10 hubs by inbound_count. If <10 hubs identified: include all (no filtering).
2. **BFS depth**:
   - Vault ≥50 notes: max 3 hops from the hub
   - Vault <50 notes: max 2 hops (avoids artificial super-clusters)
3. **Expansion**: For each hub, collect notes that reference it (inbound) + notes it references (outbound), up to depth limit.
4. **Merging**: Two hubs whose clusters overlap >30% of notes → merge into a single cluster.

**Edge cases:**
- If 0 major hubs (no note has inbound_count ≥2): treat each isolated deadend as a "micro-cluster", signal general vault fragility.
- If a hub has abnormally high inbound_count (>50% of notes): it is a "super-hub", signal excessive concentration.

**For each identified cluster, calculate:**
- **Central node**: main hub (max inbound_count of cluster)
- **Size**: number of notes in cluster
- **Density**: ratio (internal links / theoretically possible links). High = notes link a lot; low = gravitation around hub alone.
- **Health**: Active (notes modified <1 month) / Stable (1-3 months) / Stagnant (3+ months) / Neglected (never modified).
- **Intercluster connections**: which other clusters does this cluster point to? List links that cross cluster boundaries.

### Structural fragilities — Critical bridge notes

Identify notes that create isolated bridges between clusters:
- **Definition**: a note X is the **only link** between Cluster A and Cluster B.
- **Risk**: if X is deleted, A and B disconnect completely.
- **Action**: these notes are critical for navigability — flag them as "single point of failure" in the synthesis.

---

## Step 3 — Identify gaps

Three distinct types of gaps: **dead zones**, **isolated orphans**, **unresolved links**.

### 3a. Dead zones (main insight)

Compare priority subjects declared in CLAUDE.md (active projects, interests, tech stack) with the actual density of notes in the vault.

| Subject | CLAUDE.md priority | Notes detected | Clusters | Status |
|---------|-------------------|-----------------|----------|--------|
| [subject] | High / Medium / Low | [N] | [hub1, hub2] | Dead zone / OK / Over-represented |

**Criteria:**
- **High priority + 0-2 notes** → Critical dead zone (e.g. "HomeLabServer" is a priority but no design note)
- **High priority + 3-5 notes, poorly connected** → Moderate dead zone (thought about but underdeveloped)
- **High priority + active clusters** → OK
- **Low priority + 10+ notes** → Attention sink (absorbs energy without being strategic) — candidate for archiving/sorting

### 3b. Potentially valuable orphans

For each orphan note (1b), automatically qualify:
- **(a) Genuinely isolated?** → Ignore (e.g. temporary draft, test) → filename pattern = "tmp", "test", "draft", "wip"
- **(b) Not connected but worth connecting?** → High-value candidate for `/vault-link` → rich title or mtime <30d
- **(c) Forgotten insight?** → Flag to {USER_NAME} → relevant business content but mtime >3 months
- **(d) Accidentally abandoned?** → Check modification date (mtime) → long content but unmodified

**Automated heuristic:**
- If filename contains "tmp", "test", "draft", "wip", "archive" → class (a)
- If mtime <30d → class (b) (work in progress, not orphan)
- If mtime >90d + size >500 chars → class (c) (forgotten but valuable)
- Otherwise → class (d) (long, old, rarely consulted)

### 3c. Unresolved links to prioritise

Among the unresolved `[[...]]` links (1d), sort by referenced_by_count descending:
- **Multiple references (>2)** → Important thought that deserves its own note (create via `/process` or manually)
- **Single references (1)** → Possibly a typo or minor note — check context
- **Link direction** → Read context in the referencing note → determines whether it is a real gap or a false alarm

---

## Step 4 — Synthesis and presentation to {USER_NAME}

Present the complete map. **Create nothing, modify nothing — everything is a recommendation.** {USER_NAME} decides which actions to take.

**Output format:**

```
VAULT MAP — [Date]

## Overview
- Total notes (excluding daily notes): ~[N]
- Daily notes: [N]
- Orphans: [N] (of which [X] potentially valuable)
- Deadends: [N]
- Unresolved links: [N] (of which [X] with multiple references)
- Orphan tickets: [N] (or "check failed")

## Clusters Map

| Cluster | Central hub | Size | Density | Health | Intercluster connections |
|---------|------------|------|---------|--------|------------------------|
| [name] | [[hub-note]] | ~N | High/Medium/Low | Active/Stable/Stagnant/Neglected | → [ClusterX] via [[NoteY]], [ClusterZ] via [[NoteA]] |

## Topological narrative
[3-5 sentences describing the overall shape: attention distribution, isolated clusters, super-hubs, concentration]

## Single points of failure detected
- [[Note X]] is the only bridge between [Cluster A] and [Cluster B] — critical
- [[Note Y]] links [Cluster C] to [Cluster D] — check its health

## Dead zones — Under-represented CLAUDE.md priorities

| Subject (CLAUDE.md) | Priority | Vault notes | Cluster(s) | Diagnosis |
|---|---|---|---|---|
| [HomeLabServer] | High | 0-2 | — | ⚠️ Critical: thought about but undocumented |
| [subject] | Medium | 3-5 | [hub1] | ⚠️ Moderate: underdeveloped |
| [subject] | High | 8+ | [hub1, hub2] | ✓ OK: active clusters |

## Orphans recommended for `/vault-link`
- [[note]] — relevant content, mtime < 30d (work in progress)
- [[note]] — mtime > 90d + long content (forgotten but valuable)

## Orphan tickets
> [Omit if empty or check failed]
- `[slug]` — not in any kanban → link or archive

## High-impact unresolved links
- [[Concept X]] — 4 references, important missing thought
- [[Concept Y]] — 2 references, clarify or typo?

## INDEX.md health
> Omit if all INDEX.md are `ok`

| INDEX.md | Dead entries | Missing entries | Status |
|----------|-------------|-----------------|--------|
| `03 - Knowledge/INDEX.md` | — | `new-note.md` | ⚠️ Stale |
| `01 - Me/INDEX.md` | `[[deleted-note]]` | — | ❌ Broken |

Remediation: run `/vault-link` — Step 6 updates INDEX.md files automatically.

## Recommended actions — by impact

### 1. Secure critical bridges
Check health (recent mtime) of: [[NoteX]], [[NoteY]]

### 2. Connect active orphans
Run `/vault-link` on the [X] identified orphans

### 3. Fill dead zones
- [HomeLabServer] → create spec/design in `03 - Knowledge/`
- [CryptoBot] → link to current tech stack

### 4. Resolve important unresolved links
These concepts appear 3+ times, create the notes: [[...]]

### 5. Analyse emergence and patterns
- Run `/emerge` for semantic clustering
- Run `/harvestdeep` for 30-day temporal patterns (complements /map)
```

**Pair-programming compliance:** no autonomous modification, everything is recommended and subject to {USER_NAME} validation.

## Absolute rules

- **Never create or modify without explicit validation** — /map is an analysis, not an action. Everything is recommended.
- **Do not use Obsidian plugins** — use Glob and Grep only
- **Exclude `00 - Daily notes/` from orphan/deadend analyses** — ephemeral links by nature. Include in total count.
- **Dead zones = main insight** — must be clearly distinguished from orphans and deadends
- **Refer to the right skills**: orphans → `/vault-link`, fragile clusters → `/emerge`, patterns → `/harvestdeep`, stale/broken INDEX → `/vault-link` (Step 6)
- **Compatible with pair-programming**: present the map and actions, {USER_NAME} decides what to process
- **Fallbacks required**: If a parallel agent times out → relaunch alone. If empty → continue. If error → signal in status.
- **Clustering depth:** max 3 levels (50+ notes) or max 2 (< 50 notes) — avoids artificial super-clusters
- **Orphan heuristics**: Automate classification (a/b/c/d) by filename pattern + mtime + size
- **Minimal vault**: Works on vault >10 notes. <10 notes: merge all agents into one (parallel overhead useless)
- **Save the graph**: If the map is large (>10 clusters), export the result or offer an interactive exploration link (optional)
