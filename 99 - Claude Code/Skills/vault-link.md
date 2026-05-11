---
name: vault-link
description: Analyze the vault and create links [[]] between notes. Trigger this skill when the user says "/link", "do the linking", "link my notes" or "vault link".
---
# Skill: Vault Link

This skill analyzes the vault and proposes Obsidian `[[]]` links between notes discussing the same subjects. It never modifies a note without explicit validation from {USER_NAME}.

Anchoring philosophy: the role is to make the graph traversable, not to generate understanding. Claude connects. {USER_NAME} thinks. A well-traversable graph allows other commands like `/emerge`, `/trace` or `/connect` to work correctly — that's the real stake of linking.

## Trigger

- the user says "/link", "fais le linking", "relie mes notes"
- {USER_NAME} précise un dossier : "/link mes notes Warhammer"
- Sans précision → analyser tout le vault

## Learned heuristics — {USER_NAME}'s refusals

These rules apply from the generation of suggestions, not after.

### Prefer the specific to the general
Do not link to an aggregate/tracking note when a note specific to the subject exists. Example: a note on Drukhari should point to `[[Drukhari - Squidmar Color Scheme]]`, not to `[[army-tracking]]` (too generic).

### Do not link two separate projects that share a common subject
[Hobby-project] and [Work-project] may share a topic but are independent projects in the vault. Do not create cross-links between them — the common subject is not enough, the notes must complement each other functionally.

### Do not link the organization of a project with personal notes from another domain
A note from [Organization-project] should not link to personal collection notes. The two contexts are separate even if the topic overlaps.

### Check the existence of the link before proposing it
Read the full content of the source note (body text, sections "See also", "Connections", inline links `→ [[...]]`) before suggesting a link. Ne jamais proposer un lien déjà présent, quelle que soit sa forme dans la note.

### Ne pas lier une ressource technique projet vers son hub vision/écosystème
Une note qui documente un outil pour un projet précis (ex : UX analytics for [project-name]) doit pointer vers le projet directement, pas vers la note qui agrège la vision ou l'écosystème. La ressource est opérationnelle — le hub est stratégique. Le sujet commun ne suffit pas : il faut une complémentarité fonctionnelle entre les deux notes.

### Si {USER_NAME} refuse l'ensemble du résultat
Ne pas relancer une session similaire sans signal explicite. Noter le contexte du refus (type de notes, périmètre, thème) pour améliorer la détection future.

## Étape 1 — Périmètre et validation minimale

Si {USER_NAME} précise un dossier ou une note → se limiter à ce périmètre. Sans précision → scanner tous les dossiers sauf `00 - Daily notes/` (trop de volume, liens éphémères), en incluant obligatoirement `99 - Claude Code/Sessions/`.

Lister les dossiers qui seront analysés et attendre confirmation de {USER_NAME}.

**Validation minimale avant de continuer :**
- Si périmètre < 5 notes : proposer élargissement ("Périmètre insuffisant — analyser [dossier] en plus ?")
- Si périmètre > 200 notes : proposer subdivision ("Périmètre trop large — prioriser [dossier] d'abord ?")

---

## Étape 2 — Inventaire structurel

Avant de lire le contenu des notes, faire un scan structurel pour prioriser la lecture. Les orphans et deadends sont les candidats prioritaires — ce sont eux qui bénéficient le plus du linking.

### 2a. Énumérer et détecter les orphans / deadends

Pour chaque dossier à analyser :
- Utiliser Glob pour énumérer tous les fichiers `.md` (pattern : `dossier/**/*.md`)
- Pour chaque fichier, utiliser Grep pour chercher `\[\[` : 0 résultat → deadend (note sans lien sortant)
- Pour chaque fichier X, utiliser Grep pour chercher `\[\[X(\|[^\]]+)?\]\]` dans le périmètre analysé (remplacer X par le slug du fichier sans .md, accepter les alias via `|`) : 0 résultat → orphan (note sans lien entrant)

Prioriser les notes qui sont à la fois orphans ET deadends (isolation complète).

Résultat attendu : liste des orphans, deadends, et hubs (notes avec 5+ références entrantes).

### 2b. Détecter les liens non résolus

Utiliser Grep avec le pattern `\[\[([^\]]+)\]\]` sur le périmètre pour extraire tous les liens. Pour chaque lien trouvé (sans le suffixe alias `|...`), utiliser Glob pour vérifier que le fichier `lien-cible.md` existe. Lister les liens qui ne correspondent à aucun fichier.

**Si des liens brisés existent :** présenter à {USER_NAME} avec raison supposée ("note à créer" vs "lien mal formé"). Attendre instruction avant d'agir.

## Étape 3 — Analyse des connexions

Lire les notes prioritaires identifiées à l'Étape 2 en cet ordre :
1. Notes à la fois orphans et deadends (isolation complète)
2. Orphans seuls, puis deadends seuls
3. Notes dans les dossiers actifs (`03 - Knowledge/`, `04 - Projects/`, `99 - Claude Code/`) — ces dossiers contiennent les notes les plus récemment modifiées par défaut
4. Hubs (notes avec 5+ références)

Si le périmètre dépasse 30 notes, lancer plusieurs passes avec Read en parallèle (10-12 notes par pass). Pour chaque note :
- Lire son contenu complet avec Read
- Identifier les sujets et concepts clés
- Utiliser Grep pour chercher ces termes dans le périmètre
- Retourner les paires de notes candidates

Identifier aussi les **ponts manquants entre clusters** : deux groupes de notes qui gravitent autour du même sujet sans se croiser. Proposer 1-2 liens de pont par paire de clusters identifiée.

Limiter à 30-40 suggestions max par session — qualité > quantité.

### Règle des liens réciproques

Si une note A propose un lien vers B, ne pas automatiquement proposer le lien B → A. Évaluer chaque direction séparément sur la base du contenu de la note source : A parle-t-elle de B de manière fonctionnelle ? Le lien A → B apporte-t-il de la valeur au lecteur de A ?

## Étape 4 — Scoring et présentation des liens

Pour chaque lien candidat, évaluer sur 2 dimensions :
- **Force conceptuelle** (1-5) : le lien est-il réel et non-trivial ?
  - 1 = vague ou tangentiel
  - 3 = sujet commun, connexion claire mais basique
  - 5 = connexion profonde ou complémentaire
- **Impact structurel** (1-5) : est-ce que ce lien améliore la traversabilité du graphe ?
  - 1 = relie deux hubs déjà bien connectés
  - 3 = crée un pont mineur entre deux clusters
  - 5 = sort une note orphan/deadend de l'isolement ou crée un pont clé

Score = Force × Impact (max 25).

- Score > 15 → présenter en priorité
- Score 5-15 → présenter si le quota n'est pas atteint
- Score < 5 → rejeter silencieusement

**Cas "aucun lien pertinent" :** si aucun lien candidat n'atteint score 5, indiquer à {USER_NAME} "aucun lien proposé pour ce périmètre — notes trop isolées ou déjà bien connectées" et s'arrêter (ne pas continuer à l'Étape 5).

**Présenter les liens retenus sous forme de tableau :**

```
### Liens suggérés

| Note source | Lien à ajouter | Note cible | Raison | Score |
|-------------|----------------|------------|--------|-------|
| vault-second-brain.md | [[{USER_NAME}]] | {USER_NAME}.md | Contexte personnel directement lié | 20 |
| NMM.md | [[Balthasar-Gold]] | Balthasar-Gold.md | Peinture mentionnée dans la technique | 16 |
```

**Attendre la validation de {USER_NAME} avant d'ajouter quoi que ce soit.** {USER_NAME} peut rejeter des liens individuellement ou l'ensemble des suggestions.

## Étape 5 — Ajout des liens et nettoyage

Pour chaque lien validé par {USER_NAME}, utiliser Edit pour ajouter `[[nom-note]]` à l'endroit pertinent dans la note source — en fin de note dans une section `## Voir aussi` si aucun endroit naturel n'existe.

```markdown
## Voir aussi
- [[{USER_NAME}]]
- [[vault-second-brain]]
```

**Après ajout de tous les liens :** continuer vers Étape 6 — ne pas s'arrêter ici.

## Étape 6 — Mise à jour des INDEX.md

**Périmètre :** reprendre tous les dossiers définis à l'Étape 1 — pas seulement ceux où des liens ont été validés. Un dossier sans lien ajouté peut quand même manquer d'INDEX.md ou avoir des entrées manquantes.

Ne traiter que les dossiers avec un delta réel — ignorer les dossiers déjà à jour.

### 6a. Détection des changements

Pour chaque dossier du périmètre Étape 1 :
- Glob `dossier/*.md` → liste des notes (exclure `INDEX.md` lui-même et les sous-dossiers)
- **Si `INDEX.md` absent** → dossier candidat à la création
- **Si `INDEX.md` présent** → lire son contenu, extraire les slugs déjà listés, comparer avec le Glob → noter les entrées manquantes
- **Si aucun delta** → ignorer ce dossier silencieusement

### 6b. Génération des nouvelles entrées

Pour chaque note absente de l'index (ou pour toutes si création) :
- Lire le frontmatter : extraire `title` (ou `name`) et `tags`
- Si pas de frontmatter utilisable → utiliser la première ligne H1 ou le slug du fichier
- Construire la ligne : `| [[slug]] | Description 1 ligne | #tag1 #tag2 |`
- Si la note n'a ni title, ni H1, ni tags : laisser Description et Tags vides plutôt qu'inventer

### 6c. Présentation et validation

Afficher les dossiers concernés et les nouvelles entrées :

```
### INDEX.md à mettre à jour

**03 - Knowledge/** — création
| Note | Description | Tags |
...

**02 - Hobbies/** — 2 entrées ajoutées
| [[note-nouvelle]] | ... | ... |
```

**Attendre validation de {USER_NAME} avant d'écrire.** {USER_NAME} peut valider en bloc ou ajuster des entrées.

### 6d. Écriture

- **Création** : Write `INDEX.md` avec header `# Index — [Nom du dossier]` + tableau complet
- **Ajout** : Edit `INDEX.md` — appender les nouvelles lignes dans le tableau existant (ne pas réécrire les entrées déjà présentes)

**Après écriture de tous les INDEX.md :** mettre à jour le tracker (`99 - Claude Code/command-tracker.md`) si le fichier existe — ligne `/link` → remplacer la date par la date du jour au format `YYYY-MM-DD`. Ne pas bloquer si le tracker n'existe pas.

## Étape 7 — Capitalisation des refus (optionnel)

À chaque fois que {USER_NAME} refuse un lien (ou l'ensemble des suggestions) avec une explication, proposer de capitaliser : ajouter l'heuristique dans la section "Heuristiques apprises" avec le pattern général (pas l'exemple spécifique) pour que la règle s'applique aux prochaines sessions.

**Si {USER_NAME} refuse l'ensemble du résultat :** noter le contexte (type de notes, périmètre, thème, raison du refus) — ne pas relancer une session similaire sans signal explicite.
