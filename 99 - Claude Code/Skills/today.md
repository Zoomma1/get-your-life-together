---
name: today
description: Charge le contexte du jour — daily note, agenda, projets actifs, commandes en retard. Point d'entrée recommandé pour démarrer chaque session Claude Code.
---

**Déclenche le plan de la journée** — Génère un agenda adapté à l'énergie, aux contraintes et aux priorités. 

**Invocation** : `/today` à tout moment de la journée (avant 12h = plan complet, 12h-17h = plan recentré, après 17h = plan allégé).

**Exemple scénario** : l'utilisateur appelle `/today` à 14h45, il a une réunion à 15h30 (45 min avant). Le skill détecte la fenêtre courte, affiche "⚡ Micro-session (< 0.5h)", propose 1 tâche légère + le WIP en cours, puis demande la prochaine action après la réunion.

---

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

---

## Étape 0 — Digest de veille tech (parallélisable avec Étape 2)

Vérifier si la daily note du jour (à lire en Étape 2.1) contient déjà une section `## 📰 Digest` :
- Si **oui** → ne pas relancer (skip)
- Si **non** → lancer `/digest` en arrière-plan sans bloquer l'exécution
  - Continuer directement sur Étape 1 — le digest s'exécute en parallèle
  - Timeout 30s : si digest n'a pas commencé ou a échoué après 30s → ignorer et continuer le plan

---

## Étape 1 — Heure de déclenchement + Focus du jour

**Récupérer l'heure courante** via `date +"%H:%M"` (bash) au tout début. Stocker comme `HEURE_LANCEMENT`.

Utiliser `HEURE_LANCEMENT` pour adapter le plan :
- **Matin (avant 12h)** → plan complet, fenêtres normales
- **Après-midi (12h–17h)** → signaler les tâches du matin comme manquées si elles n'ont pas de sens plus tard, recentrer sur ce qui reste faisable aujourd'hui
- **Soir (après 17h)** → plan léger, privilégier les tâches courtes ou hobby, pas de deep work — signaler *"Soirée — plan allégé"*

Afficher `HEURE_LANCEMENT` en en-tête du plan final (Étape 5 template).

---

**Focus du jour**

Si la daily note du jour existe déjà avec une section `## 📅 Plan du jour` **et que cette section contient des tâches cochables** (au moins une ligne `- [ ]` en dehors du bloc `### 📅 Agenda`) → utiliser le focus implicite du plan existant, passer directement à l'Étape 6 de suivi.

Sinon (section absente ou contenant uniquement l'agenda), demander : *"Tu as une envie particulière sur quoi travailler aujourd'hui ?"* — attendre sa réponse.
- Si réponse immédiate (< 30s) → utiliser comme contrainte, l'intégrer en priorité 1 des suggestions (Étape 4)
- Si silence ≥ 30s → continuer sans focus explicite (fallback : proposer les WIP et laisser validerr en Étape 5)

---

## Étape 2 — Lire le contexte

Les étapes 2.0 à 2.12 sont exécutées **en parallèle** (aucune dépendance inter-étapes). Lancer 2.0 (Calendrier) et 2.12 (Mails) en arrière-plan si leurs sources sont distantes/lentes. Les étapes 2.1–2.11 (lecture locale vault) n'attendent rien — lancer immédiatement. Terminer toutes les lectures avant Étape 2.13.

**2.0 — Calendrier** — Vérifier que `99 - Claude Code/config\calendar-url.md` existe. Si oui, fetch l'URL ICS via WebFetch, sinon noter "Calendrier non configuré" et continuer sans bloquer.
   
   **Si fetch réussi** :
   - Parser le contenu ICS. Chaque event commence par `BEGIN:VEVENT` et se termine par `END:VEVENT`
   - Extraire `SUMMARY` (titre), `DTSTART`, `DTEND`, `DESCRIPTION` (optionnel)
   - Format DTSTART : 
     * `DTSTART;TZID=...:20260321T140000` → heure locale, extraire `20260321T140000` → convertir en `21/03 14h00`
     * `DTSTART;VALUE=DATE:20260321` → journée entière → convertir en `21/03 (journée)`
     * `DTSTART:20260321T140000Z` → UTC (rare, convertir à heure locale)
   - Extraire events du **jour en cours** et des **7 prochains jours**
   - Stocker events dans deux listes : `EVENTS_TODAY` (pour jour), `EVENTS_FUTURE` (pour 7 jours)
   - Si `EVENTS_TODAY` est vide → ne pas signaler "agenda vide", continuer normalement (journée complète possible)
   - **Calculer `FENETRE_MIN`** : pour chaque event à heure fixe aujourd'hui non passé, calculer temps disponible avant : `fenêtre = DTSTART - HEURE_LANCEMENT`. Stocker la plus petite fenêtre.
   - **Decoder messages imminents** : 
     * Si event dans les 3 jours contient `rendu|deadline|remise|livraison|dossier|exam|soutenance` → stocker comme `DEADLINE_SIGNALED = true`
     * Si event aujourd'hui/demain contient `réunion|présentation|entretien|soutenance|meeting` → ajouter `Préparer [résumé]` aux tâches de contexte
   
   **Si fetch échoue ou ICS invalide** → marquer `CALENDAR_FAILED = true`, continuer sans blocker. Signal en Étape 5 template.

**2.1 — Daily note d'aujourd'hui**

Lire `[NOTES_FOLDER]/[date selon DATE_FORMAT].md` (date du jour). Si elle n'existe pas → créer avec ce template minimal (ne pas écrire au-delà du frontmatter) :
```yaml
---
date: YYYY-MM-DD
energy: 
work_hours: 
personal_hours: 
hobby_hours: 
---
```
Mémoriser le contenu du frontmatter pour Étape 3 (extraire energy, heures).

**2.1.5 — Mood du jour**

Lire `data\mood-tracker-data.json`. Si le fichier n'existe pas ou est malformé → `MOOD_LATEST = null`, continuer.

Sinon, parser le JSON et filtrer les entrées dont `dateTime` commence par la date du jour (`YYYY-MM-DD`). Stocker dans `MOOD_TODAY` (liste, peut être vide).

- Si `MOOD_TODAY` est vide → `MOOD_LATEST = null`, continuer sans signal
- Sinon → retenir la **dernière entrée chronologiquement** (la plus récente) comme `MOOD_LATEST` 
- `MOOD_LATEST` doit contenir : `moodRating` (1–5), `emotions` (texte), optionnel `note` (texte)
- Si `MOOD_LATEST.moodRating ≤ 2` → flag `MOOD_LOW = true`

**2.2 — Daily note d'hier**

Chercher la section `## 🌙 Bilan du jour` dans la note d'hier. Si absente → signaler en tête du plan : `⚠️ Hier non clôturé — lancer \`/closeyesterday\` si ce skill est disponible, sinon lancer \`/closeday\` manuellement sur hier.`

**2.3 — Commitment scan**

Chercher les patterns dans les daily notes (aujourd'hui, hier, avant-hier si dispo) qui indiquent un engagement non suivi :
- Patterns : lignes contenant `(je vais|j'ai dit|à faire|je dois|promis)` en minuscules, NON précédées de `[x]` (coché) et NON mentionnées dans un kanban en WIP/Done
- Pour chaque match → extraire le texte complet (la ligne jusqu'au `\n`) 
- Classifier en Perso (mentions perso/hobby/dev) ou Travail (mentions pro/projets client)
- Remonter comme tâche portée en Étape 4 avec source = note d'origine

**2.4 — Dernière session**

Lister tous les fichiers dans `99 - Claude Code/Sessions/` et trier par date décroissante.
- Si le fichier le plus récent a une date < aujourd'hui → marquer `FIRST_SESSION_TODAY = true`
- Si le fichier le plus récent est daté d'aujourd'hui → lire pour connaître la prochaine étape et l'état en fin de session précédente

**2.5 — Inbox**

Lire `[INBOX_FOLDER]/` — lister les notes présentes

**2.6 — Projets actifs**

Lire `[PROJECTS_FOLDER]/INDEX.md` pour les projets actifs

**2.7 — Kanbans projet**

Pour chaque projet actif, lire son Kanban. Noter les tickets **WIP**, **Ready**, **Spec** et **Idea**.
- Pour chaque ticket **Ready** ou **Idea** avec note associée (`[[NomTicket]]`) → lire la note
- **Règle dépendances** : avant de suggérer un ticket, vérifier sa section `### Dépendances` — si "Bloqué par : [[X]]" et X n'est pas Done → proposer X à la place
- **Compter Spec** : si un projet a ≥ 3 tickets en Spec non traités → noter pour Étape 3

**2.8 — Hobby Kanban**

Lire `[HOBBIES_FOLDER]/Hobby Kanban.md` — noter les tickets **WIP** et **Ready** par type (#warhammer, #guitare, #3d, #jdr)

**2.9 — Kanbans spéciaux**

Lire et noter **WIP**, **Ready**, **Spec** et **Idea** dans :
- `99 - Claude Code/Claude Code Kanban.md`

Pour chaque ticket **Idea** avec note → lire la note. **Compter Spec** : même règle (≥ 3 → noter)

**2.10 — Profil utilisateur**

Lire le profil utilisateur dans `[ME_FOLDER]/` (fichier `.md` créé par `/setup`) — section "Mode de travail et énergie" pour adapter suggestions

**2.11 — Maintenance vault**

Lire `99 - Claude Code/command-tracker.md` si existe. Pour chaque commande, comparer `last_run + frequency` vs aujourd'hui :
- Si overdue → noter pour Étape 4
- Exclure : `/essay-check` (géré `/closeday`), `/my-world` (géré Étape 4.0)
- Contexte : `/closeweek` si dimanche/lundi, `/closemonth` si 1er du mois
- Fichier manquant → continuer (pas de signal)

**2.12 — Mails (n8n)**

Vérifier n8n et webhook mail-analysis (bash/WSL2) — initialiser `MAIL_SECTION = ""` et `MAIL_FAILED = false` avant de commencer :
- Vérifier container : `docker ps --filter "name=n8n" --filter "status=running" --format "{{.Names}}"`
- Si vide → démarrer : `docker start n8n && sleep 5`
- Appeler webhook (5s timeout = assez pour récupération mails + rendu, évite blocage) : `curl -s -m 5 "http://localhost:5678/webhook/mail-analysis" | jq -r '.markdown // empty'`
- Si réponse non-vide et valide JSON → stocker le contenu dans `MAIL_SECTION`
- **Si réponse vide** → laisser `MAIL_SECTION = ""` (pas de mails, pas d'erreur)
- **Si curl échoue ou JSON invalide** → marquer `MAIL_FAILED = true`, laisser `MAIL_SECTION = ""`. Signal en Étape 5 template.

---

## Étape 2.13 — Vérifier les contraintes hard

Après avoir lu tout le contexte (Étapes 2.0–2.12), initialiser les flags de contrainte :
- `FENETRE_CONSTRAINT = false`
- `MICRO_SESSION = false`
- (MOOD_LOW déjà en 2.1.5, CALENDAR_FAILED et MAIL_FAILED en 2.0/2.12)

Utiliser `FENETRE_MIN` calculée en Étape 2.0 :
- Si `FENETRE_MIN < 1.5h` → flag `FENETRE_CONSTRAINT = true`
- Si `FENETRE_MIN < 0.5h` → flag `MICRO_SESSION = true`

Mémoriser ces flags pour Étape 3 (affecter le nombre de suggestions + leurs types) et Étape 5 (affichage des signaux).

## Étape 3 — Appliquer les contraintes hard + évaluer la charge

**Extraire le frontmatter** (déjà mémorisé en 2.1) :
- `energy:` — niveau d'énergie (1-5, défaut 3)
- `work_hours:`, `personal_hours:`, `hobby_hours:` — heures (défaut 0 chacun)

**Appliquer les contraintes** (flags de 2.13 + profil utilisateur) :
- `MICRO_SESSION = true` → proposer max 1 tâche légère
- `FENETRE_CONSTRAINT = true` → seulement des tâches finissables avant le prochain event, prioriser WIP
- Énergie ≤ 2 + agenda dense (≥ 3 events) → réduire à 1 action + autres optionnelles
- Déplacement noté au frontmatter → exclure PC-bound, adapter mobile
- `MOOD_LOW = true` → tâches mécaniques prioritaires, réduire WIP suggéré

**Calculer la taille du pool de suggestions** :

En mode normal (pas de contrainte hard), générer un **pool de 5 à 10 candidats** issus de tous les kanbans — l'utilisateur choisit ensuite ce qu'il garde pour son plan.

| Énergie | Pool normal | Avec MICRO_SESSION | Avec FENETRE_CONSTRAINT |
|---------|-------------|-------------------|----------------------|
| 1-2 | 5-6 légers | 1 légère (pas de pool) | 2-3 |
| 3 | 6-8 équilibrés | 1 équilibrée (pas de pool) | 3-4 |
| 4-5 | 8-10 ambitieux | 1 ambitieuse (pas de pool) | 4-5 |
| Non fourni | 6 par défaut | 1 | 3 |

Sous contrainte (`MICRO_SESSION` ou `FENETRE_CONSTRAINT`) : ne pas générer de pool, proposer directement le nombre réduit.

**Répartition travail/perso/hobby** :

Calculer `TOTAL_HOURS = work_hours + personal_hours + hobby_hours`.
- Si `TOTAL_HOURS > 10` → normaliser : `work_hours *= 10/TOTAL_HOURS` (idem perso, hobby)
- Inclure un bloc que s'il a > 0h
- Si tout = 0 → signaler en Étape 5 : `⚠️ Pas d'heures renseignées — prioriser les WIP`
- Ne jamais mélanger les 3 blocs dans une suggestion

**Détecte surcharge** (lire 2-3 dernières daily notes) :
- Si patterns "trop", "épuisé" → demander en Étape 5 : *"Je détecte une surcharge. Ça te dit de réduire le plan de 20-30% ?"*
- Sinon continuer normalement

  

## Étape 4 — Générer les suggestions

  

Piocher dans ces sources par ordre de priorité :

0. **Première session du jour** (si `FIRST_SESSION_TODAY = true`) → inclure en tête du plan, avant toute autre suggestion : `💡 Début de journée — lance \`/my-world\` pour charger ton contexte avant de commencer`. Cette tâche disparaît du plan dès que la 2e action non-/my-world est lancée ou cochée

1. **Tickets WIP** — finir ce qui est en cours avant de commencer autre chose. Si WIP est vide mais l'utilisateur a exprimé un focus (Étape 1) → le focus devient la 1re suggestion (remplace WIP comme point de départ)

2. **Commandes vault overdue** — signaler dans section `🔄 Maintenance vault` (séparée du plan) les commandes overdue identifiées en Étape 2.11

3. **Spec backlog** — si un ou plusieurs kanbans ont ≥ 3 tickets en colonne Spec non traités, signaler dans une section `⚠️ Spec backlog` avec le nom du projet et la commande à lancer. Ne pas mélanger avec le plan principal ni avec la Maintenance vault. Le seuil est 3 tickets — en dessous, pas de signal.

4. **Features Ready** — prêtes à dev, pas encore démarrées

5. **Inbox** — notes à ranger, développer ou archiver

6. **Idées récurrentes** — sujets qui reviennent dans les daily notes récentes sans être capitalisés

**Règles de composition du pool (mode normal uniquement)** :

- **Identifier le projet le plus actif** : celui avec le plus d'activité dans les sessions et daily notes des 3 derniers jours → lui allouer 2-3 suggestions en priorité
- **Couverture obligatoire de tous les kanbans** : chaque kanban actif (projets actifs + Claude Code Kanban + Hobby Kanban) doit contribuer au moins 1 suggestion si des tickets WIP ou Ready sont disponibles et non bloqués
- **Équilibre Travail / Perso / Hobby** : respecter la répartition des heures du frontmatter (même règle qu'avant)
- **Présenter le pool comme une liste à choix** : afficher toutes les suggestions, puis demander de sélectionner celles qu'il retient pour son plan. Ne pas pré-sélectionner à sa place.
- **La daily note n'est écrite qu'après validation** : écrire uniquement les tâches que l'utilisateur a retenues (max 5 dans la daily note)

**Section `🗂️ Raffinement` — logique de génération :**

La section est **indépendante** du plan principal — elle est toujours générée dès qu'il y a des tickets Idea dans n'importe quel kanban, quelle que soit la charge du plan.

- Compter le total de tickets Idea dans tous les kanbans (projets actifs + kanbans spéciaux)
- Si total < 10 → proposer 2-3 tickets ; si total ≥ 10 → proposer jusqu'à 5 tickets
- **Priorité 1** : tickets proposés dans la section `🗂️ Raffinement` de la daily note d'hier mais non cochés → les reprendre en tête
- **Priorité 2** : tickets dont la note associée résonne avec le contexte récent (daily notes + sessions des 3 derniers jours)
- **Priorité 3** : tickets sans note, sélectionnés par pertinence thématique
- Pour chaque ticket : `[[NomTicket]]` (ou texte si pas de note) + contexte en 1 phrase + action attendue : **spec** ou **poubelle**
- La section `🗂️ Raffinement` **ne compte pas** dans la limite de 5 actions du plan principal

  

Chaque suggestion doit être :

- **Concrète** — une action précise, pas "travailler sur un projet"

- **Réaliste** — faisable en une session ou moins (une tâche = une session)

- **Utile** — apporte quelque chose de tangible

- **Une à la fois** — ne pas proposer des tâches qui nécessitent de switcher de contexte

- **Liée à sa source** — toujours inclure un lien Obsidian `[[]]` vers la note ou le ticket d'origine pour que l'utilisateur retrouve le contexte sans chercher

  

## Étape 5 — Présenter le plan à l'utilisateur et l'écrire dans la daily note

  

Présenter le plan à l'utilisateur :

**Template et ordre d'affichage** :

Afficher dans cet ordre. Omettre les sections avec indication entre parenthèses.

```
## 📅 Plan du [date]

> ⚠️ Hier non clôturé — lancer `/closeyesterday` avant de commencer
(Omettre si clôturé)

> 🔴 Calendrier indisponible — pas d'events remontés
(Omettre si CALENDAR_FAILED = false)

> 🔴 Webhook mails down — vérifier n8n
(Omettre si MAIL_FAILED = false)

> ⚡ Fenêtre courte (< 1.5h) — plan allégé
(Omettre si FENETRE_CONSTRAINT = false)

> ⚡ Micro-session (< 0.5h) — une tâche légère max
(Omettre si MICRO_SESSION = false)

> 🌧️ Mood bas ≤2 — tâches mécaniques prioritaires  
(Omettre si MOOD_LOW != true)

*Plan généré à [HEURE_LANCEMENT]*

> OPTIONNEL : Si surcharge détectée en Étape 3, ajouter
> Je détecte une surcharge ces 2-3 jours. Ça te dit de réduire le plan de 20-30% ?

**Aujourd'hui : [intention du jour en une phrase]**

Énergie : [X/5] | Travail : [X]h | Perso : [X]h | Hobby : [X]h | Total : [X]h/10h max

Mood : [MOOD_LATEST.moodRating]/5 · [emotions] (Omettre si MOOD_LATEST = null)

### 📅 Agenda
- [heure] — [titre event]
- [date courte] [heure] — [titre event]
(Omettre si aucun event trouvé)

### 💼 Travail
- [ ] [Action pro concrète] — [raison courte]
(Omettre si work_hours = 0)

### 🎯 Perso
- [ ] [Action perso concrète] — [raison courte]
(Omettre si personal_hours = 0)

### 🎨 Hobby
- [ ] [Suggestion hobby concrète]
(Omettre si hobby_hours = 0)

### ⚠️ Spec backlog
- [ ] `/specs [Projet]` — [X] tickets en Spec
(Omettre si aucun kanban n'atteint 3 tickets Spec)

### 🔄 Maintenance vault
- [ ] /harvest — dernière : [date] (+[X]j)
- [ ] /link — dernière : [date] (+[X]j)
(Omettre si aucune commande overdue)

### 📬 Mails
[MAIL_SECTION]
(Omettre si MAIL_SECTION vide)

### 🗂️ Raffinement — [X] Idea au total
- [ ] [[NomTicket]] — [contexte 1 phrase] — **spec** / **poubelle**

---

**Tu peux valider, ignorer, ou me demander de revoir les priorités.**
```

  

- Omettre une section si ses heures sont à 0 ou vides

- Ne jamais dépasser 10h au total même si les heures renseignées dépassent ce seuil

- Pour les suggestions hobby : s'appuyer sur les mentions dans les daily notes récentes (activités hobby mentionnées : peinture, guitare, 3D, JDR, etc.)

Une fois validé par l'utilisateur, écrire le plan dans la section `## 📅 Plan du jour` de la daily note du jour sous forme de checkboxes avec liens Obsidian vers la note source :

  

```markdown

## 📅 Plan du jour

### 📅 Agenda
- [heure] — [titre event]
- [date] [heure] — [titre event]

### 💼 Travail

- [ ] [Action pro] — [[chemin/vers/note-ou-ticket]]
  

### 🎯 Perso
- [ ] [Action perso concrète] — [[PROJECTS_FOLDER/[Projet]/Kanban]]
- [ ] Ranger la note sur claude-mem — [[INBOX_FOLDER/claude-mem]]


### 🎨 Hobby
- [ ] [Action hobby concrète] — [[HOBBIES_FOLDER/[Kanban concerné]]]

### ⚠️ Spec backlog
- [ ] `/specs [Projet]` — [X] tickets en Spec
(Omettre si aucun kanban n'atteint 3 tickets Spec)

### 🔄 Maintenance vault
- [ ] /[commande] — dernière : [date] (+[X]j)
(Omettre si aucune commande overdue)

### 📬 Mails
- **[Expéditeur]** — [résumé court]
(Omettre si MAIL_SECTION vide)

### 🗂️ Raffinement — [X] Ideas au total
- [ ] [[NomTicket]] — [contexte 1 phrase] — **spec** / **poubelle**
(Omettre si aucun ticket Idea)

```

  

Règles pour les liens :

- Ticket Kanban avec sa propre note `[[NomTicket]]` → lien direct vers la note du ticket

- Ticket Kanban sans note dédiée (texte seul dans le kanban) → lien vers le kanban du projet

- Note inbox → lien direct vers la note inbox

- Note Knowledge/Hobbies → lien direct vers la note

- Tâche sans note associée → pas de lien, juste le texte

- Omettre les sections dont les heures sont à 0

  

Si la section n'existe pas dans la daily note → la créer. Si elle existe déjà → ne pas écraser, ajouter les nouvelles actions à la suite.

  

## Étape 6 — Suivi en cours de journée

  

Quand l'utilisateur dit "j'ai fini", "c'est fait", "next", "j'ai quoi à faire" :

1. Lire la section `## 📅 Plan du jour` de la daily note du jour

2. Cocher la tâche terminée avec la date et l'heure : `- [x] [Action] ✅ YYYY-MM-DD HH:mm`

3. Si la tâche correspond à un ticket kanban → **demander** : "Je peux déplacer ce ticket en Done ?" — attendre confirmation avant de le faire

4. **Si des tâches non cochées existent** → proposer la prochaine (sans attendre demande supplémentaire de l'utilisateur)

5. **Si toutes les tâches sont cochées** → relire le contexte (inbox, kanbans) et proposer une nouvelle action

  

## Règles absolues

- **Écrire dans la daily note uniquement** — jamais ailleurs
- **Ne pas écraser le contenu existant** — ajouter à la suite si la section existe déjà
- **Pool 5-10, daily note max 5** — présenter un pool de 5 à 10 candidats (tous kanbans couverts), sélectionner, écrire dans la daily note uniquement ce qu'il retient (max 5 tâches). La section Raffinement est hors quota.
- **Toujours prioriser les WIP** avant le reste
- **Une tâche à la fois** — ne pas surcharger (profil utilisateur)
- **Validation pair-programming** — Étape 6 : demander permission avant de déplacer un ticket en Done (ne jamais autonome)
