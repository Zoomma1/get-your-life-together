---
name: dump
description: Session de vidage mental à la demande — Victor écrit librement, Claude pose des questions de relance adaptées au contenu, puis génère un bloc horodaté prêt à coller dans la daily note. Déclencher dès que Victor dit "/dump", "j'ai besoin de vider", "thinking session", "j'ai la tête pleine", "j'ai des trucs à extérioriser", "besoin de décharger", ou toute formulation qui exprime un besoin d'externalisation mentale ou émotionnelle non structurée — même sans le mot "dump".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : dump

Session d'externalisation en trois temps : écoute libre → questions de relance → bloc copier-collable pour la daily note.

## Étape 1 — Invitation

Ouvrir la session avec une invitation courte et non directive :

> "Je t'écoute — balance ce que t'as sur la tête."

Ne pas poser de questions à cette étape. Ne pas proposer de structure ni de thème. L'invitation doit être neutre pour ne pas orienter le dump avant qu'il commence.

## Étape 2 — Relance

Lire attentivement ce que Victor a écrit. Identifier les fils qui méritent d'être tirés : tensions non nommées, décisions implicites, émotions sous-jacentes, contradictions, choses dites à demi-mot.

Poser 3 questions de relance adaptées à ce dump précis — ni plus ni moins, sauf si Victor dit "génère directement" (voir plus bas). Choisir les 3 angles qui ouvrent le plus, pas les plus évidents.

Quelques angles utiles à adapter selon le contenu :
- "C'est quoi l'enjeu derrière ça ?"
- "Et alors, qu'est-ce que ça change pour toi ?"
- "Qu'est-ce que tu ressens par rapport à X ?"
- "Tu en fais quoi maintenant ?"
- "C'est quoi le truc que tu n'as pas dit ?"

**Dump très court (2-3 mots ou fragment)** : demander "Tu veux développer, ou c'est juste une capture rapide ?" avant de poser des questions de relance.

**Victor dit "génère directement"** : sauter les questions et aller à l'Étape 3 immédiatement.

## Étape 3 — Génération et écriture dans la daily note

Générer un bloc qui synthétise l'échange. Distiller, pas transcrire : ce qui a été dit, ce qui a émergé, ce que Victor en retient.

Format du bloc :

```
### Thinking session — HH:MM
[2-5 phrases condensant l'essentiel de la session]
```

**Calcul de la date et de l'heure** :
- Obtenir l'heure via `date +%H:%M` (bash) / `(Get-Date).ToString("HH:mm")` (PowerShell)
- Si `heure < 04:00` → date cible = veille, ajouter `🌙 (après minuit)` au titre du bloc
- Sinon → date cible = aujourd'hui, titre inchangé

Titre du bloc selon le contexte :
- Heure normale : `### Thinking session — HH:MM`
- Après minuit : `### Thinking session — HH:MM 🌙 (après minuit)`

Écrire automatiquement le bloc dans la daily note correspondante :
1. Trouver le fichier `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\[date cible].md`
2. Insérer le bloc à la fin de la section `## 💡 Idées & Réflexions`
3. Confirmer : "Noté dans ta daily du [date cible]."

**Plusieurs sessions dans la même journée** : chaque bloc est horodaté séparément, inséré à la suite dans la section. Ne pas fusionner les sessions.

## Notes

**Canal Telegram disponible** : si Victor est mobile, le dump peut être envoyé directement depuis le téléphone via le canal Telegram. Le comportement est identique — premier message = le dump, Claude pose 3 questions de relance directement (sans redemander "balance ce que t'as"), synthèse écrite dans la daily note du jour. Voir CLAUDE.md § `📱 Channel Telegram` pour le comportement détaillé.
