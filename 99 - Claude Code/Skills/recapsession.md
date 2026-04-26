---
name: recapsession
description: Créer un recap de la session de travail courante et proposer les capitalisations (ADR/Skills) si applicable. Utiliser quand Victor dit "recap session", "on s'arrête", "c'est bon pour aujourd'hui", "je coupe" ou via /recapsession.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : Recap de session + Capitalisation

## À quoi ça sert

Un recap crée une trace persistante de ce qui a été accompli, quelles décisions ont été prises, et ce qui bloque pour demain. C'est le seul endroit où Claude documente ce qu'il a **vu**, pas ce que Victor a **changé** (c'est le job de git).

## Déclenchement

- Victor dit "recap session", "on s'arrête", "c'est bon pour aujourd'hui", "je coupe"
- Commande `/recapsession`

## Étape 1 — Identifier le contexte

1. Récupérer l'heure locale exacte via bash :
   ```bash
   date +%H:%M
   ```
   Utiliser cette heure dans le titre de section. Ne jamais inventer une heure.
2. **Date cible** : si `heure < 04:00` → date = veille, sinon date = aujourd'hui. Toutes les sessions s'écrivent dans `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[date cible].md`, quel que soit le projet.
3. Si une note session du jour existe déjà → ajouter une nouvelle section `## Session [HH:MM]` plutôt que d'écraser.

## Étape 2 — Construire le recap

Résumer la session en couvrant ces 4 sections :

### Ce qui a été fait
Liste concise des tâches accomplies, décisions prises.

### Fichiers discutés ou consultés
Fichiers abordés pendant la session (pas une vérité git — Claude ne voit pas le diff de Victor).
**Si aucun fichier n'a été consulté**, noter "Aucun — session de discussion/réflexion".

### Décisions techniques ou changements de direction
Si des décisions ont été notées, relever leurs caractéristiques :
- **Nature** : porte-elle sur plusieurs projets, un projet spécifique, ou un domaine technique ?
- **Scope** : affecte-t-elle le code, l'infrastructure, le workflow quotidien, les skills ?
**Si aucune décision notable**, noter "Aucune — session exploratoire".

### État à la fin
Ce qui reste, prochaine étape logique, commande de reprise si applicable.

### Observation de la session
Noter honnêtement selon ce qui s'est passé pendant la session, sans inventer :
- **Flow** : Victor avançait vite, peu de blocages, réponses directes
- **Concentré** : progressait bien mais avec effort
- **Bloqué** : difficultés techniques, plusieurs tentatives
- **Frustré** : signaux de frustration détectés (reformulations, corrections, "ça marche pas")
- **Fatigué** : réponses courtes, moins d'engagement, pauses fréquentes
- **Satisfait** : objectif atteint, bon avancement

Si aucun signal clair → noter "Neutre / pas de signal particulier".

## Étape 3 — Écrire la note

Écrire le recap dans `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/[date cible].md` en ajoutant une section.

Titre de section selon le contexte :
- Heure normale : `## Session [HH:MM] — [titre court]`
- Après minuit : `## Session [HH:MM] 🌙 (après minuit) — [titre court]`

```markdown
## Session [HH:MM] — [titre court]

### ✅ Accompli
- ...
- ...

### 🔧 Fichiers discutés / consultés
- ...

### 🧠 Décisions prises
- ...

### ⏭️ Prochaine étape
...

### 🧭 Observation
[Flow / Concentré / Bloqué / Frustré / Fatigué / Satisfait] — [une phrase de contexte]
```

Utiliser Write ou MCP si dispo, fallback sur Read + Write manuel si MCP échoue.

## Étape 3.5 — Sync Postgres

Après l'écriture du fichier `.md`, lancer :

```bash
uv run ~/.claude/ingest_sessions.py
```

**Non-bloquant** : si la commande échoue (Docker down, script absent, etc.), noter `[Postgres sync skippé]` dans la confirmation et continuer sans interrompre le recap. Ce step alimente la source `recap_md` dans Postgres, complémentaire aux JSONL bruts ingérés par `/friction-scan`.

## Étape 4 — Proposer les capitalisations (si applicable)

**Uniquement si des décisions techniques ou ADR ont été identifiées à l'Étape 2** :

### Proposition ADR
- **Si décision transverse** (affecte plusieurs projets ou domaine technique) → proposer ADR dans `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/ADR/`
- **Si décision projet-spécifique** → proposer ADR dans `{VAULT_PATH}/{PROJECTS_FOLDER}/[Projet]/claude-code/ADR/`
- **Ne pas créer l'ADR** — le proposer à Victor avec un titre et une description sommaire, attendre validation

### Proposition mise à jour INDEX
- Si ADR créée → mettre à jour l'INDEX du répertoire ADR correspondant (avec validation Victor)
- Si skill créé/modifié → mettre à jour `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/INDEX.md`

**Attendre validation avant d'exécuter**.

### Sauvegarde dans le fichier proposals (toujours)

Après la proposition interactive (que Victor valide ou non), écrire les proposals dans `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Sessions/proposals-YYYY-MM-DD.md` :

- Si le fichier n'existe pas → créer avec frontmatter `processed: false`
- Si le fichier existe → append avec `---` entre sessions
- Format :

```markdown
---
date: YYYY-MM-DD
processed: false
---

## Session [HH:MM]

### ADR à créer
- **ADR** : [Titre] — [Scope : transverse | projet X] — [Contexte en 1 phrase]

### Skills à mettre à jour
- **Skill** : [nom] — [Action : create | update] — [Contexte en 1 phrase]
```

Omettre la section ADR ou Skills si aucune dans cette catégorie. Cette sauvegarde garantit que `/closeday` trouvera les proposals même si la session a été recapitulée manuellement (et non via le hook).

## Étape 4.5 — Proposition notes Knowledge (si applicable)

**Uniquement si une synthèse substantielle a été produite pendant la session** (analyse, comparaison, décision documentée en profondeur, exploration d'un outil ou concept) :

Poser à Victor : *"Une synthèse produite dans cette session mérite-elle une note Knowledge ?"*

Si oui → proposer titre + dossier cible dans `03 - Knowledge/` :
```
→ [[nom-de-la-note]] — 03 - Knowledge/[sous-dossier]/
   Résumé en 1 ligne de ce qu'elle contiendrait
```

Ajouter la proposition dans le fichier `proposals-YYYY-MM-DD.md` (même mécanique que les proposals ADR, section `### Notes Knowledge à créer`).

**Ne pas créer la note sans validation Victor.** Si Victor refuse ou ne répond pas → skip silencieux.

## Règles absolues

- Ne jamais taper `/clear` — c'est Victor qui le fait après avoir lu le recap
- Ne pas écraser une session existante du même jour — ajouter une section
- Les observations doivent être factuelles, pas flatteuses
- **Jamais de création autonome d'ADR ou modification d'INDEX sans validation Victor**
- Si une note session existe déjà et qu'on crée une nouvelle section, laisser les sections précédentes intactes
- Si MCP échoue → fallback sur Read + Write manuels sans bloquer le processus
