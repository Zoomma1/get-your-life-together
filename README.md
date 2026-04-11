# Vault Claude Code

Un vault Obsidian prêt à l'emploi, piloté par Claude Code. Fournit un système de second cerveau avec journalisation quotidienne, gestion de projets, capitalisation des connaissances et analyse de structure — le tout via des skills (commandes) invoquées depuis Claude Code.

---

## Prérequis

- [Obsidian](https://obsidian.md) — pour visualiser et naviguer dans le vault
- [Claude Code](https://claude.ai/code) — CLI ou extension IDE (le moteur de tous les skills)
- [Node.js](https://nodejs.org) ≥ 18 — requis pour les hooks Claude Code

---

## Installation

```bash
# 1. Cloner le vault
git clone <repo-url> mon-vault
cd mon-vault

# 2. Ouvrir le vault dans Obsidian
#    File > Open Vault > sélectionner le dossier mon-vault/

# 3. Ouvrir Claude Code dans le dossier du vault
claude
```

Puis, dans Claude Code :

```
/setup
```

Le skill `/setup` configure automatiquement :
- Ton profil personnel (`[ME_FOLDER]/[NOM].md`)
- Le `CLAUDE.md` personnalisé
- Le fichier `99 - Claude Code/config/vault-settings.md` (noms de dossiers, format de date)
- Les hooks Claude Code (récap de session automatique, etc.)

**C'est la seule configuration nécessaire.** Tous les autres skills lisent `vault-settings.md` et s'adaptent à ta configuration.

---

## Structure du vault

```
vault/
├── [NOTES_FOLDER]/          ← journal quotidien (configurable via /setup)
├── [ME_FOLDER]/             ← notes personnelles, profil
├── [HOBBIES_FOLDER]/        ← projets hobby
├── [KNOWLEDGE_FOLDER]/      ← base de connaissances capitalisée
├── [PROJECTS_FOLDER]/       ← projets actifs (kanban, tickets, README)
├── 05 - Studies/             ← (optionnel) études
├── 06 - Work/               ← (optionnel) travail
├── [INBOX_FOLDER]/          ← capture temporaire
└── 99 - Claude Code/
    ├── Skills/
    ├── config/
    │   ├── vault-settings.md   ← tous les paramètres (dossiers + format date)
    │   └── digest-sources.md
    ├── ADR/
    ├── Sessions/
    ├── command-tracker.md
    └── MEMORY.md
```

---

## Skills disponibles

### Quotidien

| Skill | Description |
|-------|-------------|
| `/today` | Charge le contexte du jour — daily note, emails, projets actifs, commandes en retard |
| `/my-world` | Charge le contexte global — 5 dernières daily notes, sessions récentes, sans planification |
| `/closeday` | Ferme la journée — récap, transfert des tâches, mise à jour du kanban |
| `/closeyesterday` | Clôture la journée d'hier — quand `/closeday` n'a pas été lancé le soir |

### Hebdomadaire / Mensuel

| Skill | Description |
|-------|-------------|
| `/closeweek` | Bilan de la semaine depuis les daily notes et sessions |
| `/closemonth` | Bilan mensuel — projets, apprentissages, drift |

### Analyse du vault

| Skill | Description |
|-------|-------------|
| `/map` | Cartographie topologique — clusters, dead zones, ponts critiques |
| `/vault-link` | Propose des liens `[[]]` entre les notes (pair-programming) |
| `/emerge` | Détecte les clusters d'idées qui forment quelque chose de nouveau |
| `/drift` | Idées récurrentes non capitalisées sur les 15 derniers jours |
| `/harvestdeep` | Analyse complète du vault sur 30 jours — patterns, signaux, inbox |
| `/harvest` | Capitalisation rapide des 7 derniers jours |

### Connaissance

| Skill | Description |
|-------|-------------|
| `/process` | Transforme une ressource (lien, PDF, vidéo) en note Knowledge structurée |
| `/recall` | Cherche les 1-3 notes les plus pertinentes au contexte actuel |
| `/ghost` | Répond à une question dans ta voix, en s'appuyant sur le vault |
| `/trace` | Retrace l'évolution d'une idée dans le temps |
| `/compound` | Répond à une question stratégique à trois moments du vault |
| `/connect` | Trouve les bridges conceptuels entre deux domaines du vault |
| `/digest` | Agrège et résume des sources externes (RSS, web) |

### Projets

| Skill | Description |
|-------|-------------|
| `/workon` | Charge le contexte d'un ticket/feature et démarre une session de travail |
| `/create-ticket` | Crée un ticket (fichier note + insertion kanban) |
| `/specs` | Génère les specs d'un ticket |
| `/refine` | Challenge un ticket avant implémentation |

### Introspection

| Skill | Description |
|-------|-------------|
| `/stranger` | Portrait de l'auteur par un observateur extérieur — basé uniquement sur le vault |
| `/ideas` | Extrait des idées actionnables depuis les patterns du vault (30j) |

### Méta

| Skill | Description |
|-------|-------------|
| `/setup` | Configuration initiale du vault (profil, CLAUDE.md, hooks) |
| `/recapsession` | Écrit le récap de la session Claude Code en cours |
| `/resumelastsession` | Recharge le contexte de la dernière session |
| `/evaluateskills` | Évalue la qualité des skills — détecte les ambiguïtés et les lacunes |

---

## Workflow type

```
Matin         → /today         (contexte du jour)
En continu    → /workon        (focus sur un sujet)
              → /recall        (cherche dans le vault)
              → /create-ticket (capture une idée)
Soir          → /closeday      (ferme la journée)

Semaine
  Vendredi    → /closeweek
  Dimanche    → /drift         (idées récurrentes)
              → /vault-link    (relie les orphans)

Mois
  Fin de mois → /map           (état structurel)
              → /harvestdeep   (patterns 30j)
              → /closemonth
              → /stranger      (portrait extérieur)
```

---

## Configuration avancée

### Changer le format de date ou les dossiers du vault

Éditer `99 - Claude Code/config/vault-settings.md` :

```
date_format: YYYY-MM-DD
daily_notes_folder: 00 - Daily notes
personal_folder: 01 - Me
hobbies_folder: 02 - Hobbies
knowledge_folder: 03 - Knowledge
projects_folder: 04 - Projects
inbox_folder: 09 - Inbox
```

Tous les skills lisent ce fichier automatiquement.

### Ajouter des sources pour /digest

Éditer `99 - Claude Code/config/digest-sources.md` — ajouter les URLs RSS ou web à agréger.

### Suivi des skills

`99 - Claude Code/command-tracker.md` liste la dernière exécution de chaque skill. `/today` signale automatiquement les commandes en retard.

---

## Ajouter un projet

```
[PROJECTS_FOLDER]/
└── Mon Projet/
    ├── claude-code/
    │   └── README.md     ← contexte codebase pour Claude
    ├── Kanban.md         ← source de vérité des tickets
    └── Todos/            ← tickets individuels
```

Puis ajouter le projet dans `[PROJECTS_FOLDER]/INDEX.md` pour que `/today`, `/workon` et `/create-ticket` le détectent automatiquement.
