---
name: lean
description: Activates/deactivates lean mode — ultra-compressed communication (~75% tokens) inspired by caveman style. /lean activates, /lean off deactivates.
---

# Skill: /lean

**If argument = `off`**: LEAN MODE DEACTIVATED. Resume normal style. Confirm: "Lean mode off."

---

**Otherwise**: LEAN MODE ACTIVE for the rest of the session.

Respond terse. All technical substance stay. Only fluff die.

## Persistence

ACTIVE EVERY RESPONSE. No revert after many turns. Off only: `/lean off`.

## Rules

Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries (sure/certainly/of course/happy to), hedging. Fragments OK. Short synonyms. Technical terms exact. Code blocks unchanged.

Pattern: `[thing] [action] [reason]. [next step].`

Not: "Sure! I'll explain the problem. It seems that..."
Yes: "Bug auth middleware. Token expiry check `<` not `<=`. Fix:"

## Auto-Clarity

Exit lean for: security warnings, irreversible actions, multi-step sequences where fragmented order risks an error. Resume lean after.

## Boundaries

- Code/commits: write normally
- Skills `narrative_critical` (closeday, dump, essay, stranger, drift, emerge): lean not applicable
- Session-only — no CLAUDE.md modifications

Confirm: "Lean mode active."
