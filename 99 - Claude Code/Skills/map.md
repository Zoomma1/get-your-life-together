---
name: map
description: Cartographie topologique du vault — clusters, dead zones (priorités CLAUDE.md sous-représentées), ponts critiques fragiles. Lance avant /emerge ou /harvestdeep, ou mensuel à partir de 200 notes. Analyse uniquement, ne crée/modifie rien. Actions via /link (orphans), /emerge (émergence), /harvestdeep (patterns temporels).
---

# Skill : /map

Analyse la structure topologique du vault : où les idées se concentrent, où les zones mortes se forment, quels clusters dépendent d'une seule note-pont. L'insight principal est la **dead zone** — sujet prioritaire dans CLAUDE.md mais sous-documenté dans le vault, révélant la pensée non cristallisée.

**Ordre recommandé dans une session d'analyse vault :**
1. `/map` → état structurel present (clusters, gaps, orphans)
2. `/emerge` → détecte les clusters d'idées qui forment quelque chose de nouveau
3. `/harvestdeep` → patterns sur 30 jours de daily notes (temporal view)

**Différence clé avec les autres skills :**
- `/vault-link` → opérationnel : crée des liens entre les notes existantes
- `/emerge` → sémantique : détecte les clusters d'idées qui forment quelque chose de nouveau
- `/harvestdeep` → temporel : patterns sur 30 jours de daily notes
- `/map` → **topologique** : état actuel de la structure, santé des clusters, gaps structurels

**Fréquence recommandée :** mensuel, ou quand le vault dépasse ~200 notes.

---

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

---

## Étape 1 — Scan structurel

Utiliser Glob et Grep pour collecter les données de structure sans tout lire. Déléguer le scan à des agents parallèles préserve le contexte principal pour l'analyse transverse qui suit et évite les timeouts.

**Note :** Les étapes 1a-1d sont parallélisables. L'agrégation finale (avant étape 2) réunit tous les résultats.

### 1a. Distribution par dossier — agents parallèles par dossier

Lancer un agent par dossier racine. Chaque agent exécute `Glob("**/*.md")` sur son chemin.

**Dossiers à scanner :** `[NOTES_FOLDER]/`, `[ME_FOLDER]/`, `[HOBBIES_FOLDER]/`, `[KNOWLEDGE_FOLDER]/`, `[PROJECTS_FOLDER]/`, `05 - ISEP/`, `06 - Work/`, `[INBOX_FOLDER]/`, `99 - Claude Code/`

**Contrat de retour (par agent) :**
```json
{
  "dossier": "chemin/absolu/",
  "count": N,
  "notes": ["chemin1.md", "chemin2.md"],
  "status": "success|empty|error",
  "error_msg": "optional (si error)"
}
```

**Gestion des cas limites :**
- **Timeout agent (>30s)** : relancer le dossier spécifique seul (sans parallèle). Si échec à nouveau : retourner `status: "error"` et continuer (agrégation partielle).
- **Dossier vide** : retourner `status: "empty"`, count: 0.
- **Vault total <20 notes** : fusionner batches 1b-1c en une seule passée agents (overhead parallélisme inutile).

### 1b. Orphans — 1 agent par batch de 15-20 notes

Depuis les listes 1a, constituer des batches de notes dans `[HOBBIES_FOLDER]/`, `[KNOWLEDGE_FOLDER]/`, `[PROJECTS_FOLDER]/`, `05 - ISEP/`, `06 - Work/`. **Exclure `[NOTES_FOLDER]/`** (liens éphémères par nature) et `[INBOX_FOLDER]/` (zone de capture temporaire).

Pour chaque batch, lancer un agent avec ce prompt :

```
Pour chaque note de la liste (chemin complet) :
- Grep(nom_fichier_sans_extension, path="[vault root]") 
  → 0 résultat = orphan (aucune note ne référence ce fichier)
Retourne : { "orphans": ["chemin/vers/note.md"], "batch_size": N, "status": "success|error" }
```

### 1c. Deadends et hubs — 1 agent par batch de 15-20 notes (mêmes batches que 1b)

Pour chaque batch de notes (sélection identique à 1b) :

```
Pour chaque note de la liste (chemin complet) :
- Grep("\\[\\[", path="chemin/vers/note.md") 
  → 0 résultat = deadend (pas de [[...]] dans la note)
- Compter aussi les références entrantes : combien de fichiers contiennent [[nom_note]] ?
Retourne : { 
  "deadends": ["chemin1.md"], 
  "hubs": [{"note": "chemin.md", "inbound_count": 5}],
  "batch_size": N, 
  "status": "success|error" 
}
```

### 1d. Liens non résolus — 1 agent dédié

Lancer un agent qui grep tous les [[...]] du vault, puis valide chaque cible :

```
Grep("\\[\\[[^\\]]+\\]\\]", path="[vault root]") → tous les liens [[...]]
Extraire les références uniques, puis pour chaque lien :
- Vérifier via Glob si le fichier cible existe
- Si NOT_FOUND : enregistrer comme lien non résolu, compter references
Prioriser liens modifiés <1 mois (récence)
Retourne : { 
  "liens_non_resolus": [
    {"lien": "[[NomNote]]", "referenced_by_count": 2, "references": ["fichier1.md", "fichier2.md"]}
  ],
  "total_unresolved": N,
  "status": "success|error" 
}
```

### 1e. Tickets orphelins — bash script séquentiel

Exécuter seul (pas en parallèle) :
```bash
bash "99 - Claude Code/scripts/check-orphan-tickets.sh"
```

Stocker résultat dans `ORPHAN_TICKETS` (liste de slugs, peut être vide).

**Gestion erreur :** Si bash échoue → marquer `ORPHAN_CHECK_FAILED = true`, continuer (pas bloquant).

### Agrégation (orchestrateur principal)

Attendre les retours de tous les agents (avec fallback sur timeouts). Consolider avant étape 2 :
- **Total notes :** somme des counts (1a), moins `[NOTES_FOLDER]/`
- **Orphans :** liste unique des notes sans référence entrante
- **Deadends :** liste unique des notes sans référence sortante
- **Hubs :** TOP 10 par inbound_count
- **Liens non résolus :** liste triée par referenced_by_count décroissant

Les étapes 2, 3, 4 restent dans le contexte principal — elles nécessitent une vue transverse que seul l'orchestrateur possède.

---

## Étape 2 — Identifier les clusters

Depuis les hubs identifiés en 1c, retracer les chaînes de liens via BFS pour former les clusters thématiques.

**Algorithme — BFS clustering :**
1. **Sélection hubs** : Utiliser TOP 10 hubs par inbound_count. Si <10 hubs identifiés : tous les inclure (pas de filtering).
2. **Profondeur BFS** : 
   - Vault ≥50 notes : max 3 sauts depuis le hub (hub → direct refs ↔ 3e niveau)
   - Vault <50 notes : max 2 sauts (évite les super-clusters artificiels)
3. **Expansion** : Pour chaque hub, collecter notes qui le référencent (inbound) + notes qu'il référence (outbound), jusqu'à limite de profondeur.
4. **Fusion** : Deux hubs dont clusters chevauchent >30% des notes → fusionner en un seul cluster.

**Cas limites :**
- Si 0 hubs majeurs (aucune note n'a inbound_count ≥2) : traiter chaque deadend isolé comme "micro-cluster", signaler fragilité générale du vault.
- Si un hub a inbound_count anormalement élevé (>50% des notes) : c'est un "super-hub", signaler concentration excessive.

**Pour chaque cluster identifié, calculer :**
- **Nœud central** : hub principal (inbound_count max du cluster)
- **Taille** : nombre de notes dans le cluster
- **Densité** : ratio (liens internes / liens théoriquement possibles). Forte = notes se lient beaucoup ; faible = gravitation autour du hub seul.
- **Santé** : Actif (notes modifiées <1 mois) / Stable (1-3 mois) / Stagnant (3+ mois) / Négligé (jamais modifié).
- **Connexions intercluster** : vers quels autres clusters ce cluster pointe-t-il ? Lister les liens qui franchissent les frontières de cluster.

### Fragilités structurelles — Notes-ponts critiques

Identifier les notes qui créent des ponts isolés entre clusters :
- **Définition** : une note X est le **seul lien** entre Cluster A et Cluster B.
- **Risque** : si X est supprimée, A et B se déconnectent complètement.
- **Action** : ces notes sont critiques pour la navigabilité — les signaler en tant que "single point of failure" dans la synthèse.

---

## Étape 3 — Identifier les gaps

Trois types de gaps distincts : **dead zones**, **orphans isolés**, **liens non résolus**.

### 3a. Dead zones (insight principal)

Comparer les sujets prioritaires déclarés dans CLAUDE.md (projets actifs, centres d'intérêt, stack technique) avec la densité réelle de notes dans le vault.

| Sujet | Priorité CLAUDE.md | Notes détectées | Clusters | Statut |
|-------|-------------------|-----------------|----------|--------|
| [sujet] | Haute / Moyenne / Faible | [N] | [hub1, hub2] | Dead zone / OK / Sur-représenté |

**Critères :**
- **Priorité haute + 0-2 notes** → Dead zone critique (ex : "MonProjet" est priorité mais aucune note de design)
- **Priorité haute + 3-5 notes, peu connectées** → Dead zone modérée (sujet pensé mais peu développé)
- **Priorité haute + clusters actifs** → OK
- **Priorité faible + 10+ notes** → Attention sink (absorbe de l'énergie sans être stratégique) — candidat pour archive/tri

### 3b. Orphans à valeur potentielle

Pour chaque note orpheline (1b), qualifier automatiquement :
- **(a) Genuinement isolée ?** → Ignorer (ex : brouillon temporaire, test) → pattern filename = "tmp", "test", "draft", "wip"
- **(b) Pas connectée mais mérite de l'être ?** → Candidat haute valeur pour `/vault-link` → titre riche ou mtime <30j
- **(c) Insight oublié ?** → Signaler à l'utilisateur → contenu métier pertinent mais mtime >3 mois
- **(d) Abandonnée accidentellement ?** → Vérifier la date de modification (mtime) → contenu long mais non modifié

**Heuristique automatisée :**
- Si filename contient "tmp", "test", "draft", "wip", "archive" → classe (a)
- Si mtime <30j → classe (b) (travail en cours, pas orphelin)
- Si mtime >90j + taille >500 caractères → classe (c) (oublié mais précieux)
- Sinon → classe (d) (long, vieux, rarement consulté)

### 3c. Liens non résolus à prioriser

Parmi les liens `[[...]]` non résolus (1d), trier par referenced_by_count décroissant :
- **Références multiples (>2)** → Pensée importante qui mérite sa propre note (créer via `/process` ou manuelle)
- **Références simples (1)** → Possiblement typo ou note mineure — vérifier le contexte
- **Sens du lien** → Lire le contexte dans la note qui référence → détermine si c'est vrai gap ou fausse alerte

---

## Étape 4 — Synthèse et présentation à l'utilisateur

Présenter la map complète. **Ne rien créer, ne rien modifier — tout est recommandation.** l'utilisateur décide quelles actions engager.

**Format de sortie :**

```
VAULT MAP — [Date]

## Vue d'ensemble
- Total notes (hors daily notes) : ~[N]
- Daily notes : [N]
- Orphans : [N] (dont [X] à valeur potentielle)
- Deadends : [N]
- Liens non résolus : [N] (dont [X] références multiples)
- Tickets orphelins : [N] (ou "check failed")

## Clusters Map

| Cluster | Hub central | Taille | Densité | Santé | Connexions intercluster |
|---------|------------|--------|---------|-------|------------------------|
| [nom] | [[note-hub]] | ~N | Forte/Moyenne/Faible | Actif/Stable/Stagnant/Négligé | → [ClusterX] via [[NoteY]], [ClusterZ] via [[NoteA]] |

## Narrative topologique
[3-5 phrases décrivant la forme globale : distribution d'attention, clusters isolés, super-hubs, concentration]

## Single points of failure détectés
- [[Note X]] est l'unique pont entre [Cluster A] et [Cluster B] — critique
- [[Note Y]] relie [Cluster C] à [Cluster D] — vérifier sa santé

## Dead zones — Priorités CLAUDE.md sous-représentées

| Sujet (CLAUDE.md) | Priorité | Notes vault | Cluster(s) | Diagnostic |
|---|---|---|---|---|
| [MonProjetA] | Haute | 0-2 | — | ⚠️ Critique : pensé mais non documenté |
| [sujet] | Moyenne | 3-5 | [hub1] | ⚠️ Modérée : peu développé |
| [sujet] | Haute | 8+ | [hub1, hub2] | ✓ OK : clusters actifs |

## Orphans recommandés pour `/vault-link`
- [[note]] — contenu pertinent, mtime < 30j (travail en cours)
- [[note]] — mtime > 90j + long contenu (oublié mais précieux)

## Tickets orphelins
> [Omettre si vide ou check failed]
- `[slug]` — non dans aucun kanban → lier ou archiver

## Liens non résolus de haut impact
- [[Concept X]] — 4 références, pensée importante manquante
- [[Concept Y]] — 2 références, clarifier ou typo ?

## Actions recommandées — par ordre d'impact

### 1. Sécuriser les ponts critiques
Vérifier la santé (mtime récente) de : [[NoteX]], [[NoteY]]

### 2. Relier les orphans actifs
Lancer `/vault-link` sur les [X] orphans identifiés

### 3. Combler les dead zones
- [MonProjetA] → créer spec/design dans `[KNOWLEDGE_FOLDER]/`
- [MonProjetB] → relier à stack technique actuelle

### 4. Résoudre les liens importants non résolus
Ces concepts apparaissent 3+ fois, créer les notes : [[...]]

### 5. Analyser l'émergence et les patterns
- Lancer `/emerge` pour clustering sémantique
- Lancer `/harvestdeep` pour patterns temporels 30j (complète /map)
```

**Conformité pair-programming :** aucune modification autonome, tout est recommandé et soumis à la validation de l'utilisateur.

## Étape 5 — Tracker (optionnel, après validation de l'utilisateur)

Si valider les actions recommandées, mettre à jour le tracker :
- `99 - Claude Code/command-tracker.md` : `/map` → date du jour (YYYY-MM-DD)

---

## Règles absolues

- **Jamais créer ni modifier sans validation explicite** — /map est une analyse, pas une action. Tout est recommandé.
- **Ne pas utiliser de plugins Obsidian** — utiliser Glob et Grep uniquement
- **Exclure `[NOTES_FOLDER]/` des analyses orphan/deadend** — liens éphémères par nature. Inclure dans count total.
- **Dead zones = insight principal** — doivent être clairement distinguées des orphans et deadends
- **Renvoyer vers les bons skills** : orphans → `/vault-link`, clusters fragiles → `/emerge`, patterns → `/harvestdeep`
- **Compatible pair-programming** : présenter la map et les actions, l'utilisateur décide ce qu'il veut traiter
- **Fallbacks requis** : Si un agent parallèle timeout → relancer seul. Si vide → continuer. Si erreur → signaler dans status.
- **Profondeur de clustering :** max 3 niveaux (50+ notes) ou max 2 (< 50 notes) — évite les super-clusters artificiels
- **Heuristiques orphan** : Automatiser la classification (a/b/c/d) par pattern filename + mtime + taille
- **Vault minimal** : Fonctionne sur vault >10 notes. <10 notes : fusionner tous les agents en un seul (overhead parallélisme inutile)
- **Sauvegarder le graph** : Si la map est grande (>10 clusters), exporter le résultat ou offrir un lien pour exploration interactive (optional)
