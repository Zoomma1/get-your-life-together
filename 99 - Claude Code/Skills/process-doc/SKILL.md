---
name: process-doc
description: Convert a local file (PDF, Word, Excel) to Knowledge note in 03 - Knowledge/ via markitdown. Use when user says "/process-doc [path]", "process this PDF", "capitalize this document". Skill distinct from /process (URLs) — never extend /process with local paths.
---

# Skill `/process-doc`

Transforms a local file (PDF, .docx, .xlsx) into a Knowledge note in the vault, via `markitdown`.

## Trigger

```
/process-doc /path/to/absolute/file.pdf
/process-doc /path/to/absolute/file.docx --target Dev
/process-doc /path/to/absolute/file.xlsx
```

- Absolute path required — if relative path given, ask for absolute version
- `--target [subfolder]` optional — otherwise Claude chooses based on content
- Supported formats: `.pdf`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx`

---

## Step 1 — Verify markitdown

```bash
markitdown --version
```

If command fails → display:
```
markitdown not installed. Run:
  uv tool install markitdown
or:
  pip install markitdown
For scanned PDFs (OCR): pip install markitdown[ocr]
```
And stop.

---

## Step 1.5 — Temp copy if path has accents (Windows)

If source path contains accented characters (`é`, `à`, `ê`, `è`, etc.):

```python
import shutil, pathlib
src = pathlib.Path(r"<original_path>")
dst_name = src.name.encode('ascii', 'ignore').decode() or "doc_temp" + src.suffix
tmp = pathlib.Path(r"C:\Temp") / dst_name
tmp.parent.mkdir(exist_ok=True)
shutil.copy2(src, tmp)
print(tmp)
```

Use the `tmp` path returned instead of original path for Step 2. Clean `C:\Temp\` at skill end.

**Why**: markitdown on Windows silently crashes on accented paths — returned content empty or broken. Workaround validated 2026-04-30.

---

## Step 2 — Convert the file

```bash
markitdown "<absolute_path>"
```

If command fails or returns <50 chars:
- Multi-column PDF (rulebooks, complex docs) → flag: "Insufficient content — PDF possibly multi-column or scanned. Try `pip install markitdown[ocr]` for OCR."
- Other error → display error message and stop

---

## Step 3 — Title and destination

**Proposed title**: cleaned filename (no extension, underscores/hyphens → spaces, title case).
Ex: `rapport-stage-2026.pdf` → "Rapport Stage 2026"

Display: `Proposed title: "[title]" — OK or do you change it?`
- If {USER_NAME} validates → continue
- If {USER_NAME} provides title → use it

**Destination**: same mapping as `/process`:

| Content detected | Subfolder |
|----------------|--------------|
| Claude Code, LLM, agents, MCP | `03 - Knowledge/Claude code/` |
| Dev, code, architecture, patterns | `03 - Knowledge/Dev/` |
| AI, ML, models | `03 - Knowledge/IA/` |
| Business, management, strategy | `03 - Knowledge/Business/` |
| Travel, places, culture | `03 - Knowledge/Travel/` |
| Warhammer, painting, miniatures | `02 - Hobbies/Warhammer/` |
| Courses, exam, ISEP, VUT | `03 - Knowledge/` (subfolder free by subject) |
| Other / unclassifiable | `03 - Knowledge/` (root) |

If `--target` provided → use that path directly.

---

## Step 4 — Check for duplicates

List existing files in target subfolder.
If similar note exists → ask: "Existing note found: [[note-name]]. Create anyway or enrich existing?"

---

## Step 5 — Create the note

Slug from title (kebab-case, lowercase, no accents, max 5-6 words).

```markdown
---
date: YYYY-MM-DD
source: [absolute path to file]
tags: [domain, keywords]
status: new
---

# [Title]

## In one sentence
[Summary in 1 sentence]

## Key points
- ...

## Use cases with my workflow
- ...

## See also
- [[existing-note]] — [reason]
```

**Filling:**
- `source`: absolute local path (ex: `~/Downloads/report.pdf`)
- `tags`: domain + 2-4 content keywords
- `## Key points`: 3-7 bullets, factual, drawn from markitdown content
- `## Use cases with my workflow`: omit if no obvious link
- `## See also`: search vault for linked notes. Omit if none relevant.

---

## Step 6 — Announce result

```
✅ Note created: 03 - Knowledge/[subfolder]/[slug].md
→ Source: [file path]
→ Tags: [tags]
→ See also: [[note-1]] (if found)
```

---

## Absolute rules

- **Never modify `/process`** — two distinct skills, two distinct workflows
- **Absolute path mandatory** — don't infer path from relative path
- **Never create without content** — if markitdown returns <50 chars, flag and propose OCR
- **Slug from title** — never from raw filename
- **Warhammer → Hobbies** — never in Knowledge
