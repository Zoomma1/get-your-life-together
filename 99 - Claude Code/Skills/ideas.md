---
name: ideas
description: À lancer toutes les 2-4 semaines quand Victor veut savoir quoi faire ensuite — transforme les patterns du vault en actions concrètes sourcées. Contrairement à vault-harvest-deep (qui détecte et capitalise) et à emerge (qui cherche des clusters inter-notes), /ideas transforme ces patterns en idées actionnables classées par catégorie avec effort estimé et sourcing obligatoire. Utiliser quand Victor dit "ideas", "qu'est-ce que je devrais faire", "génère des idées", "montre-moi les opportunités".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : /ideas

Extrait des idées actionnables depuis les patterns réels du vault — pas du brainstorming générique. Chaque idée doit être sourcée ("basé sur ta note du [date]..."), sinon elle n'a pas sa place ici.

**Quand invoquer `/ideas` plutôt qu'un autre skill :**

Utilise `/ideas` quand tu veux des **actions priorisées** basées sur une synthèse du vault sur 30 jours. Les autres skills complètent :
- **/drift** → signal isolé réapparu ces 15j (pas encore actionné)
- **/harvestdeep** → panorama exhaustif 30j (consolidation sans priorisation)
- **/emerge** → clusters inter-notes (nouvelles connexions, pas des actions)
- **/ideas** → synthèse 4 dimensions → top 3 actions + 1 opportunité clé

---

## Étape 1 — Lire le vault (scope 30 jours ou moins si peu de données)

Synthétiser mentalement 6 sources de signal sur les 30 derniers jours. Chaque source donne un angle d'analyse distinct. (Faire cette synthèse en lecture directe du vault — sans appeler d'outils externes.)

**Source 1 — Daily notes (`00 - Daily notes/YYYY-MM-DD.md`, 30j)**
Sujets mentionnés 2+ fois, intentions sans suite explicite, frustrations citées, décisions prises.

**Source 2 — Sessions (`99 - Claude Code/Sessions/`, 30j)**
Projets travaillés, progression vs stagnation notée, décisions, sujets reportés/évités intentionnellement.

**Source 3 — Projets actifs et kanbans (`04 - Projects/INDEX.md` + kanbans, colonnes Idea/Specs/Ready/WIP)**
État de chaque projet, tickets bloqués depuis plusieurs jours/semaines, dépendances non résolues.

**Source 4 — Knowledge actifs (`03 - Knowledge/**/*.md`, modifiés dans les 30j)**
Domaines sur lesquels Victor a écrit récemment, concepts capitalisés, lacunes visibles (sujets actifs sans note dédiée).

**Source 5 — Inbox (`09 - Inbox/`)**
Idées non capitalisées, tickets sans suite, sujets récurrents non actionnés.

**Source 6 — READMEs projets actifs (`04 - Projects/[Projet]/claude-code/README.md` pour chaque projet actif)**
Objectifs déclarés, "next steps" officiels, dette technique mentionnée.

### Consolidation avant Étape 2

Récapituler brièvement ce qui émerge des 6 sources. Si plus de 4 sources retournent "aucune donnée" (vault peu alimenté, aucune session récente, no kanbans, etc.), signaler à Victor que le signal est trop faible : proposer d'attendre une semaine supplémentaire ou continuer avec patterns partiels.

---

## Étape 2 — Synthèse en 4 dimensions (STOP et validation Victor)

Synthétiser les 6 sources consolidées sur ces 4 axes. **Présenter cette synthèse à Victor sous forme de tableau 2D et attendre sa confirmation explicite avant de continuer à Étape 3.**

Format de présentation (tableau) :

| Dimension | Signal / Exemple |
|-----------|------------------|
| **Ce qui marche** | Sujets/projets/pratiques avec énergie et avancement concret (sources 2, 3, 4) |
| **Ce qui frustre** | Friction récurrente, intentions sans suite, dépendances évitées (sources 1, 2, 5) |
| **Ce qui manque** | Lacunes identifiées (outils, savoir, process, docs), questions ouvertes (sources 4, 5, 6) |
| **Bottlenecks** | Ce qui bloque plusieurs domaines : dépendances non résolues, manque de ressource/temps (sources 2, 3, 6) |

**Exemple concret :** Si Source 1 parle d'une idée 3 fois en 2 semaines (frustration), et Source 3 montre un ticket en Blocked depuis 15j non avancé (bottleneck), alors : "Bloquer : [Titre] depuis 15j en Blocked, mentionné 3 fois en frustration" → ligne du tableau "Bottlenecks".

---

## Étape 3 — Génération d'idées (9 catégories, 3-4 max par catégorie)

Pour chaque catégorie, générer uniquement des idées **ancrées dans le vault** — si une idée ne peut pas être sourcée (note + date, ou pattern explicite du vault), la rejeter. **Chaque idée est immédiatement qualifiée par type (Étape 4 fusionnée ici).**

Format standardisé d'une idée :

```
[Titre de l'idée]
→ Type : obvious-but-important / genuinely non-obvious
→ Source : [note/daily du YYYY-MM-DD ou « pattern sur X, Y, Z »]
→ Effort : rapide (< 1h) / moyen (1j) / lourd (plusieurs sessions)
→ Pourquoi maintenant : [lien explicite avec un signal de Étape 2]
```

**Définitions de type :**
- **Obvious-but-important** — idée logique et attendue, mais non encore actionnée. Réduit la dette d'inaction.
- **Genuinely non-obvious** — connexion entre domaines lointains, pattern caché, conclusion qui n'aurait pas émergé sans analyse croisée. **À mettre en avant car plus précieuse.**

### 1. Outils à construire
Outils, scripts, automatisations qui résoudraient une friction identifiée.

### 2. Conversations à avoir
Personnes à contacter, sujets à aborder — déclenchés par un problème ou une opportunité.

### 3. Essays à écrire
Tensions intellectuelles, opinions forgées, points de vue qui méritent d'être écrits.

### 4. Projets à démarrer
Nouvelles initiatives distinctes des projets actuels.

### 5. Skills à développer
Compétences identifiées comme manquantes ou à renforcer pour accélérer/débloquer des patterns.

### 6. Personnes à connecter
Collaborations potentielles, mentors, communautés pour un domaine actif.

### 7. Systèmes à améliorer
Process, workflows, routines qui pourraient être optimisés ou automatisés.

### 8. Questions à répondre
Questions ouvertes présentes dans le vault sans réponse actuelle.

### 9. Expériences à lancer
Tests/expérimentations rapides à faire pour valider une hypothèse ou apprendre.

**Règle de volume** : 2-3 idées maximales par catégorie. Mieux vaut 6-8 idées fortes et sourcées que 25 vagues.

---


## Étape 4 — Prioritisation finale

**Top 3 actions à plus fort impact**
Basées sur : effort/impact, alignement avec les projets actifs, et les bottlenecks identifiés en Étape 2.

**1 opportunité clé**
L'idée la plus importante émergée dans cette session — celle qui, si actionnée, débloque ou change significativement une friction ou un domaine.

```
OPPORTUNITE CLE : [titre]
→ Type : obvious-but-important / genuinely non-obvious
→ Pourquoi celle-là : [raisonnement en 2-3 phrases basé sur Étape 2]
→ Première étape concrète : [action minimale pour démarrer]
```

---

## Étape 5 — Persistance et décision ticket

### Sauvegarder le rapport (obligatoire)

Créer `03 - Knowledge/Ideas/YYYY-MM-DD.md` avec la structure suivante :

```markdown
---
date: YYYY-MM-DD
type: ideas-session
vault-state: complet (6/6 sources) | partiel (2-5/6 sources) | faible (< 2/6)
---

# Session /ideas — YYYY-MM-DD

## Synthèse 4 dimensions
[Tableau Étape 2 : Ce qui marche | Ce qui frustre | Ce qui manque | Bottlenecks]

## Idées par catégorie
[Toutes les idées des 9 catégories — Étape 3 — avec type + source + effort + pourquoi maintenant]

## Prioritisation
[Top 3 + Opportunité clé — Étape 4]

## Tickets générés
[Si Victor a ticketisé : liste + kanbans cible]
```

### Présenter la liste de ticketing

Afficher à Victor une liste numérotée avec : titre + catégorie + kanban cible + effort. **Victor choisit explicitement** lesquels créer (numéros, "tout", ou "rien").

**Kanbans par défaut (routage) :**
- Outils/Systèmes → `99 - Claude Code/Claude Code Kanban.md`
- Projets → kanban du projet correspondant
- Skills/Questions/Expériences → Claude Code Kanban
- Essays → Claude Code Kanban (colonne Idea)
- Conversations/Personnes → Claude Code Kanban

**Une fois confirmé :** pour chaque ticket à créer, appliquer le skill `create-ticket` avec `column=Idea`, `type` qualifié, `project` si applicable, et `context` = source (note + YYYY-MM-DD) + effort estimé.

### Mettre à jour command-tracker

Après persistance, ajouter une ligne à `99 - Claude Code/command-tracker.md` :

```
/ideas | YYYY-MM-DD | ~20-30 jours | X tickets créés
```

---

## Règles absolues

- **Sourcing obligatoire** : chaque idée cite sa source (note + date) ou pattern explicite du vault (ex. "bloqué depuis 15j en Blocked"). Si sourcing impossible → rejeter l'idée.
- **Synthèse d'abord** : présenter tableau 4 dimensions (Étape 2) — attendre validation Victor avant Étape 3.
- **Pas de création autonome** : tickets créés uniquement sur choix explicite de Victor (numéros, "tout", ou "rien").
- **Pas de brainstorming générique** : uniquement des idées du vault, zéro suggestion libre.
- **Pas de duplication** : si `/drift` ou `/emerge` ont déjà couvert un signal en Étape 1, l'omettre.
- **Rapport obligatoire** : `03 - Knowledge/Ideas/YYYY-MM-DD.md` créée même si Victor ne ticketise rien.
- **Signal faible** : si plus de 4 sources sont vides, signaler et proposer d'attendre 1 semaine supplémentaire ou continuer avec patterns partiels.

---

## Exemple de scénario d'invocation

Victor dit : "génère des idées — j'ai pas bouffé depuis 2 semaines et je sais pas sur quoi me brancher"

1. Lire daily notes 2 dernières semaines + sessions + kanbans → Étape 1
2. Synthétiser en 4 dimensions (tableau) → Étape 2 → présenter à Victor
3. Attendre confirmation Victor : "ok, continue" ou "attends je dois ajouter un truc"
4. Générer idées 9 catégories, chaque idée avec type/source/effort/pourquoi → Étape 3
5. Top 3 + Opportunité clé → Étape 4
6. Sauvegarder rapport + proposer ticketing → Étape 5
7. Créer tickets sur confirmation Victor → Étape 5 (fin)
