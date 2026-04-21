---
name: github
description: Interface GitHub unifiée via `gh` CLI — sélectionner un repo actif puis exécuter des actions (PRs, issues, CI, fichiers, commentaires) sans quitter Claude Code. Toutes les opérations passent par `gh` ou `gh api`, sans dépendance MCP.
---

# Skill : GitHub

Interface unifiée pour les opérations GitHub. Toutes les commandes utilisent `gh` CLI ou `gh api` — aucune dépendance MCP.

**Prérequis** : `gh` authentifié (`gh auth status` doit retourner un compte actif).

## Invocation

`/github [action]`

Si `$ARGUMENTS` est vide → **Mode sélection repo** (Action 0).

---

## Action 0 — Sélection du repo (pas d'argument ou repo non défini en session)

1. Calculer la date d'il y a 2 mois (depuis la date du jour) au format `YYYY-MM-DD`
2. Lancer :
   ```bash
   gh repo list Zoomma1 --limit 30 --json name,updatedAt,defaultBranchRef \
     --jq '.[] | select(.updatedAt > "YYYY-MM-DD") | "\(.name) — \(.updatedAt[0:10]) — default: \(.defaultBranchRef.name)"'
   ```
3. Afficher :
   ```
   Prêt à utiliser GitHub. Repos actifs (2 derniers mois) :
   1. FromSprueToGlory — 2026-04-14 — default: staging
   2. Waddle — 2026-04-12 — default: main
   ...
   Sur quel repo on travaille ?
   ```
4. Victor répond le numéro, le nom partiel, ou un nom hors liste
   - Si hors liste → résoudre via `gh repo view Zoomma1/[nom] --json name,defaultBranchRef`
5. Retenir `owner/repo` et `default_branch` pour toute la session
6. Si une action était en attente (ex: `/github prs` avant sélection) → l'exécuter maintenant

**Repo retenu en session** — ne plus redemander tant que Victor ne change pas explicitement de repo.

---

## Actions disponibles

### `/github help`

Afficher :
```
Actions disponibles :
  (vide)                       Sélection du repo actif
  prs                          Lister les PRs ouvertes
  pr #123                      Lire une PR
  issues                       Lister les issues ouvertes
  issue #123                   Lire une issue
  create issue [titre]         Créer une issue
  comment [#123] [texte]       Commenter une issue ou PR
  ci [branche?]                Statut CI — branche optionnelle (défaut: default_branch)
  listFiles [chemin?]          Lister les fichiers d'un dossier du repo
  readFile [chemin]            Lire le contenu d'un fichier du repo
  help                         Cette aide
```

---

### `/github prs`

```bash
gh pr list --repo owner/repo --state open
```

Afficher : numéro, titre, branche source, auteur, date.

---

### `/github pr #123`

```bash
gh pr view 123 --repo owner/repo
```

---

### `/github issues`

```bash
gh issue list --repo owner/repo --state open
```

---

### `/github issue #123`

```bash
gh issue view 123 --repo owner/repo
```

---

### `/github create issue [titre]`

1. Demander confirmation : "Créer l'issue '[titre]' sur [owner/repo] ?"
2. Après confirmation :
   ```bash
   gh issue create --repo owner/repo --title "[titre]" --body ""
   ```
3. Retourner l'URL de l'issue créée

---

### `/github comment #123 [texte]`

1. Détecter si #123 est une issue ou une PR :
   ```bash
   gh pr view 123 --repo owner/repo --json number 2>/dev/null || echo "issue"
   ```
   - Si PR → `gh pr comment`
   - Si issue → `gh issue comment`
2. Demander confirmation : "Commenter #123 avec : '[texte]' ?"
3. Après confirmation :
   ```bash
   # PR
   gh pr comment 123 --repo owner/repo --body "[texte]"
   # Issue
   gh issue comment 123 --repo owner/repo --body "[texte]"
   ```

---

### `/github ci [branche?]`

Si branche non précisée → utiliser `default_branch` retenu en session.

1. Lister les derniers runs sur la branche :
   ```bash
   gh run list --repo owner/repo --branch [branche] --limit 5
   ```
2. Afficher le statut : ✅ success / ❌ failure / ⏳ in_progress / 🔵 queued
3. **Si le dernier run est en échec** :
   ```bash
   gh run view [run_id] --repo owner/repo --log-failed
   ```
   Afficher les logs d'erreur directement dans le transcript pour investigation.
4. Si aucun run trouvé → "Aucun workflow CI trouvé sur la branche [branche]"

---

### `/github listFiles [chemin?]`

Si chemin non précisé → racine du repo (`/`).

```bash
gh api repos/owner/repo/contents/[chemin] --jq '[.[] | "\(.type) \(.name)"]'
```

Afficher sous forme d'arborescence simple :
```
📁 src/
📄 README.md
📄 package.json
```

---

### `/github readFile [chemin]`

```bash
gh api repos/owner/repo/contents/[chemin] --jq '.content' | base64 -d
```

Afficher le contenu dans un bloc de code avec le bon langage selon l'extension.

**Si le fichier est trop grand** (> 1 Mo) → signaler et proposer de lire une section via `--jq '.download_url'` puis `gh api [url]`.

---

## Règles absolues

- **Confirmation obligatoire** avant toute action d'écriture (`create issue`, `comment`)
- **Repo et default_branch retenus en session** — sélection Action 0 une seule fois par session sauf changement explicite
- **Chemin encodé** pour `gh api` : espaces → `%20` (ex: `99%20-%20Claude%20Code/Skills`)
- **Détection issue vs PR** : tenter `gh pr view` d'abord, fallback `gh issue view` si erreur
- **CI sans branche** : toujours utiliser `default_branch` — ne jamais hardcoder `main` ou `staging`
