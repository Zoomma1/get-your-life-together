---
name: gylt-new-addon
description: Scaffold a new GYLT addon — a standalone repo of skills, hooks and extras that plugs onto GYLT. Generates the folder structure, the manifest (addon.json), a ready-to-run installer, a README and a LICENSE from templates, plus one starter skill. Invoke when you want to package and share a set of Claude Code skills/hooks as an installable addon (e.g. a dev toolkit, a writing toolkit) on top of GYLT. GYLT is the base; addons extend it.
---

# /gylt-new-addon

GYLT is the base. **Addons** extend it: a standalone git repo holding skills, hooks and
extra files, installed with one script. This skill scaffolds a new addon from templates so
every addon shares the same shape and installer — no copy-paste from an existing one.

Reference addon (the shape this produces): `GYLT-DEV-CONTEXT-ADDON`.

## Step 1 — Gather the addon spec

Ask the user (only for what is missing from the conversation):
- **Name** — kebab-case, e.g. `gylt-writing-addon`. Becomes the repo/folder name and `addon.json.name`.
- **Description** — one line, what the addon gives.
- **Target directory** — where to create it. Default: `~/Dev/<name>`.
- **First skill name** — kebab-case; a starter skill is scaffolded so the addon is non-empty.

Confirm the resolved plan (name + path) before writing anything.

## Step 2 — Create the structure

```
<target>/
  addon.json
  install.sh
  README.md
  LICENSE
  skills/
    <first-skill>/SKILL.md
  hooks/                  (empty — add hook scripts here)
  project-context-tools/  (only if the addon extends prepare-project-for-agent; else omit)
```

```bash
mkdir -p "<target>/skills/<first-skill>" "<target>/hooks"
```

## Step 3 — Fill from templates

The templates live next to this skill, in `templates/`:

| Template | → Output | Substitutions |
|---|---|---|
| `templates/addon.json` | `<target>/addon.json` | `{{NAME}}`, `{{DESCRIPTION}}`, `{{SKILLS}}` (JSON array), `{{HOOKS}}` (JSON array, `[]` if none) |
| `templates/install.sh` | `<target>/install.sh` | none — it is generic, it reads `addon.json` at runtime |
| `templates/README.md` | `<target>/README.md` | `{{NAME}}`, `{{DESCRIPTION}}` |
| `templates/SKILL.md` | `<target>/skills/<first-skill>/SKILL.md` | `{{SKILL_NAME}}`, `{{SKILL_DESCRIPTION}}` |

For the LICENSE, copy GYLT's `LICENSE` (MIT) verbatim, keeping the copyright holder.

After substitution, **strip every `{{...}}` placeholder** — none must remain in the output.

`addon.json.skills` lists the skill folder names; `addon.json.hooks` lists `{ "file": "hooks/<x>.sh", "event": "<SessionStart|...>" }` objects (empty array if the addon ships no hooks).

## Step 4 — Make scripts executable & verify

```bash
chmod +x "<target>/install.sh"
bash -n "<target>/install.sh"      # syntax check
```

Confirm the tree to the user and show the install command:

```bash
cd <target> && bash install.sh
```

## Step 5 — Next steps for the user

Tell them:
- Add real skills under `skills/<name>/SKILL.md` (folder-per-skill; templates can sit beside `SKILL.md`).
- Add hook scripts under `hooks/` and declare them in `addon.json.hooks`.
- `git init`, push, and share — others install with `bash install.sh`.

## Rules

- One addon = one repo. Skills are folder-per-skill (`skills/<name>/SKILL.md`) so they can carry sibling templates.
- The installer is generic and reads `addon.json` — never hand-edit the install logic per addon; if it needs to change, change the template here so all future addons benefit.
- Do not bundle anything proprietary or non-shareable into a public addon.
