---
name: digest
description: Fetch les sources de veille configurées dans digest-sources.md et écrit un résumé condensé dans la daily note. Workflow recommandé : lancer le soir avec /closeday dans une session dédiée — le digest écrit dans la daily note du lendemain (créée avec le template si elle n'existe pas encore). Déclencher quand Victor dit "/digest", "digest", "digest tech", "donne moi les news", "veille du jour", "fais le digest". NE PAS lancer dans la même session que /today (9 agents parallèles = ~70% du quota 5h).
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill `/digest`

Génère un résumé de veille (5-8 articles) depuis les sources configurées et l'insère dans la daily note du jour, avant la section plan.

## Déclenchement

```
/digest                  → toutes les catégories configurées
/digest [catégorie]      → une seule catégorie (ex: /digest Finance, /digest Tech)
```

**Invocation explicite uniquement** — pas de recherche de "contexte projet actif".

---

## Étape 0 — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` pour extraire :
- `date_format` — format de date des daily notes (défaut : `YYYY-MM-DD`)
- `daily_notes_folder` — dossier des daily notes (défaut : `00 - Daily notes`)

Stocker dans `DATE_FORMAT` et `NOTES_FOLDER`. Utiliser ces valeurs partout où une date ou un chemin de daily note est nécessaire.

---

## Étape 1 — Charger les sources

Lire `99 - Claude Code/config/digest-sources.md`.

**Si le fichier existe** → extraire les catégories et sources définies. Chaque section `## [Catégorie] [emoji]` définit une catégorie. Chaque ligne ` - [Nom] | [URL] | [prompt de fetch]` définit une source dans cette catégorie.

**Si le fichier est absent** → utiliser les sources par défaut :

| Catégorie | Emoji | Nom | URL | Prompt de fetch |
|-----------|-------|-----|-----|----------------|
| Tech & Dev | 🛠️ | Hacker News | `https://news.ycombinator.com/` | "Liste les titres des 15 premières stories avec leur score, l'URL complète de l'article (pas le lien HN, l'URL externe) et le domaine source" |
| Tech & Dev | 🛠️ | Dev.to | `https://dev.to/` | "Liste les articles en trending : titre, auteur, tags, résumé en 1 phrase" |
| IA & Claude | 🤖 | Anthropic news | `https://www.anthropic.com/news` | "Liste les dernières publications : titre, date, résumé en 1 phrase" |

Stocker les sources dans `SOURCES` (liste) et les catégories dans `CATEGORIES` (liste ordonnée, dédupliquée).

**Si variante appelée** (`/digest [catégorie]`) → filtrer `SOURCES` pour ne garder que les sources dont la catégorie correspond (insensible à la casse).

---

## Étape 2a — Calculer la date cible et localiser la daily note

**Date cible** (calculer en premier) :
- Si `heure >= 17:00` → `date_cible = aujourd'hui + 1 jour` (préparation pour le lendemain matin)
- Sinon → `date_cible = aujourd'hui`

Construire le chemin selon `DATE_FORMAT` et `NOTES_FOLDER` avec `date_cible`.

**Si la note existe** → continuer à Étape 2b.

**Si la note n'existe pas** → la créer avec le template daily note (`Ressources/Templates/Daily notes template.md`), en remplaçant les variables Templater par les valeurs calculées pour `date_cible` :
- `tp.date.now("YYYY-MM-DD")` → date ISO de `date_cible`
- `tp.date.now("YYYY")` → année
- `tp.date.now("MMMM")` → mois en lettres (français)
- `tp.date.now("WW")` → numéro de semaine ISO
- `tp.date.now("dddd DD MMMM YYYY")` → ex : `samedi 25 avril 2026`

Laisser `energy`, `score`, `work_hours`, `personal_hours`, `hobby_hours` vides (frontmatter). Puis continuer à Étape 2b.

## Étape 2b — Vérifier si digest existe déjà

Ouvrir la daily note et vérifier la présence d'une section `## 📰 Digest` :

- Si non → continuer à Étape 3
- Si oui → **arrêter et proposer dans le chat** :
  ```
  Un digest existe déjà pour le YYYY-MM-DD.

  Option A : Le remplacer
  Option B : Annuler
  ```
  **Attendre réponse explicite** (A ou B).

---

## Étape 3 — Fetch des sources

Fetcher toutes les sources de `SOURCES` en parallèle, chacune avec son prompt de fetch défini.

### Si un fetch échoue

```
[Source] est inaccessible (timeout/erreur).

Option A : Continuer avec les sources disponibles
Option B : Relancer le digest plus tard
```

**Attendre réponse explicite** (A ou B) :
- Si A → continuer, ajouter en bas du digest : `*[Source] inaccessible aujourd'hui*`
- Si B → arrêter

### Si le contenu est non exploitable — fallback WebSearch

Après chaque fetch réussi, évaluer si le contenu est exploitable :

- **Non exploitable** : contenu majoritairement CSS/JS (nombreux `{`, `}`, propriétés CSS, variables `--`), page vide, ou réponse du modèle indiquant l'absence d'articles
- **Exploitable** : texte naturel avec titres, dates, ou résumés d'articles identifiables

**Si non exploitable → fallback automatique (silencieux) :**
1. Extraire le domaine depuis l'URL source (ex: `hugodecrypte.kessel.media`)
2. Lancer WebSearch avec la query `site:[domaine]`
3. Appliquer le prompt de fetch d'origine sur les résultats WebSearch
4. Si WebSearch retourne aussi zéro article → traiter comme inaccessible (Option A/B ci-dessus)

Pas de message à Victor lors du fallback — la source est traitée normalement dans le digest.

---

## Étape 4 — Sélectionner et synthétiser

À partir du contenu récupéré, sélectionner **5 à 8 items au total** :

**Critères de qualité (toujours appliquer) :**
| Inclure | Exclure |
|---------|---------|
| Sorties majeures (v2.0, model release, breaking change) | Clickbait ("10 tips", "you won't believe") |
| Patterns apprentissage (architecture, best practice) | Marketing pur, contenu promotionnel |
| Débats significatifs (score 500+ HN, 100+ commentaires) | Articles > 7 jours |
| Actualité majeure dans le domaine de la source | Doublons (même sujet 2x) |

**Répartition cible** : équilibrer entre les catégories configurées — si 2 catégories → ~50/50, si 3 → ~33/33/33. Ajuster selon disponibilité.

---

## Étape 5 — Formater le digest

Construire une section par catégorie dans `CATEGORIES`, dans l'ordre de `digest-sources.md` (ou ordre par défaut si absent) :

```markdown
## 📰 Digest — DD/MM/YYYY

### [emoji] [Catégorie]
- **[Titre](url)** — [résumé 1-2 phrases] — *[source]*

### [emoji] [Catégorie 2]
- **[Titre](url)** — [résumé 1-2 phrases] — *[source]*
```

Règles :
- Titre en gras avec lien cliquable, résumé factuel (1-2 phrases), source en italique
- Omettre entièrement une catégorie si aucun item retenu (pas de titre orphelin)
- Si une seule catégorie filtrée (`/digest [catégorie]`) → une seule section

---

## Étape 6 — Insérer dans la daily note

Localiser le point d'insertion **en ordre de préférence** :
1. Juste **avant** `## 📅 Plan du jour`
2. Si absent, juste **après** le premier `---`
3. Si aucun `---`, après le bloc YAML frontmatter

Insérer le bloc digest complet. Confirmer :

```
✅ Digest inséré dans la daily note du YYYY-MM-DD
→ [N] items — [catégories utilisées]
```

---

## Étape 7 — Research intel (automatique)

Après confirmation de l'insertion du digest, exécuter le skill `/research-scout` :
lire `99 - Claude Code/Skills/research-scout.md` et exécuter ses étapes.

Non-bloquant : si /research-scout ne trouve rien ou que Victor skip tout, le digest est déjà terminé — aucune action supplémentaire.

---

## Règles absolues

- **Jamais écraser** le contenu existant — uniquement insérer le bloc digest
- **Zéro action autonome sur blocages** — toujours proposer A/B et attendre réponse explicite
- **5-8 items max** — qualité > quantité ; OK si < 5 items valides
- **Factuel uniquement** — pas d'opinion, pas d'interprétation personnelle
- **Liens obligatoires** — chaque item en markdown `[Titre](url)`
- **Si aucun item valide** → Option A (insérer digest vide avec note) / Option B (annuler)
