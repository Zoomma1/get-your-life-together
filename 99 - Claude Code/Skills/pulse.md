---
name: pulse
description: Veille hebdomadaire setup × tendances — scrute GitHub trending + HN, analyse le setup actuel, identifie les gaps et crée les tickets manquants dans le kanban Claude Code. Invoquer quand Victor dit "veille setup", "quoi de neuf à intégrer", "pulse", "check les trends", "/pulse", ou en début de semaine.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : /pulse

Veille hebdomadaire qui croise les tendances tech avec le setup actuel. Résultat : 3-5 tickets créés dans le kanban Claude Code pour les améliorations les plus pertinentes.

Fréquence recommandée : une fois par semaine (typiquement le samedi ou lundi matin).

---

## Étape 1 — Fetch tendances (parallèle)

Lancer deux recherches en parallèle :

**Recherche A — GitHub trending (semaine)**
```
WebSearch : "GitHub trending projects this week [mois année courante]"
WebSearch : "GitHub trending weekly [mois année courante]"
```
Cibler : [shareuhack.com GitHub trending weekly], [gitstars.substack.com], [trendshift.io].
Fetcher la page la plus récente trouvée avec WebFetch.

**Recherche B — HN + écosystème Claude Code**
```
WebSearch : "Hacker News trending Claude Code [mois année courante]"
WebSearch : "site:reddit.com/r/ClaudeCode trending [mois année courante]"
```

**Extraction** : pour chaque source, noter les projets avec :
- Nom + description courte
- Nombre d'étoiles ou score HN
- Catégorie : [IA/LLM] [Outillage dev] [Infra] [Vault/PKM] [Productivité]

---

## Étape 2 — Scanner le setup actuel

Lire en parallèle :

1. `99 - Claude Code/Skills/INDEX.md` — liste des skills actifs
2. `~/.claude/settings.json` (chemin : `C:/Users/victo/.claude/settings.json`) — plugins activés, hooks
3. Kanban Claude Code colonnes **Idea** et **Spec** — ce qui est déjà en backlog

**Extraction** : construire deux listes :
- Ce que le setup fait déjà (skills + plugins actifs)
- Ce qui est déjà en backlog (titres des tickets Idea/Spec)

---

## Étape 3 — Gap analysis

Croiser les tendances (Étape 1) avec le setup (Étape 2).

Pour chaque projet/pattern trending :
1. Est-ce déjà couvert par un skill ou plugin actif ? → ignorer
2. Est-ce déjà en backlog (Idea/Spec) ? → ignorer
3. Est-ce pertinent pour le workflow de Victor (vault, dev, ML, productivité) ? → candidat

**Critères de pertinence** (au moins un) :
- Réduction directe des frictions quotidiennes
- Extension naturelle d'un skill existant
- Économie de tokens ou de temps de session
- Intégration avec un projet actif (FSTG, MPA-MLF, Rustlings, Ludisep)

Trier les candidats par pertinence décroissante. Sélectionner **3 à 5 maximum**.

Si moins de 3 candidats pertinents → signaler "peu de nouveautés pertinentes cette semaine" et s'arrêter sans créer de tickets.

---

## Étape 4 — Présenter les candidats à Victor

Avant de créer les tickets, présenter la liste des candidats sélectionnés :

```
## Candidats pulse — [date]

| # | Amélioration | Inspiration | Pertinence |
|---|-------------|-------------|------------|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |

→ Je crée les tickets pour tous ? Ou veux-tu en retirer certains ?
```

Attendre la validation de Victor avant de passer à l'Étape 5.

---

## Étape 5 — Créer les tickets

Pour chaque candidat validé, appliquer le skill `create-ticket` :

```
create-ticket avec :
- title: "[titre descriptif]"
- type: "💡 Idée" (ou "⏫ Improvement" si c'est une amélioration d'existant)
- project: null (→ "Personnel")
- column: "Idea"
- context: "[lien avec la tendance source en 1 phrase]"
```

Créer les tickets séquentiellement (le kanban est modifié à chaque fois).

---

## Étape 6 — Résumé

Afficher :
```
## Pulse — [date]

**Sources scannées :** GitHub trending semaine + HN + r/ClaudeCode
**Candidats identifiés :** N (M ignorés — déjà en setup ou backlog)
**Tickets créés :** K

| Ticket | Inspiration |
|--------|-------------|
| [titre] | [source] |
```

---

## Règles

- Ne jamais créer un ticket déjà présent dans le setup ou le backlog — vérifier en Étape 2
- Ne jamais dépasser 5 tickets par run — filtrer rigoureusement
- Toujours présenter les candidats avant de créer (Étape 4) — pas de création silencieuse
- Si WebFetch échoue sur une source → noter "source indisponible" et continuer avec les autres
