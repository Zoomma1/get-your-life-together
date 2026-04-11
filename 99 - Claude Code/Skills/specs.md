---
name: specs
description: Générer les specs des features en colonne Spec, prioriser leur implémentation, valider avec l'utilisateur, puis déplacer vers Ready. Supporte plusieurs kanbans en une session.
---

Exécute le workflow de génération de specs pour un ou plusieurs kanbans.

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Étape 0 — Configurer les chemins dynamiques

Pour chaque kanban à traiter, établir le chemin racine :

| Kanban | Chemin racine | README | Priority |
|--------|---------------|--------|----------|
| Projet classique | `[PROJECTS_FOLDER]/<Projet>/` | `README.md` | `Priority.md` |
| Claude Code | `99 - Claude Code/` | (pas de README) | `Priority.md` |

Utiliser ce mappage dans toutes les étapes suivantes pour éviter les recherches répétées.

## Étape 1 — Identifier les kanbans à traiter

1. Lire `[PROJECTS_FOLDER]/INDEX.md` pour connaître les projets actifs et leurs kanbans
2. Identifier les kanbans à traiter :
   - Si l'utilisateur précise un projet → traiter uniquement ce kanban
   - Si l'utilisateur dit "tous" ou ne précise pas → traiter tous les kanbans avec des tickets en colonne **Spec** :
     - Kanbans projets : `[PROJECTS_FOLDER]/<Projet>/Project management.md`
     - Kanban Claude Code : `99 - Claude Code/Claude Code Kanban.md`
3. Pour chaque kanban identifié :
   - Projet classique → lire le README à `<Chemin racine>/README.md` pour le contexte (Architecture, Stack, Conventions)
   - Claude Code → s'appuyer sur le CLAUDE.md et les skills existants (pas de README)

## Étape 2 — Lister les features

Pour chaque kanban identifié :
1. Lire le kanban
2. Extraire toutes les features en colonne **Spec** et classifier :
   - **Specs à générer** : note vide ou sans section `## Specs générées`
   - **Specs déjà générées** : note existante avec section `## Specs générées` remplie → marquer pour déplacement en Ready (sans régénération)
   - **Feature déjà implémentée** : uniquement si explicite dans la section "Done" ou progression du README du projet — ne pas supposer
3. Aussi lister les features en colonne **Ready** non encore démarrées (pour l'ordre global de priorité — elles peuvent être réordonnées si affectées par le nouvel ordre)
4. Ignorer les features en colonne **Done** — ne jamais les relister

**Résultat de l'étape 2** : 3 listes par kanban
- Features en Spec à spécer : `[F1, F2, F3]`
- Features en Spec déjà spécées : `[F4, F5]`
- Features en Ready (non démarrées) : `[F6, F7]`

## Étape 3 — Proposer un ordre de priorité

Pour chaque kanban avec au moins une feature à traiter (Spec ou Ready) :

Analyser et proposer un ordre basé sur :
- **Dépendances** : une feature qui bloque une autre (explicite dans titres/descriptions) passe en premier — considérer dépendances intra-kanban uniquement
- **Valeur utilisateur** : impact sur l'expérience perçue par l'utilisateur final
- **Complexité technique** : features complexes pouvant être des fondations pour d'autres

Présenter le résultat en un seul tableau par kanban :

```markdown
### Kanban [NomProjet]
| # | Feature | Raison |
|---|---------|--------|
| 1 | [[NomFeature]] | Bloque X / Valeur utilisateur haute |
| 2 | [[NomFeature]] | Dépendance de #1 / Impact medium |
```

**Cas limite** : Si un kanban a zéro feature à spécer **ET** zéro feature Ready → sauter directement à la section suivante, aucune action.

Attendre la validation de l'utilisateur avant de continuer.

## Étape 4 — Mettre à jour Priority.md (optionnel)

**Condition préalable** : Cette étape s'exécute UNIQUEMENT si :
1. l'utilisateur a validé l'ordre à l'étape 3 ET
2. Au moins une feature a été identifiée comme "à spécer" à l'étape 2 (même si finalement zéro spec a été générée)

Si cette condition n'est pas remplie → sauter à l'étape 6.

Pour chaque kanban qui a un `Priority.md` (utiliser chemins de l'Étape 0) :

### 4a — Nettoyer les anciens batches

Pour chaque batch existant en Priority.md :
1. Lister les features du batch présentes en colonne **Done** du kanban
2. Supprimer ces lignes du batch
3. Si le batch est maintenant vide → supprimer la section entière du batch

Après nettoyage, appliquer cette logique de consolidation :

```
IF (tous les anciens batches vides) THEN:
  IF (features Ready subsistent au kanban) THEN:
    Créer tableau unique "Backlog Ready [date-ISO]"
    Ajouter toutes les features Ready en ordre de priorité
  ELSE:
    Supprimer toutes les sections batch
ELSE:
  Garder la structure batch existante (batches partiels restants)
END
```

### 4b — Ajouter le nouveau batch

Créer une section pour les features spécées cette session :

```markdown
## Batch [date] — Ordre de priorité
| # | Feature | Raison |
|---|---------|--------|
| 1 | [[NomFeature]] | Bloque X / Valeur utilisateur haute |
| 2 | [[NomFeature]] | Dépendance de #1 / Impact medium |
```

## Étape 5 — Générer les specs manquantes

Pour les tickets identifiés à l'étape 2 comme "specs à générer", dans l'ordre convenu :

1. Vérifier que la note existe — si non, la créer dans `<Chemin racine>/Features/` avec le titre de la feature
2. Remplir la section `## Specs générées` avec :
   - Comportement attendu (user stories ou cas d'usage)
   - Critères d'acceptation (AC — testables, concrets)
   - Notes techniques (stack, patterns, dépendances existantes)
   - Cas limites à gérer
3. S'appuyer sur le contexte du README projet (`Architecture`, `Stack`) et les conventions du CLAUDE.md
4. Ne jamais écraser ce que l'utilisateur a déjà rempli — ajouter à la section existante

## Étape 6 — Déplacer les tickets

Pour chaque feature traitée à l'étape 5 (générée ou déjà présente), mettre à jour le kanban :

- **Specs générées ou déjà présentes** → déplacer de **Spec** vers **Ready**
- **Feature déjà implémentée** → déplacer de **Spec** vers **Done**

Processus de déplacement :
1. Trouver la ligne dans la section **Spec**
2. Couper la ligne entière (garder le formatage `[[...]]` et espaces)
3. La coller dans **Ready** ou **Done** en maintenant la structure du kanban
4. Vérifier que le kanban reste cohérent (pas de doublons, structure intacte)

## Règles absolues

- **Validation obligatoire** : attendre la validation de l'ordre de priorité avant de générer les specs ou mettre à jour Priority.md
- **Pas d'écrasement** : ne jamais écraser le contenu existant — ajouter à `## Specs générées` sans supprimer
- **Pas de régénération** : si des specs existent déjà (section `## Specs générées` présente), déplacer en Ready sans modifier
- **Véracité des dépendances** : ne valider une dépendance que si elle est explicite dans les titres, descriptions ou notes du kanban
- **Contexte obligatoire** : toujours lire le README du projet avant de générer (Architecture, Stack)
- **Pair-programming** : aucune action autonome — attendre validation à chaque étape charnière (Étape 3, puis Étape 4)
