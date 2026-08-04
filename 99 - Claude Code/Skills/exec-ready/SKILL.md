---
name: exec-ready
description: "Chooses what to execute now in the Ready of the Claude Code Kanban, under time constraint. Scores technical vault/CC tickets by value = impact/effort, returns top 3, recalls current WIP, and proposes for purge tickets durably weak (never automatic). Trigger when the user says \"/exec-ready\", \"what do I do now\", \"what should I tackle\", \"I have a time slot\", \"Ready is congested\", \"help me choose\", or more broadly whenever looking for where to start in the backlog rather than what to add to it. Also use when wanting to slim down Ready or talking about ticket graveyard. Do NOT use for refining a ticket (/refine), sorting explorations (/triage-explo) or planning the day (/today)."
---

# Skill: Exec Ready

Returns the vault flow from **generation** to **execution**.

The vault has resolved capture and refinement — skills are mature and throughput is proven. The problem has shifted: ~60 tickets pile up in Ready, the throughput of `/refine` far exceeds that of execution, and the real cost is no longer producing a ticket but **choosing which one deserves the time slot you have**.

This skill does two things, and nothing else:
1. **Triage under scarcity** — "what is the best use of the next hour?" It returns top 3, not a list.
2. **Purge from below** — it spots tickets durably without value and **proposes** closing them. It never closes one on its own.

**Why both together**: scoring alone doesn't empty the graveyard, it only sorts it. It must be paired with mortality. But automatic mortality on noisy scoring would kill real work — hence systematic human validation on every closure.

## When to use / when not

- ✅ {USER_NAME} has a time slot and doesn't know where to start.
- ✅ Ready is congested and they want to slim it down.
- ❌ **Choose *if* a ticket is good** → that's `/refine`, upstream.
- ❌ **Sort explorations** → `/triage-explo`, which distills them into Knowledge notes. This skill keeps them out of scope.
- ❌ **Plan the day** (energy, calendar, hobbies) → `/today`. This skill ignores the agenda; it only knows the intrinsic value of tickets.
- ❌ **Project kanbans** — CC Kanban only. Dev kanbans have their own ordering.

## Step 1 — Read Ready and carve out the scope

Read `99 - Claude Code/Claude Code Kanban.md`, section between `## Ready` and the next `## WIP`.

> ⚠️ A kanban line can contain **two tickets concatenated** (a `- [ ] [[` mid-line). Detect this and count them separately — otherwise a ticket becomes invisible. Report it to {USER_NAME}, it's a format bug to fix.

Classify each ticket into **one** of these four families. Three of them **exit scoring**:

| Family | Signal | Outcome |
|---|---|---|
| 📝 **Essay** | slug `essay-*`, or type `📝` | **Excluded** → dedicated queue, own cadence via `/essay-check` |
| 💡 **Exploration** | kanban line marked `💡` and **without** triage verdict (see box) | **Excluded** → `/triage-explo` |
| 🏠 **Personal / off-vault** | deliverable is neither code nor a vault-CC setup element (skill, hook, ADR, note) — e.g. furniture, relation, purchase | **Excluded** → rises via `/today` |
| 🔧 **Tech vault/CC** | everything else | **Scored** |

**Why exclude rather than score.** An `impact/effort` ratio calibrated on tooling has no information to judge an essay or life task. Measured on real stock: essays structurally cap (fixed writing cost, hence bounded value — they can never reach top), and personal falls systematically into purge zone because an LLM scores low what has no code artifact. Yet the vault says the opposite about both classes: essays are the upstream feeding `{USER_NAME}.md`, and some personal tasks carry stakes that scoring doesn't see. Scoring them would purge as priority what {USER_NAME} wants most to do.

> ⚠️ **Classify exploration by status, not slug.** The slug is immutable, status is not: a ticket through `/triage-explo` and **kept in Ready** (verdict "actionable" or "POC required") keeps its `explorer-*` / `investiguer-*` while now scorable — excluding on slug makes it **invisible to scoring for life**.
>
> Read the kanban line, not the filename:
> - `💡` alone, no `veille-explo-tri-*` link → **Exploration**, excluded.
> - `🔨` + a **dated verdict** (`verdict rendered YYYY-MM-DD`, `re-confirmed YYYY-MM-DD`, `confirmed actionable`) + a `[[veille-explo-tri-*]]` link + an **effort** (`effort S/M/L`) → triage is done, ticket enters **🔧 Tech vault/CC** and scores normally.
> - `⏸️ #blocked by …` → excluded regardless of marker, it awaits unblocking, not a time slot.
>
> Slug serves only as **fallback** when the line bears neither marker nor verdict. *(Cause: 2026-07-28 — running `/exec-ready` cutting out 9 explorations in bulk, including Bumblebee and `investiguer-webfetch-calendriers`, all triaged and costed in effort that same day.)*

**Announce the breakdown** before continuing: *"N tickets in Ready — X tech scored, Y essays, Z explorations, W personal. I score the X."* If explorations exceed ~10, suggest `/triage-explo` in passing.

## Step 2 — Establish `effort`, then infer `impact`

### `effort` — read from ticket, not guessed

Look for `effort:` in the note frontmatter (scale 1-5, or S/M/L → 1/3/5).

**Effort is a ticket property, not a run opinion.** `/refine` already produces it in prose ("chore ~5min", "~30min", "agentic specs ready") — it should be fixed there, once, rather than re-estimated each pass. It's the main source of score instability: since `value = impact/effort`, a ±1 error on low `effort` **halves or doubles the score**.

If `effort:` is absent: infer it, but **mark the value with a `~`** (estimated) in output, and list at run end the tickets involved — *"N tickets without frozen effort, their score is unstable; `/refine` should write it."* This is the ratchet that converges the vault toward stored efforts.

### `impact` — inferred, on an anchored scale

Scale 1-5:
- **1** cosmetic or speculative · **2** small one-off friction · **3** removes recurring friction OR unblocks a workflow · **4** notably changes a routine OR unblocks multiple tickets · **5** structural, or head of a dependency chain

If fan-out is done in parallel batches, **include the same 3 anchor tickets with imposed score in each batch prompt**. Without common anchor, batches drift — it's been measured: on a real run, two batches out of four never dared go below `effort 1` while the other two used it, enough to fabricate a false podium. Anchoring costs three prompt lines and removes drift.

`value = impact / effort`

## Step 3 — Classify

Sort by `value` descending. On tie — and **there will be many**: a ratio of two integers 1-5 yields only ~12 distinct values, so tied packets are norm, not exception — break by **age**, with a bounded bonus:

```
bonus = 0.06 × min(age_in_days, 90) / 90        # +6 % maximum
displayed_value = value × (1 + bonus)
```

**Why exactly +6%**: the tightest gap between two reachable value tiers is `1.25 → 1.33`, or ×1.064. A larger bonus would shift an old ticket between tiers, and age would stop being a tie-breaker to become a selection criterion — what it must not be. An old ticket without value must stay without value.

Return the **top 3**, with `impact/effort` visible for each.

**Why 3 not 1**: automatic top 1 gives false authority to the noisiest note in all the math. At `effort 1`, a one-point error halves the score; at `effort 4` it costs 20%. Showing three candidates with their components lets {USER_NAME} see *why* they're there and one-glance-correct a plainly wrong effort note.

## Step 4 — Unique WIP guard

Read the `## WIP` column. **If not empty**: display what's there and **propose no promotion**. The message is *"you already have X in progress"*, not a fourth option.

The bottleneck is available time. Opening a second site doesn't create time, it fragments what exists.

If WIP is empty, propose promoting **one** of the three — {USER_NAME} chooses, skill doesn't decide.

## Step 5 — Mortality and proposed purge

### The state file

`99 - Claude Code/exec-ready-state.json` — needed because "weak for a long time" is not observable in an isolated run.

```json
{
  "version": 1,
  "runs": ["2026-07-19"],
  "tickets": {
    "ticket-slug": {
      "observations": [{ "date": "2026-07-19", "value": 0.75, "rank_pct": 0.91 }],
      "first_low": "2026-07-19"
    }
  }
}
```

Purge entries for any ticket that **exits Ready** — else state accumulates ghosts.

### Entry and exit from low zone

Hysteresis is on **rank**, not value. Hysteresis in value is impossible here: for a ticket `i3/e3`, no reachable value exists between 1.00 and 1.33 — the band would be narrower than noise, and quasi-absorbing (escaping would need `impact+1` **and** `effort−1` simultaneously).

- **Enters** low zone if `value < 1.0` **AND** rank in bottom quartile. *Both* — condemning must be hard.
- **Exits** if `value ≥ 1.0` **OR** rank above bottom third. *Either* — escaping must be easy.

The absolute 1.0 threshold comes from a real gap in measured distribution (nothing between 0.80 and 1.00) and isolates the bottom quarter of stock.

### Purge condition

Propose a ticket for purge only if **all** are true:
- ≥ **3 distinct low observations** (not 3 same day);
- ≥ **14 days** since `first_low`;
- **no observation** ≥ threshold since;
- **no gap > 30 days** between consecutive runs — else continuity is not proven, clock restarts.

**Why not "14 consecutive days"**: skill doesn't run every day. Two observations three weeks apart prove nothing about the twenty unobserved days — and vacation periods would produce condemnations for absence.

### Anti-purge floor

**A ticket with `impact ≥ 4` is never purgeable.** Tag it `⏳ needs-slot` and exclude from batch.

Pure ratio mechanically condemns the big project: a ticket `impact 5 / effort 5` scores 1.00 and lands at death threshold. Purging it would say "too big to do, so not worth it" — exactly opposite what we want. These tickets aren't bad, they need dedicated time rather than residual time. The tag says that.

### Throughput

**Maximum 3 purge proposals per run.** Fifteen closures presented at once is not a review, it's a fire — {USER_NAME} will validate in bulk without looking, and that's how real work gets lost.

## Step 6 — Present, then STOP

Sample output:

```
📋 Ready: 59 tickets — 37 tech scored · 11 essays · 9 explorations · 2 personal

🔴 WIP in progress: [nothing] / [ticket X]

🎯 Top 3
  1. 2.00  (i4/e2)  investiguer-mcp-google-calendar     — unblocks addevent, blocked 2 months
  2. 1.67  (i5/e3)  review-scoping-anti-bundling-tickets — chokepoint create-ticket
  3. 1.50~ (i3/e2)  hook-sessionend-cleanup-agent-browser — ~effort estimated

⏳ needs-slot (impact ≥ 4, non-purgeable): auto-evals-binaires, audit-adr

🪦 Proposed for purge (max 3)
  0.50  skill-design-ref  — low for 21d, 4 observations, never recovered

⚠️ 12 tickets without frozen effort — score unstable, /refine should write it
```

**Before returning control, write the two bookkeeping files** — not a decision, so no validation needed:

1. `99 - Claude Code/exec-ready-state.json` — observations from the run.
2. `99 - Claude Code/command-tracker.md` — the `/exec-ready` line with today's date.

**Write both here, not at skill end.** The skill stops right after to await {USER_NAME}: anything placed after this point never runs when they don't answer, or when session ends on presentation. Four vault skills (`/closeweek`, `/pulse`, `/stranger`, `/map`) had exactly this bug — tracker update was the last step, it got skipped, and `/today` flagged them indefinitely as late.

**Then STOP.** **No promotion to WIP, no closure, without explicit OK from {USER_NAME}.**

## Step 7 — After validation

Only on agreement, listing operations if series exceeds 2 writes (cf. CLAUDE.md):

1. **Promotion to WIP**: move chosen ticket from `## Ready` to `## WIP`.

2. **Validated purge** — ticket exits `## Ready` **directly**, without passing through `## Done`. An abandoned ticket and a delivered ticket have no business in the same place: the first awaits reuse as material, the second is closed. In order:

   a. **Read the note** and extract **3 to 5 themes** — ground cleared, not ticket title.
   b. **Write entry** in `Archive/Dropped Tickets/dropped-tickets.md`, `## Entries` section, in format documented at file head: date · title · themes · scored reason · what refine had decided · link to note.
   c. **Move note** from `09 - Inbox/tickets/` to `Archive/Dropped Tickets/`.
   d. **Remove line** from `## Ready`.

   Mandatory reason in entry: `value X.XX (iN/eN), low for N days, N observations`.

   **Why we keep.** The ticket is dead: it won't be processed. What we keep is the **refinement** — angles spotted, alternatives rejected *and their reason*, explicit out-of-scope. This material survives the ticket and can feed a future ticket not wearing the same name. Hence indexing by **themes** not title: real use case is *"I'm making a ticket on this subject — did an old refine already clear that ground?"*, never *"I'm searching ticket X"*. An entry without themes is unfindable, hence useless.

   **Material is a starting point, not verdict.** Look at what was done and why, judge if it serves, decide fresh. Never take a refine conclusion as-is: it bears assumptions of a past context.

3. **Knowledge distillation**: only if {USER_NAME} asks when validating. Index entry + moved note suffice by default — a Knowledge note makes sense only if material exceeds the ticket itself.

4. **Clean state** of tickets exiting Ready.

## Safeguards

- **Never close or promote without validation.** Score is noisy by design; it proposes, doesn't decide.
- **Never open 2nd WIP** when one exists.
- **CC Kanban only** — don't touch project kanbans.
- **Don't reimplement archiving the *delivered*** — `/archivedone` handles `## Done` column. Purge doesn't transit **through** Done: it has its own destination (`Archive/Dropped Tickets/`) because abandonment and delivery don't share a shelf. Both mechanisms don't overlap — don't merge them, don't pass purged through `/archivedone`.
- **Never purge without writing index entry.** Moving note without indexing by themes is deletion with extra steps: a graveyard nobody finds is no better than deletion. Entry **is** the purge deliverable, movement is only the consequence.
- **No second-level purging.** `dropped-tickets.md` never slims down, whatever its size. Text file costs nothing, unlike kanban lines re-read each run.
- **{USER_NAME} sole master of Git.**
- **Ready is an unordered list** — never infer priority from a ticket's position in the column.
- **Don't invent impact to fill gaps**: if ticket note is unfindable, say so and exclude from ranking rather than score blind.
- **A ticket can lie about its state.** A Ready ticket can be already done (a past `/archivedone` has already resurrected closed tickets rendering them orphan). If a top 3 ticket smells already-done, flag before proposing.
