---
name: recapsession
description: Créer un recap de la session de travail courante et proposer les capitalisations (ADR/Skills) si applicable. Utiliser quand l'utilisateur dit "recap session", "on s'arrête", "c'est bon pour aujourd'hui", "je coupe" ou via /recapsession.
---

# Skill : Recap de session + Capitalisation

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## À quoi ça sert

Un recap crée une trace persistante de ce qui a été accompli, quelles décisions ont été prises, et ce qui bloque pour demain. C'est le seul endroit où Claude documente ce qu'il a **vu**, pas ce que l'utilisateur a **changé** (c'est le job de git).

## Déclenchement

- l'utilisateur dit "recap session", "on s'arrête", "c'est bon pour aujourd'hui", "je coupe"
- Commande `/recapsession`

## Étape 1 — Identifier le contexte

1. Récupérer l'heure locale exacte via bash :
   ```bash
   date +%H:%M
   ```
   Utiliser cette heure dans le titre de section. Ne jamais inventer une heure.
2. Toutes les sessions s'écrivent dans `99 - Claude Code/Sessions/YYYY-MM-DD.md`, quel que soit le projet.
3. Si une note session du jour existe déjà → ajouter une nouvelle section `## Session [HH:MM]` plutôt que d'écraser.

## Étape 2 — Construire le recap

Résumer la session en couvrant ces 4 sections :

### Ce qui a été fait
Liste concise des tâches accomplies, décisions prises.

### Fichiers discutés ou consultés
Fichiers abordés pendant la session (pas une vérité git — Claude ne voit pas le diff de l'utilisateur).
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
- **Flow** : l'utilisateur avançait vite, peu de blocages, réponses directes
- **Concentré** : progressait bien mais avec effort
- **Bloqué** : difficultés techniques, plusieurs tentatives
- **Frustré** : signaux de frustration détectés (reformulations, corrections, "ça marche pas")
- **Fatigué** : réponses courtes, moins d'engagement, pauses fréquentes
- **Satisfait** : objectif atteint, bon avancement

Si aucun signal clair → noter "Neutre / pas de signal particulier".

## Étape 3 — Écrire la note

Écrire le recap dans `99 - Claude Code/Sessions/YYYY-MM-DD.md` en ajoutant une section :

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

## Étape 4 — Proposer les capitalisations (si applicable)

**Uniquement si des décisions techniques ou ADR ont été identifiées à l'Étape 2** :

### Proposition ADR
- **Si décision transverse** (affecte plusieurs projets ou domaine technique) → proposer ADR dans `99 - Claude Code/ADR/`
- **Si décision projet-spécifique** → proposer ADR dans `[PROJECTS_FOLDER]/[Projet]/claude-code/ADR/`
- **Ne pas créer l'ADR** — le proposer avec un titre et une description sommaire, attendre validation

### Proposition mise à jour INDEX
- Si ADR créée → mettre à jour l'INDEX du répertoire ADR correspondant (avec validation de l'utilisateur)
- Si skill créé/modifié → mettre à jour `99 - Claude Code/Skills/INDEX.md`

**Attendre validation avant d'exécuter**.

## Règles absolues

- Ne jamais taper `/clear` — c'est l'utilisateur qui le fait après avoir lu le recap
- Ne pas écraser une session existante du même jour — ajouter une section
- Les observations doivent être factuelles, pas flatteuses
- **Jamais de création autonome d'ADR ou modification d'INDEX sans validation explicite**
- Si une note session existe déjà et qu'on crée une nouvelle section, laisser les sections précédentes intactes
- Si MCP échoue → fallback sur Read + Write manuels sans bloquer le processus
