---
name: explore-codebase
description: Analyser l'architecture d'un codebase et produire un rapport structuré (stack, organisation, points notables) dans le chat. Déclencher dès que Victor donne un chemin de repo à explorer, dit "analyse ce projet", "qu'est-ce que fait ce code", "regarde l'archi de [projet]", "explore ce repo", ou veut documenter un ancien projet dev avant de créer une fiche Past Project.
---

# Skill `/explore-codebase`

Explore un repo et produit un rapport d'architecture structuré dans le chat.

## Input

`$ARGUMENTS` = chemin absolu du repo à analyser.

Si aucun chemin fourni → demander : "Quel est le chemin du repo ?" et attendre.

---

## Étape 1 — Vérifier le chemin

Vérifier que le chemin existe. Si absent → "Chemin introuvable : [chemin]. Correct ?" et attendre.

---

## Étape 2 — README (optionnel)

Utiliser Glob pour chercher `README*` à la racine du repo (depth 1 seulement).

- Si trouvé → lire les 50 premières lignes et extraire un résumé 2-3 phrases
- Si absent → noter "Absent" et continuer

---

## Étape 3 — Configuration & Stack

Utiliser Glob pour chercher les fichiers de configuration à la racine :
`package.json`, `pom.xml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `build.gradle`, `composer.json`, `Gemfile`, `.csproj`, `pyproject.toml`, etc.

Pour chaque fichier trouvé :
- Lire le contenu (max 100 lignes)
- Extraire : langage principal, framework/runtime, 5–10 dépendances clés
- Si plusieurs configs → classer par priorité (ex: package.json + Dockerfile → Node + Docker)

Si **aucune config trouvée** → noter "Aucune config détectée — analyse structurelle seulement" et continuer à l'Étape 4.

---

## Étape 4 — Structure des dossiers

Utiliser Glob pour explorer la structure avec `**/*` (depth 2-3 suggéré).

Exclure : `node_modules/`, `.git/`, `.github/`, `dist/`, `build/`, `target/`, `__pycache__/`, `.venv/`, `venv/`, `.next/`, `.nuxt/`, `out/`, `coverage/`.

Produire un arbre condensé (max 15 lignes) montrant :
- Dossiers principaux et leur contenu type
- Chemins vers les sources (ex: `src/`, `lib/`, `app/`, `backend/`)
- Fichiers d'entrée si détectés

---

## Étape 5 — Entry points (optionnel)

Utiliser Grep pour chercher `main.*`, `index.*`, `App.*`, `server.*` à la racine et dans `src/` (max 10 résultats).

Sélectionner max 2 fichiers pertinents. Lire les 50 premières lignes de chacun pour comprendre le point d'entrée.

---

## Étape 6 — Architecture & Patterns

En examinant la structure, la config et les entry points, identifier le pattern architectural :

- **MVC** : controllers/, models/, views/
- **Layered** : controllers/, services/, repositories/, entities/
- **Feature-based** : features/feature-A/, features/feature-B/
- **Monolithique** : tout dans src/ sans séparation claire
- **Monorepo** : packages/, workspaces/, plusieurs package.json
- **Other** : décrire brièvement

Justifier en 1 phrase basée sur l'evidence dans la structure.

---

## Étape 7 — Rapport final

Assembler le rapport en combinant tous les éléments précédents. Produire dans le chat ce format exact :

```
## [Nom du projet]

**Stack** : [langage(s) + framework(s) + runtime]
**Architecture** : [pattern identifié] — [justification 1 phrase]

**Structure** :
[arbre condensé, 10-15 lignes]

**Dépendances clés** : [5-10 libs principales, ou "Aucune config détectée"]

**Points notables** :
- [observation sur patterns, structure, choix tech]
- [dette technique visible ou limitation évidente]
- [exemple: "Monorepo sans Lerna/pnpm", "TypeScript strict mode disabled", etc.]
- [max 5 points]

**README** : [résumé 2-3 phrases, ou "Absent"]
```

---

## Règles absolues

- Ne jamais créer de fichier, ne jamais modifier le repo analysé
- Rapport uniquement dans le chat — pas de note vault créée
- L'analyse reste descriptive : ne pas recommander de changements ni critiquer les choix du projet
- Si une étape manque de données (pas de README, pas de config, pas d'entry point clair) → continuer quand même — le rapport est partiel mais complété
