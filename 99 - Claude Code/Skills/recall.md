---
name: recall
description: Cherche dans le vault les 1-3 notes pertinentes au contexte. Appel manuel via /recall [sujet] ou /recall (infère depuis la conversation). Retourne silence si aucun match qualifié.
---

# Skill `/recall`

Recherche ciblée dans le vault : retrouve les notes vraiment utiles pour le contexte actuel.

## Déclenchement

```
/recall              → infère les mots-clés depuis la conversation en cours
/recall [sujet]      → recherche ciblée sur ce sujet
/recall auth FSTG    → plusieurs termes possibles (AND implicite)
```

---

## Étape 1 — Extraire les mots-clés (3 à 6)

**Si argument fourni** : utiliser TOUS les termes, séparés par espace (ex: `/recall auth FSTG` = search "auth" AND "FSTG").

**Si aucun argument** : inférer depuis la conversation (par priorité) :
1. Titres ou chemins mentionnés dans les 5 derniers échanges
2. Noms de projets explicites (FSTG, ML, HomeLabServeur, etc.)
3. Termes techniques répétés 2+ fois dans la dernière requête

**Garder 3 à 6 mots-clés distincts** — ni trop larges ("code") ni trop spécifiques (noms variables).

**Passer outre si** :
- Conversation n'a aucun contexte (vide ou "hello" seulement)
- Termes inférés sont trop génériques après filtrage → afficher "Contexte insuffisant pour inférer keywords."

---

## Étape 2 — Chercher dans le vault

### Répertoires à scanner (toujours tous)

- `{VAULT_PATH}\{KNOWLEDGE_FOLDER}\` (récursif)
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\ADR\`
- `{VAULT_PATH}\{PROJECTS_FOLDER}\[Projet actif]\claude-code\` (si en contexte)
- `{VAULT_PATH}\{PROJECTS_FOLDER}\[Projet actif]\` (si en contexte ; chemin réel, pas "04 - My projects")
- `{VAULT_PATH}\{HOBBIES_FOLDER}\` (si sujet hobby détecté)

**Ne pas scanner** : `00 - Daily notes/`, `09 - Inbox/`, `Archive/`, `99 - Claude Code/Sessions/`.

### Limites d'exécution

- Par répertoire : max 50 fichiers `.md` (garder les 50 les plus récemment modifiés)
- Globalement : max 200 fichiers lus au total (stopword après)

### Algorithme de recherche

1. **Lister les fichiers** avec Glob `**/*.md`, limiter par mtime si nécessaire
2. **Scorer chaque fichier** (prendre le score maximal, pas additif) :
   - Si mot-clé dans titre → confirmer (20 lignes) → score 3
   - Sinon si mot-clé dans 10 premières lignes → score 2
   - Sinon si note déjà lue contient `[[nom-de-ce-fichier]]` → score 2
   - Sinon si mot-clé au-delà ligne 10 → score 1
3. **Écarter** les notes déjà signalées cette session
4. **Trier** par score décroissant, garder **1 à 3 meilleures**

### Scoring rapide (MAX, pas cumulatif)

| Source | Score | Condition |
|--------|-------|-----------|
| Titre | 3 | Mot-clé dans nom + confirmé (20 lignes) |
| Contenu | 2 | Mot-clé dans les 10 premières lignes |
| Backlink | 2 | `[[nom-note]]` cité en session |
| Corps | 1 | Mot-clé au-delà ligne 10 |

**Prendre le meilleur score** pour chaque fichier. Cas d'égalité : favoriser plus de keywords matchés.

---

## Étape 3 — Filtrer et présenter

**Garder 1 à 3 notes max.**

**Seuil minimum** : signaler seulement si score ≥ 2 (sinon silence).

Format :
```
📎 Notes vault pertinentes :
- [[nom-note]] — [une phrase : pourquoi utile maintenant]
- [[autre-note]] — [pourquoi]
```

**Si aucun match ≥2** → silence total (pas de "aucun résultat").

---

## Étape 2bis — Recherche sémantique sessions (optionnel)

**Condition** : lancer seulement si les mots-clés de l'Étape 1 sont techniques ou projets (Waddle, FSTG, Husker, pgvector…). Passer si requête purement personnelle/organisation.

Appeler :
```bash
uv run ~/.claude/semantic_search.py "<mots-clés joints>" --top-k 3
```

**Si la commande échoue** (Postgres ou Ollama inaccessible) → non-bloquant, continuer vers Étape 3, mais afficher : `⚠️ Recherche sémantique sessions indisponible (Postgres/Ollama down) — résultats vault uniquement.`

**Si résultats** (similarity ≥ 0.45) → ajouter un bloc séparé après les notes vault :
```
📎 Sessions pertinentes :
- [YYYY-MM-DD] — <session title> / <section_type>
```
Max 3 sessions. Ne pas les mélanger avec les notes vault — blocs distincts.

---

## Règles absolues

- **1 à 3 max** — jamais plus
- **Silence si aucun match ≥2** — qualité > quantité
- **Ne pas re-signaler** une note déjà mentionnée cette session
- **Ne pas scanner** Daily notes, Inbox, Archive, Sessions
- **Faux positifs** : si match existe mais n'est pas sémantiquement lié (ex: "color" en art vs code), écarter après vérification
- **Erreur Glob/Timeout** : ne rien afficher, logger silencieusement
- **Accès refusé** : si le répertoire n'est pas accessible (permissions), continuer avec les autres sans bloquer

