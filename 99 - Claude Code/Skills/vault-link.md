---
name: vault-link
description: Analyser le vault et créer des liens [[]] entre les notes. Déclenche ce skill quand Victor dit "/link", "fais le linking", "relie mes notes" ou "vault link".
---
# Skill : Vault Link

Ce skill analyse le vault et propose des liens Obsidian `[[]]` entre les notes qui parlent des mêmes sujets. Il ne modifie jamais une note sans validation explicite de Victor.

Philosophie d'ancrage : le rôle est de rendre le graphe traversable, pas de générer de la compréhension. Claude connecte. Victor pense. Un graphe bien traversable permet à d'autres commandes comme `/emerge`, `/trace` ou `/connect` de fonctionner correctement — c'est l'enjeu réel du linking.

## Déclenchement

- Victor dit "/link", "fais le linking", "relie mes notes"
- Victor précise un dossier : "/link mes notes Warhammer"
- Sans précision → analyser tout le vault

## Heuristiques apprises — refus de Victor

Ces règles s'appliquent dès la génération des suggestions, pas après.

### Préférer le spécifique au général
Ne pas lier vers une note agrégat/suivi quand une note spécifique au sujet existe. Exemple : une note sur les Drukhari doit pointer vers `[[Drukhari - Schema couleurs Squidmar]]`, pas vers `[[suivi-armees]]` (trop générique).

### Ne pas lier deux projets distincts qui partagent un sujet commun
Warhammer (hobby) et FSTG (projet logiciel) parlent tous les deux de figurines, mais ce sont deux projets indépendants dans le vault. Ne pas créer de liens croisés entre eux — le sujet commun ne suffit pas, il faut que les notes se complètent fonctionnellement.

### Ne pas lier l'organisation d'un projet avec les notes personnelles d'un autre domaine
La note `Event warhammer.md` (organisation Ludisep) ne doit pas pointer vers `suivi-armees.md` (hobby perso). La gestion associative et la collection personnelle sont deux contextes séparés, même si le sujet (Warhammer) est le même.

### Vérifier l'existence du lien avant de le proposer
Lire le contenu complet de la note source (corps du texte, sections "Voir aussi", "Connexions", liens inline `→ [[...]]`) avant de suggérer un lien. Ne jamais proposer un lien déjà présent, quelle que soit sa forme dans la note.

### Si Victor refuse l'ensemble du résultat
Ne pas relancer une session similaire sans signal explicite. Noter le contexte du refus (type de notes, périmètre, thème) pour améliorer la détection future.

## Étape 1 — Périmètre et validation minimale

Si Victor précise un dossier ou une note → se limiter à ce périmètre. Sans précision → scanner tous les dossiers sauf `00 - Daily notes/` (trop de volume, liens éphémères), en incluant obligatoirement `99 - Claude Code/Sessions/`.

Lister les dossiers qui seront analysés et attendre confirmation de Victor.

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

**Si des liens brisés existent :** présenter à Victor avec raison supposée ("note à créer" vs "lien mal formé"). Attendre instruction avant d'agir.

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

**Cas "aucun lien pertinent" :** si aucun lien candidat n'atteint score 5, indiquer à Victor "aucun lien proposé pour ce périmètre — notes trop isolées ou déjà bien connectées" et s'arrêter (ne pas continuer à l'Étape 5).

**Présenter les liens retenus sous forme de tableau :**

```
### Liens suggérés

| Note source | Lien à ajouter | Note cible | Raison | Score |
|-------------|----------------|------------|--------|-------|
| vault-second-brain.md | [[Victor]] | {USER_NAME}.md | Contexte personnel directement lié | 20 |
| NMM.md | [[Balthasar-Gold]] | Balthasar-Gold.md | Peinture mentionnée dans la technique | 16 |
```

**Attendre la validation de Victor avant d'ajouter quoi que ce soit.** Victor peut rejeter des liens individuellement ou l'ensemble des suggestions.

## Étape 5 — Ajout des liens et nettoyage

Pour chaque lien validé par Victor, utiliser Edit pour ajouter `[[nom-note]]` à l'endroit pertinent dans la note source — en fin de note dans une section `## Voir aussi` si aucun endroit naturel n'existe.

```markdown
## Voir aussi
- [[Victor]]
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

**Attendre validation de Victor avant d'écrire.** Victor peut valider en bloc ou ajuster des entrées.

### 6d. Écriture

- **Création** : Write `INDEX.md` avec header `# Index — [Nom du dossier]` + tableau complet
- **Ajout** : Edit `INDEX.md` — appender les nouvelles lignes dans le tableau existant (ne pas réécrire les entrées déjà présentes)

**Après écriture de tous les INDEX.md :** mettre à jour le tracker (`99 - Claude Code/command-tracker.md`) si le fichier existe — ligne `/link` → remplacer la date par la date du jour au format `YYYY-MM-DD`. Ne pas bloquer si le tracker n'existe pas.

## Étape 7 — Capitalisation des refus (optionnel)

À chaque fois que Victor refuse un lien (ou l'ensemble des suggestions) avec une explication, proposer de capitaliser : ajouter l'heuristique dans la section "Heuristiques apprises" avec le pattern général (pas l'exemple spécifique) pour que la règle s'applique aux prochaines sessions.

**Si Victor refuse l'ensemble du résultat :** noter le contexte (type de notes, périmètre, thème, raison du refus) — ne pas relancer une session similaire sans signal explicite.
