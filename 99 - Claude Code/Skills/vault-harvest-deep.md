---
name: vault-harvest-deep
description: Scan complet du vault sur une longue période pour détecter les patterns émergents, les idées récurrentes inter-contextes et les connexions profondes. Utiliser une fois par mois ou quand Victor dit "harvest deep", "deep harvest", "analyse le vault".
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : Vault Harvest Deep

Ce skill est la version mensuelle du harvest — il analyse l'intégralité du vault pour détecter ce que le harvest quotidien ne voit pas : les patterns qui émergent sur la durée, les idées qui reviennent dans des contextes différents, les connexions entre hobbies, projets et vie personnelle.

## Déclenchement

- Victor dit "harvest deep", "deep harvest", "analyse le vault"
- Fréquence recommandée : une fois par mois
- Sans précision de période → analyser les 30 derniers jours de daily notes + tout le vault
- **Durée :** quelques minutes à plusieurs heures selon le volume du vault

## Différence avec le harvest normal

| Harvest | Harvest Deep |
|---------|-------------|
| 7 derniers jours | 30 derniers jours + tout le vault |
| Idées récentes | Patterns sur la durée |
| Capitalisation immédiate | Détection de ce qui émerge |
| Rapide (5-10 min) | Long (peut prendre plusieurs minutes) |

---

## Étape 0 — Proposition optionnelle du /map

Proposer à Victor : *"Veux-tu lancer `/map` avant de commencer ? (recommandé — il contextualise les patterns topologiques du vault)"*

Si Victor accepte → lancer `/map`, attendre le résultat, puis continuer à l'Étape 1. Sinon continuer directement.

---

## Étape 1 — Lire le contexte complet

30 daily notes + 30 sessions + 5 dossiers vault = plusieurs centaines de fichiers à analyser. Procéder par **scan intelligent et progressif** en trois phases sans dépendre d'une orchestration externe.

### Phase A — Références contextuelles (rapide)

Lire dans cet ordre :
1. `99 - Claude Code/treated-links.md` → liste des liens déjà traités (filtre duplicatas potentiels)
2. `04 - Projects/INDEX.md` → projets actifs et kanbans (pour contextualiser les émergences)
3. `01 - Me/{USER_NAME}.md` → profil, centres d'intérêt (baseline pour détecter les drifts personality-related)

### Phase B — Contenu temporel (long mais séquentiel)

Lire en ordre chronologique décroissant (le plus récent d'abord) :
1. Les **30 derniers jours de daily notes** dans `00 - Daily notes/` (fichiers YYYY-MM-DD.md)
   - Extraire : idées mentionnées 2+ fois, signaux d'alerte explicites, intentions sans suite, patterns d'énergie
   - Pour les URLs rencontrées dans les daily notes : utiliser **defuddle d'abord** (`https://defuddle.md/<url>` via WebFetch), fallback WebFetch classique si invalide
2. Les **30 derniers jours de sessions** dans `99 - Claude Code/Sessions/` (mêmes fichiers ou horodatés)
   - Extraire : drifts techniques non capturés dans daily notes, décisions recurentes, patterns de travail

**Note :** Si moins de 30 jours de notes existent, adapter la période à ce qui est disponible.

### Phase C — Scan vault (structure breadth-first)

Scanner les dossiers en cet ordre :
1. `04 - Projects/` → état des projets, dette non actée, réalisations
2. `02 - Hobbies/` → projets hobby actifs/stagnants, intentions non menées
3. `01 - Me/` → notes existantes, sujets traités, capitalisations récentes
4. `03 - Knowledge/` → concepts capitalisés, lacunes, liens manquants
5. `09 - Inbox/` → idées en attente, tickets sans suite

**Important :** Ne pas lire le contenu complet de chaque fichier — examiner rapidement par titre, date et métadonnées pour identifier rapidement les patterns sans saturer le contexte.

## Étape 2 — Détecter les patterns profonds

### Drifts — idées récurrentes non capitalisées

**Critères pour identifier un drift :**
- Mentionné **2+ fois** dans les daily notes ou sessions sur la période
- **Pas de note existante** (vérifier dans `01 - Me/`, `02 - Hobbies/`, `03 - Knowledge/`)
- **Pas de ticket existant** dans les kanbans (`04 - Projects/`)
- Contextes **distincts** (pas la même journée, sur des sujets connexes mais non identiques)

Exemple de drift : le thème guitare mentionné le 2026-03-10 ("j'ai envie de reprendre") et le 2026-03-25 ("trop cher ici") mais pas de note "Guitare" existante.

**Présentation :**
```
🌊 DRIFT : [sujet]
→ Apparu [X fois] : [date 1] "[contexte 1]", [date 2] "[contexte 2]"
→ Non capitalisé
→ Suggestion : créer note / ticket kanban (colonne Idea)
```

Si des drifts sont détectés → les présenter dans la section `🌊 Drifts détectés` du récap.
Pour le traitement complet, proposer à Victor de lancer `/drift` en suivi.

### Patterns émergents — clusters qui forment quelque chose de plus grand

**Critères pour identifier un pattern émergent :**
- **3+ notes / idées connexes** découvertes pendant le scan (dans des contextes différents)
- Apparitions **récentes** (dans les 30 derniers jours minimum; éviter de linker des notes de plus de 3 mois)
- Les idées **s'enrichissent mutuellement** (ensemble elles font sens ; seules elles sont fragmentaires)
- Pas encore de projet / essay / note synthèse existant qui les lie

Exemple : notes "HomeLabServeur", "DevOps learning", "Docker en prod" + mentions en daily (mars) = cluster "Infrastructure hobby project"

**Présentation :**
```
🌱 EMERGE : [nom du cluster]
→ Notes liées : [[note1]], [[note2]], [[note3]]
→ Ce qui se forme : [description de l'idée commune]
→ État : [fragmentaire / proto-projet]
→ Suggestion : créer essay / note-projet / ticket kanban
```

Si des clusters sont détectés → les présenter dans la section `🌱 Patterns émergents` du récap.
Pour la création complète (note projet ou essay), proposer à Victor de lancer `/emerge` en suivi.

## Étape 2.5 — Lint pass sur `03 - Knowledge/`

Scanner `03 - Knowledge/` (tous sous-dossiers) pour détecter les problèmes de qualité dans la base de connaissance.

**Patterns à signaler :**
- **Contradictions** : claim dans une note A contredit par une note B plus récente (ex: "Graphify recommandé pour le vault" vs ADR-034 "graphify scopé dev uniquement")
- **Notes stales** : note datée de plus de 6 mois dont le contenu porte sur un outil ou pratique qui a évolué dans les sessions/daily notes récentes
- **Orphelines sans inbound links** : notes Knowledge qui ne sont référencées par aucune autre note (`[[slug]]` absent de tout le vault) — candidates à l'archivage ou au linking
- **Cross-refs manquants évidents** : deux notes Knowledge qui parlent manifestement du même sujet sans se lier mutuellement

**Présentation (section dédiée dans le récap Étape 5) :**
```
### 🔍 Lint Knowledge
- ⚠️ Contradiction : [[note-A]] affirme X, [[note-B]] (2026-04-XX) dit Y
- 🕸️ Orpheline : [[note-C]] — aucune note ne la référence
- 🔗 Cross-ref manquant : [[note-D]] et [[note-E]] parlent de Y sans se lier
```

Si aucun problème détecté → passer silencieusement à l'Étape 3.

---

## Étape 3 — Signaux d'alerte sur la période

Scanner les 30 jours pour les **vrais signaux négatifs explicites uniquement**.

**Signaux à rapporter :**
- Stress ou épuisement explicite ("J'ai un burnout", "Je suis trop fatigué", "C'est trop")
- Nuits écourtées ou insomnie ("4h de sommeil", "Je dors mal depuis X jours")
- Isolement ou repli ("J'ai l'impression d'être seul", "Plus envie de voir personne")
- Perte d'envie généralisée ("Rien ne m'intéresse en ce moment", "J'ai perdu ma motivation")
- Décisions radicales / ruptures ("Je vais tout arrêter", "Je quitte mon projet")

**Ne JAMAIS rapporter :**
- Mentions positives ("Je me sens bien", "C'était un bon jour")
- Énoncés ambigus ("Je dors moins mais je suis productif" = pas un signal d'alerte)
- Stress contextuel court ("Deadline demain" = normal, pas alerte)
- Plaintes sans contexte émotionnel négatif ("C'était compliqué" ≠ "Je suis déprimé")

**Présentation :**
```
⚠️ Signaux détectés ce mois :
- [date] : "[extrait exact du daily note]"
- [date] : "[extrait exact]"

Aucun signal / Signaux détectés et action recommandée :
→ [Proposer mise à jour de [[Signaux d'alerte]] ? / Aucun suivi nécessaire]
```

## Étape 4 — Inbox review (optionnel si `09 - Inbox/` existe)

Si `09 - Inbox/` existe et contient des notes : proposer à Victor une action pour chaque note.

**Laisser Victor choisir parmi :**
1. **Ranger** → destination dans le vault (ex: `01 - Me/`, `02 - Hobbies/`, `03 - Knowledge/`)
2. **Développer** → idée prometteuse, mérite 200+ mots et linking avant de ranger
3. **Archiver** → date périmée, contexte passé, ou redondant avec une note existante
4. **Garder** → toujours en cours de réflexion, repasser le mois prochain

**Si `09 - Inbox/` vide ou absent**, passer silencieusement à l'Étape 5.

## Étape 5 — Validation et création

Présenter tout en une fois :

```
## Deep Harvest [mois]

### 🌊 Drifts détectés
...

### 🌱 Patterns émergents
...

### ⚠️ Signaux d'alerte
...

### 📥 Inbox review
...

Valide ce que tu veux traiter.
```

**Attendre la validation de Victor pour chaque élément.** Une fois validés :
- Je crée via MCP les notes Knowledge et tickets kanban approuvés
- Respecter le naming du vault

**Si Victor approuve 2+ notes Knowledge**, proposer : *"Tu veux que je cherche les notes existantes à lier avec les nouvelles ?"* Lancer `/link` en suivi si oui, sinon continuer.

**Si Victor refuse tous les drifts/emerge**, passer directement à l'Étape 6 (tracker + session).

## Étape 6 — Mettre à jour le tracker et la session

Après completion du harvest deep (création + validation de Victor incluse) :

1. Mettre à jour `99 - Claude Code/command-tracker.md` :
   - Ligne `/harvestdeep` (ou `/harvest-deep`) → remplacer la date par la date du jour au format `YYYY-MM-DD`

2. Ajouter un recap dans la note de session du jour `99 - Claude Code/Sessions/YYYY-MM-DD.md` :

```markdown
## Session — /harvestdeep [mois année]

### ✅ Accompli

**Analyse :** [X daily notes, X sessions, dossiers scannés]

**Drifts détectés :**
- **[nom drift]** — [fréquence + contextes]
- ...

**Patterns émergents :**
- **[nom emerge]** — [description courte]
- ...

**Signaux d'alerte :** [synthèse ou "aucun signal de burnout"]

**Anomalies détectées :** [kanbans, orphelins, incohérences — ou "aucune"]

### 🔧 Fichiers créés / modifiés

- [liste des actions réalisées]

### 🧠 Décisions prises

- [décisions non triviales prises pendant la session]

### ⏭️ Prochaine étape

- [ce qui découle directement du harvest]
```

## Gestion des cas limites

### Moins de 30 daily notes ou sessions absentes

- Si le vault contient moins de 30 daily notes : analyser **toutes les daily notes disponibles** et adapter le récap ("X dernières dates" au lieu de "30 derniers jours")
- Si `99 - Claude Code/Sessions/` n'existe pas ou est vide : passer cette phase et noter "Aucune session disponible"

### Dossiers inaccessibles ou vides

Si un dossier n'existe pas ou est vide (ex: `02 - Hobbies/` vide), ignorer silencieusement et continuer au suivant.

