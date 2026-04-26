---
name: process-doc
description: Convertir un fichier local (PDF, Word, Excel) en note Knowledge dans 03 - Knowledge/ via markitdown. Utiliser quand Victor dit "/process-doc [chemin]", "process ce PDF", "capitalise ce document". Skill distinct de /process (URLs) — ne jamais étendre /process avec des chemins locaux.
---

# Skill `/process-doc`

Transforme un fichier local (PDF, .docx, .xlsx) en note Knowledge dans le vault, via `markitdown`.

## Déclenchement

```
/process-doc /chemin/absolu/vers/fichier.pdf
/process-doc /chemin/absolu/vers/fichier.docx --target Dev
/process-doc /chemin/absolu/vers/fichier.xlsx
```

- Chemin absolu requis — si chemin relatif fourni, demander la version absolue
- `--target [sous-dossier]` optionnel — sinon Claude choisit selon le contenu
- Formats supportés : `.pdf`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx`

---

## Étape 1 — Vérifier markitdown

```bash
markitdown --version
```

Si la commande échoue → afficher :
```
markitdown non installé. Lance :
  uv tool install markitdown
ou :
  pip install markitdown
Pour les PDFs scannés (OCR) : pip install markitdown[ocr]
```
Et arrêter.

---

## Étape 2 — Convertir le fichier

```bash
markitdown "<chemin_absolu>"
```

Si la commande échoue ou retourne < 50 chars :
- PDF multi-colonnes (rulebooks, docs complexes) → signaler : "Contenu insuffisant — PDF potentiellement multi-colonnes ou scanné. Essaie `pip install markitdown[ocr]` pour l'OCR."
- Autre erreur → afficher le message d'erreur et arrêter

---

## Étape 3 — Titre et destination

**Titre proposé** : nom du fichier nettoyé (sans extension, underscores/tirets → espaces, casse titre).
Ex : `rapport-stage-2026.pdf` → "Rapport Stage 2026"

Afficher : `Titre proposé : "[titre]" — OK ou tu corriges ?`
- Si Victor valide → continuer
- Si Victor donne un titre → utiliser ce titre

**Destination** : même mapping que `/process` :

| Contenu détecté | Sous-dossier |
|----------------|--------------|
| Claude Code, LLM, agents IA, MCP | `03 - Knowledge/Claude code/` |
| Dev, code, architecture, patterns | `03 - Knowledge/Dev/` |
| IA, ML, modèles | `03 - Knowledge/IA/` |
| Business, management, stratégie | `03 - Knowledge/Business/` |
| Voyage, lieux, culture | `03 - Knowledge/Travel/` |
| Warhammer, peinture, figurines | `02 - Hobbies/Warhammer/` |
| Cours, exam, ISEP, VUT | `03 - Knowledge/` (sous-dossier libre selon le sujet) |
| Autre / inclassable | `03 - Knowledge/` (racine) |

Si `--target` fourni → utiliser ce chemin directement.

---

## Étape 4 — Vérifier les doublons

Lister les fichiers existants dans le sous-dossier cible.
Si une note similaire existe → demander : "Note existante trouvée : [[nom-note]]. Créer quand même ou enrichir l'existante ?"

---

## Étape 5 — Créer la note

Slug depuis le titre (kebab-case, minuscules, sans accents, max 5-6 mots).

```markdown
---
date: YYYY-MM-DD
source: [chemin absolu du fichier]
tags: [domaine, mots-clés]
status: nouvelle
---

# [Titre]

## En une phrase
[Résumé en 1 phrase]

## Points clés
- ...

## Cas d'usage avec mon workflow
- ...

## Voir aussi
- [[note-existante]] — [raison]
```

**Remplissage :**
- `source` : chemin absolu local (ex: `~/Downloads/rapport.pdf`)
- `tags` : domaine + 2-4 mots-clés du contenu
- `## Points clés` : 3-7 bullets, factuels, tirés du contenu markitdown
- `## Cas d'usage avec mon workflow` : omettre si aucun lien évident
- `## Voir aussi` : chercher les notes liées dans le vault. Omettre si aucune pertinente.

---

## Étape 6 — Annoncer le résultat

```
✅ Note créée : 03 - Knowledge/[sous-dossier]/[slug].md
→ Source : [chemin fichier]
→ Tags : [tags]
→ Voir aussi : [[note-1]] (si trouvée)
```

---

## Règles absolues

- **Jamais modifier `/process`** — deux skills distincts, deux fonctionnements distincts
- **Chemin absolu obligatoire** — ne pas inférer le chemin depuis un chemin relatif
- **Jamais créer sans contenu** — si markitdown retourne < 50 chars, signaler et proposer l'OCR
- **Slug depuis le titre** — jamais depuis le nom de fichier brut
- **Warhammer → Hobbies** — jamais dans Knowledge
