---
name: triage-explo
description: "Sorts exploration tickets accumulated in the Ready column of the Claude Code Kanban via a fan-out of read-only agents. Each exploration ticket is read + its source fetched, then classified: Knowledge note (to close), implementation ticket (to create), or keep as exploration (POC required). Trigger when the user says \"/triage-explo\", \"sort the explorations\", \"the Ready is congested\", \"clear out the exploration tickets\", or when explorer-*/investiguer-* tickets accumulate in Ready (~10+). The skill stops at the verdict table — {USER_NAME} validates everything before any vault write."
---

# Skill: Triage Explo

Clears the **Ready column of the Claude Code Kanban** of exploration tickets that accumulate there. The watch (`/pulse`, `/digest`, `/research-scout`) continuously dumps "explore X / investigate Y" tickets into it, many of which really only deserve a Knowledge note — but they stay in Ready and create a false impression of an actionable backlog.

The skill launches **a read-only agent per exploration ticket in parallel** (one agent reads, fetches the source, judges), consolidates the verdicts into **a single table**, then **stops**. {USER_NAME} decides line by line. Writing (notes, kanban, new tickets) happens only **after** validation.

**Why this breakdown**: the judgment "does this deserve a real build or just a note?" benefits from a fresh opinion that will see the actual source (the ticket was often framed weeks ago, the tool may have died or been absorbed into the setup). But the final decision stays with {USER_NAME} — an agent doesn't close a ticket on its own.

## When to use / when not to

- ✅ CC Kanban Ready column congested with `explorer-*` / `investiguer-*` tickets (typically 10+).
- ✅ {USER_NAME} asks to sort / clear out explorations.
- ❌ Sorting another kanban (dev projects) — they barely have an exploration backlog. This skill is **CC Kanban only**.
- ❌ Deciding on a single isolated exploration: not worth a fan-out, read it and discuss it directly.

## Step 1 — Isolate exploration tickets from Ready

Read the `## Ready` column of `99 - Claude Code/Claude Code Kanban.md` (the section between `## Ready` and the next `## WIP`).

A ticket is **exploration** if one of these signals is true:
- its slug starts with `explorer-` or `investiguer-` ;
- its label/description frames a deliverable of the type "read an external tool/repo/article → **Knowledge note + verdict** (adopt / inspire / skip)", even without the prefix.

Filter out **noise** (are NOT explorations): essays (`📝`), bugs (`🐛`), dev features, refactors, personal tasks. When in doubt about a borderline ticket (slug `explorer-` but deliverable already leaning towards implementation), **include it** but flag it — the agent will confirm.

**Announce the count** to {USER_NAME} before launching the fan-out: *"X exploration tickets in Ready out of Y total. Should I run the sort?"* — a fan-out of X agents with web fetch is a substantial run, {USER_NAME} should be able to say no.

> ⚠️ Ready is an **unordered list** — never infer priority from a ticket's position in the column.

## Step 2 — Fan-out: one read-only agent per ticket

Launch the **Workflow** tool: one `agentType: 'Explore'` agent (strict read-only, no vault writing possible) per exploration ticket, in parallel, with structured output. Reference script:

```js
export const meta = {
  name: 'triage-explo',
  description: 'Sorts CC Kanban Ready exploration tickets: verdict knowledge / implementation ticket / keep exploration, read-only',
  phases: [{ title: 'Triage' }],
}
const VAULT = '/Users/vico/Documents/Tha vault'
const TICKETS = [ /* { slug, title } for each exploration ticket isolated in Step 1 */ ]
const SCHEMA = {
  type: 'object',
  required: ['slug', 'verdict', 'justif', 'source_status', 'effort'],
  properties: {
    slug: { type: 'string' },
    verdict: { type: 'string', enum: ['knowledge', 'ticket_imple', 'garder_explo'] },
    justif: { type: 'string', description: 'Sourced justification, single line' },
    source_status: { type: 'string', enum: ['maintained', 'dead', 'unknown'] },
    effort: { type: 'string', enum: ['S', 'M', 'L', 'NA'] },
    knowledge_angle: { type: 'string', description: 'What the note would say in 1 sentence' },
    ticket_imple_titre: { type: 'string', description: 'Implementation ticket title if ticket_imple, otherwise ""' },
  },
}
phase('Triage')
const results = await parallel(TICKETS.map((t) => () =>
  agent(`You are sorting ONE exploration ticket from {USER_NAME}'s Obsidian vault. ABSOLUTE READ-ONLY: you create/modify NO files, you only read + fetch web.

VAULT = ${VAULT}
Ticket slug: ${t.slug}
Title: ${t.title}

STEPS:
1. Locate the "${t.slug}.md" note under VAULT (Glob "**/${t.slug}.md" or find). If not found, grep the title. Read it entirely.
2. Extract the source URL (GitHub repo, article, tool) if present.
3. If URL → WebFetch: is the project maintained? last release/activity? relevant today? Fill source_status. No URL/fetch fails → "unknown".
4. Apply the CRITERIA (below) and render your verdict via StructuredOutput.

CRITERIA:
- "ticket_imple" ONLY if BOTH: (a) REAL PROBLEM (active setup friction OR gap named in ADR/lessons/daily — not "it would be cool") AND (b) NOT ALREADY COVERED by current skills/hooks/graphify/setup.
- Otherwise "knowledge": assessed → note. NOTHING is thrown away — even a dead/redundant tool becomes a short note that ACTS on the skip and why.
- "garder_explo" ONLY if you honestly cannot decide in read-only mode (POC essential).

{USER_NAME}'s SETUP (to judge "already covered"): Obsidian vault + very tooled Claude Code (custom skills, lessons-loader/friction-scan hooks, graphify, agentic mode, multi-agent workflows), self-hosted n8n N100, homelab Proxmox/Tailscale. Dev: Angular/Express/Prisma, Rust, Python.

Fill knowledge_angle (1 sentence). If ticket_imple: ticket_imple_titre + effort (S/M/L); otherwise effort="NA", ticket_imple_titre="". justif = 1 sourced line.`,
    { label: t.slug.slice(0, 32), phase: 'Triage', agentType: 'Explore', schema: SCHEMA }
  ).then((r) => ({ ...r, title: t.title }))
))
const order = { knowledge: 0, ticket_imple: 1, garder_explo: 2 }
const ok = results.filter(Boolean).sort((a, b) => (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9))
return { total: TICKETS.length, analysed: ok.length, results: ok }
```

## Step 3 — The criteria (reminder)

This is the heart of it. Without strict criteria, each agent judges by their own rules and everything becomes "yeah that's worth a ticket" → no clearing at all.

An exploration becomes **🔨 implementation ticket** only if **(a)** it solves active friction OR fills a named gap, **AND (b)** the current setup doesn't already do it "well enough". Otherwise **📚 Knowledge note** (nothing is thrown away — a dead tool becomes a note that acts on the skip). Otherwise **⏸️ keep as exploration** if a POC is essential to decide.

## Step 4 — Present the table + STOP

Consolidate into **a single table** sorted by verdict (📚 first — that's the bulk of clearing), then 🔨, then ⏸️. Columns: `ticket | verdict | 1-line justif | source_status | effort (if 🔨)`. Highlight notable findings (premise now false, ticket already done, source dead).

**STOP here.** Present to {USER_NAME}, ask to validate / correct line by line. **No vault write before explicit OK.** Agents wrote nothing (read-only) — this is the moment for human judgment.

## Step 5 — After validation: writing

Only once {USER_NAME} agrees, execute (list operations and confirm if the series exceeds 2 writes, cf. CLAUDE.md):

1. **Synthesis note** in `03 - Knowledge/Claude code/watch-explo-sort-<YYYY-MM-DD>.md`: index table of all verdicts (angle + source + `[[ticket]]` link). This is capitalization — even closed 📚 keep a consultable trace.
2. **Close the 📚** in the kanban: remove from `## Ready`, add to `## Done` **checked `[x]`** + mention `✅ <date> — 📚 see [[watch-explo-sort-<date>]]`. Close = move **AND** check, both.
3. **Create the 🔨**: for each, invoke `/create-ticket` (`type: ⏫ Improvement`, `column: Ready`, `context:` from the sort + effort). Then close the source exploration ticket in Done with mention `→ transformed into [[new ticket]]`. **Exception**: if the exploration and implementation are the same work (e.g., an MCP investigation), don't create a duplicate — leave the exploration in Ready and flag it.
4. **Leave the ⏸️ in Ready** — nothing to do, they await a real POC.

## Safeguards

- **Strict read-only** for agents (`agentType: 'Explore'`) — zero vault writes during triage. All writes are post-validation, done by the skill itself.
- **{USER_NAME} sole master of Git** — never touch git.
- **Don't invent to fill gaps**: if a ticket targets an unreachable/dead source, the honest verdict (📚 "skip, source dead" or ⏸️ "unverifiable") beats a false 🔨.
- **Tickets already out of Ready** between two reads (concurrent refine): operate on current state, flag discrepancies, don't force.

## Automatic trigger (out of scope, do separately)

Ideal: `/today` (🔄 Vault maintenance section) counts exploration tickets in Ready and suggests `/triage-explo` beyond a threshold (~10-12). **This patch in `/today` is not in this skill** — it's a separate ticket. For now, `/triage-explo` is invoked manually.
