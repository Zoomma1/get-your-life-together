---
name: my-world
description: Charger le contexte global de l'utilisateur AVANT de savoir sur quoi travailler. Utiliser en début de session quand l'utilisateur ne sait pas encore où donner de la tête, veut une vue d'ensemble de sa situation actuelle, ou veut calibrer ses priorités avant de choisir un sujet. Différent de /workon (qui charge un sujet précis) et de /today (qui planifie la journée avec calendrier et kanbans).
---

# Skill : /my-world

Synthétise l'état actuel de la vie/projets de l'utilisateur en **4 blocs** pour répondre à "où j'en suis ?" avant de décider sur quoi bosser.

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Étape 1 — Lire les daily notes récentes

Utiliser Glob sur `[NOTES_FOLDER]/` pour lister tous les fichiers `.md` (nommés selon le format de date configuré).
Trier lexicographiquement et prendre les **5 fichiers les plus récents**.
Lire dans l'ordre chronologique (du plus ancien au plus récent).

**Fallback** : si moins de 5 existent, lire celles disponibles sans signaler le manque.
**Extraction** : noter ce qui occupe l'utilisateur — mentions récurrentes, sujets revernis, disparitions, décisions implicites.

## Étape 2 — Lire la dernière session

Utiliser Glob sur `99 - Claude Code/Sessions/` pour lister tous les fichiers `.md`.
Prendre le fichier à la **date la plus haute**.

**Extraction** : accomplissements, prochaine étape, momentum perçu.
**Fallback** : si aucune session, noter "aucun recap de session" dans la synthèse finale — utiliser daily notes seules.

## Étape 3 — Synthétiser en 4 blocs

À partir des daily notes + session (si existe), construire une synthèse structurée.
Limiter à **3-5 items par bloc** — prioriser par importance/fréquence.
**Règle stricte** : ne jamais inventer d'infos absentes des fichiers lus. Si un bloc est vide, le déclarer explicitement.

### Bloc 1 — Priorités actives

Ce sur quoi l'utilisateur travaille **réellement** en ce moment (tickets WIP, actions cochées, sujets récurrents dans daily notes).
Tri par fréquence (plus souvent = plus haut).
Marquer chaque priorité :
- `[solide]` — mentionné dans dernière session OU dernière daily note
- `[évolue]` — mentionné ≥2 fois dans les 5 jours
- `[hypothèse]` — rarement/indirectement mentionné

### Bloc 2 — Questions ouvertes

Décisions non prises, incertitudes, sujets mentionnés sans suite.
Chercher dans les daily notes : "je sais pas si", "à réfléchir", "pas sûr", tickets bloqués, abandons/reprises.
Tri par urgence (blockers avant "à terme").

### Bloc 3 — Shifts récents

Ce qui a **changé** depuis dernière session ou depuis début des 5 daily notes.
Chercher : changements de priorité, nouvelles mentions absentes de la session, disparitions de sujets récurrents, décisions prises.
Tri par ampleur (impacts visibles d'abord).

### Bloc 4 — Énergie / contexte perso

L'état **personnel** de l'utilisateur (distinct des priorités de travail).
Extraire des 2-3 dernières daily notes : niveau d'énergie, fatigue/momentum, contraintes logistiques (déplacements, exams, contexte), état émotionnel.

## Format de sortie

```
## Mon monde — [date du jour]

### 🎯 Priorités actives
- [Priorité 1] [solide/évolue/hypothèse]
- [Priorité 2] [solide/évolue/hypothèse]

### ❓ Questions ouvertes
- [Question ou incertitude 1]

### 🔄 Shifts récents
- [Ce qui a changé]

### ⚡ Énergie / contexte
- [État actuel en 1-2 phrases]

---
Sur quoi tu veux bosser ?
```

## Étape 4 — Présenter et fermer

Utiliser le format fourni ci-dessous. **Règles** :
- Ne pas proposer de plan d'action ni suggestions de tâches (rôle de `/today`)
- Ne pas charger kanbans projets ni inbox (hors scope)
- Terminer TOUJOURS par "Sur quoi tu veux bosser ?" sans enchaîner

## Étape finale — Mettre à jour le tracker

Mettre à jour `99 - Claude Code/command-tracker.md` :
- Ligne `/my-world` → remplacer la date par la date du jour au format `DATE_FORMAT`
