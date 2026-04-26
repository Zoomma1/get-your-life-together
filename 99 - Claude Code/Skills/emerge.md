---
name: emerge
description: Détecter les clusters d'idées éparpillées dans le vault qui forment ensemble quelque chose de nouveau — un projet ou un essay. Contrairement au drift (idée individuelle récurrente), emerge cherche des connexions inter-notes qui n'ont pas encore été synthétisées, et des conclusions que le vault implique mais n'a jamais tirées. Utiliser manuellement ou automatiquement après un /harvestdeep.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : /emerge

Analyse le vault pour détecter des clusters d'idées éparpillées qui, ensemble, forment quelque chose de nouveau — un projet, un essay, une direction implicite.

**Différence clé avec `/drift`** : 
- drift = 1 idée individuelle revient souvent
- emerge = N idées distinctes convergent vers 1 nouvelle structure

**Test d'une vraie émergence** : "C'est vrai mais je ne l'avais jamais dit" (pas "je sais déjà").

---

## Résumé d'exécution rapide

**Entrée** : Victor lance `/emerge` ou système propose après `/harvestdeep`

**Sortie** : Max 5 clusters proposés avec score/confiance/notes sources, attente validation Victor avant création

**Temps** : ~1-2h complet (dépend du vault — Pass 1B/1C sont les phases lourdes)

**Étapes clés** :
1. **Lire références** (5-10 min) — INDEX, {USER_NAME}.md, command-tracker
2. **Pass transverse** (15-20 min) — détecter candidats inter-domaines
3. **Pass détail** (20-30 min) — appliquer Méthodes A/B/C/D aux candidats
4. **Fabrication check** (5-10 min) — rejeter idées existantes
5. **Scoring** (10 min) — attribuer scores numériques, trier
6. **Présentation** (5 min) — montrer top 5 à Victor
7. **Création + linking** (15-20 min) — après validation Victor

## Déclenchement

- **Manuel** : Victor dit "/emerge", "fais un emerge", "qu'est-ce qui émerge du vault"
- **Automatique** : Harness propose après `/harvestdeep` complet si richesse vault OK (gérée par post-harvest hook, pas via le skill)

---

## Étape 1 — Collecter les candidats bruts

Scan du vault en 2 passes : d'abord orientation + détection rapide, puis capture formelle.

### Phase 1A — Contexte et santé du vault (5-10 min)

Lire pour établir le baseline :
```
1. `04 - Projects/INDEX.md` → projets actifs (exclure de l'analyse)
2. `01 - Me/{USER_NAME}.md` → profil, context (pour interpréter signaux)
3. `99 - Claude Code/command-tracker.md` → date /emerge précédent (éviter redondance)
```

**Santé du vault** : Si < 10 daily notes ou 0 notes dans domaines clés (Me/, Projects/, Knowledge/, Sessions/) → arrêter, signaler "Vault insuffisamment riche".

### Phase 1B — Détection rapide (15-20 min)

Lire un échantillon pour identifier candidats potentiels :
- Dernières 3-5 daily notes : idées récurrentes, tensions non résolues?
- Une note marquante par domaine (Me/, Hobbies/, Knowledge/, Projects/Project ideas/, Sessions/)
- Question : "Cette idée du domaine A résonne-t-elle ailleurs en B ou C?"

**Candidats bruts** à marquer :
- Idée X réapparaît 2+ contextes distincts
- Tension Y non résolue (veux + obstacle + piste)
- Pattern décisionnel Z révélant croyance implicite

**Si 0 candidats** : proposer Victor (continuer Phase 1C ou arrêter?). **Si > 15** : trier par domaines, top 15.

### Phase 1C — Approfondissement des candidats (structure standardisée) (20-30 min)

Pour chaque candidat brut, relire les sources et capturer formellement :

```markdown
## Candidat : [Nom temporaire]

**Domaines** : Me/, Knowledge/, Projects/Project ideas/ (2-3)

**Méthodes confirmées** : [ajout en Étape 2]

**Sources** : 
- [[note1]] — signal/citation
- [[note2]] — signal/citation
- [[note3]] — signal/citation

**Signal clé** : [1-2 phrases : ce qui relie ces sources ensemble]

**État** : Brut (scoring Étape 4)
```

---

## Étape 2 — Valider avec les 4 méthodes

Pour chaque candidat brut de l'Étape 1, relire les sources et tagguer les méthodes qui confirment le signal. Garder seulement les candidats avec 1+ méthodes.

**Processus** :
1. Candidat X : relire sources [A, B, C]
2. Appliquer filtres A/B/C/D (voir sections ci-après)
3. Marquer méthodes confirmées : ex "A+C" (thématique + comportemental)
4. Si 0 méthodes confirmées → rejeter
5. Si 1+ méthodes → garder pour Étape 3

### Résumé des 4 méthodes (guide d'application)

### Filtre 1 — Thématique (Méthode A)

Candidats regroupant 3+ sources d'au moins 2-3 domaines distincts, parlant du même thème.

Critères :
- Pas de lien `[[]]` existant entre les sources (pas déjà connectées)
- Idée réapparaît dans 2+ contextes différents
- Tension explicite : "veux faire X" + "obstacle Y" + "piste solution Z"

### Filtre 2 — Logique (Méthode B)

Candidats où prémisses A + B → conclusion C jamais écrite.

Signaux explicites :
- "je pense que...X" dans note 1 + contexte où X s'applique ailleurs = conclusion implicite
- "le problème c'est...Y" + solution esquissée ailleurs = Y non résolu globalement
- Principe en domaine 1 appliqué à domaine 2 = conclusion nouvelle

### Filtre 3 — Comportemental (Méthode C)

Candidats où pattern de décision 3+ occurrences révèle croyance implicite.

Signaux explicites dans daily notes :
- "j'ai décidé pas", "j'ai annulé", "j'ai sauté" (même décision type évitée 3+ fois)
- Énergie systématiquement donnée à certains domaines, procrastinée sur d'autres
- Évitement consistant = croyance non dite sur le risque ou la valeur

**Confiance haute** : actions + difficiles à faker que paroles.

### Filtre 4 — Convergence (Méthode D)

Candidats où 3+ threads pointent vers même destination non nommée.

Exemples : plusieurs projets différents qui, achevés, produiraient résultat jamais nommé comme goal.

**Confiance basse** : spéculatif, ne consolider que si convergence clairement visible.

---

## Étape 3 — Fabrication check (obligatoire avant Étape 4)

Avant de scorer, vérifier qu'un cluster n'existe pas déjà dans le vault.

**Processus** :
1. Chercher l'idée telle qu'elle serait formulée : lire `04 - Projects/INDEX.md` (projet actif?), `04 - Projects/Project ideas/` (idea note existante?), `03 - Knowledge/` (concept déjà synthétisé?)
2. Si résultat direct → rejeter (répétition, pas émergent)
3. Si idée formulée différemment ailleurs → vérifier si déjà liée par `[[]]` : si oui, connexion existante, pas émergent
4. Si passé check → procéder à Étape 4 (scoring)

**Tracer les rejets** : noter brièvement les candidats rejetés pour transparency.

---

## Étape 4 — Scorer la confiance et consolider

Pour chaque cluster ayant passé le fabrication check, attribuer un score numérique puis un niveau :

**Critères de scoring**

| Élément | Points | Notes |
|---------|--------|-------|
| **Points de données** | +1 par note | Max +5 (au-delà = plus de données détail inutile) |
| **Domaines impliqués** | +1 par domaine (min 2) | +1 si 2 domaines, +2 si 3+. Capped +2. |
| **Méthode A (thématique)** | +1 | Si cluster regroupe 3+ notes thématiquement |
| **Méthode B (logique)** | +1 | Si prémisses A+B → conclusion C jamais écrite |
| **Méthode C (comportement)** | +2 | Si pattern 3+ occurrences (plus fiable que B) |
| **Méthode D (convergence)** | +0.5 | Spéculatif, compter comme demi-point |
| **Tension explicite** | +1 | Si cluster contient tension non résolue |
| **Recurrence sur période** | +1 | Si signal apparaît sur 7+ jours (persistance) |

**Niveaux finaux**

| Score | Niveau |
|-------|--------|
| 6+ | **Haut** — fort signal, prêt à créer ou valider avec Victor |
| 4-5 | **Moyen** — signal clair mais incomplet, à approfondir avec Victor |
| 2-3 | **Faible** — spéculatif, proposer comme exploratoire seulement |
| <2 | **Rejeté** — signal insuffisant, ne pas présenter |

Présenter dans l'ordre : Haut → Moyen → Faible. **Limiter à max 5 clusters présentés** (les plus hauts scores d'abord).

---

## Étape 5 — Qualifier chaque cluster et proposer format

Pour chaque cluster détecté, déterminer ce qu'il appelle :

| Signal | Output suggéré | Cas Victor |
|--------|----------------|-----------|
| **Cluster d'idées techniques / product** — pointe vers un outil, système, app ou SaaS à construire | **Projet** → note dans `04 - Projects/Project ideas/` | Outils dev, automation, infra |
| **Cluster de réflexions, observations, tensions** — observations sur la vie, le travail, la cognition ou concepts sans déliverable concret | **Essay** → texte narratif dans `04 - Projects/Project ideas/` | TDAH, systèmes, processus, réflexions |
| **Cluster ambigu** — pas encore assez clair si c'est un projet ou une réflexion | **Proposer à Victor** : "Je vois deux directions, laquelle tu veux explorer?" |

Utiliser le contexte : si cluster mentionne "build", "tool", "system", "app", "automation" → Projet. Si mentions "pourquoi", "pattern", "croyance", "tension" → Essay.

---

## Étape 6 — Présentation à Victor

Format par cluster :

```
🌱 [Titre du cluster]
- Confiance : [Haut/Moyen/Faible] | Score : X/10
- Méthodes : [A/B/C/D] | Sources : [[note1]], [[note2]], [[note3]]
- Ce qui se forme : [1-2 phrases sur ce que ces idées composent]
- Émergence : [Pourquoi ce n'est pas déjà dans le vault]
- Type : [Projet / Essay / À clarifier]
```

**Aucun cluster** : Afficher ✅ Aucun cluster — vault sain, idées bien isolées ou capitalisées.

**Limite** : Max 5 clusters, triés par score décroissant. Si > 5, présenter top 5 + proposer batch 2.

Attendre validation Victor avant création.

---

## Étape 7 — Création + Linking (après validation)

### 7A — Créer la note (Projet ou Essay)

Ne créer qu'après validation explicite Victor.

**Projet** — note dans `04 - Projects/Project ideas/[slug-titre].md` :

```markdown
---
date: YYYY-MM-DD
source: emerge YYYY-MM-DD
tags: [project-idea]
status: draft
---

# [Titre]

## Pourquoi

[Contexte, motivation — d'où vient l'idée]

## Ce que ça résout

[Problème concret ou besoin]

## Comment

[Approche générale, solution envisagée]

## Comment y arriver

[3-5 étapes concrètes pour démarrer]

## Notes liées

- [[note1]] — signal
- [[note2]] — signal
- [[note3]] — signal
```

**Essay** — même chemin, tags `[essay, draft]` :

```markdown
---
date: YYYY-MM-DD
source: emerge YYYY-MM-DD
tags: [essay, draft]
status: draft
---

# [Titre]

## Pourquoi j'écris ça

[Impulsion, raison d'être]

## Le problème ou la tension

[Ce qui manque, question sans réponse]

## Ce que j'en pense

[Thèse, argument — à remplir par Victor]

## Prochaines étapes

[Direction, comment approfondir]

---

*Brouillon — /emerge YYYY-MM-DD*

## Notes source

- [[note1]] — A/B/C/D
- [[note2]] — A/B/C/D
- [[note3]] — A/B/C/D
```

Utiliser **Write tool** (pas Obsidian API). Chemin : `{VAULT_PATH}\{PROJECTS_FOLDER}\Project ideas\[slug-titre].md`

### 7B — Linker les sources (après création)

Ajouter liens bidirectionnels dans 3-5 sources clés vers la nouvelle note.

**Processus** :
1. Lister sources Étape 1
2. Proposer Victor emplacements précis par source (quelle section, quelle phrase)
3. Valider Victor
4. Ajouter via Edit : `[[NomNoteMere]] — contexte` ou `[[NomNoteMere|label]]` selon besoin

Limiter 5-7 liens (saturation) ; prioriser pertinence.

---

## Étape 8 — Finalisation

Après création + linking (ou si 0 cluster) :

1. Mettre à jour `99 - Claude Code/command-tracker.md` : `/emerge` → YYYY-MM-DD
2. Optionnel (batch auto) : recap dans `99 - Claude Code/skills-autoresearch-log.md`

---

## Edge cases

| Cas | Comportement |
|-----|--------------|
| **Vault insuffisant** | Arrêter Étape 1A : "Vault insuffisamment riche" |
| **0 candidats après Phase 1B** | Demander Victor : "Continuer Phase 1C (détail) ou arrêter?" |
| **> 15 candidats bruts** | Trier par domaines (richesse), garder top 15, proposer batch 2 |
| **0 candidats validés (Étape 2)** | Afficher ✅ "Aucun cluster — vault sain" |
| **Timeout > 1h** | Limiter Phase 1 à 30j (au lieu de complet), signaler Victor |
| **Borderline (Étape 3)** | Demander Victor : "Rework existante ou émergeant?" |
| **/emerge en cours** | Refuser : "Emerge en cours, attendez fin" |
| **Cluster Méthode D seule** | Scorer < 3, proposer exploratoire seulement |

---

## Règles absolues

- **Jamais créer sans validation explicite** de Victor
- **Chercher les connexions inter-domaines** — les clusters les plus intéressants sont souvent cross-contextes
- **Ne pas confondre avec drift** — drift = répétition d'une même idée ; emerge = convergence de plusieurs idées distinctes
- **Fabrication check obligatoire** avant toute présentation — une idée déjà dans le vault n'est pas émergente
- **Une note = un cluster** — ne pas fusionner deux clusters dans la même note
- **Jamais proposer quelque chose qui est déjà un projet actif** dans `04 - Projects/INDEX.md`
- **Max 5 clusters présentés** — trier par score décroissant
- **Validation de linking avant execution** — demander l'OK pour chaque lien ajouté

---

## Pièges à éviter

| Piège | Correction |
|-------|-----------|
| **Connection disguise** — liens déjà existants `[[]]` | Vérifier links : si existe, rejeter |
| **Forced emergence** — inventé sans données vault (intuition Claude) | Exiger 3+ sources concrètes, tracées |
| **Obvious emergence** — idée déjà dans vault | Fabrication check obligatoire, rejeter |
| **Worldview creep** — signal vient de Claude pas du vault | Tracer chaque candidat à ses sources ; rejeter si non-sourcé |

---

## Checklist avant présentation

- [ ] 3+ sources par cluster (Étape 1)
- [ ] Méthodes A/B/C/D appliquées (Étape 2)
- [ ] Fabrication check passé (Étape 3)
- [ ] Score 2+ sinon rejeter (Étape 4)
- [ ] Max 5 clusters, score décroissant (Étape 6)
- [ ] Sources tracées avec signaux cités (Étape 6)
- [ ] Validation Victor avant création (Étape 7)
