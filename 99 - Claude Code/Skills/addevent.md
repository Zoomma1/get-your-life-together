---
name: addevent
description: Quand Victor veut ajouter un bloc horaire dans sa daily note pour le visualiser dans Full Calendar. Déclenché via /addevent avec ou sans arguments — ex: /addevent 11:30 12:30 Révisions ibP
---

## Arguments

`$ARGUMENTS` accepte 0 à 3 éléments, dans l'ordre : `[startTime] [endTime] [titre]`
- Format HH:mm : heures 00:00 à 23:59 (24h)
- Exemple complet : `/addevent 11:30 12:30 Révisions ibP`
- Exemple partiel (startTime + titre) : `/addevent 14:30 Dentiste`
- Exemple minimal : `/addevent 14:00`

## Comportement

1. Parser `$ARGUMENTS` en composants [startTime] [endTime] [titre] :
   - Identifier les tokens au format HH:mm
   - Remaining text = titre
   - Cas 1 : trois éléments valides (HH:mm HH:mm texte) → continuer
   - Cas 2 : deux HH:mm + titre → continuer
   - Cas 3 : un HH:mm + titre (pas de deuxième HH:mm) → demander endTime
   - Cas 4 : deux HH:mm (pas de titre) → demander titre
   - Cas 5 : un HH:mm (pas de titre) → demander endTime et titre
   - Cas 6 : texte seul (aucun HH:mm) → demander startTime et endTime
   - Cas 7 : vide → demander startTime, endTime et titre

2. Valider les heures :
   - Format HH:mm : rejeter si MM >= 60 ou HH >= 24, redemander
   - Logique : rejeter si startTime >= endTime, redemander

3. Lire (ou créer) la daily note : `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\YYYY-MM-DD.md` (date courante)
   - Si le fichier n'existe pas, le créer en appliquant le template `{VAULT_PATH}\Ressources\Templates\Daily notes template.md` :
     - Lire le template
     - Résoudre tous les placeholders Templater `<% tp.date.now(...) %>` avec la date courante (ex: `<% tp.date.now("YYYY-MM-DD") %>` → `2026-04-02`)
     - Créer la note avec ce contenu résolu (frontmatter complet + toutes les sections)

4. Localiser la section `### 📅 Agenda` :
   - Si elle existe → insérer à la fin (au dernier item coché ou texte avant les lignes blanches)
   - Si absente, mais `## 📅 Plan du jour` existe → ajouter `### 📅 Agenda` en-dessous
   - Si les deux absent → créer `### 📅 Agenda` en fin de note

5. Ajouter la ligne :
   ```
   - [ ] [titre] [startTime:: HH:mm] [endTime:: HH:mm]
   ```
   Note : `startTime::` et `endTime::` sont des propriétés DataView pour suivi Full Calendar.

6. Confirmer : "Événement ajouté : [titre] de HH:mm à HH:mm"

## Règles

- Format des heures : HH:mm (24h), plage 00:00-23:59
- Validation temps : rejeter formats invalides (MM >= 60, HH >= 24) et startTime >= endTime, redemander
- Insertion : fin de section Agenda, avant les lignes blanches si présentes
- Création note : depuis template avec placeholders Templater résolus à la date courante
- Confirmation : afficher l'événement ajouté avec les heures formatées
