---
name: trace
description: Retracer l'évolution d'une idée dans le vault de l'utilisateur — quand elle est apparue, comment elle a changé, où elle en est maintenant. Pair-programming chronologique : Claude cherche + synthétise, valider à 3 points clés (synonymes, résultats bruts, timeline). Déclencher quand l'utilisateur veut comprendre comment une pensée a mûri, détecter une contradiction, ou cartographier la trajectoire d'un concept. Exemples : "/trace procrastination", "/trace architecture software", "/trace remote work", "/trace pair programming".
---

# Skill : /trace

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

---

Une idée dans un vault n'est jamais figée. Elle apparaît sous un nom, change de forme, fusionne avec d'autres, se contredit. Le skill `/trace` suit cette évolution chronologiquement — pas pour raconter une histoire propre, mais pour rendre visible ce qui s'est réellement passé dans la pensée de l'utilisateur.

**Différence avec `/recall`** : `recall` cherche *quoi existe* sur un sujet ; `trace` cherche *comment ce sujet a changé dans le temps*.

---

## Déclenchement

```
/trace [concept]         → trace l'évolution de ce concept dans le vault
/trace productivité      → comment la vision de la productivité a évolué
/trace architecture      → comment la vision de l'architecture logicielle a changé
/trace pair programming  → comment la vision du travail avec Claude Code a évolué
```

---

## Étape 0 — Vérifier la viabilité

**Avant de lancer la trace**, déterminer si le concept existe dans le vault sur une durée significative.

Claude exécute un grep initial léger (10 secondes max) sur les termes évidentes du concept. Trois cas possibles :

1. **Concept riche** (10+ occurrences, 2+ mois d'évolution) → continuer vers Étape 1
2. **Concept très neuf ou rare** (1-5 occurrences, <1 mois) → signaler à l'utilisateur : "Ce concept a très peu de traces. La trace sera courte/mince. Continuer ?"
3. **Concept absent** (0 occurrence) → arrêter et dire à l'utilisateur : "Je ne trouve aucune trace de [concept] dans le vault. Voulez-vous que je cherche des variantes ?" → revenir à Étape 1 si l'utilisateur donne des variantes

C'est une mini-validation AVANT d'investir 5 minutes en Étape 1-2.

---

## Étape 1 — Construire et valider la carte des synonymes

**Avant de chercher quoi que ce soit**, générer la liste complète des termes à chercher. Une idée change souvent de nom au fil du temps — chercher uniquement le terme original rate les occurrences antérieures ou parallèles.

Pour le concept passé en argument, lister :
- Le terme exact + ses variantes orthographiques
- Les synonymes directs
- Les termes adjacents (concepts qui co-évoluent souvent avec celui-ci)
- Les formulations négatives (ex: "je n'arrive pas à..." révèle une relation avec un concept)
- Les abréviations et sigles utilisés par l'utilisateur

Exemple pour `/trace productivité` :
```
Termes : productivité, efficacité, focus, deep work, concentration,
         procrastination, organisation, priorités, flow, routine
```

**VALIDATION OBLIGATOIRE** — Présenter cette liste et attendre la réponse :
- Si l'utilisateur dit "c'est bon" ou valide implicitement → Étape 2.
- Si l'utilisateur ajoute des termes, reformule ou retire → intégrer et redemander confirmation.
- Si l'utilisateur dit "ce concept n'existe pas dans mon vault" ou "trop neuf" → arrêter et signaler.

---

## Étape 2 — Rechercher dans les sources (5 répertoires en parallèle)

La liste de synonymes validée est connue → lancer la recherche dans les 5 répertoires en parallèle. **Claude exécute les 5 Grep en parallèle, valider les résultats ensuite.**

Chaque recherche retourne les matches avec leur contexte (fichier, date, extrait exact) :

```
Agent 1 : `[NOTES_FOLDER]/` → cherche tous les termes + [[terme]]
Agent 2 : `[KNOWLEDGE_FOLDER]/` → cherche tous les termes + [[terme]]
Agent 3 : `99 - Claude Code/ADR/` → cherche tous les termes + [[terme]]
Agent 4 : `99 - Claude Code/Sessions/` → cherche tous les termes + [[terme]]
Agent 5 : `[PROJECTS_FOLDER]/*/claude-code/` → cherche tous les termes + [[terme]]
```

**Traitement des résultats** (Claude) :
- Agréger les 5 retours par unicité (fichier + ligne)
- Pour chaque match : extraire **fichier, date (déduite du nom ou frontmatter), extrait exact**
- Marquer les backlinks `[[terme]]` comme "confiance élevée"
- Signaler si un terme n'a ZÉRO occurrence → note `[absent du vault]`

**Pause pour validation** : présenter les résultats bruts à l'utilisateur. Il peut demander une recherche supplémentaire ou valider pour Étape 3.

---

## Étape 3 — Détecter les patterns implicites et les gaps

**Claude analyse les résultats de Étape 2** pour identifier les traces implicites : des moments où le concept apparaît *sans être nommé*.

Patterns à chercher :
- **Décisions qui révèlent une position** : un ADR peut refléter une croyance sans jamais nommer le concept
- **Réactions émotionnelles** : "ça m'a frustré", "c'est exactement ça" indiquent une relation avec une idée sous-jacente
- **Approches récurrentes** : si l'utilisateur résout toujours les mêmes problèmes de la même façon, c'est un pattern implicite
- **Absences significatives** : un sujet qui disparaît soudainement du vault après avoir été fréquent

Ces patterns implicites seront marqués `[implicit]` dans la timeline.

**Claude signale aussi les gaps** :
- Périodes vides (ex: concept abondant jusqu'à date X, puis silence 6 mois)
- Termes absents du vault (marqués `[absent]`)
- Fichiers attendus mais manquants (ex: CLAUDE.md de projet ne montrant pas une décision sur le sujet)

**Note sur le découpage temporel** : si la trace couvre > 2 ans ou > 50 entrées, Claude demande à l'utilisateur : "La trace est très longue. Veux-tu la voir complète ou segmentée par période/theme ?" et attend la réponse avant Étape 4.

---

## Étape 4 — Construire et valider la timeline

**Claude construit** la timeline à partir des résultats de Étape 2-3, en organisant chronologiquement.

Pour chaque entrée de la timeline :

```
[DATE] — [SOURCE] — [confiance]
"[extrait exact, citation verbatim]"
→ [contexte en une phrase : qu'est-ce qui se passait à ce moment ?]
```

**Marqueurs de confiance (obligatoires sur chaque entrée) :**

| Marqueur | Sens |
|----------|------|
| `[solid]` | Position clairement affirmée, sans ambiguïté |
| `[evolving]` | Position en transition, indices de changement |
| `[hypothesis]` | Idée tentative, explorée sans conviction affirmée |
| `[questioning]` | Doute explicite, remise en question d'une position antérieure |
| `[implicit]` | Déduit d'un pattern, non nommé directement |
| `[absent]` | Période sans occurrences ou terme introuvable |

**Règle des citations** : toujours utiliser les mots exacts de l'utilisateur, entre guillemets. Ne jamais paraphraser. Si l'extrait est trop long, couper avec `[...]` mais préserver les formulations clés.

**Catalyseurs** : si un changement est visible entre deux entrées, identifier ce qui l'a provoqué — une lecture, un événement, un projet, une décision. Les marquer `→ ⚡ Catalyseur : ...`.

**VALIDATION DE VICTOR OBLIGATOIRE** — Avant Étape 5 :
- Présenter la timeline brute
- l'utilisateur peut signaler : maldates, mauvaise interprétation, entrée oubliée, contexte erroné
- Intégrer les retours, puis passer à Étape 5

---

## Étape 5 — Identifier et présenter l'arc

**Claude construit** une analyse narrative à partir de la timeline validée. Sections obligatoires :

### Apparition initiale
- Quand le concept est-il apparu pour la première fois ?
- Sous quelle forme ? Avec quelle confiance initiale ?

### Points d'inflexion
- Quels moments ont fait évoluer la pensée ?
- Qu'est-ce qui a provoqué chaque pivot ?

### Position actuelle
- Où en est l'utilisateur sur ce sujet maintenant ?
- Avec quel niveau de confiance ?

### Pattern d'évolution

Classifier l'arc parmi ces types :

| Type | Définition |
|------|-----------|
| **Linéaire** | Approfondissement progressif d'une même position |
| **Pivot** | Abandon d'une position antérieure — rupture claire |
| **Convergence** | Plusieurs threads distincts qui se rejoignent en une position unifiée |
| **Divergence** | Une idée initiale qui se scinde en deux positions distinctes |
| **Circulaire** | Retour à une position antérieure après en avoir exploré d'autres |

### Contradictions non résolues
Quelles tensions persistent dans la pensée actuelle ?

### Trajectoires probables
Où cette pensée semble-t-elle se diriger ? Quelles questions restent ouvertes ?

---

## Format de sortie (Étape 5, synthèse finale)

```
## Trace : [concept] — [date d'analyse]

### Termes cherchés (validés par l'utilisateur)
[liste des synonymes + termes adjacents utilisés]

### Timeline
[DATE] — [source] [confiance]
"[citation exacte]"
→ [contexte]

[DATE] — [source] [confiance]
"[citation exacte]"
→ [contexte]
→ ⚡ Catalyseur : [ce qui a provoqué le changement]

[Nota bene sur les gaps ou absences détectées]

### Arc
**Type** : [linéaire / pivot / convergence / divergence / circulaire]
**Apparition** : [quand, sous quelle forme, confiance]
**Inflexions** : [liste des moments-clés + catalyseurs]
**Position actuelle** : [résumé] [confiance]
**Contradictions** : [tensions non résolues, ou "aucune détectée"]
**Trajectoire** : [où ça semble aller, questions ouvertes]
```

**Note** : Les synonymes apparaissent EN TÊTE (validés par l'utilisateur à Étape 1), pas à la fin. Les gaps et absences sont notés après la timeline pour contexte.

---

## Règles absolues

### Citations et dates
- **Citations exactes obligatoires** — ne jamais paraphraser les mots de l'utilisateur, toujours utiliser guillemets et `[...]` pour couper
- **Dater chaque entrée** — une entrée sans date est inutile pour une timeline. Si la date est approximative, le noter `[~DATE]`
- **Confidence markers sur chaque entrée** — `[solid]`, `[evolving]`, `[hypothesis]`, `[questioning]`, `[implicit]`, ou `[absent]`

### Workflow et validation
- **Étape 1 → VALIDATION VICTOR** — ne jamais commencer le Grep sans accord sur les synonymes
- **Étape 2 → présenter résultats bruts** — l'utilisateur peut demander des recherches supplémentaires
- **Étape 4 → VALIDATION VICTOR** — antes de synthétiser l'arc, valider les dates et contextes
- **Pas d'interprétation solo** — si une position est ambiguë, la marquer `[hypothesis]` ou `[questioning]`, pas `[solid]`

### Contenu
- **Signaler les gaps explicitement** : périodes vides, termes introuvables, fichiers manquants
- **Pas de jugement** : le skill décrit une évolution, il ne dit pas quelle position est "meilleure"
- **Chercher les catalyseurs** : chaque pivot doit avoir une explication (lecture, événement, décision)

### Sortie
- **Présenter le résultat complet** avant de poser des questions
- **Nommer les sources exactes** : pas "Daily notes" mais le chemin complet du fichier (ex: `[NOTES_FOLDER]/2026-03-15.md`)

## Étape finale — Mettre à jour le tracker

Mettre à jour `99 - Claude Code/command-tracker.md` :
- Ligne `/trace` → remplacer la date par la date du jour au format `DATE_FORMAT`
