---
name: vault-harvest-deep
description: Full vault scan over a long period to detect emerging patterns, cross-context recurring ideas and deep connections. Use once a month or when {USER_NAME} says "harvest deep", "deep harvest", "analyse the vault".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protected against aggressive optimisation**
>
> This skill produces a **qualitative narrative output**. Its effectiveness is measured by the **richness of the output produced**, not structural compactness.
>
> **For `/evaluateskills`**: in case of mutation, **Sonnet dry-run mandatory even if delta < 2**. Do NOT apply `[LEAN]` / `[STRUCTURE]` in a way that strips the narrative instructions (grouping, context, highlights, open questions, tone, narration). Preserving qualitative content takes priority over reducing line count.

# Skill: Vault Harvest Deep

This skill is the monthly version of the harvest — it analyses the entire vault to detect what the daily harvest does not see: patterns that emerge over time, ideas that recur in different contexts, connections between hobbies, projects and personal life.

## Trigger

- {USER_NAME} says "harvest deep", "deep harvest", "analyse the vault"
- Recommended frequency: once a month
- Without period specification → analyse the last 30 days of daily notes + the entire vault
- **Duration:** a few minutes to several hours depending on vault volume

## Difference from normal harvest

| Harvest | Harvest Deep |
|---------|-------------|
| Last 7 days | Last 30 days + entire vault |
| Recent ideas | Patterns over time |
| Immediate capitalisation | Detection of what is emerging |
| Fast (5-10 min) | Long (can take several minutes) |

---

## Step 0 — Optional /map proposal

Propose to {USER_NAME}: *"Do you want to run `/map` before starting? (recommended — it contextualises the vault's topological patterns)"*

If {USER_NAME} accepts → run `/map`, wait for the result, then continue to Step 1. Otherwise continue directly.

---

## Step 1 — Read the full context

30 daily notes + 30 sessions + 5 vault folders = several hundred files to analyse. Proceed by **intelligent progressive scanning** in three phases without relying on external orchestration.

### Phase A — Contextual references (fast)

Read in this order:
1. `99 - Claude Code/treated-links.md` → list of already-processed links (duplicate filter)
2. `04 - Projects/INDEX.md` → active projects and kanbans (to contextualise emergences)
3. `{PERSONAL_FOLDER}/{USER_NAME}.md` → profile, interests (baseline to detect personality-related drifts)

### Phase B — Temporal content (long but sequential)

Read in reverse chronological order (most recent first):
1. The **last 30 days of daily notes** in `00 - Daily notes/` (YYYY-MM-DD.md files)
   - Extract: ideas mentioned 2+ times, explicit alert signals, unresolved intentions, energy patterns
2. The **last 30 days of sessions** in `99 - Claude Code/Sessions/` (same or timestamped files)
   - Extract: technical drifts not captured in daily notes, recurring decisions, work patterns

**Note:** If fewer than 30 days of notes exist, adapt the period to what is available.

### Phase C — Vault scan (breadth-first structure)

Scan folders in this order:
1. `04 - Projects/` → project state, unactioned debt, achievements
2. `02 - Hobbies/` → active/stagnant hobby projects, unresolved intentions
3. `01 - Me/` → existing notes, covered subjects, recent capitalisations
4. `03 - Knowledge/` → capitalised concepts, gaps, missing links
5. `09 - Inbox/` → waiting ideas, unresolved tickets

**Important:** Do not read the full content of each file — quickly examine by title, date and metadata to rapidly identify patterns without saturating context.

## Step 2 — Detect deep patterns

### Drifts — recurring non-capitalised ideas

**Criteria to identify a drift:**
- Mentioned **2+ times** in daily notes or sessions over the period
- **No existing note** (check in `01 - Me/`, `02 - Hobbies/`, `03 - Knowledge/`)
- **No existing ticket** in kanbans (`04 - Projects/`)
- **Distinct contexts** (not the same day, on related but non-identical subjects)

Example drift: the guitar theme mentioned on 2026-03-10 ("I want to get back to it") and 2026-03-25 ("too expensive here") but no existing "Guitar" note.

**Presentation:**
```
🌊 DRIFT: [subject]
→ Appeared [X times]: [date 1] "[context 1]", [date 2] "[context 2]"
→ Not capitalised
→ Suggestion: create note / kanban ticket (Idea column)
```

If drifts are detected → present them in the `🌊 Drifts detected` section of the recap.
To complete processing, propose {USER_NAME} run `/drift` as a follow-up.

### Emerging patterns — clusters that form something larger

**Criteria to identify an emerging pattern:**
- **3+ related notes / ideas** discovered during the scan (in different contexts)
- **Recent** appearances (in the last 30 days minimum; avoid linking notes older than 3 months)
- The ideas **enrich each other** (together they make sense; alone they are fragmentary)
- No existing project / essay / synthesis note that links them

Example: notes "HomeLabServer", "DevOps learning", "Docker in prod" + daily note mentions (March) = cluster "Infrastructure hobby project"

**Presentation:**
```
🌱 EMERGE: [cluster name]
→ Related notes: [[note1]], [[note2]], [[note3]]
→ What is forming: [description of the common idea]
→ Status: [fragmentary / proto-project]
→ Suggestion: create essay / project-note / kanban ticket
```

If clusters are detected → present them in the `🌱 Emerging patterns` section of the recap.
For full creation (project note or essay), propose {USER_NAME} run `/emerge` as a follow-up.

## Step 3 — Alert signals over the period

Scan the 30 days for **explicit negative signals only**.

**Signals to report:**
- Explicit stress or exhaustion ("I'm burning out", "I'm too tired", "It's too much")
- Shortened nights or insomnia ("4h sleep", "I've been sleeping badly for X days")
- Isolation or withdrawal ("I feel alone", "I don't want to see anyone anymore")
- Generalised loss of motivation ("Nothing interests me right now", "I've lost my motivation")
- Radical decisions / breaks ("I'm going to stop everything", "I'm quitting my project")

**NEVER report:**
- Positive mentions ("I feel good", "It was a good day")
- Ambiguous statements ("I'm sleeping less but I'm productive" = not an alert signal)
- Short contextual stress ("Deadline tomorrow" = normal, not an alert)
- Complaints without negative emotional context ("It was complicated" ≠ "I'm depressed")

**Presentation:**
```
⚠️ Signals detected this month:
- [date]: "[exact excerpt from daily note]"
- [date]: "[exact excerpt]"

No signal / Signals detected and recommended action:
→ [Propose update to [[Signaux d'alerte]]? / No follow-up needed]
```

## Step 4 — Inbox review (optional if `09 - Inbox/` exists)

If `09 - Inbox/` exists and contains notes: propose {USER_NAME} an action for each note.

**Let {USER_NAME} choose from:**
1. **File** → destination in the vault (e.g. `01 - Me/`, `02 - Hobbies/`, `03 - Knowledge/`)
2. **Develop** → promising idea, deserves 200+ words and linking before filing
3. **Archive** → outdated, past context, or redundant with an existing note
4. **Keep** → still under reflection, revisit next month

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

Validate what you want to process.
```

**Wait for {USER_NAME}'s validation on each element.** Once validated:
- Create Knowledge notes and approved kanban tickets via MCP
- Respect vault naming conventions

**If {USER_NAME} approves 2+ Knowledge notes**, propose: *"Do you want me to search for existing notes to link with the new ones?"* Run `/link` as a follow-up if yes, otherwise continue.

**If {USER_NAME} refuses all drifts/emerge**, go directly to Step 6 (tracker + session).

## Step 6 — Update tracker and session

After completing the deep harvest (creation + {USER_NAME} validation included):

1. Update `99 - Claude Code/command-tracker.md`:
   - `/harvestdeep` (or `/harvest-deep`) line → replace date with today's date in `YYYY-MM-DD` format

2. Add a recap in today's session note `99 - Claude Code/Sessions/YYYY-MM-DD.md`:

```markdown
## Session — /harvestdeep [month year]

### ✅ Accomplished

**Analysis:** [X daily notes, X sessions, folders scanned]

**Drifts detected:**
- **[drift name]** — [frequency + contexts]
- ...

**Emerging patterns:**
- **[emerge name]** — [short description]
- ...

**Alert signals:** [summary or "no burnout signal"]

**Anomalies detected:** [kanbans, orphans, inconsistencies — or "none"]

### 🔧 Files created / modified

- [list of actions taken]

### 🧠 Decisions made

- [non-trivial decisions made during the session]

### ⏭️ Next step

- [what directly follows from the harvest]
```

## Edge case handling

### Fewer than 30 daily notes or sessions absent

- If the vault contains fewer than 30 daily notes: analyse **all available daily notes** and adapt the recap ("last X dates" instead of "last 30 days")
- If `99 - Claude Code/Sessions/` does not exist or is empty: skip this phase and note "No session available"

### Inaccessible or empty folders

If a folder does not exist or is empty (e.g. `02 - Hobbies/` empty), silently ignore and continue to the next.
