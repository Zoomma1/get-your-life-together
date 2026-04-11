---
name: setup
description: Configure un vault Claude Code from scratch — génère le profil personnel, le CLAUDE.md, installe les hooks et crée la structure 99 - Claude Code/.
---

**Configure un vault Claude Code from scratch** — génère le profil personnel, le CLAUDE.md, installe les hooks et crée la structure `99 - Claude Code/`.

**Invocation** : `/setup` — à lancer une seule fois lors de l'installation, ou relancer pour régénérer le CLAUDE.md sans écraser les notes existantes.

---

## Prérequis

- Obsidian installé avec le vault ouvert
- Claude Code installé (`claude` disponible en ligne de commande)
- Node.js installé (`node` disponible en ligne de commande)

---

## Étape 0 — Détection de l'environnement

Avant toute question, collecter silencieusement :

```bash
# Chemin absolu du vault (répertoire de travail courant de Claude Code)
pwd

# Chemin home Claude
# Windows : %USERPROFILE%\.claude
# Mac/Linux : ~/.claude

# OS
node -e "console.log(process.platform)"
```

Stocker :
- `VAULT_PATH` — chemin absolu du vault
- `CLAUDE_HOME` — chemin absolu vers `.claude` de l'utilisateur
- `OS_PLATFORM` — `win32` / `darwin` / `linux`

Si `VAULT_PATH` ne contient pas de dossier `99 - Claude Code/` → confirmer avec l'utilisateur : *"Je vais créer la structure dans `[VAULT_PATH]`. C'est bien le bon vault ?"*

---

## Étape 1 — Profil personnel (essay interactif)

Annoncer : *"Je vais te poser des questions en plusieurs rounds pour créer ton profil personnel. Ce fichier aidera Claude à te connaître et à personnaliser ses réponses. Pas de bonne ou mauvaise réponse — réponds aussi librement que tu veux."*

Utiliser ce prompt pour conduire l'interview :

---

Procède par rounds de questions. Commence large puis affine progressivement :
- Round 1 : qui je suis (identité, parcours, situation actuelle)
- Round 2 : ce que je fais (travail, projets, études)
- Round 3 : ce que j'aime (hobbies, passions, centres d'intérêt)
- Round 4 : comment je pense et travaille (méthodes, valeurs, façon de prendre des décisions)
- Round 5 : questions spécifiques basées sur ce que tu as appris des rounds précédents

Règles :
- Maximum 5 questions par round, posées toutes en même temps
- Attendre les réponses avant de passer au round suivant
- Les questions du round suivant doivent s'appuyer sur ce que la personne a dit, pas être génériques
- Aucune reformulation des réponses entre les rounds, aller directement aux questions suivantes
- Si 5 rounds ne suffisent pas, en ajouter librement
- À la fin, rédiger l'essay en français, à la troisième personne, structuré en sections thématiques, dense et factuel — pas lyrique

---

Une fois l'essay rédigé :
- Stocker le prénom/pseudo dans `NOM`
- **Demander validation** : *"Voici ton profil. Tu veux ajuster quelque chose avant que je l'enregistre ?"*
- Écrire l'essay dans `[ME_FOLDER]/{{NOM}}.md` uniquement après validation

---

## Étape 2 — Préférences Claude

Poser les questions suivantes **toutes en même temps** :

1. **Mode de travail** — Comment tu veux que Claude travaille avec toi ?
   - **(A) Pair — défaut** : Claude guide et explique, tu décides et agis. Claude ne fait rien sans ta demande explicite.
   - **(B) Autonome** : Claude implémente directement et résume ce qu'il a fait.

2. **Style de réponse** — Quel style tu préfères ?
   - **(A) Court et direct — défaut** : réponses concises, structurées (listes, tableaux), aller à l'essentiel.
   - **(B) Détaillé** : réponses complètes avec contexte et exemples.

3. **Langue** — Dans quelle langue tu veux que Claude te réponde ? (défaut : Français)

4. **Format de date des daily notes** — Quel format utilises-tu pour nommer tes daily notes ?
   - **(A) YYYY-MM-DD — défaut** : 2026-04-11.md (format ISO, recommandé)
   - **(B) DD-MM-YYYY** : 11-04-2026.md
   - **(C) MM-DD-YYYY** : 04-11-2026.md
   - **(D) Autre** : précise le format

5. **Dossier des daily notes** — Comment s'appelle ton dossier de daily notes ? (défaut : `00 - Daily notes`)

6. **Dossier personnel** — Comment s'appelle ton dossier de notes personnelles ? (défaut : `01 - Me`)

7. **Dossier hobbies** — Comment s'appelle ton dossier de hobbies/loisirs ? (défaut : `02 - Hobbies`)

8. **Dossier knowledge** — Comment s'appelle ta base de connaissances ? (défaut : `03 - Knowledge`)

9. **Dossier projets** — Comment s'appelle ton dossier de projets ? (défaut : `04 - Projects`)

10. **Dossier inbox** — Comment s'appelle ton dossier de capture temporaire ? (défaut : `09 - Inbox`)

11. **Sources digest** — Le skill `/digest` surveille des sources d'actualité pour toi chaque matin. Quelles sources tu veux suivre ? Exemples : tech (Hacker News, Dev.to), IA (Anthropic blog), finance, actu monde, design... Tu peux aussi dire "aucune pour l'instant".

Stocker les réponses dans `MODE_TRAVAIL`, `STYLE_REPONSE`, `LANGUE`, `DATE_FORMAT`, `DAILY_NOTES_FOLDER`, `PERSONAL_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`, `DIGEST_SOURCES`.

---

## Étape 3 — Génération des fichiers

### 3.1 — Structure `99 - Claude Code/`

Créer les dossiers suivants s'ils n'existent pas :

```
[VAULT_PATH]/99 - Claude Code/
  Skills/
  Sessions/
  config/
  memory/
  ADR/
```

Créer les fichiers suivants s'ils n'existent pas :

**`99 - Claude Code/MEMORY.md`** :
```markdown
# MEMORY.md — Index

<!-- Index des mémoires persistantes — généré et mis à jour automatiquement par Claude -->
```

**`99 - Claude Code/command-tracker.md`** :
```markdown
# Command Tracker

Mis à jour automatiquement par chaque skill après exécution.
Lu par `/today` pour détecter les commandes en retard.

| Commande     | Dernière exécution | Fréquence recommandée |
| ------------ | ------------------ | --------------------- |
| /harvest     | —                  | 7 jours               |
| /map         | —                  | 7 jours               |
| /link        | —                  | 7 jours               |
| /harvestdeep | —                  | 30 jours              |
| /drift       | —                  | 7 jours               |
| /emerge      | —                  | 15 jours              |
| /closeweek   | —                  | 7 jours               |
| /closemonth  | —                  | 30 jours              |
| /my-world    | —                  | 1 jour                |
| /stranger    | —                  | 30 jours              |
| /trace       | —                  | 30 jours              |
| /evaluateskills | —               | 30 jours              |
```

### 3.1b — Dossiers utilisateur

Pour chacun des dossiers suivants, **vérifier l'existence avant toute action** :

| Variable | Chemin à vérifier |
|----------|-------------------|
| `DAILY_NOTES_FOLDER` | `[VAULT_PATH]/[DAILY_NOTES_FOLDER]/` |
| `PERSONAL_FOLDER` | `[VAULT_PATH]/[PERSONAL_FOLDER]/` |
| `HOBBIES_FOLDER` | `[VAULT_PATH]/[HOBBIES_FOLDER]/` |
| `KNOWLEDGE_FOLDER` | `[VAULT_PATH]/[KNOWLEDGE_FOLDER]/` |
| `PROJECTS_FOLDER` | `[VAULT_PATH]/[PROJECTS_FOLDER]/` |
| `INBOX_FOLDER` | `[VAULT_PATH]/[INBOX_FOLDER]/tickets/` |

Règle : **si le dossier existe → ne pas y toucher, l'utiliser tel quel**. Si absent → le créer.

Pour `[PROJECTS_FOLDER]` uniquement : si le dossier est créé (n'existait pas), créer aussi `[PROJECTS_FOLDER]/INDEX.md` :

```markdown
# Projects Index

Lu automatiquement par `/today`, `/workon`, `/create-ticket`, `/drift`, `/harvestdeep`.

## Format

Ajouter une ligne par projet actif :

| Projet | Chemin | Kanban |
|--------|--------|--------|
| Exemple | `[PROJECTS_FOLDER]/Exemple/` | `[PROJECTS_FOLDER]/Exemple/Kanban.md` |

## Projets actifs

<!-- Ajouter ici les projets lors du setup ou manuellement -->
```

Si `[PROJECTS_FOLDER]/INDEX.md` existait déjà → ne pas l'écraser.

---

### 3.1d — vault-settings.md

Créer `99 - Claude Code/config/vault-settings.md` :

```markdown
# Vault Settings

date_format: [DATE_FORMAT]
daily_notes_folder: [DAILY_NOTES_FOLDER]
personal_folder: [PERSONAL_FOLDER]
hobbies_folder: [HOBBIES_FOLDER]
knowledge_folder: [KNOWLEDGE_FOLDER]
projects_folder: [PROJECTS_FOLDER]
inbox_folder: [INBOX_FOLDER]
```

Où :
- `[DATE_FORMAT]` → format choisi en Étape 2 (ex: `YYYY-MM-DD`, `DD-MM-YYYY`)
- `[DAILY_NOTES_FOLDER]` → dossier choisi (ex: `00 - Daily notes`)

### 3.2 — CLAUDE.md

Lire `99 - Claude Code/Templates/CLAUDE.md.template`.

Interpoler les placeholders :
- `{{NOM}}` → valeur de `NOM`
- `{{LANGUE}}` → valeur de `LANGUE`
- `{{PERSONAL_FOLDER}}` → valeur de `PERSONAL_FOLDER`
- `{{MODE_TRAVAIL}}` → bloc correspondant à l'option choisie (A ou B) :

  **Option A (pair)** :
  ```
  Claude agit comme **guide et pair**, pas assistant autonome.
  - Expliquer l'approche, laisser {{NOM}} décider et agir
  - Proposer des pistes, pas des solutions toutes faites
  - Poser des questions si plusieurs approches existent

  **Quand {{NOM}} dit "fais-le"** : agir directement + résumé de ce qui a été fait et pourquoi.
  **Ne jamais faire sans demande explicite** : créer des fichiers non discutés, enchaîner des tâches sans validation.
  ```

  **Option B (autonome)** :
  ```
  Claude agit de façon **autonome et directe**.
  - Implémenter sans attendre validation à chaque étape
  - Résumer ce qui a été fait en fin de tâche
  - Demander uniquement si une décision structurante se présente
  ```

- `{{STYLE_REPONSE}}` → bloc correspondant :

  **Option A (court)** :
  ```
  Réponses courtes et directes — aller à l'essentiel, pas de phrases de remplissage.
  Format structuré : tableaux, listes, blocs de code quand pertinent.
  Expliquer le pourquoi, pas seulement le comment.
  ```

  **Option B (détaillé)** :
  ```
  Réponses détaillées avec contexte complet et exemples.
  Format prose avec structure claire.
  ```

Écrire le résultat dans `[CLAUDE_HOME]/CLAUDE.md`.

**Si le fichier existe déjà** → demander confirmation : *"Un CLAUDE.md existe déjà. Je le remplace ?"*

### 3.3 — vault-config.json

Créer `[CLAUDE_HOME]/vault-config.json` :

```json
{
  "vaultPath": "[VAULT_PATH]",
  "userName": "[NOM]"
}
```

### 3.4 — digest-sources.md

Si `DIGEST_SOURCES` n'est pas "aucune" → créer `99 - Claude Code/config/digest-sources.md` :

```markdown
# Sources Digest

Sources surveillées par /digest chaque matin.

## Sources actives

[liste des sources choisies]

## Format attendu
- Hacker News : top stories du jour
- Anthropic blog : nouveaux articles
- Dev.to : articles tendance
- Autres : adapter selon la source
```

---

## Étape 4 — Installation des hooks

Afficher la commande et demander confirmation avant chaque action.

### 4.1 — Copier les hooks

```bash
# Créer le dossier hooks si nécessaire
mkdir -p [CLAUDE_HOME]/hooks

# Copier les 3 hooks depuis 99 - Claude Code/
cp "[VAULT_PATH]/99 - Claude Code/hooks/recap-session.js" "[CLAUDE_HOME]/hooks/"
cp "[VAULT_PATH]/99 - Claude Code/hooks/retention-purge.js" "[CLAUDE_HOME]/hooks/"
cp "[VAULT_PATH]/99 - Claude Code/hooks/secret-guard.js" "[CLAUDE_HOME]/hooks/"
```

### 4.2 — settings.json

Lire `99 - Claude Code/Templates/settings.json.template`.

Interpoler :
- `{{VAULT_PATH}}` → chemin absolu du vault
- `{{CLAUDE_HOME}}` → chemin absolu vers `.claude`

**Si `[CLAUDE_HOME]/settings.json` existe déjà** → merger uniquement les sections `hooks` et `permissions.allow` sans écraser les autres paramètres existants. Demander confirmation avant.

**Si absent** → écrire le template interpolé directement.

### 4.3 — Symlink CLAUDE.md

Créer un symlink pour que `99 - Claude Code/CLAUDE.md` pointe vers `[CLAUDE_HOME]/CLAUDE.md` :

**Windows** :
```bash
cmd /c mklink "[VAULT_PATH]\99 - Claude Code\CLAUDE.md" "[CLAUDE_HOME]\CLAUDE.md"
```

**Mac/Linux** :
```bash
ln -sf "[CLAUDE_HOME]/CLAUDE.md" "[VAULT_PATH]/99 - Claude Code/CLAUDE.md"
```

Si le fichier `99 - Claude Code/CLAUDE.md` existe déjà (symlink ou fichier) → le supprimer avant de créer le symlink.

---

## Étape 5 — Récapitulatif et prochaines étapes

Afficher un récapitulatif de ce qui a été créé :

```
✅ Profil personnel      [ME_FOLDER]/[NOM].md
✅ CLAUDE.md             ~/.claude/CLAUDE.md (+ symlink vault)
✅ vault-config.json     ~/.claude/vault-config.json
✅ Hooks installés       recap-session.js, retention-purge.js, secret-guard.js
✅ Structure vault       99 - Claude Code/ (Skills, Sessions, config, memory, ADR)
✅ Command tracker       99 - Claude Code/command-tracker.md
[si digest] ✅ Sources digest  99 - Claude Code/config/digest-sources.md
✅ Stubs skills         ~/.claude/commands/ ([N] fichiers)
```


### 5.1 — Créer les stubs pour tous les skills

Pour chaque fichier `.md` dans `[VAULT_PATH]/99 - Claude Code/Skills/` (sauf `setup.md` lui-même et `INDEX.md`) :

Créer `[CLAUDE_HOME]/commands/[nom-du-skill].md` avec ce contenu :
```
Lis le skill [nom] dans `[VAULT_PATH]/99 - Claude Code/Skills/[nom].md` et exécute-le.
```

Exemples générés :
- `~/.claude/commands/today.md` → `Lis le skill today dans `[VAULT_PATH]/99 - Claude Code/Skills/today.md` et exécute-le.`
- `~/.claude/commands/harvest.md` → `Lis le skill vault-harvest dans `[VAULT_PATH]/99 - Claude Code/Skills/vault-harvest.md` et exécute-le.`

**Note** : si un stub existe déjà pour un skill, ne pas l'écraser — passer au suivant.

Afficher le nombre de stubs créés à la fin.

Puis indiquer les prochaines étapes :
1. Installer Obsidian si ce n'est pas fait — ouvrir ce dossier comme vault
2. Lancer `/today` pour commencer

---

## Règles absolues

- **Ne jamais écraser** `[ME_FOLDER]/[NOM].md` si le fichier existe — demander confirmation
- **Ne jamais écraser** `settings.json` sans merger — toujours préserver les paramètres existants
- **Toujours demander confirmation** avant chaque opération sur `~/.claude/` (hors vault)
- **Idempotent** : relancer `/setup` régénère CLAUDE.md et vault-config.json, ne touche pas aux notes existantes
