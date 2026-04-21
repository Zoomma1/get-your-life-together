---
name: my-world
description: Charger le contexte global de Victor AVANT de savoir sur quoi travailler. Utiliser en début de session quand Victor ne sait pas encore où donner de la tête, veut une vue d'ensemble de sa situation actuelle, ou veut calibrer ses priorités avant de choisir un sujet. Différent de /workon (qui charge un sujet précis) et de /today (qui planifie la journée avec calendrier et kanbans).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : /my-world

Synthétise l'état actuel de la vie/projets de Victor en **4 blocs** pour répondre à "où j'en suis ?" avant de décider sur quoi bosser.

## Étape 1 — Lire les daily notes récentes

Utiliser Glob sur `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\` pour lister tous les fichiers `.md` au format `YYYY-MM-DD.md` (ex : `2026-04-01.md`).
Trier lexicographiquement et prendre les **5 fichiers les plus récents**.
Lire dans l'ordre chronologique (du plus ancien au plus récent).

**Fallback** : si moins de 5 existent, lire celles disponibles sans signaler le manque.
**Extraction** : noter ce qui occupe Victor — mentions récurrentes, sujets revernis, disparitions, décisions implicites.

## Étape 2 — Lire la dernière session

Utiliser Glob sur `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` pour lister tous les fichiers `.md`.
Prendre le fichier à la **date la plus haute**.

**Extraction** : accomplissements, prochaine étape, momentum perçu.
**Fallback** : si aucune session, noter "aucun recap de session" dans la synthèse finale — utiliser daily notes seules.

## Étape 2bis — Mémoire longue (optionnel)

**Condition** : lancer seulement si Postgres et Ollama sont accessibles. Si la commande échoue → non-bloquant, continuer vers Étape 3, afficher : `⚠️ Mémoire longue indisponible (Postgres/Ollama down) — synthèse sur daily notes uniquement.`

Inférer 2 thèmes majeurs des daily notes lues (projets actifs, sujets récurrents). Pour chacun :
```bash
uv run ~/.claude/semantic_search.py "<thème>" --top-k 2 --since <date J-30>
```

**Usage dans la synthèse** — enrichir uniquement :
- **Bloc 1** : si un projet est mentionné depuis plusieurs semaines (pattern historique), le noter `[évolue]` avec la date de première apparition
- **Bloc 3** : si un shift est en réalité une récurrence ("déjà observé le YYYY-MM-DD"), le signaler explicitement

Ne pas créer de bloc supplémentaire. Ne pas surcharger la synthèse — max 1-2 enrichissements historiques.

---

## Étape 3 — Synthétiser en 4 blocs

À partir des daily notes + session (si existe), construire une synthèse structurée.
Limiter à **3-5 items par bloc** — prioriser par importance/fréquence.
**Règle stricte** : ne jamais inventer d'infos absentes des fichiers lus. Si un bloc est vide, le déclarer explicitement.

### Bloc 1 — Priorités actives

Ce sur quoi Victor travaille **réellement** en ce moment (tickets WIP, actions cochées, sujets récurrents dans daily notes).
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

L'état **personnel** de Victor (distinct des priorités de travail).
Extraire des 2-3 dernières daily notes : niveau d'énergie, fatigue/momentum, contraintes logistiques (Brno, déplacements, exam), état émotionnel.

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
