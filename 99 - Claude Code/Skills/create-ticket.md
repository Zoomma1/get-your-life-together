---
name: create-ticket
description: Point d'entrée unique pour créer un ticket — fichier note + insertion kanban. Invoqué par les skills qui génèrent des tickets (drift, ideas, vault-harvest, today). Garantit un format cohérent et une position unique dans le kanban.
---

# Skill : Create Ticket

Middleware qui centralise la création de tickets. Les skills appelants (drift, ideas, vault-harvest, today) délèguent à ce skill en passant title, type, projet, colonne, contexte. Retourne le chemin du fichier créé.

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Paramètres

| Paramètre | Requis | Valeurs | Défaut |
|-----------|--------|---------|--------|
| `title` | Oui | Texte libre | — |
| `type` | Oui | `💡 Idée` / `⏫ Improvement` / `🐛 Bug` | — |
| `project` | Non | Nom du projet (doit être dans INDEX.md) | null (→ "Personnel") |
| `column` | Non | `Idea` / `Spec` / `Ready` / `WIP` | `Idea` |
| `context` | Non | Phrase courte pour la carte kanban | — |

## Étape 0 — Vérifier l'absence de doublon

Slugifier `title` : minuscules, espaces → tirets, supprimer accents et caractères spéciaux.
Exemples : "Refaire le bureau à la maison" → `refaire-bureau-maison`, "Bug OAuth" → `bug-oauth`.

Utiliser Glob pour chercher un fichier avec ce slug dans les deux destinations possibles :
- Dossier `Todos/` du projet si `project` fourni (chemin déduit depuis `[PROJECTS_FOLDER]/INDEX.md`)
- `[INBOX_FOLDER]/tickets/<slug>.md` (sinon)

**Si un doublon existe :** signaler et arrêter. Valider avec l'utilisateur avant de continuer.

## Étape 1 — Déterminer la destination

**Dossier du fichier note :**
- Si `project` fourni → lire `[PROJECTS_FOLDER]/INDEX.md`, extraire le chemin du projet, utiliser son dossier `Todos/`
- Sinon → `[INBOX_FOLDER]/tickets/`

**Fichier kanban cible :**
- Si `project` fourni → lire `[PROJECTS_FOLDER]/INDEX.md`, extraire le chemin kanban du projet
- Sinon → `99 - Claude Code/Claude Code Kanban.md`

**Validation :** si `project` fourni mais absent d'INDEX.md, signaler et utiliser kanban par défaut.

## Étape 2 — Créer le fichier note

Écrire le fichier `<dossier>/<slug>.md` avec ce template :

```markdown
---
title: <title>
date: YYYY-MM-DD
type: <type>
project: <project ou "Personnel">
---

# <title>

## Résumé

<!-- Ce que ça fait en 2-3 phrases -->

## Contexte / Pourquoi

<!-- Quel problème ça résout, pourquoi maintenant -->

## Comportement attendu

## Hors scope

## Notes techniques

<!-- Contraintes, idées d'implémentation, dépendances -->

## Specs générées

<!-- Rempli par /specs -->
```

**Règles :**
- Ne **jamais** ajouter `status` au frontmatter — le kanban fait foi
- `project` = "Personnel" si aucun projet n'a été fourni
- Date : `YYYY-MM-DD` au format ISO (jour actuel)

## Étape 3 — Insérer dans le kanban

Lire le fichier kanban cible. Localiser la section `## <column>` (ex : `## Idea`, `## Spec`).

**Si la section n'existe pas :** créer la section avant d'y insérer.

Ajouter **à la fin de la section** (avant le prochain `##`) :

```markdown
- [ ] [[<chemin/vers/ticket>|<title>]]<contexte optionnel>
```

**Chemin relatif au vault, sans `.md` (convention Obsidian) :**
- Inbox : `[INBOX_FOLDER]/tickets/<slug>`
- Projet : `[PROJECTS_FOLDER]/<chemin-projet>/Todos/<slug>`

**Si `context` fourni :** ajouter ` — <context>` à la suite du lien.

## Retour attendu

Toujours retourner : `"Ticket créé : <chemin-complet>/nom.md"`

## Règles absolues

1. **Toujours créer le fichier ET l'ajouter au kanban** — un ticket sans kanban naît orphelin
2. **Vérifier absence de doublon en Étape 0** — si doublon, signaler à l'utilisateur et attendre validation
3. **Le kanban est l'unique source de vérité pour le statut** — pas de `status` dans le frontmatter
4. **Si projet invalide** — utiliser le kanban par défaut (`Claude Code Kanban.md`)
5. **Slugs uniques par destination** — deux tickets avec le même slug dans des dossiers différents sont acceptés

## Utilisation par d'autres skills

Skills appelants (`/drift`, `/ideas`, `/vault-harvest`, `/today`) :

```
Appliquer create-ticket avec :
- title: "<titre du ticket>"
- type: "<type>"
- project: "<nom projet ou null>"
- column: "<Idea|Spec|Ready|WIP>"
- context: "<contexte optionnel>"
```

Un seul point de maintenance pour format et logique.
