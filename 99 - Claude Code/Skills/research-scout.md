---
name: research-scout
description: Veille quotidienne orientée vault × Claude Code — ce qui sort et trend cette semaine dans l'écosystème. Déclencher via /research-scout ou automatiquement à la fin de /digest.
---

# Skill : /research-scout

Veille ciblée sur ce qui sort et trend dans l'espace **Claude Code × vault × agents IA** cette semaine. Format et logique proches de `/pulse`, mais quotidien et léger — pas de création de tickets (le `/harvest` s'en charge).

---

## Étape 1 — Calculer la date et fetcher les tendances (parallèle)

**Date dynamique** : calculer la date d'aujourd'hui et la date J-7. Utiliser le format `YYYY-MM-DD` dans les requêtes — ne jamais hardcoder une date.

Lancer **5 recherches en parallèle** (4 WebSearch + 1 webhook n8n YouTube) :

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

**E — YouTube trending 24h** (via webhook n8n `youtube-search`)
```bash
curl -s -m 30 "{N8N_WEBHOOK_URL}/webhook/youtube-search"
```

Le webhook (workflow n8n à créer — voir ticket [[amelioration-research-scout-integration-youtube-extraction-transcript]]) doit :
- Lancer une YouTube search trending 24h sur les mots-clés `claude code`, `obsidian claude code`, `agentic coding`, `claude agents`
- Récupérer les 10 premiers résultats
- Fetch le transcript pour chaque vidéo
- Retourner JSON `{ videos: [{ title, url, channel, published_at, insights: string }] }`

**Gestion erreur webhook** :
- Container n8n down → `docker start n8n` puis retry une fois
- Webhook 404 / timeout / JSON malformé → marquer `YOUTUBE_FAILED = true`, continuer sans bloquer
- En Étape 4 : signaler à Victor `⚠️ YouTube source skip — workflow n8n down ou pas encore créé`

**Extraction** : pour chaque résultat (toutes sources), noter :
- Titre + URL
- Source : `[GitHub]` `[HN]` `[Anthropic]` `[Outillage]` `[YouTube]` (préfixe explicite)
- Date de publication — **ignorer si > 7 jours** pour A/B/C/D, **ignorer si > 24h** pour E (le workflow filtre déjà mais double-check)
- Catégorie : [Claude Code] [Vault/PKM] [Agents IA] [Release Anthropic] [Outillage dev]
- **Pour E uniquement** : `channel` + `insights` (résumé extrait du transcript par le workflow)

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

Retenir **3 à 5 items maximum** (toutes sources confondues). Critères stricts :

| Inclure | Exclure |
|---------|---------|
| Release Anthropic (nouveau produit, nouveau modèle, nouvelle feature) | Tutoriels "top X", guides, "how to" génériques |
| Outil concret ou repo sorti cette semaine | Contenu déjà présent dans le vault |
| Discussion communauté avec signal fort (300+ HN, 100+ upvotes) | Articles > 7 jours (24h pour YouTube) |
| Pattern ou outil dans l'écosystème Claude Code / agents / PKM qui mérite d'être sur le radar (même si ça demande un refacto ou l'ajout d'un MCP) | Contenu marketing sans substance |
| **Vidéo YouTube** avec `insights` substantiels (extraction transcript révèle un pattern, un outil, un retour terrain) | **Vidéo YouTube** monétisée pure (titres clickbait, contenu < 30% utile vs longueur, présentateur générique du type "5 things you should know") |

**Filtrage vidéos YouTube spécifique** : si ≥ 70% des résultats E ressemblent à du clickbait ou contenu monétisé générique (analyse rapide titres + insights) → ne retenir aucune vidéo plutôt que de remplir avec du bruit. La qualité prime sur la quantité.

**Si moins de 2 items pertinents** (toutes sources confondues) → terminer silencieusement, ne rien insérer.

---

## Étape 4 — Présenter pour validation

Format tableau proche de `/pulse`. Si `YOUTUBE_FAILED = true` → afficher en haut `⚠️ YouTube source skip — workflow n8n down ou pas encore créé`.

```
🔭 Research intel — [N] items — semaine du [date]

| # | Item | Source | Angle vault |
|---|------|--------|-------------|
| 1 | [Titre](url) | HN / GitHub / Reddit / Anthropic / Outillage | [Claude Code / Vault / Agents / Release] |
| 2 | [Titre vidéo](url) — *insights : [résumé 1 phrase]* | YouTube — chaîne "[Nom]" | [Claude Code / Agents / Vault] |

→ Quels numéros tu gardes ? ("1 3", "tout", "skip")
```

**Différenciation vidéos** : pour les items `[YouTube]`, ajouter le résumé `insights` (1 phrase) directement après le titre, pour que Victor décide sans cliquer. Préciser la chaîne en source.

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
| **[Titre vidéo](url)** — *[chaîne]* — insights : [résumé 1 phrase] | [YouTube / Claude Code] |
```

Pour les items vidéo `[YouTube]` : inclure la chaîne en italique + le résumé d'insights (1 phrase) dans la cellule `Item`, pour que la table reste auto-suffisante (Victor relit sa daily note sans cliquer).

Confirmer : "✅ [N] item(s) ajoutés dans Research intel." Si une partie venait de YouTube : "(dont [N] vidéos)"

**Si tout skipé** → confirmer "Research intel — rien retenu." sans rien écrire.

**Si `YOUTUBE_FAILED = true`** : ajouter à la fin du message de confirmation `⚠️ YouTube source skip ce run — vérifier n8n / workflow youtube-search.`
