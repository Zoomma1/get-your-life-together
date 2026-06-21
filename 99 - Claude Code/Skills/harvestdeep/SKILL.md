---
name: harvestdeep
description: Complete vault scan over an extended period to detect emerging patterns, recurring ideas across different contexts, and deep connections. Use once a month or when the user says "harvest deep", "deep harvest", "analyze the vault".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimization**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not by structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **dry-run Sonnet mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips narrative instructions (grouping, context, pivotal moments, open questions, tone, narration). Preserving qualitative content takes priority over line reduction.

# Skill: Vault Harvest Deep

This skill is the monthly version of harvest — it analyzes the entire vault to detect what daily harvest cannot see: patterns that emerge over time, ideas that recur in different contexts, connections between hobbies, projects, and personal life.

## Triggering

- the user says "harvest deep", "deep harvest", "analyze the vault"
- Recommended frequency: once a month
- Without a specific period → analyze the last 30 days of daily notes + entire vault
- **Duration:** several minutes to multiple hours depending on vault volume

## Difference from regular harvest

| Harvest | Harvest Deep |
|---------|-------------|
| Last 7 days | Last 30 days + entire vault |
| Recent ideas | Patterns over time |
| Immediate capitalization | Detection of emerging content |
| Fast (5-10 min) | Long (can take several minutes) |

---

## Step 0 — Optional `/map` proposal

Suggest to {USER_NAME}: *"Would you like to launch `/map` before we start? (recommended — it contextualizes the vault's topological patterns)"*

If {USER_NAME} accepts → launch `/map`, wait for results, then continue to Step 1. Otherwise continue directly.

---

## Step 1 — Read complete context

30 daily notes + 30 sessions + 5 vault folders = several hundreds of files to analyze. Proceed with **intelligent and progressive scanning** in three phases without depending on external orchestration.

### Phase A — Contextual references (fast)

Read in this order:
1. `99 - Claude Code/treated-links.md` → list of already-treated links (filter potential duplicates)
2. `04 - Projects/INDEX.md` → active projects and kanbans (to contextualize emergences)
3. `01 - Me/{USER_NAME}.md` → profile, interests (baseline to detect personality-related drifts)

### Phase B — Temporal content (long but sequential)

Read in reverse chronological order (most recent first):
1. The **last 30 days of daily notes** in `00 - Daily notes/` (files YYYY-MM-DD.md)
   - Extract: ideas mentioned 2+ times, explicit alert signals, intentions without follow-through, energy patterns
   - For URLs encountered in daily notes: use **defuddle first** (`https://defuddle.md/<url>` via WebFetch), fallback to classic WebFetch if invalid
2. The **last 30 days of sessions** in `99 - Claude Code/Sessions/` (same files or timestamped)
   - Extract: technical drifts not captured in daily notes, recurring decisions, work patterns

**Note:** If fewer than 30 days of notes exist, adapt the period to what is available.

### Phase C — Vault scan (breadth-first structure)

Scan folders in this order:
1. `04 - Projects/` → project status, unacknowledged debt, accomplishments
2. `02 - Hobbies/` → active/stagnant hobby projects, unexecuted intentions
3. `01 - Me/` → existing notes, covered subjects, recent capitalizations
4. `03 - Knowledge/` → capitalized concepts, gaps, missing links
5. `09 - Inbox/` → pending ideas, tickets without follow-up

**Important:** Do not read the complete content of each file — quickly examine by title, date, and metadata to quickly identify patterns without saturating context.

## Step 2 — Detect deep patterns

### Drifts — recurring non-capitalized ideas

**Criteria to identify a drift:**
- Mentioned **2+ times** in daily notes or sessions over the period
- **No existing note** (check in `01 - Me/`, `02 - Hobbies/`, `03 - Knowledge/`)
- **No existing ticket** in kanbans (`04 - Projects/`)
- **Distinct contexts** (not the same day, on related but non-identical subjects)

Example of drift: guitar theme mentioned on 2026-03-10 ("I want to pick it back up") and 2026-03-25 ("too expensive here") but no existing "Guitar" note.

**Presentation:**
```
🌊 DRIFT: [subject]
→ Appeared [X times]: [date 1] "[context 1]", [date 2] "[context 2]"
→ Not capitalized
→ Suggestion: create note / kanban ticket (Idea column)
```

If drifts are detected → present them in the `🌊 Drifts detected` section of the summary.
For complete processing, suggest to {USER_NAME} to launch `/drift` as follow-up.

### Emerging patterns — clusters that form something larger

**Criteria to identify an emerging pattern:**
- **3+ related notes / ideas** discovered during scan (in different contexts)
- **Recent appearances** (within the last 30 days minimum; avoid linking notes older than 3 months)
- Ideas **enrich each other mutually** (together they make sense; alone they are fragmentary)
- No existing project / essay / synthesis note linking them yet

Example: notes "[infra-project]", "DevOps learning", "Docker in prod" + mentions in daily (March) = cluster "Infrastructure hobby project"

**Presentation:**
```
🌱 EMERGE: [cluster name]
→ Related notes: [[note1]], [[note2]], [[note3]]
→ What is forming: [description of the common idea]
→ Status: [fragmentary / proto-project]
→ Suggestion: create essay / project-note / kanban ticket
```

If clusters are detected → present them in the `🌱 Emerging patterns` section of the summary.
For complete creation (project note or essay), suggest to {USER_NAME} to launch `/emerge` as follow-up.

## Step 2.5 — Lint pass on `03 - Knowledge/`

Scan `03 - Knowledge/` (all subfolders) to detect quality issues in the knowledge base.

**Patterns to report:**
- **Contradictions**: claim in note A contradicted by note B more recent (e.g.: "Graphify recommended for vault" vs ADR-034 "graphify scoped dev only")
- **Stale notes**: note dated more than 6 months ago whose content covers a tool or practice that has evolved in recent sessions/daily notes
- **Orphaned without inbound links**: Knowledge notes not referenced by any other note (`[[slug]]` absent from entire vault) — candidates for archiving or linking
- **Obvious missing cross-refs**: two Knowledge notes that clearly discuss the same subject without linking to each other

**Presentation (dedicated section in Step 5 summary):**
```
### 🔍 Lint Knowledge
- ⚠️ Contradiction: [[note-A]] claims X, [[note-B]] (2026-04-XX) says Y
- 🕸️ Orphaned: [[note-C]] — no note references it
- 🔗 Missing cross-ref: [[note-D]] and [[note-E]] discuss Y without linking
```

If no issues detected → silently proceed to Step 3.

---

## Step 3 — Alert signals over the period

Scan the 30 days for **only genuine explicit negative signals**.

**Signals to report:**
- Explicit stress or exhaustion ("I have burnout", "I'm too tired", "It's too much")
- Shortened nights or insomnia ("4 hours of sleep", "I've been sleeping poorly for X days")
- Isolation or withdrawal ("I feel alone", "Don't want to see anyone anymore")
- General loss of interest ("Nothing interests me right now", "I've lost my motivation")
- Radical decisions / breakups ("I'm going to stop everything", "I'm quitting my project")

**NEVER report:**
- Positive mentions ("I feel good", "It was a good day")
- Ambiguous statements ("I sleep less but I'm productive" = not an alert signal)
- Short-term contextual stress ("Deadline tomorrow" = normal, not alert)
- Complaints without negative emotional context ("It was complicated" ≠ "I'm depressed")

**Presentation:**
```
⚠️ Signals detected this month:
- [date]: "[exact excerpt from daily note]"
- [date]: "[exact excerpt]"

No signals / Signals detected and recommended action:
→ [Suggest updating [[Alert signals]]? / No follow-up needed]
```

## Step 4 — Inbox review (optional if `09 - Inbox/` exists)

If `09 - Inbox/` exists and contains notes: propose to {USER_NAME} an action for each note.

**Let {USER_NAME} choose from:**
1. **Organize** → destination in vault (e.g.: `01 - Me/`, `02 - Hobbies/`, `03 - Knowledge/`)
2. **Develop** → promising idea, deserves 200+ words and linking before organizing
3. **Archive** → outdated, past context, or redundant with existing note
4. **Keep** → still in reflection, revisit next month

**If `09 - Inbox/` empty or absent**, silently proceed to Step 5.

## Step 5 — Validation and creation

Present everything at once:

```
## Deep Harvest [month]

### 🌊 Drifts detected
...

### 🌱 Emerging patterns
...

### ⚠️ Alert signals
...

### 📥 Inbox review
...

Validate what you want to work on.
```

**Wait for {USER_NAME}'s validation for each item.** Once validated:
- I create via MCP the approved Knowledge notes and kanban tickets
- Respect vault naming conventions
- **Archiving convention**: Done/canceled tickets = notes to **move** to `Archive/` at vault root — never delete. The `Archive/` folder is intentionally unorganized (no subfolders) to remain greppable by slug or date.

**If {USER_NAME} approves 2+ Knowledge notes**, suggest: *"Do you want me to search for existing notes to link with the new ones?"* Launch `/link` as follow-up if yes, otherwise continue.

**If {USER_NAME} refuses all drifts/emerge**, proceed directly to Step 6 (tracker + session).

## Step 6 — Update tracker and session

After harvest deep completion (including creation + {USER_NAME} validation):

1. Update `99 - Claude Code/command-tracker.md`:
   - Line `/harvestdeep` (or `/harvest-deep`) → replace date with today's date in `YYYY-MM-DD` format

2. Add a recap in today's session note `99 - Claude Code/Sessions/YYYY-MM-DD.md`:

```markdown
## Session — /harvestdeep [month year]

### ✅ Accomplished

**Analysis:** [X daily notes, X sessions, scanned folders]

**Drifts detected:**
- **[drift name]** — [frequency + contexts]
- ...

**Emerging patterns:**
- **[emerge name]** — [short description]
- ...

**Alert signals:** [summary or "no burnout signals"]

**Anomalies detected:** [kanbans, orphans, inconsistencies — or "none"]

### 🔧 Files created / modified

- [list of actions performed]

### 🧠 Decisions made

- [non-trivial decisions made during session]

### ⏭️ Next steps

- [what directly follows from the harvest]
```

## Edge case handling

### Fewer than 30 daily notes or sessions absent

- If vault contains fewer than 30 daily notes: analyze **all available daily notes** and adapt summary ("X last dates" instead of "last 30 days")
- If `99 - Claude Code/Sessions/` doesn't exist or is empty: skip this phase and note "No sessions available"

### Inaccessible or empty folders

If a folder doesn't exist or is empty (e.g.: `02 - Hobbies/` empty), silently ignore and continue to the next one.
