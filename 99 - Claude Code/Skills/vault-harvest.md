---
name: vault-harvest
description: Scanner les daily notes pour en extraire des idées à capitaliser et des liens à traiter. Utiliser quand Victor dit "harvest", "fais le harvest", "scanne mes notes", ou quand /harvest est en retard dans le command-tracker, ou en fin de session si des daily notes ont été mentionnées.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : Vault Harvest

Ce skill transforme les daily notes en capital structuré. Après validation de Victor, Claude Code crée les notes et tickets directement dans le vault via MCP.

## Déclenchement

- Victor dit "harvest", "fais le harvest", "scanne mes notes"
- Victor précise une période : "harvest de la semaine" (lundi-dimanche dernier achevé), "harvest depuis lundi dernier", "harvest des 3 derniers jours"
- Sans précision → proposer "7 derniers jours" et attendre validation (ne pas appliquer par défaut)

## Structure du vault — destinations valides

| Type de contenu | Destination |
|----------------|-------------|
| Réflexion personnelle, idée de vie | `01 - Me/` |
| Warhammer, peinture, technique | `02 - Hobbies/Warhammer/` |
| Guitare, musique | `02 - Hobbies/Guitare/` |
| Impression 3D | `02 - Hobbies/3D Printing/` |
| Concept dev, pattern, outil | `03 - Knowledge/Dev/` |
| Outil, plugin, pratique Claude Code / écosystème IA | `03 - Knowledge/Claude code/` |
| Notes de voyage, lieux | `03 - Knowledge/Travel/` |
| Autre connaissance générale | `03 - Knowledge/` |
| Idée de futur projet (tech à apprendre, besoin perso, idée SaaS) | `04 - Projects/Project ideas/` |
| Idée inclassable, en attente de rangement | `09 - Inbox/` |
| Skill Claude Code à créer ou mettre à jour | `99 - Claude Code/Skills/` — **uniquement pour les fichiers skill actifs, pas pour des notes de connaissance** |
| Réflexion sur l'architecture Claude/vault | `99 - Claude Code/` ou `09 - Inbox/` |
| Note terminée à archiver (ticket Done, spec réalisée) | `Archive/` — voir ADR-003 |

**Ne jamais suggérer un dossier qui n'existe pas dans cette liste.**

## Projets actifs — source de vérité

Lire `04 - Projects/INDEX.md` au début de chaque harvest pour connaître les projets actifs et leurs Kanbans. Si une tâche identifiée concerne un projet listé → créer le ticket dans la colonne **Idea** du Kanban correspondant. Si le projet n'est pas dans l'INDEX → flaguer le projet inconnu pour l'Étape 4 (ne pas créer le ticket avant validation Victor).

Structure Kanban universelle : `Idea → Ready → WIP → Done` (colonne `Blocked` disponible pour les tickets bloqués par dépendance externe)

**Kanbans spéciaux :**
- `Claude Code Kanban` — Kanban unique pour toutes les tâches sans projet spécifique : vie quotidienne, vault/Claude Code, skills, ADR, workflows. Les notes tickets vont dans `09 - Inbox/tickets/`.

**Limite WIP Hobby** : À l'Étape 1 Groupe A, compter les tickets WIP par type (`#warhammer`, `#guitare`, `#3d`, `#jdr`) dans `02 - Hobbies/Hobby Kanban.md`. Si un type atteint 2 WIP, signaler à Victor à l'Étape 4. Ne jamais créer un ticket hobby directement en WIP si la limite est atteinte — créer en Backlog ou Ready à la place.

## Liens — règle permanente

Lire `99 - Claude Code/treated-links.md` au début de chaque harvest. Ne jamais reproposer une URL listée dans ce fichier. Ignorer uniquement les URLs exactes listées — pas les domaines entiers.

**Si une URL est dans treated-links mais mentionnée à nouveau dans les daily notes récentes** : l'ignorer (ne pas refetcher). Si le contexte suggère un contenu changé (ex: version mise à jour, lien partagé pour une raison différente), demander à Victor si c'est une reproposition volontaire avant de la traiter.

---

## Étape 1 — Lire le contexte

**Groupe A — Références (lectures parallèles, indépendantes de la période)**

Lancer ces quatre lectures en parallèle — elles ne dépendent pas des daily notes :
1. Lire `99 - Claude Code/treated-links.md` → récupérer la liste des URLs déjà traitées
2. Lister les titres existants dans `01 - Me/`, `09 - Inbox/`, `99 - Claude Code/Skills/` → pour dédupliquer les idées futures
3. Lire `04 - Projects/INDEX.md` → identifier les projets actifs et leurs Kanbans
4. Lire `02 - Hobbies/Hobby Kanban.md` (si existe) → compter les tickets WIP par type : `#warhammer`, `#guitare`, `#3d`, `#jdr` → stocker compteurs (utilisés à l'étape 4)

**Fallback Groupe A** : Si `Hobby Kanban.md` n'existe pas → stocker compteurs vides (ignorer l'alerte WIP à l'étape 4).

**Groupe B — Confirmation de période + contenu des daily notes (séquentiel après Groupe A)**

1. **Confirmer la période avec Victor** (sauf si déjà précisée au déclenchement) :
   - Proposer : "semaine" (lundi-dimanche du calendrier dernier achevé) / "X derniers jours" / "depuis date Y (exacte)"
   - Si Victor accepte "7 derniers jours" par défaut → appliquer sans délai
   - Si Victor précise une période → l'appliquer
2. **Une fois la période confirmée, lire en parallèle** :
   - Toutes les daily notes de la période dans `00 - Daily notes/` → extraire idées, tâches, URLs, images, signaux
   - Sessions correspondantes dans `99 - Claude Code/Sessions/` → capturer décisions et tâches non documentées
   - `data/mood-tracker-data.json` (si existe) → filtrer entrées dont `dateTime` tombe dans la période → stocker dans `MOOD_PERIOD`

**Fallback Groupe B** : Si `mood-tracker-data.json` n'existe pas ou est invalide JSON → `MOOD_PERIOD = []` (section mood omise à l'étape 4). Si aucune daily note trouvée → signaler et arrêter. Si une daily note n'a pas de date explicitée → la traiter comme étant du jour du nom du fichier (ex: `2026-04-06.md` → date = 2026-04-06).

**Règle de déduplication** : Ne jamais proposer une idée ou note dont le sujet existe déjà dans le vault (vérifier via les résultats du Groupe A).


---

## Étape 2 — Détecter les idées, tâches et signaux

Scanner le contenu pour identifier :
- Un sujet mentionné 2+ fois distinctes sur la période **qui n'existe pas encore dans le vault** (ex: même idée dans 2 daily notes différentes)
- Une technique, outil, concept noté en passant
- Une réflexion personnelle qui revient
- Une intention formulée mais pas suivie d'action
- Une tâche liée à un projet actif (dont le nom figure dans `04 - Projects/INDEX.md`)
- **Projet inconnu identifié** : Si une tâche vise un projet NON listé dans INDEX.md, le flaguer pour l'Étape 4 (ne pas créer le ticket avant validation Victor)
- **Vrais signaux négatifs uniquement** : stress explicite, épuisement, mauvaise passe, isolement, nuits écourtées, perte d'envie générale — jamais signaler les mentions positives ou ambiguës (ex: "je dors moins mais je me sens bien" n'est PAS un signal d'alerte)
- **Patterns de travail** : si une tendance émerge sur la période (énergie systématiquement basse certains jours, sessions plus productives à certains moments, perturbateurs récurrents, nouveau rituel) → proposer un enrichissement de la section "Mode de travail et énergie" dans `01 - Me/{USER_NAME}.md` — jamais écrire dedans directement, toujours proposer à Victor

Catégoriser chaque signal :
- **Idées à capitaliser** → créer une note dans le vault
- **Tâches projet** → créer un ticket dans le Kanban du projet concerné (colonne Idea)
- **Tâches vault/Claude Code** → ticket dans `Claude Code Kanban` (colonne Idea)
- **Signaux d'alerte négatifs** → proposer une mise à jour de `01 - Me/Signaux d'alerte.md` — jamais écrire dedans directement
- **Projets inconnus** → lister dans la présentation Étape 4 (ne pas créer sans validation Victor)

## Étape 3 — Traiter les liens et images

### Images embarquées

Détecter tous les `![[filename.ext]]` dans les daily notes de la période (extensions : png, jpg, jpeg, gif, webp).

Pour chaque image détectée :
1. Trouver le fichier dans le vault — chercher dans `Ressources/Attachements/` en premier, puis glob récursif si non trouvé
2. Vérifier si le container n8n est running :
   ```bash
   docker ps --filter name=n8n --filter status=running --format "{{.Names}}"
   ```
3. Si vide → démarrer :
   ```bash
   docker start n8n
   ```
   Attendre 3-5 secondes.
4. Lire l'image en base64 et appeler le webhook :
   - **Windows (PowerShell)** :
     ```powershell
     $bytes = [System.IO.File]::ReadAllBytes("{VAULT_PATH}\Ressources\Attachements\[filename]")
     $b64 = [Convert]::ToBase64String($bytes)
     $body = @{ type = "image"; filename = "[filename]"; mediaType = "image/[ext]"; data = $b64 } | ConvertTo-Json -Depth 3
     Invoke-WebRequest -Uri "{N8N_WEBHOOK_URL}/webhook/fallback-link" -Method POST -ContentType "application/json" -Body $body
     ```
   - **macOS/Linux (bash)** :
     ```bash
     B64=$(base64 -w0 "/Me/Tha vault/Ressources/Attachements/[filename]")
     curl -s -X POST {N8N_WEBHOOK_URL}/webhook/fallback-link \
       -H "Content-Type: application/json" \
       -d "{\"type\": \"image\", \"filename\": \"[filename]\", \"mediaType\": \"image/[ext]\", \"data\": \"$B64\"}"
     ```

5. n8n retourne `{ title, content }` → créer une note dans la destination appropriée selon le contexte de la daily note
6. Arrêter le container après traitement de toutes les images :
   ```bash
   docker stop n8n
   ```

**mediaType** : `image/png` pour `.png`, `image/jpeg` pour `.jpg`/`.jpeg`, `image/gif` pour `.gif`, `image/webp` pour `.webp`

Si le fichier est introuvable dans le vault → signaler à Victor, ne pas bloquer le reste du harvest.

### URLs

Détecter tous les URLs dans les daily notes de la période, sauf les URLs exactes déjà traitées en mémoire.

**Déléguer le fetch de chaque URL à un agent dédié** — 1 agent par URL, tous lancés en parallèle. Inclure systématiquement les instructions suivantes dans chaque prompt d'agent :
1. **defuddle d'abord** : fetcher `https://defuddle.md/<url>` via WebFetch → si réponse valide (markdown propre, > 100 chars) → utiliser ce contenu et le frontmatter defuddle (`title`, `author`, `site`) pour les métadonnées
2. **Fallback WebFetch** : si defuddle échoue (erreur, page auth, SPA, < 100 chars) → fetcher l'URL originale via WebFetch
3. **Fallback n8n** : si WebFetch échoue → vérifier si n8n tourne (`docker ps --filter name=n8n`), le démarrer si besoin (`docker start n8n`), puis appeler `{N8N_WEBHOOK_URL}/webhook/fallback-link` avec `{ url, type: "youtube" | "article" }` → retourner le `{ title, content }` reçu
4. Un agent en échec ne bloque pas les autres — signaler l'URL en erreur dans le résumé final

### Cas nominal — fetch réussi
```
🔗 [url]
→ Contenu récupéré ✓
→ Destination suggérée : [chemin]
→ Résumé généré (voir ci-dessous)
```

### Cas fallback — fetch échoué
Pour les URLs YouTube au format court (`youtu.be/ID`) : retry automatiquement avec `https://www.youtube.com/watch?v=ID` avant de déclarer fallback.

Si toujours inaccessible, tenter le fallback automatique via n8n :

1. Vérifier si le container n8n est running :
   ```bash
   docker ps --filter name=n8n --filter status=running --format "{{.Names}}"
   ```
2. Si vide (non running) → démarrer le container :
   ```bash
   docker start n8n
   ```
   Attendre 3-5 secondes que le webhook soit prêt.
3. Déterminer le type : `youtube` si l'URL contient `youtube.com` ou `youtu.be`, sinon `article`
4. Appeler le webhook :
   ```bash
   curl -s -X POST {N8N_WEBHOOK_URL}/webhook/fallback-link \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"[URL]\", \"type\": \"[type]\"}"
   ```
5. Si n8n retourne `{ title, content }` → créer la note directement, pas besoin de prompt NotebookLM
6. Toujours arrêter le container après usage (même en cas d'erreur) :
   ```bash
   docker stop n8n
   ```
7. Si n8n échoue ou timeout (connexion refusée, 500, etc.) → proposer fallback NotebookLM ci-dessous

Si n8n échoue ou timeout, proposer un fallback NotebookLM :

**Fallback NotebookLM — Vidéo Warhammer / peinture :**
```
Résume cette vidéo en listant : les techniques de peinture mentionnées, 
les peintures et couleurs utilisées avec leur rôle (base, wash, layer, etc.), 
les étapes dans l'ordre, et les conseils pratiques. Sois factuel et concis.
```

**Fallback NotebookLM — Vidéo tech / dev / outil :**
```
Résume cette vidéo en listant : le problème résolu, les outils ou concepts 
présentés, les étapes clés, et les points importants à retenir pour 
un développeur. Sois factuel et concis.
```

**Fallback NotebookLM — Vidéo générale / podcast :**
```
Résume cette vidéo/podcast en couvrant : le sujet principal, les idées clés 
dans l'ordre, les exemples ou démonstrations notables, et les conclusions 
ou recommandations. Sois factuel et concis.
```

Présenter le lien en attente de fallback :
```
🔗 [url]
→ Accès bloqué / pas de transcript disponible / n8n en erreur
→ Fallback proposé : [prompt NotebookLM adapté]
→ Victor peut : fournir un export HTML, un copier-coller, ou ignorer le lien
→ En attente de validation pour créer la note
```

Si Victor ne fournit pas de contenu, ignorer le lien et le lister comme non traité dans le récapitulatif final.

## Étape 4 — Validation groupée

Présenter un récapitulatif complet. **Ordre de présentation prioritaire : tickets et pistes d'évolution d'abord, notes Knowledge ensuite.** Le but premier du harvest est de détecter les opportunités d'action, pas de produire des notes encyclopédiques.

```
## Harvest [période]

### Tickets à créer
- [ ] [Tâche 1] → Kanban [Projet] — colonne Idea
- [ ] [Tâche 2] → Claude Code Kanban — colonne Idea

### Idées à capitaliser
- [ ] [Idée 1] → [destination]
- [ ] [Idée 2] → [destination]

### ⚠️ Projets inconnus identifiés
> Omettre si aucun projet inconnu trouvé.
- [Tâche X] mentionne "[Nom du projet]" — absent d'INDEX.md. Validez que tu veux que j'ajoute ce ticket ou créez le projet d'abord ?

### 🌤️ Mood de la semaine
> Omettre si `MOOD_PERIOD` contient moins de 3 entrées.
- Rating moyen : [X.X/5] ([icône : 😀 ≥4, 🙂 3-3.9, 😐 2-2.9, 😔 <2])
- Émotions dominantes : [top 3-5 émotions les plus fréquentes avec décompte]

### Signaux d'alerte détectés
- [ ] "[extrait exact de la daily note]" → proposer ajout dans [[Signaux d'alerte]]

### ⚠️ Limites WIP Hobby
> Omettre cette section si aucun type n'atteint 2 WIP.
- ⚠️ Tu as déjà 2 [#type] en WIP — pense à prioriser ou passer un projet en Backlog avant d'en démarrer un nouveau.

### Images à traiter
- [ ] ![[image1.png]] → vision OK → [destination]
- [ ] ![[image2.jpg]] → fichier introuvable

### Liens à traiter
- [ ] [url 1] → fetch OK → [destination]
- [ ] [url 2] → fallback needed
- [ ] [url 3] → non traité (ignoré)

Valide tout / indique ce que tu veux ignorer / fournis les fallbacks manquants.
```

**Attendre la validation de Victor sur l'Étape 4 (récapitulatif) avant de créer quoi que ce soit.**

## Étape 5 — Création via MCP et linking

Uniquement pour les éléments validés par Victor.

**Prérequis** : Vérifier l'accès au vault avant de créer — tenter une lecture de test sur `04 - Projects/INDEX.md` (déjà lu en Étape 1). Si la lecture échoue, signaler à Victor que MCP est indisponible et lister le contenu exact à créer manuellement.

**Créer directement les fichiers et tickets validés par Victor** — lancer les créations sans nouvelle demande de confirmation. Les appels MCP sont atomiques par fichier. Signaler les erreurs de création explicitement.

Pour chaque ticket à créer, appliquer le skill `create-ticket` — il gère le fichier note ET l'insertion dans le kanban. Pour chaque note Knowledge, créer le fichier via Write ou MCP selon le contexte (pas de demande intermédiaire à Victor).

**Après création**, mettre à jour les notes existantes liées via des agents parallèles :

Pour chaque note nouvellement créée (notes Knowledge uniquement, pas les tickets), lancer 1 agent background en parallèle :
- Input : slug de la nouvelle note + tags + mots-clés du titre (2-4 termes)
- L'agent applique la logique recall : scanner `03 - Knowledge/` récursif — scoring titre=3, contenu=2, backlink=2, seuil ≥ 2, max 3 notes candidates
- Pour chaque note candidate, l'agent prépare :
  - **A)** `[[slug-nouvelle-note]] — [raison]` à ajouter dans `## Voir aussi`
  - **B)** 1 bullet à ajouter dans la section la plus pertinente du corps
- L'agent retourne ses proposals (ou rien si score < 2)

Attendre que tous les agents aient terminé. Agréger et dédupliquer (une note existante peut être candidate de plusieurs nouvelles notes). Présenter à Victor pour validation :
```
📎 Mises à jour proposées pour les notes existantes :
- [[note-existante-1]] ← [[nouvelle-note-A]] :
  → Voir aussi : [[nouvelle-note-A]] — [raison]
  → Corps (section "## Points clés") : "- [bullet]"
```

**Ces propositions ne sont que des suggestions** — appliquer uniquement après validation Victor. Si aucune candidate trouvée pour une note → passer silencieusement.

Proposer aussi les liens entre les nouvelles notes elles-mêmes si elles sont liées — après validation de Victor.

### Structure d'une note de technique (Warhammer)
```markdown
---
date: YYYY-MM-DD
source: [url ou "daily note YYYY-MM-DD"]
tags: [warhammer, peinture, technique]
---

# [Nom de la technique]

## Points clés
- ...

## Peintures mentionnées
- ...

## Notes personnelles
> [ce que Victor a ajouté dans sa daily note]
```

### Structure d'une note de concept (Knowledge)
```markdown
---
date: YYYY-MM-DD
source: [url ou "daily note YYYY-MM-DD"]
tags: [dev, concept]
---

# [Nom du concept]

## En une phrase
...

## Points clés
- ...

## Lien avec mes projets
- ...
```

### Structure d'une note Inbox (idée inclassable)
```markdown
---
date: YYYY-MM-DD
source: daily note YYYY-MM-DD
tags: [inbox]
---

# [Titre de l'idée]

## Contexte
> [extrait exact de la daily note]

## À explorer
...
```

### Structure d'un ticket Kanban
```markdown
---
title: [Titre du ticket]
date: YYYY-MM-DD
type: 💡
status: Idea
project: [Nom du projet]
source: harvest YYYY-MM-DD
---

## Description
[Ce qui a été identifié dans la daily note]
```

## Étape 6 — Finalisation et tracker

Après création de tous les fichiers et tickets (validation de Victor incluse) :

1. **Mettre à jour `treated-links.md`** : Ajouter les URLs traitées ou ignorées à la liste existante :
   ```markdown
   - [url] — source: daily YYYY-MM-DD, statut: créé / ignoré / fallback-needed
   ```
   
2. **Mettre à jour le command-tracker** : 
   - Ouvrir `99 - Claude Code/command-tracker.md`
   - Ligne `/harvest` → remplacer la date par la date du jour au format `YYYY-MM-DD`

3. **Résumé final** : Afficher le nombre de notes créées, tickets créés, liens traités, et signaler les éléments en attente (fallbacks NotebookLM, images manquantes, etc.)

## Règles absolues

- **Jamais créer sans validation** — attendre la réponse de Victor sur l'Étape 4 (récapitulatif)
- **Jamais modifier les daily notes** — elles restent telles quelles
- **Jamais écrire dans `Signaux d'alerte.md` directement** — toujours proposer à Victor
- **Créer via MCP sans demande supplémentaire** — les créations suivent la validation de l'Étape 4
- **Destinations valides uniquement** — utiliser le tableau de structure vault ci-dessus
- **Fallback explicite** — si un lien est inaccessible, le dire clairement et attendre
- **Une note = une idée** — ne pas fusionner deux sujets dans la même note
- **treated-links.md** — mis à jour en Étape 6 avec les liens traités ou ignorés
- **Jamais reproposer l'existant** — vérifier le CLAUDE.md et le vault avant de proposer
- **Claude Code Kanban** — créer un ticket ici pour toutes les tâches perso/vault sans projet associé. Notes dans `09 - Inbox/tickets/`, jamais dans `09 - Inbox/` directement
- **Hobby Kanban WIP** — ne jamais créer en WIP si la limite est atteinte. Créer en Backlog ou Ready à la place et signaler à Victor
- **Projets inconnus** — flaguer à l'Étape 4 (ne pas créer le ticket avant validation Victor)
- **Fallback gracieux** — si `mood-tracker-data.json` ou `Hobby Kanban.md` n'existent pas, continuer sans ces données (section omise)
