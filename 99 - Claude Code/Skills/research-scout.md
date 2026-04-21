---
name: research-scout
description: Veille quotidienne orientée vault × Claude Code — ce qui sort et trend cette semaine dans l'écosystème. Déclencher via /research-scout ou automatiquement à la fin de /digest.
---

# Skill : /research-scout

Veille ciblée sur ce qui sort et trend dans l'espace **Claude Code × vault × agents IA** cette semaine. Format et logique proches de `/pulse`, mais quotidien et léger — pas de création de tickets (le `/harvest` s'en charge).

---

## Étape 1 — Calculer la date et fetcher les tendances (parallèle)

**Date dynamique** : calculer la date d'aujourd'hui et la date J-7. Utiliser le format `YYYY-MM-DD` dans les requêtes — ne jamais hardcoder une date.

Lancer 4 recherches en parallèle :

**A — GitHub trending vault/agents**
```
WebSearch : "GitHub trending Claude Code vault Obsidian agents [mois courant] [année courante]"
```

**B — HN discussions récentes**
```
WebSearch : "Hacker News Claude Code Obsidian PKM agents [mois courant] [année courante]"
```

**C — Anthropic nouveautés**
```
WebSearch : "Anthropic Claude new product tool release [mois courant] [année courante]"
```

**D — Écosystème IA dev tools**
```
WebSearch : "AI developer tools release agents [mois courant] [année courante] new"
```

**Extraction** : pour chaque résultat, noter :
- Titre + URL
- Date de publication — **ignorer si > 7 jours** (comparer avec J-7 calculé au début)
- Catégorie : [Claude Code] [Vault/PKM] [Agents IA] [Release Anthropic] [Outillage dev]

---

## Étape 2 — Gap analysis contre le setup existant

Lire en parallèle :
1. `99 - Claude Code/Skills/INDEX.md` — skills actifs
2. `99 - Claude Code/Claude Code Kanban.md` — colonnes Idea, Blocked, Ready (ce qui est déjà en backlog)

Pour chaque résultat de l'Étape 1 :
- Déjà couvert par un skill actif ? → ignorer
- Déjà en backlog kanban ? → ignorer
- URL déjà dans la section `## 📰 Digest` de la daily du jour ? → ignorer
- Topic déjà présent dans `99 - Claude Code/` ou `03 - Knowledge/` (Grep rapide) ? → ignorer

---

## Étape 3 — Filtrer et sélectionner

Retenir **3 à 5 items maximum**. Critères stricts :

| Inclure | Exclure |
|---------|---------|
| Release Anthropic (nouveau produit, nouveau modèle, nouvelle feature) | Tutoriels "top X", guides, "how to" génériques |
| Outil concret ou repo sorti cette semaine | Contenu déjà présent dans le vault |
| Discussion communauté avec signal fort (300+ HN, 100+ upvotes) | Articles > 7 jours |
| Pattern ou outil dans l'écosystème Claude Code / agents / PKM qui mérite d'être sur le radar (même si ça demande un refacto ou l'ajout d'un MCP) | Contenu marketing sans substance |

**Si moins de 2 items pertinents** → terminer silencieusement, ne rien insérer.

---

## Étape 4 — Présenter pour validation

Format tableau proche de `/pulse` :

```
🔭 Research intel — [N] items — semaine du [date]

| # | Item | Source | Angle vault |
|---|------|--------|-------------|
| 1 | [Titre](url) | HN / GitHub / Reddit | [Claude Code / Vault / Agents / Release] |
| 2 | ... | ... | ... |

→ Quels numéros tu gardes ? ("1 3", "tout", "skip")
```

Timeout 45s → skip tout.

---

## Étape 5 — Écrire dans la daily note

Date cible : si heure < 04:00 → veille, sinon aujourd'hui.

**Si items acceptés**, ajouter en bas de `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\[date cible].md` :

```markdown
## 🔭 Research intel

| Item | Angle |
|------|-------|
| **[Titre](url)** | [Claude Code / Vault / Agents / Release] |
```

Confirmer : "✅ [N] item(s) ajoutés dans Research intel."

**Si tout skipé** → confirmer "Research intel — rien retenu." sans rien écrire.
