#!/usr/bin/env bash
#
# Get Your Life Together — bootstrap (macOS / Linux)
#
# Run this ONCE right after cloning, BEFORE /setup:
#
#   git clone https://github.com/Zoomma1/get-your-life-together my-vault
#   cd my-vault
#   bash install.sh
#
# What it does: creates the Claude Code slash-command stubs in
# <claude home>/commands/ so that /setup (and every other skill)
# becomes invocable. Without this step /setup cannot be called on a
# fresh clone — the stubs live in your home directory, not in the repo.
#
# Zero dependencies beyond git + bash. Idempotent: safe to re-run,
# existing stubs are left untouched.

set -euo pipefail

# --- Vault path = directory this script lives in (the cloned repo) ---
VAULT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

# --- Claude home: honour CLAUDE_CONFIG_DIR, else platform default ---
CLAUDE_HOME="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

SKILLS_DIR="$VAULT_PATH/99 - Claude Code/Skills"
COMMANDS_DIR="$CLAUDE_HOME/commands"

if [ ! -d "$SKILLS_DIR" ]; then
  echo "Error: skills folder not found at:" >&2
  echo "  $SKILLS_DIR" >&2
  echo "Run this script from inside the cloned vault." >&2
  exit 1
fi

mkdir -p "$COMMANDS_DIR"

created=0
skipped=0

for skill in "$SKILLS_DIR"/*.md; do
  [ -e "$skill" ] || continue          # no matches → skip cleanly
  name="$(basename "$skill" .md)"
  stub="$COMMANDS_DIR/$name.md"

  if [ -e "$stub" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  # First `description:` line of the skill's YAML frontmatter (single line).
  desc="$(grep -m1 '^description:' "$skill" 2>/dev/null | sed 's/^description:[[:space:]]*//' || true)"

  if [ -n "$desc" ]; then
    {
      printf -- '---\n'
      printf 'description: %s\n' "$desc"
      printf -- '---\n'
      printf 'Read the %s skill from `%s/99 - Claude Code/Skills/%s.md` and execute it.\n' \
        "$name" "$VAULT_PATH" "$name"
    } > "$stub"
  else
    printf 'Read the %s skill from `%s/99 - Claude Code/Skills/%s.md` and execute it.\n' \
      "$name" "$VAULT_PATH" "$name" > "$stub"
  fi

  created=$((created + 1))
done

echo ""
echo "Get Your Life Together — bootstrap done."
echo "  Claude home : $CLAUDE_HOME"
echo "  Stubs       : $created created, $skipped already present"
echo ""
echo "Next steps:"
echo "  1. Don't have Claude Code yet? Get it at https://claude.ai/code and sign in."
echo "  2. In Claude Code, from this folder, run:  /setup"
echo "  3. Then every morning:  /today"
echo ""
