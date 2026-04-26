---
name: closemonth
description: Bilan mensuel — progression des projets, tendances énergie/score, patterns comportementaux stabilisés (≥ 3 occurrences, ex : "procrastination sur décisions d'architecture"), objectifs du mois suivant et mise à jour proposée de {USER_NAME}.md si des patterns se confirment. Utiliser quand Victor dit "closemonth", "bilan du mois", "on boucle le mois" ou via /closemonth.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : Close Month

## Déclenchement

- Victor dit "closemonth", "bilan du mois", "on boucle le mois"
- Commande `/closemonth [YYYY-MM]` (argument optionnel)
- Rappel depuis `/today` : si on est le 1er du mois et que `/closemonth` dans `command-tracker.md` date de plus de 30 jours

## Étape 1 — Déterminer le mois cible et vérifier les retards

**Algorithme de sélection (ordre de priorité) :**
1. Si `YYYY-MM` passé en argument → utiliser cet argument (cas : rattrapage manuel ou clôture rétroactive)
2. Sinon, si on est le **1er du mois** → boucler le **mois précédent** (cas : clôture automatique le 1er)
3. Sinon → boucler le **mois courant** (cas : clôture volontaire en cours de mois)

Exemple : Si aujourd'hui = 2026-04-01 et pas d'argument → boucler mars (2026-03). Si `/closemonth 2026-02` en argument → boucler février même si on est en avril.

**Détecter les mois manquants :**
1. Lire `command-tracker.md` et chercher la dernière occurrence de `/closemonth`
2. Si absent ou date > 30 jours avant aujourd'hui → des mois manquent
3. Énumérer tous les mois non couverts entre le dernier `/closemonth` et le mois cible (inclus) dans l'ordre chronologique
4. **Demander à Victor** : "Mois manquants détectés : [liste]. Procéder par ordre chronologique (Y/N) ?" — ne pas continuer sans accord explicite
5. Si accord : traiter le plus ancien d'abord. Après fin du mois courant, relancer Étape 1 pour le mois suivant (sauf si Victor dit non)

**Si `command-tracker.md` absent :** assumer premier run, déterminer mois cible et continuer normalement.

## Étape 2 — Collecter le matériau

**Ordre de recherche (cascade) :**

1. **Chercher les weeklies du mois cible** (source prioritaire) :
   - Lire `00 - Daily notes/Weekly/YYYY-W{nn}.md`
   - Identifier quelles semaines W{nn} chevauchent le mois cible
   - **Si ≥ 1 weekly trouvée et non vide** → utiliser CELLES-CI (arrêter la recherche)

2. **Fallback : chercher les dailies du mois cible** (source secondaire) :
   - Lire `00 - Daily notes/YYYY-MM-*.md` (tous les jours du mois)
   - **Si ≥ 1 daily trouvée et non vide** → utiliser CELLES-CI (arrêter la recherche)

3. **Aucune source trouvée** :
   - Signaler à Victor : "Aucune weekly ni daily pour [YYYY-MM]. Options : (1) rédiger depuis souvenirs (disclaimer: non documenté), (2) annuler et relancer en fin de mois, (3) chercher dans répertoire alternatif."
   - **Attendre la décision explicite de Victor** — ne jamais halluciner de bilan sans source
   - **Edge case : si Victor choisit (1)**, ajouter un bloc "⚠️ Non documenté" en début du bilan indiquant que le contenu vient de la mémoire, pas des weeklies/dailies

## Étape 3 — Construire le bilan

Extraire des sources (Étape 2) et remplir ce template :

```markdown
# Bilan — [Mois YYYY]

## 📊 Projets
### [Nom du projet]
- Avancement : [état en fin de mois]
- Points notables : [décisions, jalons, blocages, commits clés si applicables]

### [Nom du projet] (répéter pour chaque projet)
- ...

### (Si 0 projets ce mois)
- Note : Aucun projet actif ce mois

## 🔋 Énergie & score
- Moyenne énergie : [X]/5 | Min : [X] | Max : [X]
- Moyenne score : [X]/5
- Ressentis représentatifs : [2-3 exemples tirés des daily notes — ex: *"difficile le matin, bien le soir (J-12)"*, *"fluide mais court (J-24)"*, *"épuisant mais satisfait (J-28)"*]
- Observation : [si tendance notable — ex: "Énergie stable semaines 1-2, baisse semaines 3-4 (surcharge ISEP). Score en remontée fin mois."]

## 🔁 Patterns comportementaux
- Patterns détectés (≥ 3 occurrences) :
  - [Pattern 1 : description courte + count]
  - [Pattern 2 : ...]
- (Si 0 pattern ≥ 3 : "Aucun pattern comportemental répété ≥ 3 fois ce mois.")

## 🎯 Objectifs du mois suivant
- [Intention 1 : action concrète issue du bilan]
- [Intention 2 : ...]
- [1-3 intentions minimum]
```

**Règle d'extraction :** Un pattern ne figure dans cette section que s'il est mentionné **≥ 3 fois distinctes** dans les sources. Sinon → le noter mais l'omettre de la synthèse.

## Étape 4 — Post-mortem & Propositions

### A. Patterns comportementaux → mise à jour {USER_NAME}.md

Si patterns détectés ≥ 3 fois :
1. Présenter à Victor le pattern exact (count + citations sources)
2. Proposer une modification **ciblée et minimale** de `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\{USER_NAME}.md`, section "Patterns observés"
3. **Attendre la validation explicite de Victor** avant modification
4. Exemples valides :
   - "Blocage paralysie sur décisions d'architecture sans pair review (détecté 4x) → ajouter : 'Demander review avant dev sur décisions structurantes' ?"
   - "Pattern de procrastination fin de semaine (5x) → ajouter : 'Limiter les tâches creuses après 17h ?' "

Si 0 pattern ≥ 3 : ne pas toucher {USER_NAME}.md, noter "Aucune modification proposée."

### B. Skills analytiques suggérés

Basé sur ce qui ressort du bilan du mois, proposer les skills pertinents comme suggestions optionnelles (Victor décide) :

- **Toujours proposer** : `/trace [idée clé du mois]` — pour retracer l'évolution d'un concept ou d'une décision importante qui a marqué le mois
- **Si des idées récurrentes non actionnées ont été identifiées** : `/ideas` — pour transformer les patterns du mois en liste d'actions concrètes
- **Si des connexions entre deux domaines ont émergé** : `/connect [domaine A] [domaine B]`
- **Si un changement significatif de vie, carrière ou projet sur le mois** : `/compound [question stratégique]` — pour mesurer comment le vault a changé la réponse
- **Si `/stranger` date de plus de 30 jours** (vérifier `command-tracker.md`) : `/stranger` — portrait extérieur pour recalibrer en fin de mois

Présenter sous cette forme :
```
💡 Skills à envisager ce mois :
- /trace [sujet] — [raison en 1 phrase]
- /ideas — [ce qui justifie le lancement]
[...selon contexte]
```

## Étape 5 — Écrire et finaliser

1. **Créer** le bilan mensuel :
   - Dossier `00 - Daily notes/Monthly/` (créer s'il n'existe pas)
   - Fichier : `YYYY-MM.md` avec contenu de Étape 3
2. **Mettre à jour** `{VAULT_PATH}\command-tracker.md` :
   - Nouvelle ligne : `/closemonth` date du jour (format : YYYY-MM-DD HH:MM)
3. **Si mois en retard restants** (Étape 1) :
   - Demander à Victor : "Mois suivant (YYYY-MM) à boucler aussi ? (Y/N)"
   - Si oui → relancer Étape 1 sur le mois suivant
   - Si non → arrêter

## Règles

- **Un seul mois à la fois** — jamais boucler 2 mois en parallèle
- **Aucune source** = demande explicite Victor avant fallback (pas de hallucination)
- **Patterns < 3 fois** = les ignorer, noter "aucun pattern stabilisé"
- **0 projets ce mois** = acceptable, noter dans Projets
- **Double clôture** : si mois déjà clôturé, demander à Victor "Ce mois est déjà clôturé. Réécrire ? (Y/N)"
- **Projet arrêté en cours de mois** : inclure dans Projets comme "Statut : arrêté à [semaine N]"
- **Validation Victor obligatoire pour** :
  - Mois en retard (Étape 1, point 4)
  - Modification {USER_NAME}.md (Étape 4A)
  - Refus de valider patterns → omettre de {USER_NAME}.md, noter "Non validés, aucune modification"
  - Relance sur mois suivant (Étape 5, point 3)
