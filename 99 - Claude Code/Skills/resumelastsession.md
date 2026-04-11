---
name: resumelastsession
description: Reprendre la dernière session de travail — charge la session précédente, contexte du projet, et nouvelles données depuis hier.
---

# Skill : Reprise de session

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Étape 1 — Localiser le fichier session le plus récent

Utiliser Glob sur `99 - Claude Code/Sessions/` avec le pattern `**/*.md` pour lister tous les fichiers `.md`.
Trier par nom de fichier et extraire le plus récent. Si `DATE_FORMAT` est `YYYY-MM-DD`, le tri alphabétique par nom donne le résultat correct. Pour d'autres formats, trier par date de modification du fichier (mtime) comme fallback.

**Si aucun fichier n'existe** : signaler et proposer de partir d'une daily note du jour (dans `[NOTES_FOLDER]` selon vault-settings.md).

## Étape 2 — Extraire contexte session + projet

Lire le fichier session en entier.
Identifier la **dernière section** `## Session [HH:MM]` (la plus récente du fichier).
- Si aucune section `## Session` n'existe → signaler "Fichier session mal formaté" et proposer fallback daily note

Extraire exactement dans cet ordre (et lister les sections trouvées) :
1. **✅ Accompli** — ce qui a été fait (section dédiée ou bullet points)
2. **⏭️ Prochaine étape / Next** — où reprendre (section ou liste)
3. **🧭 État de l'utilisateur / Notes** — observations sur son état en fin de session

**À noter explicitement dans le résumé** : toute section absente ou vide.

En parallèle, **identifier le projet** mentionné dans la session :
- Lire `[PROJECTS_FOLDER]/INDEX.md` pour la liste des projets actifs → chercher une correspondance dans la session
- Si le nom n'est pas trouvable → signaler et demander de préciser le projet

## Étape 3 — Charger contexte du projet et nouvelles données

Si le projet a pu être identifié :
- Chercher son README : `[PROJECTS_FOLDER]/[Projet]/claude-code/README.md`
- Si le fichier existe → lire et mémoriser : stack, architecture, fichiers clés
- Si absent → signaler "README projet introuvable" et demander si continuer sans, ou spécifier un autre projet

Vérifier si la session date d'avant aujourd'hui (décalage temporel) :
- Si oui → lire la daily note du jour (dans `[NOTES_FOLDER]` selon vault-settings.md)
- Si la daily note existe et contient des plans/notes → extraire et mentionner
- Si la daily note n'existe pas ou est vide → signaler "aucun changement depuis la dernière session"

## Étape 4 — Afficher le résumé et charger

Afficher dans ce format :

```
📂 Session du [date] à [HH:MM]

✅ Accompli :
[liste chronologique des accomplissements, ou "(aucun noté)"]

⏭️ Prochaine étape :
[action définie, ou "(à définir)"]

🧭 État de l'utilisateur :
[observation ou "(pas de notes)"]

[Si décalage temporel et daily note avec contenu]
📋 Contexte nouveau depuis hier :
[résumé de la daily du jour, ou "aucun changement"]

---
Projet identifié : [nom projet] | Contexte chargé.
```

**Important** : À la fin du résumé, l'utilisateur doit valider avant d'enchaîner. Demander "Prêt à continuer ?" ou attendre sa prochaine instruction.

## Règles absolues

- Ne jamais inventer d'informations absentes du fichier session
- Si une section est vide ou absente → le mentionner explicitement ("(aucun noté)", "(pas de notes)", etc.)
- Si aucun fichier session n'existe → proposer fallback sur daily note du jour, attendre la validation de l'utilisateur
- Si projet indéterminé → signaler et demander de le spécifier
- Si README du projet est absent → signaler le problème, proposer continuer sans ou clarifier le projet
- Ne pas charger des contextes de multiples projets si ambigu — chercher le plus pertinent ou demander
