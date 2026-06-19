# {{NAME}}

{{DESCRIPTION}}

A [GYLT](https://github.com/Zoomma1/get-your-life-together) addon — GYLT is the base, this plugs onto it.

## Install

```bash
git clone <this repo>
cd {{NAME}}
bash install.sh
```

Requires `bash` and `ln`. Optional: `jq` (for automatic hook registration in `settings.json`; without it you add one snippet by hand).
Restart Claude Code once after installing so any SessionStart hook is picked up.

## What's inside

| Folder | Contents |
|---|---|
| `skills/` | Slash-command skills (`skills/<name>/SKILL.md`, folder-per-skill so each can carry sibling templates). |
| `hooks/` | Hook scripts, declared in `addon.json` with their event. |
| `project-context-tools/` | (Optional) tools that plug into `/prepare-project-for-agent` after graphify. |

## Manifest

`addon.json` declares the skills and hooks the installer wires up. The installer is
generic and reads it at runtime — don't hand-edit install logic per addon.

## License

MIT — see [LICENSE](LICENSE).
