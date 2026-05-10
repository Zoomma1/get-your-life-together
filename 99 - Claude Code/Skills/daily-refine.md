---
name: daily-refine
description: Lance le raffinement des tickets listés dans la section 🗂️ Raffinement de la daily note du jour. Invoquer quand Victor dit "/daily-refine", "on fait le raffinement du jour", "raffinement depuis la daily", "lance les refines du plan", ou "on passe les tickets en raffinement". Lit automatiquement la daily note courante, extrait les tickets non cochés, et enchaîne /refine sur chacun en séquence — sans que Victor ait à tout préciser manuellement.
---

# Skill : /daily-refine

Élimine la friction de démarrage du raffinement quotidien : plutôt que de préciser manuellement chaque ticket à /refine, ce skill lit la daily note du jour et orchestre le raffinement en séquence.

## Étape 1 — Initialiser les variables

Lire `/home/vico/.claude/vault-config.json` → extraire `VAULT_PATH`.
Lire `{VAULT_PATH}/99 - Claude code/config/vault-settings.md` → extraire `DAILY_NOTES_FOLDER`.

## Étape 2 — Lire la daily note du jour

Récupérer la date du jour : `date +"%Y-%m-%d"`.
Lire `{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md`.

**Si la daily note n'existe pas** → signaler et arrêter : *"Pas de daily note pour aujourd'hui — lance /today d'abord ?"*

## Étape 3 — Extraire les tickets Raffinement

Localiser la section `### 🗂️ Raffinement` dans la daily note.

Extraire toutes les lignes correspondant au pattern `- [ ] [[...]]` dans cette section.

**Ignorer** :
- Les lignes `- [x]` — déjà traités dans la session courante ou une session précédente
- Les lignes sans lien `[[]]` (texte libre)
- Les lignes hors de la section Raffinement

**Si aucun ticket non coché trouvé** :
- Si la section Raffinement est absente → *"Pas de section Raffinement dans la daily du jour."*
- Si tous sont cochés → *"Tous les tickets du Raffinement sont déjà traités aujourd'hui ✅"*
- Dans les deux cas, arrêter.

## Étape 4 — Présenter et confirmer

Afficher la liste extraite :

```
🗂️ Raffinement du jour — X ticket(s) à traiter :
1. [[NomTicket1|Titre]] 
2. [[NomTicket2|Titre]]
...

On démarre ?
```

Attendre la confirmation de Victor. Si Victor dit "non" ou veut retirer des tickets → ajuster la liste avant de démarrer.

## Étape 5 — Lancer /refine en séquence

Pour chaque ticket dans l'ordre :

1. Annoncer : *"Ticket N/X — /refine [[NomTicket]]"*
2. Invoquer `/refine [[NomTicket]]` — laisser /refine gérer entièrement la discussion (format exploratoire ou standard selon le type de ticket)
3. Attendre que Victor donne une issue finale ("spec", "poubelle", "backlog V2", "blocker", "next", "suivant")
4. Passer au ticket suivant

**Ne pas enchaîner sans confirmation** — le rythme est celui de Victor, pas celui du skill.

Si Victor dit "stop" ou "on s'arrête là" en cours de route → arrêter proprement sans forcer la suite.

## Étape 6 — Clôture

Quand tous les tickets sont traités ou que Victor arrête :

```
✅ Raffinement terminé — X/Y tickets traités.
```

Les tickets non traités restent non cochés dans la daily note — ils remonteront lors du prochain /daily-refine ou via /today.
