---
name: gylt-update
description: Met à jour le vault GYLT depuis le repo GitHub officiel. Compare la version locale avec la dernière version GitHub, résume ce que chaque changement apporte, et laisse l'utilisateur choisir ce qu'il veut appliquer. Recommandé chaque semaine. Invoquer avec `/gylt-update` ou quand une mise à jour manuelle est souhaitée.
---

# Skill : GYLT Update

Met à jour ton vault depuis le repo GitHub officiel — de façon transparente et à ton rythme.

**Fréquence recommandée :** hebdomadaire (suivi dans `command-tracker.md`).

---

## Prérequis

- Git installé et configuré (le vault doit être un repo git cloné depuis GitHub)
- Connexion internet active

---

## Étape 1 — Vérifier les mises à jour disponibles

```bash
git fetch origin
git log HEAD..origin/master --oneline
```

**Si aucun commit en avance** → afficher :
> "Ton vault est à jour. Aucune mise à jour disponible."
Mettre à jour `command-tracker.md` et s'arrêter.

**Si des commits existent** → continuer.

---

## Étape 2 — Lister les fichiers modifiés

```bash
git diff HEAD..origin/master --name-only
```

Catégoriser les fichiers :

| Catégorie | Pattern |
|-----------|---------|
| Nouveaux skills | `99 - Claude Code/Skills/*.md` absent en local |
| Skills mis à jour | `99 - Claude Code/Skills/*.md` présent en local mais différent |
| Config | `99 - Claude Code/config/*.md` |
| Templates | `Ressources/Templates/*.md` |
| Hooks | `99 - Claude Code/hooks/*.js` |
| Autre | README.md, LICENSE, etc. |

---

## Étape 3 — Résumer chaque changement

Pour chaque fichier modifié, produire un résumé en **1-2 phrases** :

**Nouveau skill** → lire le frontmatter `description` de la version GitHub :
```bash
git show origin/master:"99 - Claude Code/Skills/[nom].md" | head -20
```
→ Afficher : `🆕 /[nom] — [description du frontmatter]`

**Skill mis à jour** → lire le diff et produire un résumé humain :
```bash
git diff HEAD..origin/master -- "99 - Claude Code/Skills/[nom].md"
```
→ Lire les lignes ajoutées/supprimées, résumer en 1-2 phrases ce qui a changé fonctionnellement (pas les détails techniques). Exemples :
- *"Améliore la sélection des tâches du jour : ordre déterministe et détection des projets inactifs."*
- *"Ajoute l'invocation automatique de `/refine` lors du raffinement d'idées."*

**Config** → décrire brièvement le changement (ex: *"Ajoute le champ `claude_code_folder` pour plus de flexibilité."*)

**Template** → décrire la mise à jour du template.

**Hooks** → signaler que les hooks ont changé et recommander de les réinstaller manuellement (voir Étape 5).

---

## Étape 4 — Présenter le menu de sélection

Afficher le récapitulatif complet avant de demander quoi appliquer :

```
## Mises à jour GYLT disponibles — [date]
[N commits depuis ta dernière version]

### 🆕 Nouveaux skills
- [ ] /dump — Mental dump → questions de relance → note horodatée dans le journal quotidien
- [ ] /essay — Écriture d'essay guidée par questions (plan + Q&A + mise en forme)
... (liste complète)

### 🔄 Skills mis à jour
- [ ] /today — Sélection déterministe des tâches + détection projets inactifs + invocation /refine en raffinement
- [ ] /workon — Recherche sémantique dans les sessions passées pour charger l'historique d'un sujet
... (liste complète)

### ⚙️ Config
- [ ] vault-settings.md — Ajoute le champ claude_code_folder

### 📄 Templates
- [ ] Daily notes template.md — Template de journal quotidien (nouveau)

### ⚠️ Hooks (action manuelle recommandée)
- [ ] recap-session.js — [résumé du changement]
     → Pour appliquer : copier manuellement dans ~/.claude/hooks/

---
Quels éléments veux-tu appliquer ? (tout / sélection / rien)
```

**Si l'utilisateur répond "tout"** → appliquer tous les éléments non-hooks.
**Si sélection** → appliquer uniquement les éléments cochés.
**Si "rien"** → s'arrêter, mettre à jour le tracker quand même.

---

## Étape 5 — Appliquer les mises à jour sélectionnées

Pour chaque fichier sélectionné (hors hooks) :

```bash
git checkout origin/master -- "[chemin/du/fichier]"
```

Pour les **hooks** sélectionnés : ne pas appliquer automatiquement. Afficher à la place :
```
Pour mettre à jour recap-session.js :
cp "99 - Claude Code/hooks/recap-session.js" ~/.claude/hooks/
```
(ou le chemin équivalent selon l'OS)

---

## Étape 6 — Rapport final

Afficher :
```
✅ [N] fichiers mis à jour
⏭️  [N] fichiers ignorés

Prochaine mise à jour recommandée dans 7 jours.
```

Mettre à jour `99 - Claude Code/command-tracker.md` — ajouter ou mettre à jour la ligne `/gylt-update` avec la date du jour.

Si la ligne `/gylt-update` est absente du command-tracker → l'ajouter :
```
| /gylt-update | [date] | 7 jours |
```

---

## Règles absolues

- **Ne jamais faire `git pull`** — appliquer fichier par fichier pour que l'utilisateur garde le contrôle
- **Ne jamais écraser les fichiers de notes personnelles** — uniquement `99 - Claude Code/`, `Ressources/Templates/`, `README.md`, `LICENSE`
- **Hooks = manuel obligatoire** — ne jamais copier un hook dans `~/.claude/` sans confirmation explicite
- **Si conflit détecté** (le fichier local a été modifié par l'utilisateur) → signaler et ignorer, ne pas écraser
