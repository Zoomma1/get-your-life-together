---
name: closeyesterday
description: Clôture la journée d'hier quand /closeday n'a pas été lancé — même logique que /closeday mais appliquée à J-1. Invoquer depuis /today quand hier n'est pas clôturé.
---

# Skill : /closeyesterday

Applique la même logique que `/closeday` mais sur la daily note d'hier (`J-1`) au lieu d'aujourd'hui.

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Déclenchement

- Invoqué automatiquement depuis `/today` quand hier n'est pas clôturé
- Invocation manuelle : `/closeyesterday`

## Étapes

Appliquer exactement les mêmes étapes que `/closeday`, en remplaçant :
- "daily note du jour" → daily note d'hier (`[NOTES_FOLDER]/[date J-1 selon DATE_FORMAT].md`)
- "session du jour" → dernière session existante avant aujourd'hui dans `99 - Claude Code/Sessions/`

Lire le skill `/closeday` pour le détail des étapes.

## Règle absolue

Ne jamais modifier la daily note d'aujourd'hui. Opérer uniquement sur J-1.
