---
name: evaluateskills
description: Maintenance mensuelle de tous les skills — auto-évaluation, sync avec le skill-creator Anthropic, review qualitative et application des fixes. Déclencher quand Victor dit "évalue les skills", "maintenance skills", "check les skills", "les skills sont à jour ?", ou en fin de session création de skill.
---

# Skill : Evaluate Skills

Maintenance mensuelle de l'ensemble des skills du vault. Ce skill commence toujours par s'évaluer lui-même et synchroniser les principes du skill-creator Anthropic avant d'analyser les autres skills.

Chaque skill est évalué, muté si nécessaire, et la boucle tourne jusqu'à convergence (score stable ou parfait). Tout est tracé dans un fichier de log. Un backup est créé avant toute modification.

## Déclenchement

- Victor dit "évalue les skills", "maintenance skills", "/evaluateskills"
- Fréquence recommandée : une fois par mois
- Optionnel : cibler un sous-ensemble ("évalue les dev skills", "évalue uniquement workon")

---

## Étape 0 — Backup

Avant toute modification, créer un snapshot de l'état actuel des skills.

1. Créer le dossier `99 - Claude Code/Skills/Archives/YYYY-MM-DD_HH-MM/` (date et heure courantes)
2. Copier tous les fichiers `.md` de `Skills/` dans ce dossier (hors `Archives/` lui-même)
3. Confirmer le nombre de fichiers copiés avant de continuer

Confirmer le nombre de fichiers sauvegardés. Ne continuer à l'Étape 1 que si le backup est complètement créé.

---

## Étape 0.5 — Auto-évaluation et sync skill-creator

Avant d'évaluer les autres skills, ce skill s'évalue lui-même.

### Sync avec le skill-creator Anthropic

Charger `document-skills:skill-creator` et lire son contenu intégralement.

Chercher des principes ou règles qui ne sont pas encore reflétés dans l'Étape 2 de ce skill :
- Nouvelles heuristiques de rédaction de skills
- Nouveaux patterns d'évaluation ou catégories de problèmes
- Changements dans les recommandations de structure

Identifier tout élément nouveau découvert. Présenter à Victor le diff proposé pour l'Étape 2. Attendre la validation explicite de Victor avant de continuer.

### Auto-évaluation

Lire ce fichier avec les mêmes principes de l'Étape 2. Identifier tous les problèmes possibles (wording, structure, edge cases) selon les 7 critères.

Présenter les problèmes trouvés à Victor. Appliquer les fixes validés. Une fois complété, continuer à l'Étape 1.

---

## Étape 1 — Inventaire

1. Lire `99 - Claude Code/Skills/INDEX.md` — liste de tous les skills actifs
2. Lire `99 - Claude Code/skills-autoresearch-log.md` si existant — pour connaître l'historique des mutations par skill
3. Construire la liste des skills à évaluer :
   - Si Victor précise un périmètre → se limiter à ce périmètre
   - Sans précision → tous les skills listés dans INDEX.md

Présenter la liste et confirmer avec Victor avant de commencer.

---

## Étape 2 — Principes d'évaluation

Pour chaque skill, appliquer ces principes comme **lentilles d'analyse** — comprendre pourquoi un problème existe plutôt que cocher mécaniquement des cases.

### Scoring — 7 critères (/7)

Chaque critère vaut 1 point. Le score est calculé par l'agent à chaque cycle.

| # | Critère | Question posée |
|---|---------|----------------|
| 1 | **Description** | La description déclenche-t-elle le skill dans les bons contextes, avec suffisamment de formulations concrètes ? |
| 2 | **Lean** | Chaque instruction mérite-t-elle sa place ? Pas de règle dupliquée, pas de lecture inutile ? |
| 3 | **Wording** | Les instructions sont-elles à l'impératif, sans ambiguïté ni conditionnel flou ? |
| 4 | **Edge cases** | Les scénarios limites réalistes sont-ils couverts (fichier absent, format inattendu, liste vide) ? |
| 5 | **Structure** | La logique est-elle à un seul endroit ? Pas de fragmentation entre étapes ? |
| 6 | **Pair-programming** | Le skill n'implique-t-il aucune action autonome sans validation de Victor ? |
| 7 | **Qualité de sortie** | Le skill produit-il une sortie conforme à son intention déclarée ? Pour les skills marqués `narrative_critical: true`, la richesse (regroupement, recul multi-jours, questions ouvertes) prime sur la concision — une version plus courte qui l'élimine est une régression, pas une amélioration. |

> **Note pour les skills `narrative_critical: true`** : le critère 7 est prioritaire. Si une mutation améliore les critères 2 (Lean) ou 5 (Structure) mais dégrade le critère 7, c'est une régression nette — ne pas l'appliquer.

### Catégories de problèmes

Issues issues de l'analyse statique :
- `[BUG]` — comportement incorrect ou cassé
- `[STRUCTURE]` — organisation sous-optimale
- `[LEAN]` — contenu inutile ou redondant
- `[WORDING]` — formulation ambiguë
- `[LOGIC]` — règle ou routing incorrect
- `[EDGE]` — cas limite non couvert

Issues issues du dry-run (autoresearch) :
- `[DRIFT]` — le skill simulé diverge de son intention déclarée
- `[SILENT_FAIL]` — scénario réaliste non couvert, le skill s'arrête sans le signaler
- `[ASSUMPTION]` — le skill suppose une condition externe qui peut ne pas tenir

### Principes issus du skill-creator Anthropic

**Lean** — Chaque instruction doit mériter sa place. Si une règle ou étape n'a pas d'impact observable sur le comportement, elle ne devrait pas être là.

**Pourquoi plutôt que comment** — Les instructions qui expliquent *pourquoi* sont plus robustes que celles qui disent *quoi faire*. Un MUST, ALWAYS, ou NEVER en majuscules est un signal d'alerte — peut-on le remplacer par une explication du raisonnement ?

**Théorie de l'esprit** — Le modèle est intelligent. Lui faire confiance pour généraliser à partir d'exemples plutôt que tout prescrire en dur. Des instructions trop rigides produisent des comportements rigides.

**Forme impérative** — Les instructions doivent être formulées à l'impératif ("Lire le fichier", "Proposer un fix"). Le conditionnel ou le participe présent est moins clair — signal `[WORDING]`.

**Cas limites** — Les scénarios non couverts créent des comportements imprévisibles. Chercher les "et si" non traités.

**Pas de surprise** — Le skill fait ce que son nom et sa description promettent, sans effets de bord cachés.

### Principes spécifiques à ce vault

**Qualité de la description** — La `description` dans le frontmatter est le mécanisme primaire de déclenchement automatique. Une description trop vague = skill jamais déclenché. Vérifier qu'elle inclut plusieurs formulations naturelles et des situations concrètes.

Note : Claude a une tendance à l'undertriggering — ne pas utiliser un skill même quand il serait utile. Une bonne description est légèrement "pushy" : elle liste des contextes précis et des formulations que Victor utiliserait vraiment. Elle cible des tâches complexes/multi-étapes — Claude ne déclenche pas les skills pour des requêtes simples qu'il peut traiter directement.

**Frontmatter YAML valide** — Pas de `##` devant les clés, pas de clé dupliquée.

**Lazy loading** — Ne lire que ce qui est nécessaire pour l'étape en cours.

**Routing logic** — Les destinations (kanban, dossier vault) doivent être correctes pour tous les types de contenu.

**Cohérence structurelle** — La logique d'une section doit être à un seul endroit.

**Compatibilité pair-programming** — Aucun skill ne doit impliquer que Claude prend l'initiative sans validation de Victor.

**Numérotation et références** — Pas de trous dans les numéros, pas de `2b` dans une séquence numérotée.

**Pas de redondance** — Une règle présente dans les Règles absolues ET dans le corps du skill est du bruit.

**Limite de taille** — Un skill efficace tient sous 500 lignes. Au-delà, signal `[LEAN]` à examiner.

**Bundled resources** — Si un skill régénère le même code boilerplate à chaque run, signal `[EDGE]` : ce contenu appartient à `scripts/` ou `references/`.

---

## Étape 3 — Évaluation par batches (Haiku)

**BATCH_SIZE = 8** (ajustable selon la consommation de tokens observée).

Pour chaque batch :

1. Prendre les N prochains skills de la liste
2. Spawner N **agents background Haiku** en parallèle avec le prompt ci-dessous
3. Attendre que tous les agents du batch soient terminés
4. Afficher le récap du batch (voir Étape 3.5)
5. Demander confirmation : **"Batch [X/Y] terminé ([N] skills traités, [M] restants). Continue ? [go / stop]"**
6. Si go → batch suivant. Si stop → sauvegarder l'état et passer à l'Étape 4 avec ce qui a été traité.
7. Si un agent ne retourne rien ou échoue → logger `[FAILED] [nom du skill]` dans le log et continuer le batch sans bloquer.

**Prompt agent (modèle : Haiku) :**

Ne jamais lire les fichiers skills dans le contexte principal pour construire ce prompt. Passer uniquement le chemin — l'agent lit lui-même.

```
Tu évalues et améliores le skill : [nom du skill]
Chemin du fichier : [chemin absolu complet]

Commence par lire le fichier à ce chemin.

Si le frontmatter contient `narrative_critical: true` : mode protégé activé.
- Toute réduction visant les instructions narratives prescriptives (regroupement, recul multi-jours, questions ouvertes, moments forts) est une régression sur le critère 7, même si elle améliore le critère 2 (Lean). Le skill a besoin de ces instructions pour produire sa sortie caractéristique — la "théorie de l'esprit" ne compense pas leur absence.
- Le critère 7 "Qualité de sortie" est prioritaire sur les critères 2 et 5 pour ce skill.

SCÉNARIO D'INVOCATION À SIMULER :
Génère toi-même un scénario réaliste basé sur le nom et la description du skill.
Exemple : si le skill s'appelle "workon", simule Victor qui dit "workon FSTG".

CONTRAINTE ABSOLUE : Ne jamais modifier les chemins de fichiers, les noms d'outils,
les commandes shell, ou les noms de variables dans le skill. Modifier uniquement
la structure, la clarté et la formulation des instructions.

CYCLE D'AMÉLIORATION — tourner jusqu'à convergence (max 5 itérations) :

Itération N :
1. Score initial — évaluer le skill sur les 7 critères (/7) + identifier tous les problèmes ([BUG], [LEAN], [WORDING], [LOGIC], [EDGE], [DRIFT], [SILENT_FAIL], [ASSUMPTION])
2. Si score == 7 ou aucun problème → STABLE, arrêter
3. Générer une version mutée : réécrire le skill en ciblant les problèmes trouvés — garder le frontmatter intact
4. Scorer la version mutée (/7)
5. Si score muté > score initial → écrire la mutation dans le fichier (overwrite), logger "improved run N: X→Y"
6. Si score muté <= score initial → STABLE, logger "converged run N: score X unchanged", garder l'original
7. Continuer à l'itération N+1

ÉCRITURE DANS LE LOG :
Appender à la fin de `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/skills-autoresearch-log.md` (ne jamais écraser).
Une entrée par skill — score initial/final, itérations, status (improved/stable/converged/max_reached), issues, mutations.

FORMAT DE RETOUR vers le contexte principal (une seule ligne) :
`[nom]: X/7 → Y/7 improved [NC]` ou `[nom]: X/7 stable [NC]`  ← si narrative_critical: true détecté
`[nom]: X/7 → Y/7 improved` ou `[nom]: X/7 stable`            ← sinon
```

---

## Étape 3.5 — Récap de batch

Après chaque batch, afficher les lignes de retour des agents (une ligne par skill) :

```
workon: 5/7 → 6/7 improved
today: 2/7 stable
recapsession: 3/7 → 5/7 improved [NC]
...
```

Puis demander : **"Batch [X/Y] terminé. Continue ? [go / stop]"**

Le détail complet de chaque mutation est dans le log — ne pas le relire ici.

---

## Étape 3.6 — Dry-run de validation (Sonnet)

Une fois tous les batches terminés, identifier les skills mutés avec un **delta ≥ 2 points OU dont le retour contient `[NC]`** (skills `narrative_critical: true` — dry-run obligatoire quel que soit le delta, car même un gain d'1 point peut masquer une régression narrative).
Les skills à delta < 2 sans `[NC]` (tweaks mineurs sur skills non-narratifs) sont considérés bas risque — pas de dry-run.

Référencer l'archive créée en Étape 0 pour chaque restauration potentielle. **Archive path : `Skills/Archives/YYYY-MM-DD_HH-MM/`** — remplacer par la date/heure du run courant.

Pour chaque skill sélectionné, spawner un **agent background Sonnet** avec le prompt :

```
Tu valides le skill muté : [nom du skill]
Chemin du fichier muté : [chemin absolu]
Chemin original (archive) : [chemin absolu dans Archives/YYYY-MM-DD_HH-MM/]

Commence par lire les deux fichiers.

VALIDATION :
1. Simuler une invocation réaliste du skill muté (génère toi-même un scénario réaliste)
2. Vérifier qu'aucune régression n'a été introduite :
   - Aucun chemin de fichier modifié
   - Aucune commande shell altérée
   - Le comportement observable reste cohérent avec la description du skill
3. Scorer le skill muté sur les 7 critères
4. Verdict : VALID (score ≥ score Haiku) | REVERT (régression détectée ou score < score Haiku)

Retourner une ligne : [nom]: VALID X/7 | REVERT — [raison courte]
```

Présenter les verdicts à Victor :
- **VALID** → mutation acceptée, fichier reste modifié
- **REVERT** → restaurer immédiatement depuis l'archive avec `cp -r Skills/Archives/YYYY-MM-DD_HH-MM/[skill].md Skills/[skill].md`

Exécuter chaque restauration validée. Signaler l'état final à Victor avant Étape 4.

---

## Étape 4 — Collecte finale et patterns récurrents

Une fois tous les batches et dry-runs terminés, lire `skills-autoresearch-log.md` une seule fois :

1. Construire le tableau final depuis le log
2. Identifier les patterns récurrents (même type de problème sur plusieurs skills → signal que le processus de création de skills doit être amélioré)

---

## Étape 5 — Review finale des mutations

Présenter à Victor :
- Le tableau récapitulatif final (tous batches confondus)
- Pour chaque skill muté validé : le diff des changements appliqués (avant/après)
- Les patterns récurrents identifiés (Étape 4)

Attendre la validation de Victor. Si un skill muté doit être reverté → restaurer depuis `Skills/Archives/YYYY-MM-DD_HH-MM/`.

Une fois les revert éventuels appliqués, invoquer `/evaluateskills-postmortem` avec :
- `ARCHIVE_PATH` = `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/Archives/YYYY-MM-DD_HH-MM/` (chemin du backup Étape 0)
- `MUTATED_SKILLS` = liste des skills mutés validés (après revert éventuels)

Le postmortem est silencieux si aucune régression n'est détectée. S'il alerte, attendre la décision de Victor avant de passer à l'Étape 6.

---

## Étape 5.5 — Sync stubs

Exécuter le script de sync pour créer les stubs manquants :

```powershell
& "$env:USERPROFILE\.claude\sync-skills.ps1"
```

- Si des stubs ont été créés : les mentionner dans le résumé final
- Si tout est à jour : continuer sans commentaire

---

## Étape 6 — Mise à jour du log autoresearch

Écrire dans `99 - Claude Code/skills-autoresearch-log.md` (créer le fichier s'il n'existe pas) :

```markdown
## Run [YYYY-MM-DD HH:MM]

**Backup** : `Skills/Archives/YYYY-MM-DD_HH-MM/` — N fichiers

| Skill | Score initial | Score final | Itérations | Statut |
|-------|--------------|-------------|------------|--------|
| [nom] | X/7 | Y/7 | N | improved / stable / converged / max_reached |

### Changements appliqués
- **[skill]** run 1: [WORDING] description rewritten → score 3→5
- **[skill]** run 2: converged at 5/7

### Patterns récurrents
[Types de problèmes qui reviennent sur plusieurs skills — signal d'amélioration du processus de création]
```

Mettre à jour `99 - Claude Code/command-tracker.md` avec la date/heure du run `/evaluateskills` :
- Format : `| /evaluateskills | [YYYY-MM-DD HH:MM] |` — marquer que la maintenance a été exécutée

