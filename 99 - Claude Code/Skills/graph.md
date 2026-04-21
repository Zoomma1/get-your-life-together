---
name: graph
description: Génère ou met à jour le knowledge graph d'un projet dev via graphify, puis produit un graph-context.md curé (~40 lignes) depuis GRAPH_REPORT.md pour chargement en contexte Claude. Invoquer quand : première session sur un nouveau projet dev, ou mise à jour manuelle après refacto majeure. Ex: /graph, /graph --update
---

Génère un knowledge graph via graphify puis produit un `graph-context.md` curé et annoté.

## Étape 1 — Identifier la cible

Demander le chemin du repo. Output → `.claude/graph-context.md`

**Attendre la réponse avant de continuer.**

## Étape 2 — Vérifier l'existant

Vérifier si `graph-context.md` existe à l'emplacement cible.

**Si oui** → demander : "Un graph-context.md existe. **Update** (--update, fichiers modifiés seulement) ou **repartir de zéro** ?"

**Attendre la réponse.**

**Si non** → vérifier si `graphify-out/GRAPH_REPORT.md` existe déjà à la racine du workspace cible.

- **GRAPH_REPORT.md présent** → graphify a déjà tourné mais la curation n'a pas eu lieu. Passer directement à l'**Étape 4** (synthèse manuelle depuis le rapport existant — pas besoin de re-run).
- **GRAPH_REPORT.md absent** → continuer à l'Étape 3 (lancer graphify).

## Étape 3 — Lancer graphify

Afficher la commande, expliquer en une phrase, **attendre OK de Victor** :

```bash
cd "<chemin-repo>" && graphify . [--update]
```

Lancer après confirmation. Attendre la fin.

## Étape 4 — Curation du graph-context.md

Lire `graphify-out/GRAPH_REPORT.md` et produire un draft `graph-context.md` curé suivant ce format exact :

```markdown
# graph-context — [NOM] (YYYY-MM-DD)
# Généré depuis graphify-out/GRAPH_REPORT.md (run YYYY-MM-DD)
# [X] nodes · [Y] edges · [Z] communities[· Stack: ... si projet dev]

## God Nodes (abstractions centrales)
1. `[Nom]` — [N] edges ([annotation contextuelle : rôle dans le projet/vault])
...

## Communautés principales
- **[Groupe]** : [membres ou description]
...

## Hyperedges clés
- **[Feature/Groupe]** : [membres liés]
...

## Connexions surprenantes (INFERRED)
- `[A]` → `[B]` ([contexte court])
...
```

**Règles de curation :**
- God Nodes : garder les 10 premiers, ajouter une annotation contextuelle sur chaque (pas juste le nombre d'edges — expliquer le rôle)
- Communautés : regrouper par domaine fonctionnel, pas lister exhaustivement (viser ~10 groupes max)
- Hyperedges : garder seulement les groupes significatifs (feature complète, stack, cluster métier)
- Connexions surprenantes : INFERRED uniquement, max 5, ignorer les faux positifs évidents (ex: Istanbul → fichiers sources)
- Taille cible : ~40 lignes — si plus, re-regrouper

Présenter le draft à Victor : "Voilà le draft — tu veux annoter ou ajuster avant que j'écrive ?"

**Attendre validation (ou "c'est bon") avant d'écrire le fichier.**

## Étape 5 — Écriture et post-run

Écrire le `graph-context.md` validé à l'emplacement cible.

### Premier run (pas --update)
Proposer : "Tu veux installer le hook pre-commit pour que le graph se mette à jour automatiquement après chaque commit ?"

Si oui → afficher la commande à lancer depuis la racine du repo :
```bash
graphify hook install
```
Préciser : le hook utilise l'AST sans LLM pour les fichiers TS/JS — rebuild instantané.

## 🚫 Règle absolue

**Ne jamais lancer graphify sur le vault** (`{VAULT_PATH}`). Le vault est exclu définitivement — coût LLM et temps d'exécution disproportionnés par rapport aux INDEX.md qui remplissent le même rôle. Si Victor demande `/graph` sur le vault, refuser et expliquer.

## Notes techniques

- `.graphifyignore` à la racine pour les exclusions (syntaxe gitignore) — ex FSTG : `client/coverage/` + `graphify-out/`
- Ne pas utiliser `tee` pour capturer le stdout — le GRAPH_REPORT.md est la source, pas le CLI output
