---
name: closeday
description: Bilan de fin de journée — synthétiser sessions, mettre à jour daily note avec patterns observés, détecter WIP en cours, vérifier essay-check overdue. Déclencher quand l'utilisateur dit l'une de ces formules : "closeday", "j'arrête", "je finis", "c'est fini", "fin de session", "bonne nuit", "bonne journée", "j'arrête pour aujourd'hui", "ça suffit", "journée finie", "c'est bon je m'arrête", "c'est terminé" ou via /closeday.
---

# Skill : Close Day

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Déclenchement

L'utilisateur dit l'une de ces formules (ou équivalente) :
- "closeday"
- "j'arrête", "je finis", "c'est fini"
- "bonne nuit", "bonne journée"
- "fin de session", "je m'arrête"

Ou : commande `/closeday`

## Étape 1 — Collecter les données du jour

Lire en parallèle (avec fallbacks) :

1. **Daily note du jour** : `[NOTES_FOLDER]/[date selon DATE_FORMAT].md`
   - Si absent → créer un fichier minimal (frontmatter vide + titre du jour), continuer
   - Format : `---\n---\n# [date]\n`
   
2. **Sessions du jour** : `99 - Claude Code/Sessions/[date selon DATE_FORMAT].md`
   - Si absent → synthétiser depuis la daily note, noter `[Synthèse approx — à valider par l'utilisateur]`
   - Si plusieurs sessions → énumérer chacune avec heure de début (ex: `09:30 — Projet X`)
   - Si fichier trop long (erreur token) → lire par tranches successives (limit: 200, offset: 0 → 200 → 400 → …) jusqu'à fin complète. Ne jamais construire bilan sur lecture partielle — si truncation, noter `[Lecture complète par tranches — synthèse validée]`.
   
3. **Hobby Kanban** : `[HOBBIES_FOLDER]/Hobby Kanban.md`
   - Si absent → skip Étape 1.5 silencieusement
   - Vérifier si colonne `## WIP` contient des tickets (items non vides)

4. **Mood du jour** : `data/mood-tracker-data.json`
   - Si absent → `MOOD_TODAY = null`, continuer
   - Si présent : filtrer entrées dont `dateTime` commence par `YYYY-MM-DD`
   - Stocker dans `MOOD_TODAY` (triées chronologiquement)
   - Si liste vide → `MOOD_TODAY = null`

## Étape 1.5 — Suivi Warhammer (optionnel — skip si Hobby Kanban absent)

**Condition préalable** : Hobby Kanban trouvé.

**Si `## WIP` n'est pas vide** → skip (déjà peuplé, pas besoin de relancer).

**Si `## WIP` est vide** → Poser : "Tu as des figurines en cours ? (Warhammer, peinture, etc.)"

Accepter : "oui", "ok", ou nom concret. Refuser : "non", silence, timeout (30s) → continuer sans écrire.
- Si accepté → ajouter au WIP
- Sinon → continuer sans écrire

## Étape 2 — Construire le bilan

### 2.1 — Agrégation des sessions

Depuis la daily note et `Sessions/[date selon DATE_FORMAT].md`, extraire :
- Quoi : chaque session — projet, tâche, résultat (énumérer chronologiquement)
- Énergie : observations d'états (flow, fatigue, blocages)
- Idées/Décisions : **relever et traiter en Étape 4, pas ici**

### 2.2 — Présentation et validation du bilan

Présenter à l'utilisateur :

> Voilà ce que j'ai vu sur la journée :
> 
> **Ce qui a été fait** :
> - [session 1 — projet/contexte]
> - [session 2 — projet/contexte]
> 
> **Patterns observés** : [si aucun, "pas d'observation"]

**Si `## 📝 Réflexions` existe et remplie** → demander simple confirmation : "C'est bon, je le note ?"
- Accepter : oui, ok, d'accord, ouais. Refuser : non, nope, silence/timeout (45s) → continuer sans modifier.

**Sinon (pas de Réflexions)** → demander :
> (1) Qu'est-ce que t'as vraiment avancé ? (2) Un blocage ou observation ?

Accepter réponses (libre). Timeout (45s) ou pas de réponse → inclure données existantes (sessions, mood) + note "[Quick Wrap skipped — timeout]".

### 2.3 — Écriture du bilan

**Chercher si `## 🌙 Bilan du jour` existe déjà** → Si oui, passer à Étape 3 (bilan déjà écrit). Si non, ajouter en bas de la daily note :

```markdown
## 🌙 Bilan du jour

### Ce qui a été fait
- [session 1 — projet/contexte]
- [session 2 — projet/contexte]

### Énergie & état
- Énergie du jour : [valeur frontmatter ou "non renseignée"]
- Mood : [selon MOOD_TODAY]
  - null → "non renseigné"
  - 1 entrée → "😊 optimiste, 14h30"
  - 2+ entrées → "😊 (14h30) → 😌 (18h00)" [chronologique]
- Score final : [Étape 3]
- État général : [synthèse brève — mood + énergie + observations]

### Patterns détectés
[Si Réflexions existante : "Voir section Réflexions." Sinon : intégrer Quick Wrap de Étape 2.2]

### Demain
- Prochaine étape prioritaire : [depuis les sessions]
- À ne pas oublier : [mentionnés pendant la journée]
```

## Étape 3 — Score et frontmatter

Vérifier si `score:` existe dans frontmatter (valeur numérique 1-5).

**Si présent et valide** → continuer à l'Étape 4.

**Si absent ou invalide** :
- Poser : "Note ta journée sur 5 ?"
- Accepter : nombres 1-5. Refuser : non-nombre, silence/timeout (30s) → skip sans score, continuer à Étape 4.

(Ce score conditionne l'essay-check hebdo à l'Étape 5.)

## Étape 4 — Idées et décisions : filing suggestions

Depuis les sessions et la daily note, **relever toutes les idées/décisions mentionnées** : nouveaux insights, changements de direction, tâches à tracker, tech à explorer, etc.

**Si aucune trouvée** → skip silencieusement, aller à Étape 5.

**Si trouvées** : proposer une destination pour chacune :

```
[Idée] → [Destination : [KNOWLEDGE_FOLDER]/ | [PROJECTS_FOLDER]/… | [ME_FOLDER]/[NOM].md | kanban projet | Hobby Kanban | command-tracker]
```

Présenter :

> Idées/décisions du jour :
> - [item 1] → [destination]
> - [item 2] → [destination]
> 
> Tu veux en filer certaines ?

Accepter : listes explicites ("oui, les 2 premiers", "item X seulement"). Refuser : "non", "nope", silence/timeout (45s) → laisser en daily note, ne rien écrire.

## Étape 5 — Essay-check hebdo (conditionnel)

**Lire** `99 - Claude Code/command-tracker.md` et chercher la dernière ligne `- /essay-check → YYYY-MM-DD`.

**Conditions pour déclencher essay-check** :
- command-tracker existe **ET**
- entrée `/essay-check` trouvée **ET**
- date au format YYYY-MM-DD valide **ET**
- date ≥ 7 jours (overdue)

Sinon (fichier absent, entrée non trouvée, format invalide, ou date < 7j) → skip, fin du closeday.

---

**Si essay-check overdue** :

Si le skill `/essay-check` existe dans `99 - Claude Code/Skills/` → le lancer. Sinon, passer.

## Règles

1. **Aucune écriture sans confirmation** — toujours présenter avant d'écrire
2. **Timeouts standard** — chaque interaction a un max (30-45s selon contexte). À expiration : action par défaut (skip, continuer + note "[action skipped — timeout]")
3. **Fichiers manquants gracieux** — skip silencieux si non bloquant (sauf daily note du jour — créer si absent)
4. **Append-only** — ne jamais écraser la daily note — sections `## 🌙 Bilan du jour` ajoutées en bas. Si existe déjà → skip à Étape 3.
5. **Parsing robuste** — format inattendu (ex : `score: "quatre"`, date malformée) → skip + note "[format invalide]", ne pas bloquer
6. **Chunking par tranches** — trop longs : limit: 200 (sessions) ou 100 (mood), offset: 0 → 200/100 → … jusqu'à fin
7. **Profil utilisateur fallback** — si absent (`[ME_FOLDER]/[NOM].md`), skip tout enrichissement silencieusement (Étape 5 seulement)
