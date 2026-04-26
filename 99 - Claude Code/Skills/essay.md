---
name: essay
description: Lancer un essay introspectif, d'analyse système ou d'opinion tranchée — workflow guidé en 5 étapes : cadrage du sujet, plan + 5-8 questions ancrées dans le vécu de Victor, réponses, brouillon validé, version finale sauvée dans 03 - Knowledge/Essays/. Déclencher quand Victor dit "essay", "/essay", "essay [nom du ticket]", "j'ai envie d'écrire sur X", "je veux explorer cette idée par écrit", "introspection", "creuse cette pensée", ou pour challenger une croyance ou retracer une évolution personnelle. Sans argument = mode sujet libre (création de stub ticket), avec argument = lit le ticket dans 09 - Inbox/tickets/.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : /essay

## Déclenchement

```
/essay                        → mode sujet libre (questions de cadrage → stub ticket)
/essay [nom du ticket]        → lit le ticket existant dans 09 - Inbox/tickets/
```

---

## Étape 0 — Détecter le mode

**Si aucun argument :**
→ Aller à l'**Étape 0b** (création du stub ticket)

**Si un argument est fourni :**
→ Tenter de lire la note `{VAULT_PATH}\{INBOX_FOLDER}\tickets\[argument].md`
→ Si le fichier existe : aller directement à l'**Étape 1**
→ Si le fichier n'existe pas : signaler à Victor "Je n'ai pas trouvé le ticket `[argument].md` dans `09 - Inbox/tickets/`. Peux-tu vérifier le nom ou créer le ticket d'abord ?" — arrêter

---

## Étape 0b — Mode sujet libre : créer le stub ticket

Poser à Victor les questions de cadrage suivantes (en une seule réponse) :

```
Pour cadrer l'essay, j'ai besoin de quelques précisions :

1. **Sujet** : De quoi parle cet essay ? (une phrase)

2. **Angle** : Quelle direction tu veux prendre ? Quelques exemples :
   - Introspection : explorer un pattern perso ou une insight sur toi-même
   - Analyse système : disséquer un problème (ex: TDAH au travail, pair-prog, outils dev)
   - Opinion tranchée : challenger une croyance commune ("pourquoi le solo c'est pas productif")
   - Historique : retracer une évolution (ex: ta relation au code, à l'apprentissage)
   - Autre : précise

3. **Lecteur cible** : Pour qui tu écris ? 
   - Toi dans 2 ans (pour te rappeler une insight)
   - Quelqu'un comme toi (TDAH, dev, etc.)
   - Quelqu'un qui ne te connaît pas
   - Peu importe

4. **Sources disponibles** : Est-ce qu'il y a des notes du vault, des daily notes, des expériences précises, des essays passés que tu veux qu'on exploite ?

5. **Longueur visée** : Court (~500 mots), moyen (~1000 mots), long (2000+) ?
```

Une fois que Victor a répondu, créer un stub ticket dans `{VAULT_PATH}\{INBOX_FOLDER}\tickets\essay-[slug].md` :

```markdown
---
title: Essay — [Titre]
date: JJ/MM/AAAA
type: 💡 Idée
status: WIP
---

# Essay — [Titre]

## Résumé

[Reformulation du sujet en une phrase]

## Contexte / Pourquoi

[Angle + lecteur cible]

## Notes techniques

- Sources : [liste des sources mentionnées par Victor]
- Longueur visée : [court / moyen / long]
```

→ Continuer vers l'**Étape 1** avec ce stub comme ticket de référence.

---

## Étape 1 — Charger le contexte

1. Lire le ticket (existant ou stub)
2. Lire les sources explicitement listées dans le ticket :
   - Daily notes mentionnées (via chemin `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\`)
   - Essays existants (`{VAULT_PATH}\{KNOWLEDGE_FOLDER}\Essays\`)
   - `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` si l'essay est d'introspection
   - Tickets liés dans les dépendances du ticket
   - **Si une source n'existe pas** : ignorer silencieusement et continuer

3. **Avant l'étape 2**, si sources listées sont vagues ou absentes, demander à Victor inline :
   - "Y a-t-il des daily notes précises, des expériences ou des notes du vault que tu veux que j'exploite pour l'essay ?"
   - Attendre la réponse avant de générer le plan
   - Ne pas lister de candidats — laisser Victor décider ce qui compte

---

## Étape 2 — Générer le plan + les questions

Produire en une seule réponse :

```markdown
## Plan proposé — [Titre de l'essay]

### Sources
- [liste des sources lues]

### Structure envisagée
1. [Section 1 — accroche ou contexte]
2. [Section 2 — développement central]
3. [Section 3 — tension ou retournement]
4. [Section 4 — conclusion ouverte ou concrète]

### Questions à répondre

**Pour ancrer dans du réel :**
- Q1 : [Quel moment/expérience précise a déclenché cette réflexion ?]
- Q2 : [Raconte-moi un détail concret qui l'illustre]

**Pour développer la thèse :**
- Q3 : [Qu'est-ce que tu comprends maintenant que tu ne comprenais pas avant ?]
- Q4 : [Quel obstacle ou contradiction tu vois dans cette idée ?]

**Pour la conclusion :**
- Q5 : [Qu'est-ce que tu veux que le lecteur retienne ?]
```

Règles pour les questions :
- **Formulées à la deuxième personne** : "Quand tu as réalisé que...", "Raconte-moi le moment où...", "Quel détail..."
- **Ancrées dans le vécu de Victor**, pas génériques — exemple MAUVAIS : "What is productivity?" ; BON : "Quel moment au travail t'a montré que tu n'étais pas productif en solo ?"
- **5 à 8 questions maximum** — force à la concision
- **Conçues pour faire émerger une thèse**, pas lister des faits — ne pas demander "list your achievements" mais "pourquoi ces achievements t'importent"
- **Pas de questions rhétoriques** — attendre une vraie réponse

**Validation du plan :**
Terminer par : "**Avant de continuer :** est-ce que ce plan et ces questions te parlent ? Si tu veux ajuster la structure ou reformuler des questions, dis-le — je reprépare l'étape 2. Sinon, réponds aux Q1-Q5 et on passe à l'étape 3."

**Si Victor rejette ou ajuste le plan :**
→ Reprendre l'étape 2 seule (pas l'étape 1) avec la nouvelle direction

---

## Étape 3 — Victor répond

Victor répond aux questions — dans le chat ou en éditant la note ticket.

**Claude ne doit pas :**
- Relancer Victor ou le presser
- Compléter à la place de Victor
- Paraphraser les réponses — les utiliser telles quelles

**Si réponses très courtes (< 1 phrase par Q) :**
Demander clarification — "Tu peux développer la Q2 ? J'ai besoin de plus de détail concret pour bien l'ancrer." Ne pas continuer tant que le contenu n'est pas suffisant.

**Si Victor demande de rejeter/ajuster le plan ou une question :**
Revenir à l'étape 2 et reproposer — ne pas forcer le plan existant

---

## Étape 4 — Brouillon + validation

Avant de produire la version finale :

1. Rédiger un **brouillon complet** (première personne, style direct, pas académique)
2. Respecter le plan proposé en étape 2 ; si les réponses suggèrent une structure différente, signaler le changement à Victor
3. Proposer le brouillon : "Voici le premier jet — c'est la direction que tu veux ? Je peux affiner, découper, développer telle section..."
4. **Attendre le feu vert de Victor avant version finale**

**Si Victor demande des changements substantiels :**
- Affiner sur place, ne pas relancer l'étape 2
- Si Victor veut une restructuration complète → revenir à l'étape 2

Règles de rédaction :
- Pas de conclusion générique — finir sur quelque chose de concret ou une tension ouverte
- Longueur : respecter la visée du ticket (ou ~800 mots par défaut)
- Pas de reformulation artificielle — garder les phrases bien tournées de Victor telles quelles

---

## Étape 5 — Sauvegarder

Écrire l'essay dans `{VAULT_PATH}\{KNOWLEDGE_FOLDER}\Essays\[slug].md`

Format frontmatter :

```markdown
---
title: [Titre complet]
date: JJ/MM/AAAA
tags: [essay, introspection, ...]
sources: [liste des sources utilisées]
---
```

Mettre à jour le ticket d'origine : passer le status à `Done`.

---

## Règles absolues

- **Ne jamais rédiger sans réponses aux Q** : étape 3 doit être complète avant étape 4
- **Validation du plan avant rédaction** : demander à Victor si la structure et les Q lui conviennent (étape 2)
- **Validation du brouillon avant final** : proposer le premier jet et attendre ok (étape 4)
- Respecter le style de Victor — ne pas académiser, ne pas lisser
- Les questions (étape 2) sont le livrable — pas un brouillon de l'essay
- Le stub ticket (mode sujet libre) est créé avant les étapes 1–5
- Si réponses partielles/incomplètes : demander clarification explicite — ne pas inventer
- Ne jamais modifier le ticket sans permission de Victor
