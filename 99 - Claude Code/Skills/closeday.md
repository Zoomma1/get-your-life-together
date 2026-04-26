---
name: closeday
description: Bilan de fin de journée — synthétiser sessions, mettre à jour daily note avec patterns observés, détecter WIP Warhammer en cours, vérifier essay-check overdue. Déclencher quand Victor dit l'une de ces formules : "closeday", "j'arrête", "je finis", "c'est fini", "fin de session", "bonne nuit", "bonne journée", "j'arrête pour aujourd'hui", "ça suffit", "journée finie", "c'est bon je m'arrête", "c'est terminé" ou via /closeday.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : Close Day

## Déclenchement

Victor dit l'une de ces formules (ou équivalente) :
- "closeday"
- "j'arrête", "je finis", "c'est fini"
- "bonne nuit", "bonne journée"
- "fin de session", "je m'arrête"

Ou : commande `/closeday`

## Étape 1 — Collecter les données du jour

**Date cible** : calculer avant toute lecture. Si `heure < 04:00` → date = veille, sinon date = aujourd'hui. Utiliser cette date pour tous les chemins ci-dessous.

Lire en parallèle (avec fallbacks) :

1. **Daily note du jour** : `00 - Daily notes/[date cible].md`
   - Si absent → créer un fichier minimal (frontmatter vide + titre du jour), continuer
   - Format : `---\n---\n# YYYY-MM-DD\n`
   
2. **Sessions du jour** : `99 - Claude Code/Sessions/YYYY-MM-DD.md`
   - Si absent → synthétiser depuis la daily note, noter `[Synthèse approx — à valider par Victor]`
   - Si plusieurs sessions → énumérer chacune avec heure de début (ex: `09:30 — Projet X`)
   - Si fichier trop long (erreur token) → lire par tranches successives (limit: 200, offset: 0 → 200 → 400 → …) jusqu'à fin complète. Ne jamais construire bilan sur lecture partielle — si truncation, noter `[Lecture complète par tranches — synthèse validée]`.
   
3. **Hobby Kanban** : `02 - Hobbies/Hobby Kanban.md`
   - Si absent → skip Étape 1.5 silencieusement
   - Vérifier si colonne `## WIP` contient des tickets (items non vides)

4. **Recul hebdo — 3 daily notes précédentes** : `00 - Daily notes/YYYY-MM-DD.md` pour J-1, J-2, J-3
   - Lecture ciblée des sections `## 🌙 Bilan du jour`, `## 💡 Idées & Réflexions`, frontmatter (`energy`, `score`, `ressenti`)
   - Si une daily note est absente → skip silencieusement, continuer avec celles présentes
   - Objectif : détecter les patterns inter-jours (énergie qui monte/descend, sujets qui reviennent, contradictions avec aujourd'hui, moments forts répétés ou isolés)
   - Ces données nourrissent l'étape 2.2 (questions ouvertes sourcées) et l'étape 2.3 (narratif de l'État général)

## Étape 1.5 — Suivi Warhammer (optionnel — skip si Hobby Kanban absent)

**Condition préalable** : Hobby Kanban trouvé.

**Si `## WIP` n'est pas vide** → skip (déjà peuplé, pas besoin de relancer).

**Si `## WIP` est vide** → Poser : "Tu as des figurines en cours ? (Warhammer, peinture, etc.)"

Accepter : "oui", "ok", ou nom concret. Refuser : "non", silence, timeout (30s) → continuer sans écrire.
- Si accepté → ajouter au WIP
- Sinon → continuer sans écrire

## Étape 2 — Construire le bilan

### 2.1 — Agrégation et regroupement narratif

Depuis la daily note et `Sessions/YYYY-MM-DD.md`, extraire et **regrouper par chantier** (pas par ordre chronologique plat) :

- **Regroupement par chantier/thème** : une feature, un projet, une session de raffinement, un chantier perso = un bullet unique. Ne pas éclater par session si plusieurs sessions portent sur le même sujet.
- **Contexte d'exécution obligatoire par bullet** : pour chaque chantier, inclure ce qui rend le travail concret — stack touchée, fichiers modifiés, tests écrits, ADR créé, décisions prises, personnes impliquées. Pas de bullet nu style "Bug 429 fail to fetch" — préférer "Bug 429 + fail to fetch saisie armée/projet — retry exponentiel côté client, debug du timing Prisma, 3 tests ajoutés".
- **Moments forts narratifs** : relever explicitement les événements marquants de la journée (bonne surprise, frustration, moment de joie, interaction notable, crise) — ces moments vont dans `État général` à l'étape 2.3, pas dans la liste des bullets.
- **Énergie et états** : observations de flow, fatigue, blocages, écarts notables (ex: énergie basse mais output élevé) — pour l'État général.
- **Patterns inter-jours** : en croisant avec les 3 daily notes précédentes (chargées à l'étape 1, point 4), relever ce qui se répète, ce qui contredit, ce qui émerge comme constante. Ces observations nourrissent les questions ouvertes à l'étape 2.2.
- **Vérification déjà-vu sémantique** (optionnel) : pour chaque pattern identifié ci-dessus, requête :
  ```bash
  uv run ~/.claude/semantic_search.py "<pattern en 3-5 mots>" --top-k 2 --type accompli
  ```
  Si similarity ≥ 0.45 sur une session antérieure → le pattern est un **déjà-vu**. Pour chaque déjà-vu :
  1. **Date de première apparition** : extraire la date de la session trouvée
  2. **Ce qui en a découlé** : relancer avec `--type prochaines_etapes --since <date>` pour voir les suites planifiées après ce pattern
  3. **Lien causal** : si les suites existent, construire le lien "pattern → ce qui s'est passé après"
  Ces informations enrichissent la section `Patterns détectés` dans la note (voir template ci-dessous).
  Si Postgres/Ollama inaccessible → non-bloquant, afficher : `⚠️ Vérification déjà-vu indisponible (Postgres/Ollama down) — patterns sourçés sur daily notes uniquement.`
- **Idées/Décisions** : relever mais **traiter en Étape 4, pas ici**.

### 2.2 — Présentation et validation du bilan

Présenter à Victor **la version narrative complète** — pas une version résumée. Victor doit voir dans le chat ce qui sera écrit, pas une preview plate :

> Voilà ce que j'ai vu sur la journée :
>
> **Ce qui a été fait** (regroupé par chantier, contexte inclus) :
> - [chantier 1 — contexte d'exécution : stack, fichiers, tests, ADR, décisions]
> - [chantier 2 — contexte d'exécution]
> - …
>
> **État général** (narratif, 2-4 phrases) : [énergie ressentie, flow ou friction, moment fort de la journée, lien éventuel avec la fatigue/motivation — raconter la journée, pas la résumer]
>
> **Patterns observés** (croisés avec les 3 jours précédents) :
> - [pattern récurrent ou contradiction détectée, sourcé "déjà vu J-1/J-2" ou "nouveau vs hier"]
> - [écart énergie/output, ou motivation qui compense la fatigue, etc.]
>
> **2 questions pour creuser** (sourcées sur le recul hebdo, pas génériques) :
> 1. [Question reliée à un pattern inter-jours précis, ex: "Le pattern X est revenu 3 fois cette semaine — c'est une constante ou lié au contexte Y ?"]
> 2. [Question sur ce que les notes ne capturent pas bien, ou contradiction observée]

**Règles pour les questions ouvertes** :
- **Toujours 1 à 2 questions**, jamais zéro (c'est ça qui fait la rétrospective vivante)
- **Sourcées** : chaque question doit s'appuyer sur quelque chose de concret vu dans les 3 dernières dailies ou dans les thinking sessions du jour
- **Pas génériques** : éviter "comment tu te sens ?", "t'as appris quoi ?" — préférer des questions précises sur des patterns ou contradictions détectées

**Si `## 💡 Idées & Réflexions` existe et remplie** → présenter la version narrative complète + questions ouvertes, puis demander : "C'est bon, je le note ?"
- Accepter : oui, ok, d'accord, ouais. Refuser : non, nope, silence/timeout (45s) → continuer sans modifier.

**Sinon (section vide ou absente)** → présenter ce qui a pu être reconstruit + demander :
> (1) Qu'est-ce que t'as vraiment avancé ? (2) Un blocage ou observation ? (3) [question sourcée sur le recul hebdo si patterns détectés]

Accepter réponses (libre). Timeout (45s) ou pas de réponse → inclure données existantes (sessions, mood, recul hebdo) + note "[Quick Wrap skipped — timeout]".

### 2.3 — Écriture du bilan

**Chercher si `## 🌙 Bilan du jour` existe déjà** → Si oui, passer à Étape 3 (bilan déjà écrit). Si non, ajouter en bas de la daily note :

```markdown
## 🌙 Bilan du jour

### Ce qui a été fait
- **[Chantier 1 — titre narratif]** — contexte d'exécution complet : stack touchée, fichiers modifiés, tests écrits, ADR créé, décisions prises, résultats concrets
- **[Chantier 2 — titre narratif]** — contexte d'exécution complet
- [...]

### Énergie & état
- Énergie du jour : [valeur frontmatter ou "non renseignée"]
- Score final : [score]/5 — *[ressenti]*
- **État général** : [NARRATIF 2-4 phrases — raconter la journée, pas la résumer. Inclure : le ton de la journée (atypique, dense, calme, difficile...), l'écart éventuel énergie/output, les flow moments, le ou les moments forts relevés (bonne nouvelle, frustration, interaction marquante, crise, joie). Pas de bullets ici — du texte qui raconte.]

### Patterns détectés
[Croiser avec les 3 daily notes précédentes. Intégrer 2-4 observations structurées :
- Patterns inter-jours (récurrences, contradictions, écarts énergie/output)
- Dynamiques comportementales émergentes sourcées sur des faits concrets
- Si `## 💡 Idées & Réflexions` est remplie : ne PAS juste écrire "Voir section Réflexions" — faire du **méta** par-dessus, relever ce qui émerge en croisant plusieurs thinking sessions, pas juste les lister
- Pour les patterns identifiés comme déjà-vu (vérification sémantique Étape 2.1) : format obligatoire :
  `→ Déjà observé le YYYY-MM-DD — suite : [ce qui en a découlé, en 1 phrase]`]

### Demain
- Prochaine étape prioritaire : [depuis les sessions]
- À ne pas oublier : [mentionnés pendant la journée]
```

**Règle critique sur la qualité narrative** : ce bilan est la sortie principale du skill. Les étapes 4 (idées à filer), 5 (propositions de capitalisation) et 6 (essay-check) sont **secondaires** et ne doivent **en aucun cas** compromettre la richesse du bilan. Si le modèle se sent tiré entre "bien écrire le bilan" et "anticiper les capitalisations latérales", **priorité absolue au bilan narratif**.

## Étape 3 — Score, ressenti et frontmatter

**Score** — Vérifier si `score:` existe dans frontmatter (valeur numérique 1-5).

**Si présent et valide** → passer au ressenti.

**Si absent ou invalide** :
- Poser : "Note ta journée sur 5 ?"
- Accepter : nombres 1-5. Refuser : non-nombre, silence/timeout (30s) → skip sans score.
- Si obtenu → écrire dans le frontmatter : `score: [valeur]`

(Ce score conditionne l'essay-check hebdo à l'Étape 6.)

**Ressenti** — Toujours demander, que le score soit déjà présent ou non :
- Poser : "Un mot sur la journée ?" (ex: *"difficile le matin, bonne relance l'aprem"*, *"fluide tout au long"*, *"épuisant mais satisfait"*)
- Accepter : texte libre, 1 ligne max. Timeout (30s) → skip sans ressenti.
- Si réponse → écrire dans le frontmatter : `ressenti: "[texte]"`

## Étape 4 — Idées et décisions : filing suggestions

Depuis les sessions et la daily note, **relever toutes les idées/décisions mentionnées** : nouveaux insights, changements de direction, tâches à tracker, tech à explorer, etc.

**Si aucune trouvée** → skip silencieusement, aller à Étape 5.

**Si trouvées** : proposer une destination pour chacune :

```
[Idée] → [Destination : 03 - Knowledge/ | 04 - Projects/… | 01 - Me/{USER_NAME}.md | kanban projet | Hobby Kanban | command-tracker]
```

Présenter :

> Idées/décisions du jour :
> - [item 1] → [destination]
> - [item 2] → [destination]
> 
> Tu veux en filer certaines ?

Accepter : listes explicites ("oui, les 2 premiers", "item X seulement"). Refuser : "non", "nope", silence/timeout (45s) → laisser en daily note, ne rien écrire.

## Étape 5 — Propositions de capitalisation (conditionnel)

**Vérifier** si `99 - Claude Code/Sessions/proposals-YYYY-MM-DD.md` existe pour la date du jour.

**Si absent** → skip silencieusement, aller à Étape 6.

**Si présent et `processed: true`** → skip silencieusement, aller à Étape 6.

**Si présent et `processed: false`** :

1. Lire le fichier
2. Présenter les propositions à Victor :

> Propositions de capitalisation du jour :
>
> [pour chaque bloc Session]
> **Session HH:MM :**
> - [ADR] Titre — Scope — Contexte
> - [Skill] Nom du skill — Action — Contexte
>
> Tu valides, rejettes, ou reportes ?

3. Pour chaque élément validé :
   - **ADR transverse** → créer dans `99 - Claude Code/ADR/` + mettre à jour `ADR/INDEX.md`
   - **ADR projet** → créer dans `04 - Projects/[Projet]/claude-code/ADR/`
   - **Skill update** → appliquer la modification dans `99 - Claude Code/Skills/[skill].md`
   - **Skill create** → invoquer `/create-ticket` avec type Amélioration pour ticketiser la création
4. Timeout (45s) ou refus global → skip tout
5. **Toujours** marquer `processed: true` dans le frontmatter après traitement (validé ou non)

## Étape 6 — Essay-check hebdo (conditionnel)

**Lire** `99 - Claude Code/command-tracker.md` et chercher la dernière ligne `- /essay-check → YYYY-MM-DD`.

**Conditions pour déclencher essay-check** :
- command-tracker existe **ET**
- entrée `/essay-check` trouvée **ET**
- date au format YYYY-MM-DD valide **ET**
- date ≥ 7 jours (overdue)

Sinon (fichier absent, entrée non trouvée, format invalide, ou date < 7j) → skip, fin du closeday.

---

**Si essay-check overdue** :

Déclencher `/essay-check` et attendre retour. (Toute la synthèse, check-in, et enrichissement {USER_NAME}.md sont gérés par le skill `essay-check` dédié.)

**Après essay-check** : Mettre à jour command-tracker : `/essay-check → YYYY-MM-DD` (date du jour).

## Étape 7 — Digest du lendemain

En toute fin de session (après essay-check), suggérer :

> "Lance `/digest` dans une session dédiée pour avoir tes news demain matin — le digest écrira directement dans la daily note de demain."

**Attendre confirmation** que Victor l'a lancé :
- Victor confirme ("c'est parti", "lancé", "ok") → confirmer : "✅ Digest en route — à demain !"
- Victor refuse ou silence (30s) → continuer sans bloquer, noter silencieusement

> **Rappel** : `/digest` doit tourner dans une autre session (pas celle du closeday) pour éviter de cumuler les agents.

## Règles

1. **Priorité absolue au bilan narratif** — la sortie principale du skill est un bilan riche, narratif, regroupé par chantier, avec recul hebdo et questions ouvertes sourcées. Les étapes 4-5-6 (filing, capitalisation, essay-check) sont **secondaires** et ne doivent jamais dégrader la qualité du bilan. Si le modèle doit arbitrer entre richesse narrative et anticipation des étapes latérales, choisir la richesse narrative.
2. **Pas de liste plate** — Étape 2.3 : les bullets de "Ce qui a été fait" doivent être regroupés par chantier avec contexte d'exécution complet, jamais une liste chronologique plate. "État général" doit être un narratif 2-4 phrases, pas un résumé en bullets.
3. **Toujours 1-2 questions ouvertes sourcées** à l'étape 2.2 — jamais zéro, jamais génériques. Elles doivent s'appuyer sur des patterns concrets observés dans les 3 daily notes précédentes ou dans les thinking sessions du jour.
4. **Aucune écriture sans confirmation** — toujours présenter avant d'écrire
5. **Timeouts standard** — chaque interaction a un max (30-45s selon contexte). À expiration : action par défaut (skip, continuer + note "[action skipped — timeout]")
6. **Fichiers manquants gracieux** — skip silencieux si non bloquant (sauf daily note du jour — créer si absent)
7. **Append-only** — ne jamais écraser la daily note — sections `## 🌙 Bilan du jour` ajoutées en bas. Si existe déjà → skip à Étape 3.
8. **Parsing robuste** — format inattendu (ex : `score: "quatre"`, date malformée) → skip + note "[format invalide]", ne pas bloquer
9. **Chunking par tranches** — trop longs : limit: 200 (sessions) ou 100 (mood), offset: 0 → 200/100 → … jusqu'à fin
10. **{USER_NAME}.md fallback** — si absent, skip tout enrichissement silencieusement (Étape 6 seulement)
