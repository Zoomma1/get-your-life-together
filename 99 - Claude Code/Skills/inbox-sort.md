---
name: inbox-sort
description: Scanne 09 - Inbox/ et trie son contenu. Flow A : détecte les tickets orphelins (non référencés dans les kanbans) et propose un rattachement. Flow B : détecte les fichiers racine et les déplace vers leur destination avec patch des wikilinks.
---

Scanne `09 - Inbox/` et propose un rangement structuré en deux flows distincts.

## Kanbans scannés

Toujours scanner ces fichiers pour Flow A :
- `04 - Projects/*/Project management.md` (tous les projets actifs)
- `02 - Hobbies/Hobby Kanban.md`
- `99 - Claude Code/Claude Code Kanban.md`

Un ticket est **référencé** si son basename (sans `.md`) apparaît dans l'un de ces fichiers.
Les daily notes et Sessions **ne comptent pas** comme référence — uniquement les kanbans.

---

## Flow A — `09 - Inbox/tickets/*` (aucun fichier déplacé)

### Étape A1 — Scan

Pour chaque fichier `.md` dans `09 - Inbox/tickets/` :
- Chercher le basename dans tous les kanbans (grep)
- Classer : **référencé** (kanban source) ou **orphelin**

### Étape A2 — Tableau orphelins

Afficher uniquement les orphelins sous forme de tableau numéroté :

```
| n | fichier | résumé | kanban proposé | colonne | raison |
```

**Règles de proposition :**
- `project: [X]` dans le frontmatter → kanban du projet X
- `status: Done` → colonne Done + signaler ("déjà terminé, rattachement pour traçabilité")
- `status: Ready` → colonne Ready
- `status: Idea / Backlog` ou absent → colonne Idea
- Si le ticket décrit une tâche vault/Claude Code sans projet explicite → CC Kanban
- Si la même tâche existe déjà dans un kanban (sans wikilink) → signaler le doublon, proposer de passer en Done avec wikilink ou de skip

**Cas bloqué :** si un ticket contient une note de blocage explicite (ex: "blocked: …"), l'indiquer dans la colonne raison et proposer d'ajouter cette note dans la ligne kanban.

### Étape A3 — Validation

Victor valide ou corrige chaque ligne. Batch inversé autorisé :
- `tout` → valide tous
- `tout sauf 1,3` → valide tous sauf
- `seulement 2,4` → valide uniquement ceux-là

### Étape A4 — Exécution

Pour chaque ticket validé :
- Insérer une ligne dans la colonne cible du kanban, format :
  `- [ ] [[09 - Inbox/tickets/slug|Titre]] — description courte`
- Si note de blocage : ajouter en fin de ligne ` — blocked: "…"`
- **Aucun fichier ticket n'est déplacé ni modifié.**

---

## Flow B — Fichiers à la racine de `09 - Inbox/` (déplacement + patch)

### Étape B1 — Scan

Lister tous les `.md` directement à la racine de `09 - Inbox/` (hors sous-dossiers).
Lire les premières lignes (frontmatter + titre + premiers paragraphes) de chaque fichier.

### Étape B2 — Tableau destinations

Afficher un tableau numéroté :

```
| n | fichier | type détecté | destination proposée | raison |
```

**Heuristique destination (pattern matching sur nom + contenu) :**

| signal | destination |
|--------|-------------|
| `rust` | `03 - Knowledge/Rust/` |
| `angular`, `theodo` | `03 - Knowledge/Dev/` |
| `fstg` | `04 - Projects/From sprue to glory/` |
| `warhammer`, `hobby` | `02 - Hobbies/Warhammer/` |
| tag `meeting-note` ou `vut-*` | `04 - Projects/[projet détecté]/Meeting notes/` |
| tag `ludisep` ou `partenaire` | `04 - Projects/Ludisep/` |
| tag `lecture`, `livre` | `03 - Knowledge/Lectures/` |
| tag `identité`, `vault`, `contexte` | `01 - Me/` |
| déjà traitée / artefact one-shot | `Archive/` |

Si la destination est ambiguë → proposer 2-3 options numérotées, Victor choisit.
Si le dossier destination n'existe pas → le signaler ("sera créé à l'exécution").

### Étape B3 — Corrections libres

Victor peut corriger les destinations en langage libre **avant** validation :
> "3 va dans 03 - Knowledge/Dev/"

Le skill met à jour le tableau et le réaffiche intégralement.

### Étape B4 — Validation batch

- `tout` → valide tous
- `tout sauf 1,3` → valide tous sauf
- `seulement 2,4` → valide uniquement ceux-là

### Étape B5 — Dry-run obligatoire

Avant toute exécution, afficher :

**Déplacements :**
```
09 - Inbox/fichier.md  →  destination/fichier.md
```

**Wikilinks à patcher** (fichiers citeurs) :
```
chemin/citeur.md  :  [[09 - Inbox/fichier]] → [[destination/fichier]]
```

Règles de détection des wikilinks :
- Chercher `[[09 - Inbox/nom-fichier` dans tout le vault (glob `**/*.md`)
- Patcher uniquement les `[[]]` (pas les backticks ni les chemins en texte brut)
- Préserver les aliases : `[[09 - Inbox/xxx|label]]` → `[[destination/xxx|label]]`
- Gérer les variantes `.md` explicites et `#heading`

Demander confirmation explicite : **"Confirme pour exécuter ?"**

### Étape B6 — Exécution

Pour chaque fichier validé :
1. Créer le dossier destination si absent
2. Déplacer le fichier (renommage de chemin)
3. Patcher les wikilinks dans tous les fichiers citeurs

---

## Actions associées (première exécution réussie)

Archiver `09 - Inbox/tickets/triage-tickets-orphelins.md` avec une note dans le fichier :
> "Remplacé par le skill `/inbox-sort` — première exécution réussie le [date]"

---

## Règles absolues

- **Jamais de déplacement sans dry-run validé** (Flow B uniquement)
- **Flow A ne déplace aucun fichier** — uniquement des insertions kanban
- **Pas de modification du contenu des tickets** (Flow A) — uniquement les kanbans
- **Dry-run → confirmation → exécution** : ordre strict, jamais sauter une étape
- **Daily notes et Sessions ≠ ancres kanban** : ne pas compter comme référence pour Flow A
