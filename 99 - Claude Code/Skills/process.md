---
name: process
description: Donner une URL → Claude fetch le contenu et crée une note structurée dans [KNOWLEDGE_FOLDER]/ immédiatement. Utiliser quand l'utilisateur dit "/process [url]" ou "process ce lien", "capitalise cet article/cette vidéo". Court-circuite le harvest pour un traitement immédiat.
---

# Skill `/process`

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

---

Transforme un lien externe en note Knowledge dans le vault, sans passer par l'inbox ni attendre le `/harvest`.

## Déclenchement

```
/process [url]
/process [url] --target [sous-dossier]
/process [url] --tag [tag-custom]
```

- Sans `--target` → Claude choisit le sous-dossier selon le domaine
- Sans `--tag` → Claude génère les tags depuis le contenu
- URL requise — sans URL, demander de la fournir
- Si l'utilisateur annule à tout moment (Ctrl+C) → arrêter immédiatement et signaler l'annulation

---

## Étape 1 — Récupération et validation du contenu

**Validation préalable :**
- Vérifier que l'URL est bien-formée (commence par `http://` ou `https://`)
- Rejeter les URLs `localhost`, `127.0.0.1`, ou fichier local (`file://`)
- Si validation échoue → signaler "URL invalide, réessaye avec une URL publique"

**Fetch nominal :**
Utiliser `WebFetch` sur l'URL validée.

**Cas YouTube :**
Pour shortcut `youtu.be/ID` ou paramètre `?v=ID` → normaliser vers `https://www.youtube.com/watch?v=ID`.
WebFetch récupère titre + description (pas de transcript sans API YouTube). Minimum 100 caractères de contenu requis.

**Fetch échoué (timeout, 4xx, 5xx, contenu < 100 chars) :**
Prodemander dans cet ordre :

1. **Fallback n8n** — si actif :
   ```bash
   docker ps --filter name=n8n --filter status=running --format "{{.Names}}"
   ```
   Si arrêté, démarrer et attendre 3 secondes :
   ```bash
   docker start n8n && sleep 3
   ```
   Lancer le webhook :
   ```bash
   curl -s -X POST http://localhost:5678/webhook/fallback-link \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"[URL]\"}"
   ```
   Analyser réponse : si `{ "title": "...", "content": "..." }` avec contenu >= 100 chars → continuer.
   Sinon → proposer NotebookLM. Arrêter n8n après usage :
   ```bash
   docker stop n8n
   ```

2. **Fallback NotebookLM** — si l'utilisateur accepte, présenter le prompt adapté au type détecté (voir ci-dessous) et laisser l'utilisateur copier-coller le résumé.

**Prompts NotebookLM :**

Article/doc :
```
Résume ce contenu : le problème/sujet, concepts/outils, points clés, conclusions.
Sois factuel et concis.
```

Vidéo tech/dev :
```
Résume : problème résolu, outils/concepts, étapes clés, points importants pour un dev.
Sois factuel et concis.
```

Vidéo Warhammer/peinture :
```
Résume : techniques mentionnées, peintures/couleurs (base, wash, layer, etc.),
étapes dans l'ordre, conseils pratiques. Sois factuel et concis.
```

---

## Étape 2 — Identifier le type et le domaine

À partir du contenu obtenu, déterminer :
- **Type** : `article`, `vidéo`, `forum`, `doc`, `podcast`
- **Domaine** : voir tableau ci-dessous

**Mapping domaine → sous-dossier :**

| Domaine détecté | Sous-dossier destination |
|----------------|--------------------------|
| Claude Code, LLM, prompt engineering, MCP, agents IA | `[KNOWLEDGE_FOLDER]/Claude code/` |
| Dev, code, architecture, patterns, frameworks, outils dev | `[KNOWLEDGE_FOLDER]/Dev/` |
| IA générale, ML, modèles, recherche IA | `[KNOWLEDGE_FOLDER]/IA/` |
| Business, product, startup, management, stratégie | `[KNOWLEDGE_FOLDER]/Business/` |
| Voyage, lieux, culture | `[KNOWLEDGE_FOLDER]/Travel/` |
| Warhammer, peinture, figurines | `[HOBBIES_FOLDER]/Warhammer/` |
| Autre / inclassable | `[KNOWLEDGE_FOLDER]/` (racine) |

Si `--target` fourni → utiliser ce chemin directement. Créer le dossier s'il n'existe pas (`mkdir -p`). Accepter tout chemin valide sous `[KNOWLEDGE_FOLDER]/` ou `[HOBBIES_FOLDER]/`.

---

## Étape 3 — Vérifier les doublons

Lister les fichiers existants dans le sous-dossier cible.

Si une note similaire existe déjà :
→ Présenter à l'utilisateur : "Note existante trouvée : [[nom-note]]. Créer quand même ou enrichir l'existante ?"
→ Attendre sa réponse avant de continuer.

---

## Étape 4 — Créer la note

Générer le slug depuis le titre (kebab-case, minuscules, sans accents, max 5-6 mots).

Créer `[KNOWLEDGE_FOLDER]/[sous-dossier]/[slug].md` :

```markdown
---
date: [date du jour au format DATE_FORMAT]
source: [url]
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
- [[note-existante]] — [raison en une phrase]
```

**Remplissage :**
- `tags` : domaine + 2-4 mots-clés du contenu. Si `--tag [custom]` → ajouter en fin de liste (accepter tel quel)
- `## Points clés` : 3-7 bullets, factuels
- `## Cas d'usage avec mon workflow` : liens concrets avec les projets actifs du vault — omettre si aucun lien évident
- `## Voir aussi` : chercher les notes liées dans le vault. Au moins 1 lien si pertinent existe, sinon omettre cette section.

**Validation du contenu :**
- Minimum 100 caractères de contenu utile (titre + résumé)
- Sinon → signaler "Contenu insuffisant" et proposer NotebookLM

---

## Étape 5 — Annoncer le résultat

**Succès — note créée :**
```
✅ Note créée : [KNOWLEDGE_FOLDER]/[sous-dossier]/[slug].md
→ Type : [type]
→ Tags : [tags]
→ Voir aussi : [[note-1]], [[note-2]] (si trouvées)
```

**Définition du succès :**
- Fichier créé et écrit sur disque
- Frontmatter valide (date, source, tags, status)
- Contenu minimum : titre + résumé 1-phrase + au moins 3 points clés
- Tag custom (si `--tag` fourni) présent dans le frontmatter

**Cas d'échec :**
- [Doublon détecté] → signaler et demander confirmation avant d'écraser
- [Contenu insuffisant] → proposer NotebookLM ou enrichissement manuel
- [Fetch échoué] → signaler l'erreur avec la raison (timeout, 404, etc.) et proposer NotebookLM

---

## Règles absolues

- **Jamais créer sans contenu récupéré** — ne pas générer depuis l'URL seule
- **Jamais écraser une note existante** — demander confirmation si doublon
- **Destinations valides uniquement** — utiliser le mapping domaine → sous-dossier
- **Slug depuis le titre** — jamais depuis l'URL
- **Fallbacks explicites** — signaler l'échec et proposer options (n8n ou NotebookLM)
- **Warhammer → `[HOBBIES_FOLDER]/`** — jamais dans Knowledge
- **Pair-programming** — attendre validation de l'utilisateur aux points critiques (doublon, fallback, annulation)
