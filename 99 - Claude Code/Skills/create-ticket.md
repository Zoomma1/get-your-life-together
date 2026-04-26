---
name: create-ticket
description: Point d'entrée unique pour créer un ticket — fichier note + insertion kanban. Lit `04 - Projects/INDEX.md` pour résoudre le Kanban, le dossier tickets et le slug du projet. Auto-numérotation par scan du dossier tickets. Invoqué par les skills qui génèrent des tickets (drift, ideas, vault-harvest, today) et directement par Victor. Garantit un format cohérent et une position unique dans le kanban.
---

# Skill : Create Ticket

Middleware qui centralise la création de tickets. Les skills appelants (`/drift`, `/ideas`, `/vault-harvest`, `/today`) délèguent à ce skill en passant title, type, projet, colonne, contexte. Retourne le chemin du fichier créé.

## Paramètres

| Paramètre | Requis | Valeurs                                      | Défaut                |
| --------- | ------ | -------------------------------------------- | --------------------- |
| `title`   | Oui    | Texte libre                                  | —                     |
| `type`    | Oui    | `💡 Idée` / `⏫ Improvement` / `🐛 Bug`      | —                     |
| `project` | Non    | Nom du projet (doit être dans INDEX.md)      | null (→ "Personnel")  |
| `column`  | Non    | `Idea` / `Blocked` / `Ready` / `WIP`         | `Idea`                |
| `context` | Non    | Phrase courte pour la carte kanban           | —                     |

## Étape 1 — Résoudre la destination via INDEX.md

Lire `04 - Projects/INDEX.md`. Chercher dans la table "Projets actifs" la ligne correspondant à `project` (comparaison insensible à la casse, accepte nom complet ou slug — ex: `Husker` match aussi bien le nom complet que le slug `HUSKER`).

**Si `project` fourni et trouvé dans INDEX.md** :
- Extraire `kanban_path` depuis la colonne "Kanban" (lien Obsidian `[[...]]`, ou `—` si pas de kanban)
- Extraire `tickets_folder` depuis la colonne "Tickets" (chemin entre backticks, ex: `04 - Projects/Husker/Tickets`)
- Extraire `slug` depuis la colonne "Slug" (valeur entre backticks, ex: `HUSKER`)
- Si `kanban_path` = `—` → signaler à Victor "Projet sans Kanban, impossible d'insérer — créer un Kanban d'abord ?" et attendre validation

**Si `project` fourni mais absent d'INDEX.md** :
- Signaler : "Projet `<nom>` absent de INDEX.md, j'utilise le fallback Inbox"
- `tickets_folder = 09 - Inbox/tickets`
- `kanban_path = 99 - Claude code/Claude Code Kanban`
- `slug = null`

**Si `project` non fourni** :
- `tickets_folder = 09 - Inbox/tickets`
- `kanban_path = 99 - Claude code/Claude Code Kanban`
- `slug = null`

## Étape 2 — Auto-numérotation (si slug défini)

**Si `slug` est défini** :
- Glob `<tickets_folder>/<slug-lowercase>-*.md`
- Pour chaque fichier trouvé, extraire NN via regex : `^<slug-lowercase>-(\d{2})-`
- `max_nn` = max des NN trouvés (ou `0` si aucun match)
- `next_nn` = `max_nn + 1`, formaté sur 2 chiffres zero-padded (`01`, `02`, …, `17`)

**Si `slug` est null** : `next_nn = null` (pas de préfixe, ancien format).

## Étape 3 — Slugifier le titre + calculer le nom de fichier

Slugifier `title` : minuscules, espaces → tirets, supprimer accents et caractères spéciaux.
Exemples :
- "Refaire le bureau à Issy" → `refaire-bureau-issy`
- "Bug OAuth" → `bug-oauth`
- "Setup repo Cargo + structure src/" → `setup-repo-cargo-structure-src`

**Nom du fichier** :
- Avec slug : `<slug-lowercase>-<next_nn>-<slug-titre>.md` (ex: `husker-01-setup-repo-cargo.md`)
- Sans slug : `<slug-titre>.md` (ex: `refaire-bureau-issy.md`)

**Titre frontmatter** (`TITLE_FRONT`) :
- Avec slug : `<SLUG>-<NN> — <title>` (ex: `HUSKER-01 — Setup repo Cargo`)
- Sans slug : `<title>` (ex: `Refaire le bureau à Issy`)

## Étape 4 — Vérifier absence de doublon

Glob `<tickets_folder>/*<slug-titre>*.md` — chercher un fichier existant avec le même slug de titre (titre trop proche).

**Si doublon détecté** : signaler à Victor et arrêter. Valider avant de continuer (peut-être le même ticket déjà créé, ou titre à nuancer).

## Étape 5 — Créer le fichier note

Écrire le fichier `<tickets_folder>/<filename>` avec ce template :

````markdown
---
title: <TITLE_FRONT>
date: YYYY-MM-DD
type: <type>
project: <project ou "Personnel">
---

# <TITLE_FRONT>

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
````

**Règles** :
- Ne **jamais** ajouter `status` au frontmatter — le kanban fait foi
- `project` = "Personnel" si aucun projet fourni
- Date : `YYYY-MM-DD` au format ISO (jour actuel)
- Créer le dossier `<tickets_folder>` s'il n'existe pas encore (premier ticket du projet)

## Étape 6 — Insérer dans le Kanban

Lire le fichier Kanban cible (`kanban_path`). Localiser la section `## <column>` (ex : `## Idea`, `## Ready`).

**Si la section n'existe pas** : créer la section avant d'y insérer.

Ajouter **à la fin de la section** (avant le prochain `##` ou la fin du fichier) :

```markdown
- [ ] [[<filename-sans-extension>|<TITLE_FRONT>]]<contexte optionnel>
```

Utiliser le nom court (sans chemin) — Obsidian résout via son index global. Si conflit de nom possible (doublon global), utiliser le chemin complet `[[<tickets_folder>/<filename-sans-extension>|<TITLE_FRONT>]]`.

**Si `context` fourni** : ajouter ` — <context>` à la suite du lien.

## Retour attendu

Toujours retourner :
```
Ticket créé : <tickets_folder>/<filename>
Inséré dans : <kanban_path> (colonne <column>)
```

## Règles absolues

1. **Toujours créer le fichier ET l'ajouter au Kanban** — un ticket sans kanban naît orphelin
2. **Résolution INDEX.md first** — jamais de hardcoding de chemins ou de slugs par projet
3. **Vérifier absence de doublon en Étape 4** — si doublon, signaler à Victor et attendre validation
4. **Le Kanban est l'unique source de vérité pour le statut** — pas de `status` dans le frontmatter
5. **Auto-numérotation atomique par scan** — pas de compteur persistant externe
6. **Fallback Inbox jamais en silence** — toujours signaler à Victor si le projet est absent d'INDEX.md

## Utilisation par d'autres skills

Skills appelants (`/drift`, `/ideas`, `/vault-harvest`, `/today`) :

```
Appliquer create-ticket avec :
- title: "<titre du ticket>"
- type: "<type>"
- project: "<nom projet ou null>"
- column: "<Idea|Blocked|Ready|WIP>"
- context: "<contexte optionnel>"
```

Un seul point de maintenance pour format et logique. Toute évolution (nouveau champ frontmatter, nouveau format de slug) se fait ici et se propage à tous les skills appelants.
