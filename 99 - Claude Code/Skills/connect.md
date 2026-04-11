---
name: connect
description: Trouver les bridges conceptuels non-évidents entre deux domaines précis du vault via recherche textuelle. Contrairement à emerge (inductif — quoi émerge du vault ?), connect est déductif — que partagent ces deux domaines précis ? Contrairement à vault-link (opérationnel — crée les liens), connect est analytique — trouve d'abord les connexions, l'utilisateur décide ensuite. Ex : /connect Warhammer dev, /connect productivity workflow.
---

# Skill : /connect

Explore deux domaines du vault et révèle ce qu'ils partagent sans que l'utilisateur l'ait encore formulé — patterns communs, tensions parallèles, bridges conceptuels. Présenter les bridges, laisser l'utilisateur décider des liens à créer.

## Déclenchement

```
/connect [domaine A] [domaine B]    → ex: /connect Warhammer dev
/connect productivity workflow       → deux termes larges acceptés
/connect "Mon Projet" learning       → guillemets pour les noms composés
```

---

## Étape 1 — Cartographier chaque domaine

Pour chaque domaine, construire une image de ce qui existe dans le vault via **recherche textuelle** (Grep sur les titres, corps de notes, liens `[[]]`).

### Méthode de recherche

1. Grep le terme du domaine dans tout le vault — collecter les fichiers `.md` qui le mentionnent (limiter à 50 résultats)
2. Identifier les **hub notes** : soit le titre est un exact match du domaine, soit la note est mentionnée 3+ fois dans les résultats de grep
3. Lire ces hub notes et suivre les liens `[[]]` sortants sur une profondeur à déterminer à l'étape suivante
4. Identifier les notes, concepts, personnes, tensions récurrentes et questions ouvertes dans chaque domaine
5. Arrêter si une note est visitée 2 fois (cycle detection)

### Adapter la profondeur selon la couverture (Depth Asymmetry)

L'équilibre documentaire détermine combien de hops explorer pour chaque domaine :

| Couverture | Domaine A | Domaine B | Profondeur |
|----------|-----------|-----------|-----------|
| **Balanced** | > 15 résultats | > 15 résultats | Tous deux max 2 hops |
| **Asymétrique** | > 20 résultats | 5-15 résultats | A: 2 hops, B: 3 hops + chercher hubs cachés |
| **One sparse** | > 15 résultats | < 5 résultats | A: 1 hop (essentiel), B: 3 hops (marges) |
| **Both sparse** | < 10 résultats | < 10 résultats | Tous deux max 3 hops |

**Raison** : Les connexions intéressantes se trouvent aux marges du domaine minoritaire ; les domaines sous-documentés nécessitent une profondeur maximale.

---

## Étape 2 — Trouver les overlaps

Comparer les deux cartographies pour identifier les éléments communs. C'est une étape **analytique** : vous documentez ce qui existe, sans créer ou modifier quoi que ce soit. Chercher :

- **Références partagées** — notes ou concepts qui apparaissent dans les deux domaines (bridges naturels via liens `[[]]`)
- **Personnes partagées** — mentionnées dans les deux domaines, éventuellement dans des rôles différents
- **Thèmes partagés** — même terme récurrent, même question, même type de tension dans le corps des notes (pas juste les titres)
  - Exemple : "itération" apparaît dans hobby (peinture par couches) et dev (refacto agile) → thème partagé
- **Patterns partagés** — même structure de problème, ex : blocage → dépendance → délai (même type d'obstacle)
- **Tags partagés** — tags `#tag` identiques dans les deux domaines

---

## Étape 3 — Tracer les bridges

Pour chaque overlap identifié, approfondir sur **max 3 hops** depuis la note bridge. C'est encore une étape **analytique** : documentez les chemins, ne créez rien.

Tracez le chemin le plus court entre les deux hub notes via les liens `[[]]` — les notes intermédiaires se situent souvent à l'intersection sans appartenir pleinement à aucun des deux domaines. Ce sont vos bridges les plus forts.

---

## Étape 4 — Synthétiser

### Format de chaque bridge

```
Bridge [#] : [Titre du bridge]
Dans [Domaine A] : [comment ce concept apparaît]
Dans [Domaine B] : [comment il apparaît différemment]
La connexion : [ce qui les relie et pourquoi c'est intéressant]
Profondeur : [Surface / Structural / Foundational]
Implication : [ce que ça suggère pour l'un ou l'autre domaine]
```

**Profondeur du bridge** :
- **Surface** — même terminologie, overlap superficiel (peut se dissiper)
- **Structural** — même structure de problème ou de solution, persistant
- **Foundational** — même croyance de fond, même principe sous-jacent (invariant)

### Le bridge le plus fort

Identifier le bridge unique le plus intéressant — celui qui recadre la façon de penser les deux domaines simultanément.

### Missing Links

Connexions qui *devraient* exister mais n'ont pas encore été créées. **Proposer en prose** — ex : "Une note 'Mastery via iteration' pourrait relier hobby + dev" — jamais créer ou modifier des liens sans validation de l'utilisateur.

### La question que ça soulève

Quelle nouvelle question devient visible en voyant ces deux domaines connectés, qu'il était impossible de formuler tant qu'ils restaient séparés ?

Après avoir présenté la question, évaluer si elle est ticket-digne selon ce seuil :
- **Oui** : la question ouvre un champ de réflexion nouveau OU remet en question une assomption existante
- **Non** : la question reste rhétorique ou ne demande pas de suivi

Si oui → proposer le ticket en prose (ex : "Voulez-vous créer un ticket Idea ?") et attendre la réponse explicite de l'utilisateur. Ne jamais créer, modifier, ou ajouter à un ticket sans validation.

---

## Edge cases

### Domaines disjoints

Si après cartographie complète, **aucun overlap n'est trouvé** (domaines véritablement disjoints) :

```
CONNECT : [Domaine A] <-> [Domaine B]
Trend : No overlap

Résultat : Aucun bridge détecté après recherche approfondie.
Les domaines restent structuralement indépendants.
Implication : [optionnel] Réflexion sur pourquoi cette séparation existe.
```

Ne pas forcer un bridge inexistant. Rapporter l'absence est utile.

### Un domaine introuvable (0 résultats Grep)

```
CONNECT : [Domaine A] <-> [Domaine B]
Status : [Domaine B] — Aucune mention dans le vault

Résultat : Impossible de mapper [Domaine B]. Domaine inexistant ou sous-documenté.
Suggestion : Vérifier le terme utilisé ou créer une note hub pour [Domaine B].
```

### Un domaine partiellement documenté (1-4 résultats Grep)

```
CONNECT : [Domaine A] <-> [Domaine B]
Trend : [Domaine B] — Minimal coverage (3 résultats)

Résultat : [Domaine B] est peu documenté mais identifiable. Avoir exploré 3 hops complets.
Bridges trouvés : [liste]
Limitation : Connexions possibles au-delà de ces 3 hops restent invisibles.
Suggestion : Densifier [Domaine B] au vault si la connexion semble prometteuse.
```

### Domaines identiques (A == B)

Ne pas exécuter la recherche. Rapporter directement :

```
CONNECT : [Domaine] <-> [Domaine]
Status : Domaines identiques

Résultat : Les deux entrées pointent le même domaine. Aucun bridge à trouver.
Suggestion : Vérifier si vous vouliez connecter [Domaine] à un autre.
```

### Domaine mal formé ou très court (< 2 caractères)

```
CONNECT : [Domaine A] <-> [Domaine B]
Status : Parsing error ou domaine invalide

Résultat : [Domaine B] est trop court ou mal formé. Grep produirait trop de bruit.
Suggestion : Utiliser un terme de 2+ caractères, ou guillemets pour les noms composés.
Exemple : /connect "Mon Projet" Productivity
```

---

## Format de sortie

```
CONNECT : [Domaine A] <-> [Domaine B]
Coverage : [Balanced / Asymétrique / Un sparse / Tous sparse]
Status : [OK / Partial / Disjoint / Identical / Invalid]

[Bridges trouvés — du plus fort au plus faible]
Bridge [#] : [Titre]
  Dans [Domaine A] : [apparition]
  Dans [Domaine B] : [apparition différente]
  La connexion : [ce qui les relie et pourquoi c'est intéressant]
  Profondeur : [Surface / Structural / Foundational]
  Implication : [ce que ça suggère]

[Le bridge le plus fort et son implication]
[Missing links — en prose]
[La question qui émerge — évaluation ticket-digne]
```

**Exemple** :
```
CONNECT : Warhammer <-> Productivity
Coverage : Asymétrique (Warhammer 45 résultats, Productivity 8)
Status : OK

Bridge 1 : Pile of Shame — Accumulation et friction
  Dans Warhammer : figurines non peintes, backlog visuel croissant
  Dans Productivity : tâches repoussées, accumulation psychologique
  La connexion : même dynamique d'inertie croissante face à la quantité
  Profondeur : Structural
  Implication : les deux domaines bénéficient du même cadre de réduction progressive

Le bridge le plus fort : Pile of Shame. Recadre comment penser l'inertie dans deux domaines distincts.
Missing : Une note 'Accumulation et friction' pourrait expliciter ce lien.

La question : Ma relation à la Pile of Shame dans deux domaines reflète-t-elle la même aversion à l'imperfection ?
Seuil ticket-digne : Oui — remet en question mon assomption que l'inertie a des causes différentes selon le contexte.
```

---

## Règles absolues

- **Analytique pur** — Étapes 1-3 sont exploratoires ; vous présentez les bridges découverts sans créer, modifier, ou décider d'actions
- **Vault uniquement** — les bridges viennent des notes existantes et de leurs liens, pas de la synthèse ou du modèle de Claude
- **Ne pas forcer** — un overlap superficiel n'est pas un bridge ; écarter si pas étayé par au moins une note, un lien, ou un thème concret
- **Depth Asymmetry obligatoire** — appliquer le tableau des couvertures pour déterminer les hops, jamais estimer à vue
- **Validation explicite** — pour tout action (création de liens, ticket, modification), attendre l'approbation explicite de l'utilisateur
- **Missing links en prose** — proposer les connexions manquantes sous forme de suggestions textuelles, jamais créer les notes
