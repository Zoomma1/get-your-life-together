---
name: new-project-claude-md
description: Génère les fichiers Claude Code pour un nouveau projet — CLAUDE.md projet (< 50 lignes, filtre strict) et claude-code/README.md (contexte codebase). Analyse le repo local si un chemin est fourni.
---

Exécute le workflow de génération des fichiers Claude Code pour un nouveau projet.

## Étape 1 — Collecter les infos ou détecter un chemin

**Option A : Chemin local fourni**
- Victor fournit un chemin → vérifier que le dossier existe et contient du code source
- Passer directement à l'étape 2 (analyse du codebase)

**Option B : Pas de chemin**
- Demander à Victor :
  - Nom du projet
  - Stack technique principale (ex: "Express + TypeScript + Prisma + Angular")
  - Commandes clés réelles : dev, test, build, migrate
  - Ports locaux si applicable
  - URL du repo GitHub (optionnel)
- Passer à l'étape 3 (génération sans analyse)

## Étape 2 — Analyser le codebase (si chemin local disponible)

Depuis le chemin local fourni, chercher et lire dans cet ordre (essayer chaque fichier ; continuer si absent) :

**Fichiers de config à lire :**
1. `package.json` → nom, scripts (dev, test, build, migrate), dépendances principales
2. `pom.xml` → si Java, groupId, artifactId, dépendances
3. `docker-compose.yml` ou `docker-compose.yaml` → services, ports, ordre de démarrage
4. `.env.example` ou `.env.sample` → variables d'environnement requises
5. `prisma/schema.prisma` → si ORM Prisma
6. Entry point : `src/index.ts`, `src/main.ts`, `src/app.ts`, `main.py`, etc.
7. `README.md` existant → instructions de démarrage

**Analyser la structure des dossiers :**
- Identifier structure principal : `src/` direct ou monorepo (`client/`, `server/`, `frontend/`, `backend/`) ?
- Lister les dossiers de premier niveau sous le dossier source identifié
- Identifier les couches : routes, services, controllers, features, models, etc.
- Repérer front vs back si monorepo

**Fallback si fichiers manquent :**
- Si pas de `package.json` ET pas de `pom.xml` → demander le stack à Victor manuellement
- Si pas de docker-compose → chercher les ports dans les scripts ou `.env.example`
- Si pas de `.env.example` → marquer ports/vars comme `[À confirmer par Victor]`

**Déduire depuis cette lecture :**
- Stack technique (framework, ORM, test runner, etc.)
- Commandes clés réelles (tirées des scripts npm/Maven/Gradle)
- Ports locaux (tirés de docker-compose, .env ou scripts)
- Fichiers clés avec leur rôle (entry points, config, services partagés)
- Gotchas : ordre de démarrage obligatoire, variables d'env requises, commandes custom

## Étape 3 — Générer CLAUDE.md projet

Appliquer le filtre strict : **"Claude ferait-il une erreur sans cette ligne ?"**

**Inclure :**
- Commandes non-devinables ou non-standard (ex : ordre de démarrage obligatoire, commandes custom)
- Conventions qui diffèrent des defaults du langage ou du framework
- Règles méthodologiques si applicables (TDD, DDD, etc.)
- Gotchas d'environnement (variables requises, services à démarrer avant, etc.)
- Ports si non-standard

**Exclure :**
- Conventions standard du langage (indentation, naming basique)
- Doc API ou description des endpoints
- Tout ce que Claude peut inférer directement depuis le code
- Informations déjà dans le README projet Claude Code

**Format cible (< 50 lignes) :**

```markdown
# CLAUDE.md — [Nom du projet]

## Commandes

| Commande | Dossier | Action |
|----------|---------|--------|
| `[commande dev]` | `[dossier]/` | Lancer le dev |
| `[commande test]` | `[dossier]/` | Lancer les tests |
| `[commande migrate]` | `[dossier]/` | Appliquer les migrations DB |

## Architecture

[Structure en 3-5 lignes max]

## Règles obligatoires

[Uniquement ce qui est non-évident et spécifique au projet]
```

Si aucune règle obligatoire non-évidente n'existe → omettre la section plutôt qu'inventer.

**Chemin cible :** `{VAULT_PATH}/{PROJECTS_FOLDER}/[Projet]/CLAUDE.md`

## Étape 4 — Générer claude-code/README.md

Utiliser le template `{VAULT_PATH}/Ressources/Templates/Claude Code - Project template.md` comme base structurelle.

Remplir chaque section avec les informations collectées :

- **En-tête** : nom + description courte + URL repo si connue
- **Stack** : tableau complet avec toutes les couches identifiées
- **Lancer le projet** : commandes réelles dans l'ordre correct (inclure les gotchas d'ordre de démarrage)
- **Architecture** : structure des dossiers telle qu'observée, séparée front/back si monorepo
- **Fichiers clés** : tableau des fichiers importants avec leur rôle réel
- **Skills associés** : sélectionner depuis `99 - Claude Code/Skills/INDEX.md` les skills pertinents à la stack détectée
- **Sections non remplissables** → garder le callout `> [!danger] À compléter par Victor`

**Chemin cible :** `{VAULT_PATH}/{PROJECTS_FOLDER}/[Projet]/claude-code/README.md`

## Étape 5 — Proposer et valider

Afficher les deux fichiers générés à Victor dans le chat :
- `CLAUDE.md` en bloc code markdown avec lang `markdown`
- `claude-code/README.md` en bloc code markdown avec lang `markdown`

Indiquer clairement les chemins cibles avant chaque bloc.

Attendre la validation explicite de Victor (ex: "ok", "looks good", "change X") avant de passer à l'étape 6.

## Étape 6 — Créer la structure et écrire les fichiers

Une fois Victor a validé (ou demandé des changements, faire l'étape 5 → 6 en itération) :

1. Vérifier que le dossier parent `{VAULT_PATH}/{PROJECTS_FOLDER}/[Projet]/` existe — créer si nécessaire
2. Créer le sous-dossier `claude-code/` s'il n'existe pas
3. Écrire `{VAULT_PATH}/{PROJECTS_FOLDER}/[Projet]/CLAUDE.md` (file Write)
4. Écrire `{VAULT_PATH}/{PROJECTS_FOLDER}/[Projet]/claude-code/README.md` (file Write)
5. Confirmer les deux chemins complets à Victor avec un résumé : "✓ Fichiers créés : CLAUDE.md + claude-code/README.md"

## Règles absolues

- **Validation obligatoire** : ne jamais écrire les fichiers avant la validation explicite de Victor (attendre "ok", "looks good", ou refonte explicite)
- **Filtre strict CLAUDE.md** : si une information ne passerait pas le test "Claude ferait-il une erreur sans cette ligne ?", l'exclure
- **Pas d'invention** : ne jamais inventer des commandes, ports ou conventions — si incertain, marquer `[À confirmer par Victor]`
- **Template obligatoire** : toujours partir du template `{VAULT_PATH}/Ressources/Templates/Claude Code - Project template.md` pour le README
- **Fallback si fichier manque** : si un fichier de config n'existe pas, la chercher dans l'ordre proposé à l'étape 2 — si tous manquent, marquer les infos comme `[À confirmer par Victor]`
