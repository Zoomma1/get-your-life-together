---
name: security-audit
description: Audit sécurité Claude Code — vérifie la version, les deny rules manquantes, les patterns secret-guard.js, et crée une note Knowledge de résumé. Relancer après chaque mise à jour majeure de Claude Code ou incident sécurité. Déclencher avec /security-audit.
---

# Skill : /security-audit

Audit complet du setup sécurité Claude Code en 5 étapes. Produit un rapport + note Knowledge datée.

---

## Étape 1 — Version Claude Code

```bash
claude --version
```

Extraire le numéro de version (ex: `2.1.119`).

**Version minimale de référence** : `2.1.90`
(Fix bug Adversa AI — bypass deny rules si >50 subcommands)

- Si version ≥ 2.1.90 → ✅ SAFE
- Si version < 2.1.90 → 🔴 **CRITIQUE** — mettre à jour immédiatement (`npm update -g @anthropic-ai/claude-code`)

---

## Étape 2 — Deny rules dans settings.json

Lire `~/.claude\settings.json` → section `permissions.deny`.

**Liste de référence** (deny rules attendues) :
```
Bash(rm -rf*)
Bash(sudo rm*)
Bash(git push *--force*)
Bash(git push *-f *)
Bash(git reset --hard*)
Bash(git stash drop*)
Bash(git stash clear)
Bash(git branch -D*)
Bash(chmod -R 777*)
```

Pour chaque règle de la liste de référence :
- ✅ Présente dans `permissions.deny`
- ⚠️ Absente → lister comme manquante

Si des règles manquent → proposer le bloc JSON à ajouter dans `settings.json` et attendre validation de Victor avant d'écrire.

---

## Étape 3 — Patterns secret-guard.js

Lire `~/.claude\hooks\secret-guard.js` → array `DANGER_PATTERNS`.

**Patterns de référence attendus** (au minimum) :
- `.env` files (cat/less/more/head/tail)
- `.pem` / `.key` files
- SSH private keys (`id_rsa`, `id_ed25519`…)
- `.aws/credentials`
- `.docker/config`
- `printenv` (bare)
- `env` (bare)
- `export VAR_SECRET=literal`
- `Authorization: Bearer <token>`
- `--user user:pass`
- `git remote -v`
- `echo $VAR_SECRET`
- `history`
- `cat ~/.netrc`

Lister les patterns de référence absents du fichier actuel. Proposer les additions si manquantes — attendre validation avant d'écrire.

---

## Étape 4 — Fetch sources sécurité (optionnel, sur demande)

Si Victor demande "vérifie les dernières vulnérabilités" ou "fetch les sources" :

Sources à consulter :
- Adversa AI blog (recherche "Claude Code security")
- HN discussions récentes sur Claude Code (WebSearch "Claude Code security site:news.ycombinator.com")

Extraire uniquement les findings actionnables (nouvelles vulnérabilités, nouveaux patterns à bloquer, nouveaux bugs de version).

Par défaut (sans demande explicite) : **skip cette étape** — trop lent pour un audit de routine.

---

## Étape 5 — Créer la note Knowledge

Créer `{VAULT_PATH}\{KNOWLEDGE_FOLDER}\Claude code\security-audit-YYYY-MM-DD.md` :

```markdown
---
date: YYYY-MM-DD
type: Security Audit
claude_version: [version]
---

# Audit sécurité Claude Code — YYYY-MM-DD

## Version
- Installée : [version] ✅/🔴
- Minimale requise : 2.1.90

## Deny rules
[résumé : X/9 présentes — liste des manquantes ou "Toutes présentes"]

## secret-guard.js
[résumé : X/14 patterns présents — liste des manquants ou "Tous présents"]

## Actions appliquées
[liste des modifications faites ce run, ou "Aucune modification nécessaire"]

## À relancer
- Après chaque mise à jour majeure Claude Code
- Après tout incident sécurité
- Prochaine échéance : [date suggérée]
```

---

## Étape 6 — Mettre à jour le command-tracker

- Ouvrir `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- Ligne `/security-audit` → remplacer la date par la date du jour (`YYYY-MM-DD`)

---

## Règles absolues

- Ne jamais modifier `settings.json` ou `secret-guard.js` sans validation explicite de Victor
- Toujours créer la note Knowledge même si aucune modification n'est nécessaire (traçabilité)
- Fréquence recommandée : après chaque mise à jour majeure Claude Code, ou au minimum mensuel
