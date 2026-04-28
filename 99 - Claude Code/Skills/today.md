---
name: today
description: Générer ou mettre à jour le plan de la journée — agenda adapté à l'énergie, aux contraintes calendaires, aux heures work/perso/hobby et au feedback récent. Lit les daily notes, sessions, kanbans projet, mood tracker, calendrier ICS et webhook mails. Déclencher quand Victor dit "today", "/today", "plan du jour", "qu'est-ce que je fais aujourd'hui", "génère mon plan", "je commence quoi", ou en début de journée. Adapte automatiquement selon l'heure (matin = plan complet, après-midi = recentré, soir = allégé).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

**Déclenche le plan de la journée** — Génère un agenda adapté à l'énergie, aux contraintes et aux priorités. 

**Invocation** : `/today` à tout moment de la journée (avant 12h = plan complet, 12h-17h = plan recentré, après 17h = plan allégé).

**Exemple scénario** : Victor appelle `/today` à 14h45, il a une réunion à 15h30 (45 min avant). Le skill détecte la fenêtre courte, affiche "⚡ Micro-session (< 0.5h)", propose 1 tâche légère + le WIP en cours, puis demande la prochaine action après la réunion.

  

## Préambule — Initialiser les variables

Avant toute étape, initialiser ces variables de contrôle pour éviter les undefined à la lecture :

```
HEURE_LANCEMENT = null
FENETRE_MIN = Infinity  
FENETRE_COURTE = false
CALENDAR_FAILED = false
MAIL_FAILED = false
FIRST_SESSION_TODAY = false
```

---

## Étape 0 — Digest de veille tech (conditionnel, non-blocking)

Vérifier si la daily note du jour contient déjà une section `## 📰 Digest` :
- Si **oui** → skip (digest déjà collecté)
- Si **non** → afficher dans le plan : `⚠️ Pas de digest — lancer /digest dans une session dédiée si tu veux un digest aujourd'hui` et continuer sans bloquer

> **Pourquoi une session dédiée** : `/digest` + `/research-scout` spawne 9 agents parallèles (~30-45 appels API). Lancé dans la même session que `/today`, cela consomme ~70% du quota 5h. Workflow recommandé : lancer `/digest` le soir avec `/closeday` → le digest est prêt le lendemain matin.

---

## Étape 1 — Heure de déclenchement + Focus du jour

**Récupérer l'heure courante** : exécuter `date +"%H:%M"` (bash). Stocker comme `HEURE_LANCEMENT` (ex: "09:15").

Utiliser `HEURE_LANCEMENT` pour adapter le plan :
- **Matin (avant 12h)** → plan complet, fenêtres normales
- **Après-midi (12h–17h)** → signaler les tâches du matin comme manquées si elles n'ont pas de sens plus tard, recentrer sur ce qui reste faisable aujourd'hui
- **Soir (après 17h)** → plan léger, privilégier les tâches courtes ou hobby, pas de deep work — signaler *"Soirée — plan allégé"*

Afficher `HEURE_LANCEMENT` en en-tête du plan final (Étape 5 template).

---

**Focus du jour**

Si la daily note du jour existe déjà avec une section `## 📅 Plan du jour` **et que cette section contient des tâches cochables** (au moins une checkbox `- [ ]` dans une sous-section autre que `### 📅 Agenda`, ex: `### 💼 Travail`) → utiliser le focus implicite du plan existant, passer directement à l'Étape 6 de suivi.

Sinon (section absente ou contenant uniquement l'agenda), poser à Victor : *"Tu as une envie particulière sur quoi travailler aujourd'hui ?"* — attendre sa réponse avec timeout court.
- Si réponse reçue → utiliser comme contrainte, l'intégrer en priorité 1 des suggestions (Étape 4)
- Si silence (timeout ~5s) → continuer sans focus explicite (fallback : proposer les WIP et laisser Victor valider en Étape 5)

---

## Étape 2 — Lire le contexte

Les étapes 2.0 à 2.12 sont exécutées **en parallèle** (aucune dépendance inter-étapes). Lancer 2.0 (Calendrier) et 2.12 (Mails) en arrière-plan si leurs sources sont distantes/lentes. Les étapes 2.1–2.11 (lecture locale vault) n'attendent rien — lancer immédiatement. Terminer toutes les lectures avant Étape 2.13.

**2.0 — Calendrier** — Vérifier que `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\config\calendar-url.md` existe. Si oui, fetch l'URL ICS via WebFetch, sinon noter "Calendrier non configuré" et continuer sans bloquer.
   
   **Si fetch réussi** :
   - Parser le contenu ICS. Chaque event commence par `BEGIN:VEVENT` et se termine par `END:VEVENT`
   - Extraire `SUMMARY` (titre), `DTSTART`, `DTEND`, `DESCRIPTION` (optionnel)
   - Format DTSTART (3 cas) : 
     * `DTSTART;TZID=Europe/Prague:20260321T140000` → heure locale Prague, extraire timestamp `20260321T140000` → convertir en `21/03 14h00` (fuseau déjà local, ne pas transformer)
     * `DTSTART;VALUE=DATE:20260321` → journée entière (pas d'heure) → convertir en `21/03 (journée)`
     * `DTSTART:20260321T140000Z` → UTC avec `Z`, transformer en fuseau local Victor (Brno = UTC+1 hiver, UTC+2 été) → convertir en `21/03 15h00 (ou 16h00)` selon saison
   - Extraire events du **jour en cours** et des **7 prochains jours** (utiliser date YYYY-MM-DD pour filtrer)
   - Stocker events dans deux listes : `EVENTS_TODAY` (pour jour), `EVENTS_FUTURE` (pour 7 jours)
   - Si `EVENTS_TODAY` est vide → ne pas signaler "agenda vide", continuer normalement (journée complète possible)
   - **Calculer `FENETRE_MIN`** : pour chaque event à heure fixe aujourd'hui non encore passé (heure event > HEURE_LANCEMENT), calculer temps disponible avant : `fenêtre_minutes = (heure_event - HEURE_LANCEMENT) en minutes`. Stocker le minimum dans `FENETRE_MIN` (reste `Infinity` si aucun event futur).
   - **Decoder messages imminents** : 
     * Si event dans les 3 prochains jours contient `rendu|deadline|remise|livraison|dossier|exam|soutenance` → stocker comme `DEADLINE_SIGNALED = true`
     * Si event aujourd'hui ou demain contient `réunion|présentation|entretien|soutenance|meeting` → prévoir tâche contexte "Préparer résumé"
   
   **Si fetch échoue ou ICS invalide** → marquer `CALENDAR_FAILED = true`, laisser `EVENTS_TODAY` et `EVENTS_FUTURE` vides, `FENETRE_MIN` à `Infinity`. Signal à Victor en Étape 5 template.

**2.1 — Daily note d'aujourd'hui**

Lire `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\YYYY-MM-DD.md` (date du jour). Si elle n'existe pas → créer avec ce template minimal (ne pas écrire au-delà du frontmatter) :
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

**2.2 — Daily note d'hier**

Chercher la section `## 🌙 Bilan du jour` dans la note d'hier. Si absente → signaler en tête du plan : `⚠️ Hier non clôturé — lancer \`/closeyesterday\` avant de commencer`

Chercher aussi la section `## 📅 Plan du jour` dans la note d'hier. Extraire toutes les lignes `- [ ]` présentes dans les sous-sections du plan (Perso, Travail, Hobby — pas Agenda ni Raffinement). Stocker comme `TACHES_NON_COCHEES_J1`. Si section absente ou vide → `TACHES_NON_COCHEES_J1 = []`.

**2.3 — Commitment scan**

Chercher les patterns dans les daily notes (aujourd'hui, hier, avant-hier si dispo) qui indiquent un engagement non suivi :
- Patterns : lignes contenant `(je vais|j'ai dit|à faire|je dois|promis)` en minuscules, NON précédées de `[x]` (coché) et NON mentionnées dans un kanban en WIP/Done
- Pour chaque match → extraire le texte complet (la ligne jusqu'au `\n`) 
- Classifier en Perso (mentions perso/hobby/dev) ou Travail (mentions pro/Theodo/projets client)
- Remonter comme tâche portée en Étape 4 avec source = note d'origine

**2.4 — Dernière session**

Lister tous les fichiers dans `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` et trier par date décroissante.
- Si le fichier le plus récent a une date < aujourd'hui → marquer `FIRST_SESSION_TODAY = true`
- Si le fichier le plus récent est daté d'aujourd'hui → lire pour connaître la prochaine étape et l'état en fin de session précédente

**2.5 — Inbox**

Lire `{VAULT_PATH}\{INBOX_FOLDER}\` — lister les notes présentes

**2.6 — Projets actifs**

Lire `{VAULT_PATH}\{PROJECTS_FOLDER}\INDEX.md` pour les projets actifs

**2.7 — Kanbans projet**

Pour chaque projet actif, lire son Kanban. Noter les tickets **WIP**, **Ready**, **Blocked** et **Idea**.
- Pour chaque ticket **Ready** ou **Idea** avec note associée (`[[NomTicket]]`) → lire la note
- **Règle dépendances** : avant de suggérer un ticket, vérifier sa section `### Dépendances` — si "Bloqué par : [[X]]" et X n'est pas Done → proposer X à la place

**2.8 — Hobby Kanban**

Lire `{VAULT_PATH}\{HOBBIES_FOLDER}\Hobby Kanban.md` — noter les tickets **WIP** et **Ready**. Catégories ignorées (#warhammer, #guitare, #3d, #jdr) puisqu'elles résident dans les notes de ticket, non dans le kanban.

**2.9 — Kanbans spéciaux**

Lire et noter **WIP**, **Ready**, **Blocked** et **Idea** dans :
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Claude Code Kanban.md`

Pour chaque ticket **Idea** avec note → lire la note.

**2.10 — Profil TDAH**

Lire `{VAULT_PATH}\{PERSONAL_FOLDER}\{USER_NAME}.md` — section markdown "Mode de travail et énergie" pour extraire les adaptations suggérées (ex: "une tâche à la fois", "pas de context switch"). Utiliser ces préférences pour adapter la composition du pool en Étape 4.

**2.11 — Maintenance vault**

Lire `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md` si existe. Pour chaque commande, comparer `last_run + frequency` vs date du jour :
- Si overdue → noter pour Étape 4 (section 🔄 Maintenance vault)
- Exclure automatiquement : `/essay-check` (hook post-session, géré `/closeday`), `/my-world` (gestion Étape 4.0 déjà intégrée)
- Contexte spécial : proposer `/closeweek` si jour = dimanche ou lundi, `/closemonth` si jour = 1er du mois
- Fichier manquant → continuer sans signal (vault neuve)

**2.12 — Mails (n8n)**

Vérifier n8n et webhook mail-analysis (bash/WSL2) — initialiser `MAIL_SECTION = ""` avant de commencer :
- Vérifier container : exécuter `docker ps --filter "name=n8n" --filter "status=running" --format "{{.Names}}"`
- Si vide → démarrer : exécuter `docker start n8n && sleep 5`
- Appeler webhook avec timeout (10s pour récupération + rendu) : exécuter `curl -s -m 10 "{N8N_WEBHOOK_URL}/webhook/mail-analysis"` 
- Parser la réponse :
  * Si réponse est JSON avec clé `.markdown` non-vide → stocker le contenu texte dans `MAIL_SECTION`
  * Si réponse JSON mais `.markdown` absent ou vide → `MAIL_SECTION = ""` (pas de mails à afficher, pas d'erreur)
  * Si réponse invalide (JSON malformé ou curl échoue) → marquer `MAIL_FAILED = true`, `MAIL_SECTION = ""`. Signal à Victor en Étape 5 template.
  * Si curl timeout (> 10s) ou container down → `MAIL_FAILED = true`, continuer sans mails

---

## Étape 2.13 — Vérifier la fenêtre disponible

Après avoir lu tout le contexte (Étapes 2.0–2.12) :

Utiliser `FENETRE_MIN` calculée en Étape 2.0 :
- Si `FENETRE_MIN` < 90 minutes (1.5h) ET `CALENDAR_FAILED` = false (ie, calendrier opérationnel ET event trouvé) → stocker `FENETRE_COURTE = true` pour Étape 4 (surfacing tickets rapides avant l'event)
- Sinon → `FENETRE_COURTE = false`

Rappel: `CALENDAR_FAILED` et `MAIL_FAILED` initialisés en Préambule, mis à jour en Étape 2.0/2.12.

## Étape 3 — Calibrer le pool + les budgets

**Extraire le frontmatter** (déjà mémorisé en 2.1) :
- `energy:` — niveau d'énergie (1-5, défaut 3)
- `work_hours:`, `personal_hours:`, `hobby_hours:` — heures (défaut 0 chacun)

**Si énergie ≤ 2** — avant de générer le pool, poser la question :
> Énergie basse détectée — tu pars sur :
> A) Tâches mécaniques (raffinement, maintenance, tickets rapides)
> B) Plan normal allégé (mix habituel, pool réduit vu l'énergie)

Attendre la réponse pour orienter la sélection en Étape 4. Si silence → continuer en mode B.

**Calculer les budgets par contexte** :

```
budget_perso  = personal_hours  ← temps projets/vault/tâches productives UNIQUEMENT
budget_hobby  = hobby_hours
budget_work   = work_hours
```

**Calculer `CAP_TOTAL`** (garde-fou journée longue) :
Lire les 2 dernières daily notes (J-1 et J-2). Pour chacune, sommer `work_hours + personal_hours + hobby_hours` du frontmatter.
- Si les **2 jours consécutifs** ont tous les deux une somme > 10h → `CAP_TOTAL = 10h` (récupération forcée)
- Sinon → `CAP_TOTAL = min(work_hours + personal_hours + hobby_hours déclarés aujourd'hui, 16h)`

Ne jamais dépasser `CAP_TOTAL` dans la sélection de tâches (remplace l'ancien cap fixe à 10h).

> **Définition stricte de `personal_hours`** : temps alloué aux projets, vault et tâches productives. Les activités extérieures (sorties, tourisme, sport, activités sociales avec Jay) sont **hors quota** — les mentionner si deadline proche mais ne jamais les déduire du budget perso.

> **`/my-world` est hors quota** : ne jamais le déduire de `personal_hours`. Il s'affiche dans la section `💡 Début de journée` uniquement, pas dans le tableau de tâches perso.

Pour chaque tâche sélectionnée, inférer une durée estimée en minutes (ex: "affiner spec" = 45min, "review PR" = 30min). Si durée indéterminable → fallback 45min.

**Filtre de durée par tâche (selon énergie)** :

- Énergie ≤ 2 : ne retenir que les tâches estimées ≤ 1h
- Énergie > 2 et ≤ 3.5 : ne retenir que les tâches estimées ≤ 2h
- Énergie > 3.5 : pas de limite de durée par tâche

Si énergie non renseignée ou non numérique → utiliser `énergie = 3` (filtre ≤ 2h).

**Règle d'arrêt de sélection** : s'arrêter au premier plafond atteint :
1. Budget du contexte épuisé (travail/perso/hobby > heures renseignées), OU
2. Si énergie < 2.5 : 5 tâches atteintes (toutes sections confondues, excl. Raffinement), OU
3. Plus de candidats disponibles (après application du filtre durée)

La section Raffinement est hors quota et s'ajoute toujours.

**Répartition travail/perso/hobby** :

- Inclure un bloc que s'il a > 0h
- Si tout = 0 → signaler en Étape 5 : `⚠️ Pas d'heures renseignées — prioriser les WIP`
- Ne jamais mélanger les 3 blocs dans une suggestion
- Déplacement noté au frontmatter → exclure PC-bound, adapter mobile

**Détecte surcharge** (lire 2-3 dernières daily notes) :
- Si patterns "trop", "épuisé" → demander en Étape 5 : *"Je détecte une surcharge. Ça te dit de réduire le plan de 20-30% ?"*
- Sinon continuer normalement

**Règle batterie sociale — PC = recharge, pas décharge** :
- Si l'agenda du jour contient une sortie / activité sociale dans l'après-midi (cours présentiel non-routine, sortie avec Jay, événement Ludisep, déjeuner amis, RDV médical…) → **ne pas réduire automatiquement** `personal_hours` du budget soirée sur cette base
- Le pattern *PC = recharge* tient pour Victor — voir [[01 - Me/hypothese-batterie-sociale]] et `{USER_NAME}.md`
- Continuer à respecter le frontmatter (Victor déclare la charge réelle), mais ne jamais auto-couper le soir sous prétexte que la journée a été socialement chargée
- Exception : si Victor a **explicitement** signalé une fatigue sociale durable dans une daily note récente (ex: dump "je peux plus voir personne") → traiter comme une surcharge et appliquer la règle ci-dessus

  

## Étape 4 — Générer les suggestions

  

Piocher dans ces sources par ordre de priorité :

0. **Première session du jour** (si `FIRST_SESSION_TODAY = true`) → inclure en section `### 💡 Début de journée` **séparée**, avant toute autre suggestion : `lance \`/my-world\` pour charger ton contexte avant de commencer`. **Hors quota** — ne jamais compter dans le budget `personal_hours` ni dans le tableau de tâches perso. Cette section disparaît du plan dès que la 2e action non-/my-world est lancée ou cochée.

1. **Tickets WIP** — finir ce qui est en cours avant de commencer autre chose. Si WIP est vide mais Victor a exprimé un focus (Étape 1) → le focus devient la 1re suggestion (remplace WIP comme point de départ)

1.5. **Tâches non cochées J-1** (`TACHES_NON_COCHEES_J1`) — si la liste est non vide, injecter chaque tâche dans la section correspondante (Perso, Travail ou Hobby selon son contexte), labelisée *"→ report J-1"*. Appliquer le filtre durée (énergie) : ignorer les tâches estimées trop longues. Ne pas remonter les tâches Agenda ni Raffinement.

2. **Commandes vault overdue** — signaler dans section `🔄 Maintenance vault` (séparée du plan) les commandes overdue identifiées en Étape 2.11

3. **Features Ready** — prêtes à dev, pas encore démarrées

4. **Inbox** — notes à ranger, développer ou archiver

5. **Idées récurrentes** — sujets qui reviennent dans les daily notes récentes sans être capitalisés

**Règles de composition du pool (mode normal uniquement)** :

- **Identifier le projet prioritaire** : appliquer dans l'ordre — (1) compter les mentions du nom de projet (slug ou nom exact) dans les 3 dernières daily notes — le plus mentionné l'emporte ; (2) à égalité, projet avec le plus de tickets WIP ; (3) à égalité finale, prendre le premier dans l'ordre de `04 - Projects/INDEX.md` → lui allouer 2-3 suggestions en priorité. Règle déterministe : jamais de jugement sur "l'activité ressentie".
- **Ordre de sélection dans un kanban** : au sein d'un kanban, les tickets sont pris dans l'**ordre d'apparition dans le fichier** (haut = prioritaire). Ne jamais réordonner par jugement — l'ordre dans le kanban est l'ordre de priorité décidé par Victor. WIP avant Ready, Ready avant Idea.
- **Couverture obligatoire de tous les kanbans** : chaque kanban actif (projets actifs + Claude Code Kanban + Hobby Kanban) doit contribuer au moins 1 suggestion si des tickets WIP ou Ready sont disponibles et non bloqués (sauf si budget épuisé ou plafond énergie basse atteint)
- **Fenêtre courte** : si `FENETRE_COURTE = true`, identifier dans le pool les tickets estimés à moins de 30min et les réserver pour la section `⚡ Avant [event]` de l'Étape 5 — ils font partie du pool mais sont présentés séparément
- **Équilibre Travail / Perso / Hobby** : respecter la répartition des heures du frontmatter. Si budget = 0 pour une section → l'omettre du pool.
- **Filtrage géographique** : si Victor est en déplacement (vérifier `project_victor_location.md` en mémoire), exclure les tâches nécessitant l'appart d'Issy, du matériel stocké là-bas, ou une présence physique locale. Appliquer à toutes les sources (inbox, kanbans, bilan J-1).
- **Pool vide** : si aucun candidat (tous WIP/Ready vides, inbox vide) → ne pas générer de section vide, signaler simplement "Aucune tâche en stock, c'est un bon jour pour le raffinement !" et afficher uniquement Raffinement si tickets Idea existent.
- **Présenter le pool comme une liste à choix** : afficher toutes les suggestions, puis demander à Victor de sélectionner celles qu'il retient pour son plan. Ne pas pré-sélectionner à sa place.
- **La daily note n'est écrite qu'après validation** : écrire uniquement les tâches que Victor a retenues (budget horaire par contexte = contrainte principale). La section Raffinement est hors quota.
- **Énergie basse (< 2.5)** : après présentation des 5 tâches, ajouter en bas du plan : *"Énergie basse — 5 tâches proposées. Tu peux me redemander des tâches si tu veux en faire plus dans la journée."*

**Section `🗂️ Raffinement` — logique de génération :**

La section est **indépendante** du plan principal — elle est toujours générée dès qu'il y a des tickets Idea dans n'importe quel kanban, quelle que soit la charge du plan.

Compter le total de tickets Idea dans tous les kanbans (projets actifs + Claude Code Kanban + Hobby Kanban) :
- Si total = 0 → omettre la section Raffinement
- Si total ∈ [1, 9] → proposer 2-3 tickets
- Si total ≥ 10 → proposer jusqu'à 5 tickets

Ordre de sélection (apply dans cet ordre) :
- **Priorité 1** : tickets proposés dans la section `🗂️ Raffinement` de la daily note d'hier mais non cochés → reprendre en tête (Victor a du contexte frais)
- **Priorité 2** : tickets dont la note associée apparaît dans les daily notes ou sessions des 3 derniers jours (résonnance contexte)
- **Priorité 3** : tickets sans note ou note détachée — pris dans l'ordre d'apparition dans le kanban (haut = prioritaire). Pas de jugement sur la pertinence thématique.

Pour chaque ticket : `[[NomTicket]]` (ou texte brut si pas de note) + contexte en 1 phrase + action : **→ spec** ou **→ poubelle**

**Après validation du plan (Étape 5)** : pour chaque ticket que Victor marque **spec** → invoquer immédiatement `/refine [[NomTicket]]`. Ne pas écrire la daily note avant la fin de chaque `/refine`. Si Victor marque plusieurs tickets spec, les traiter en séquence (un `/refine` à la fois).

La section `🗂️ Raffinement` **ne compte pas** dans les budgets contexte ni dans le plafond énergie basse (5 tâches). Toujours affichée si ≥ 1 ticket.

  

**Garde-fou dormance (obligatoire avant dry-run)** :

Pour chaque projet actif dans `04 - Projects/INDEX.md` :
1. Scanner les daily notes des **7 derniers jours** — chercher le slug ou nom exact du projet
2. Si **0 mention** dans ces 7 jours ET le projet a au moins 1 ticket Ready → projet **dormant**
3. Pour chaque projet dormant (ordre d'apparition dans INDEX.md) : prendre son **1er ticket Ready** (ordre d'apparition kanban) et l'insérer en **position 3 de la section Perso** — après WIP et 1ère suggestion du projet prioritaire, avant les suggestions normales
4. Si plusieurs projets dormants → s'insèrent à la suite (positions 3, 4, …)
5. Un projet déjà présent dans le pool (via couverture obligatoire ou projet prioritaire) n'est pas considéré dormant même s'il n'est pas mentionné

**Rationale** : 7 jours sans mention = risque réel de dérive. 1 ticket forcé en position visible = l'avancement ralentit mais le projet reste vivant.

---

**Dry-run de vérification (obligatoire avant Étape 5)** :

Avant de présenter quoi que ce soit, vérifier mécaniquement :
1. Vérifier le filtre durée : chaque tâche respecte la limite selon énergie (≤ 2 → 1h max, ≤ 3.5 → 2h max, > 3.5 → libre) → supprimer les tâches non conformes.
2. Si énergie < 2.5 et plus de 5 tâches (hors Raffinement) → supprimer les dernières jusqu'à 5.
3. Pour chaque contexte (Travail / Perso / Hobby) : sommer les durées estimées → si **strictement supérieur** au budget du contexte (budget résiduel < 0) : supprimer la dernière tâche ajoutée et réessayer la suivante. Budget = 0 après addition = exact fit, conserver.
4. Si une tâche n'a pas de durée estimée → lui attribuer 45min avant de sommer
5. **Jamais présenter un plan non conforme** — tronquer d'abord, présenter ensuite

Ce dry-run est silencieux (pas affiché à Victor). Son résultat est la liste définitive envoyée à l'Étape 5.

---

Chaque suggestion doit être :

- **Concrète** — une action précise, pas "travailler sur un projet"

- **Réaliste** — faisable en une session ou moins (une tâche = une session)

- **Utile** — apporte quelque chose de tangible

- **Une à la fois** — ne pas proposer des tâches qui nécessitent de switcher de contexte

- **Liée à sa source** — toujours inclure un lien Obsidian `[[]]` vers la note ou le ticket d'origine pour que Victor retrouve le contexte sans chercher

  

## Étape 5 — Présenter le plan à Victor et l'écrire dans la daily note

  

Présenter le plan à Victor :

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

*Plan généré à [HEURE_LANCEMENT]*

> OPTIONNEL : Si surcharge détectée en Étape 3, ajouter
> Je détecte une surcharge ces 2-3 jours. Ça te dit de réduire le plan de 20-30% ?

**Aujourd'hui : [intention du jour en une phrase]**

Énergie : [X/5] | Travail : [X]h | Perso : [X]h | Hobby : [X]h | Total : [X]h/[CAP_TOTAL]h max

### 📅 Agenda
- [heure] — [titre event]
- [date courte] [heure] — [titre event]
(Omettre si aucun event trouvé)

### ⚡ Avant [event] à [heure]
- [ ] [ticket rapide estimé <30min] — (~Xmin)
(Omettre si FENETRE_COURTE = false)

### 💼 Travail
- [ ] [Action pro concrète] — [raison courte] — (~Xh / ~Xmin)
(Omettre si work_hours = 0)

### 🎯 Perso
- [ ] [Action perso concrète] — [raison courte] — (~Xh / ~Xmin)
(Omettre si personal_hours = 0)

### 🎨 Hobby
- [ ] [Suggestion hobby concrète] — (~Xh / ~Xmin)
(Omettre si hobby_hours = 0)

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

- **Cap dynamique** — ne jamais dépasser `CAP_TOTAL` (calculé en Étape 3). Un jour > 10h est ok, pas 2 jours consécutifs — le troisième est cappé à 10h.

- Pour les suggestions hobby : s'appuyer sur les mentions dans les daily notes récentes (activités hobby mentionnées : peinture, guitare, 3D, JDR, etc.)

Une fois validé par Victor, écrire le plan dans la section `## 📅 Plan du jour` de la daily note du jour sous forme de checkboxes avec liens Obsidian vers la note source :

  

```markdown

## 📅 Plan du jour

### 📅 Agenda
- [heure] — [titre event]
- [date] [heure] — [titre event]

### ⚡ Avant [event] à [heure]
- [ ] [ticket rapide estimé <30min]
(Omettre si FENETRE_COURTE = false)

### 💼 Travail

- [ ] [Action pro] — [[chemin/vers/note-ou-ticket]]
  

### 🎯 Perso
- [ ] [Action perso concrète] — [[04 - Projects/[Projet]/Kanban]]
- [ ] Ranger la note sur claude-mem — [[09 - Inbox/claude-mem]]


### 🎨 Hobby
- [ ] [Action hobby concrète] — [[02 - Hobbies/[Kanban concerné]]]

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

  

Quand Victor dit "j'ai fini", "c'est fait", "next", "j'ai quoi à faire" :

1. Lire la section `## 📅 Plan du jour` de la daily note du jour

2. Cocher la tâche terminée : `- [x] [Action] ✅ HH:mm` (exemple : `- [x] Affiner la spec FSTG ✅ 10:47`)

3. Si la tâche correspond à un ticket kanban → **demander à Victor** : "Je peux déplacer ce ticket en Done sur le kanban ?" — attendre confirmation avant le déplacer

4. **Si des tâches non cochées existent** → proposer la prochaine sans attendre demande supplémentaire

5. **Si toutes les tâches du plan sont cochées** → relire les kanbans et inbox, proposer une nouvelle action ou déclarer la journée poutinée

  

## Règles absolues

- **Écrire dans la daily note uniquement** — jamais ailleurs
- **Ne pas écraser le contenu existant** — ajouter à la suite si la section existe déjà
- **Budget horaire = contrainte principale** — remplir les heures disponibles par contexte (frontmatter). Filtre par durée selon énergie : ≤ 2 → 1h max/tâche, ≤ 3.5 → 2h max/tâche, > 3.5 → libre. Si énergie < 2.5 → cap 5 tâches + note "sur demande". La section Raffinement est hors quota.
- **Toujours prioriser les WIP** avant le reste
- **Une tâche à la fois** — ne pas surcharger (profil TDAH)
- **Validation pair-programming** — Étape 6 : demander permission avant de déplacer un ticket en Done (ne jamais autonome)
