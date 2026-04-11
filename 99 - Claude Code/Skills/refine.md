---
name: refine
description: Challenger un ticket ou une feature — discussion sur la faisabilité, les specs et les alternatives avant de coder
---

# Skill : Refine

Ce skill ouvre une discussion structurée sur un ticket ou une feature **avant le code**. L'objectif est d'éviter 3 pièges courants :
1. Coder la mauvaise chose parce que les specs sont floues
2. Découvrir à mi-chemin qu'une dépendance ou assumption était fausse
3. Implémenter dans une mauvaise direction faute d'avoir exploré les alternatives

Refine = challenger les specs, identifier ce qui est implicite, évaluer la faisabilité, et décider ensemble de la suite.

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Déclenchement

- Commande `/refine [nom du ticket]`
- l'utilisateur dit "on discute de cette feature", "challenge ce ticket", "est-ce que c'est faisable", "prends la main sur le refine du ticket X"

**Structure du skill** : 6 étapes — charger contexte → extraction assumptions → analyse+risques → discussion → question sous-jacente → conclusion

## Étape 1 — Charger le contexte

1. Chercher le ticket dans les Kanbans des projets actifs :
   - Lire `[PROJECTS_FOLDER]/[NomProjet]/` pour localiser le fichier Features ou Kanban
   - Chercher la note du ticket (format : `NomFeature.md` ou équivalent)
2. Si trouvé → lire la note du ticket + les specs existantes. **Procéder directement, sans demander permission — l'utilisateur a nommé le ticket, il s'attend à ce qu'on le charge.**
3. Lire le README du projet concerné (`[PROJECTS_FOLDER]/[NomProjet]/claude-code/README.md`) pour le contexte technique
4. **Ne jamais charger les skills par anticipation** — attendre une demande explicite de l'utilisateur ("montre-moi", "comment tu ferais", "prends la main")

**Si le ticket n'est pas trouvé ou mal écrit** → demander de le décrire directement dans le chat. Accepter une description verbale comme source de vérité pour le refine. Si la description donnée est fragmentaire, itérer : poser des questions clarificatrices (scope, contexte, dépendances) avant de passer à l'Étape 2.

## Étape 2 — Extraction et validation des assumptions

Avant d'analyser le ticket, identifier les assumptions cachées qu'il contient. Les énoncer explicitement :

- "On part du principe que..." (ex : "...la DB est accessible en temps réel")
- "Ça suppose que..." (ex : "...l'utilisateur a accès à une API tierce")
- "Ça marche seulement si..." (ex : "...on accepte une latence de 2s")

**Format concret** : présenter 3-5 assumptions clés, une par ligne, validées contre le ticket et le README du projet.

**Puis valider avec l'utilisateur** avant de continuer. L'objectif : éviter de passer une heure à discuter d'une fausse version du ticket.
- Si l'utilisateur confirme → continuer à Étape 3
- Si l'utilisateur contredit → revenir immédiatement à Étape 1 pour relire et ajuster
- Si l'utilisateur ajoute une assumption → incorporer et re-valider

## Étape 3 — Analyse + Severity matrix

Présenter une analyse honnête avec classification de chaque risque :

```
## Analyse de [NomDuTicket]

### Ce que je comprends
[Résumé de ce que le ticket demande]

### Faisabilité
[Faisable / Faisable avec contraintes / Complexe / À reconsidérer]

### Risques et points qui coincent
- **Crack** (mineur) — [ex: petite ambiguïté ou détail à clarifier]
- **Tension** (bloquant tant que non résolu) — [ex: contradiction, décision manquante]
- **Foundation risk** (critique) — [ex: dépendance externe, assumption fausse = ticket s'effondre]

### Questions ouvertes
- ...

### Mon avis
[Avis direct — pas de langue de bois]
```

**Classement des risques** :
- **Crack** → continuer la discussion, révisiter au sprint suivant si besoin
- **Tension** → poser la question à l'utilisateur maintenant, bloquer le Go tant que non tranché
- **Foundation risk** → STOP. Identifier qui doit valider et documenter la dépendance. Taguer `#blocked` si bloquant.

**Traiter en ordre** : Foundation risks d'abord, puis Tensions, puis Cracks.

## Étape 4 — Discussion

Mode discussion libre — l'utilisateur donne son avis, on itère jusqu'à une décision ou un pivot.

**Règles pendant la discussion** :
- Nommer les problèmes directement, proposer une alternative, laisser l'utilisateur décider — pas de validation automatique
- Rester concret — toujours ancrer dans le contexte du projet réel
- Pas de code pendant la discussion — seulement quand l'utilisateur dit "montre-moi" ou "prends la main"
- **Limite** : si la discussion tourne en boucle (même question posée 3+ fois, pas de progression), proposer d'arrêter et d'attendre plus d'info. Documenter le point d'arrêt dans le ticket.

**Si l'utilisateur veut aborter ou pivoter** :
- Respecter la décision sans négocier
- Documenter ce qui a été exploré et pourquoi la discussion s'arrête (pour contexte futur)
- Passer à l'Étape 6 (Conclusion) et sélectionner une issue appropriée (souvent Blocker si c'est une dépendance externe, ou Backlog V2 si c'est un pivot futur)

## Étape 5 — La question sous-jacente

Avant de conclure, identifier et poser la question cachée — celle qui n'a pas été nommée explicitement mais qui conditionne la décision finale :

**Exemples concrets** :
- "Est-ce qu'on accepte une solution compliquée maintenant ou on la simplifie en V2 ?"
- "Quelle est vraiment la dépendance bloquante — est-ce vraiment insurmontable ?"
- "On code pour le cas nominatif ou on prévient tous les edge cases ?"
- "Ce ticket résout-il le vrai problème utilisateur, ou juste un symptôme ?"

**Pourquoi c'est important** : les Tensions et Cracks qu'on a identifiés reflètent souvent une seule vraie question sous-jacente. La poser directement accélère la décision finale.

**Attitude** : poser la question directement, sans langue de bois. Ne pas valider automatiquement la réponse — attendre la réaction de l'utilisateur.

## Étape 6 — Conclusion et issue

Proposer une des cinq issues et documenter la décision :

**✅ Go — implémenter tel quel**
- Les specs sont claires, les assumptions confirmées, faisabilité OK
- Demander si l'utilisateur veut démarrer maintenant ou plus tard
- Si "plus tard" : noter la date et l'intention dans le ticket (pas juste verbal)

**✏️ Adapter — modifier les specs**
- Mettre à jour la section `## Specs générées` du ticket avec les décisions prises
- Déplacer le ticket en colonne Ready si ce n'est pas déjà fait

**🗑️ Jeter — abandonner le ticket**
- Déplacer le ticket en colonne Done avec une note d'abandon
- Documenter pourquoi dans la note du ticket

**🧊 Backlog V2 — ticket valide mais prématuré**
- Taguer `#V2` dans le kanban
- Alimenter le fichier `V2 ideas.md` du projet avec le ticket et le raisonnement (créer le fichier s'il n'existe pas)
- Laisser le ticket en colonne Idea — il sera repris quand les prérequis seront réunis

**⏸️ Blocker — ticket valide mais bloqué**
- Le ticket dépend d'une info externe manquante, d'une feature non livrée, ou d'une décision en attente
- Identifier précisément ce qui bloque et qui doit le débloquer
- Taguer `#blocked` dans le kanban + noter le bloquant dans la note du ticket

**Pour toutes les issues** : mettre à jour la note du ticket avec le raisonnement complet — c'est la mémoire du refine pour une revue ultérieure.

## Règles absolues

- Ne jamais commencer à coder sans que l'utilisateur dise explicitement "go" ou "prends la main"
- Toujours mettre à jour la note du ticket avec les décisions de la discussion
- Un avis honnête prime sur un avis rassurant
