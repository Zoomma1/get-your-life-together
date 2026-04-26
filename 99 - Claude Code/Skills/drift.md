---
name: drift
description: Détecter les idées récurrentes non capitalisées sur les 15 derniers jours — idées mentionnées plusieurs fois sans note ni ticket existant. Ciblé et compact. Jamais créer sans validation explicite de Victor.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : /drift

Le drift révèle ce qui compte vraiment vs ce qui sonne bien. Quand une idée revient régulièrement sans jamais être actionnée, c'est un signal : soit elle mérite une place dans le système, soit elle occupe de l'espace mental pour rien. Le but du skill est de rendre ce signal visible et de forcer une décision.

**Différence clé avec `/harvestdeep`** : drift est ciblé (15j, répétitions uniquement, compact) ; harvestdeep est exhaustif (30j, capitalisation large, signaux, inbox review). Si Victor hésite entre les deux, choisir drift pour une vérification rapide, harvestdeep pour un bilan complet.

## Déclenchement

- Victor dit "drift", "check les drifts", "qu'est-ce qui revient"
- **Période par défaut** : 15 derniers jours uniquement (scoped = rapide)
- Optionnel : période personnalisée ("drift de la semaine", "drift du mois") → sinon, 15j

---

## Étape 1 — Lire le contexte minimal

Lire en parallèle les 3 sources indépendantes (ne pas scanner le vault entier) :

1. **Daily notes** (15 derniers jours) dans `00 - Daily notes/` → sujets mentionnés 2+ fois, intentions sans suite
   - Chercher les fichiers au format `YYYY-MM-DD.md` uniquement
   - Pas de daily note pour un jour ? Sauter (ne pas forcer), mais **compter ce jour comme potentiel context pour autres sources** (session, index)
2. **Sessions** (15 derniers jours) dans `99 - Claude Code/Sessions/` → idées non capitalisées, sujets reportés
3. **Projects/INDEX.md** → projets actifs, kanbans associés

Agréger avant l'Étape 2. Ciblé uniquement.

---

## Étape 2 — Détecter les répétitions non capitalisées

Chercher les sujets **mentionnés 2+ fois sur jours ou contextes différents** qui **n'ont ni note ni ticket** :

**Définition d'une occurrence** : une mention du sujet dans un jour/session distinct. Plusieurs mentions le même jour = 1 occurrence. Exemple : "Refacto paint service" mentionné 3 fois le 2026-03-20 = 1 occurrence. Mentionné aussi le 2026-03-25 = 2e occurrence → seuil atteint.

**Seuil de détection** : 2 occurrences minimum sur jours/sessions différents. Fréquence plus haute (3+) = priorité plus haute.

**Filtrer avant Étape 3** :
1. **Kanban check** : le sujet existe-t-il en Idea/Specs/Ready/WIP ? → ne pas signaler (déjà capitalisé)
2. **Orpheline check** : existe-t-il une note orpheline via glob `04 - Projects/*/Todos/` ou `09 - Inbox/` ? → ne pas créer doublon, lier au kanban (Étape 5)

**Ne pas signaler** :
- Idées en WIP ou Done
- Mentions dans un seul jour/session uniquement
- Signaux d'alerte personnels (harvestdeep)

---

## Étape 3 — Classifier : résistance ou obstacle ?

Pour chaque drift détecté, identifier pourquoi il n'a pas été actionné :

**Résistance vraie** : le sujet revient, Victor l'évite activement, mais rien n'empêche concrètement d'avancer.
- Le sujet est mentionné mais aucune suite n'est donnée
- Pas de dépendance externe identifiée
- Les prochaines étapes seraient définissables immédiatement

**Obstacle structurel** : bloqué par une contrainte réelle, pas par de l'évitement.
- Dépendance externe non résolue (réponse attendue, info manquante, pas le bon moment)
- Prochaine étape floue ou hors de contrôle de Victor
- Timing contraint par un facteur extérieur

Cette distinction change la conclusion proposée :
- **Résistance** → forcer une décision (drop / schedule 48h / reframe)
- **Obstacle** → identifier le déblocage concret et le noter

---

## Étape 4 — Présentation compacte

### Si aucun drift
```
Aucun drift sur les 15 derniers jours — tout est capitalisé ou trop récent.
```

### Si drifts détectés
Présenter liste rapide d'abord, puis détails :

**Drifts détectés (à valider) :**
- [Sujet 1]
- [Sujet 2]

Puis pour chaque drift :

```
🌊 DRIFT : [Sujet]
→ Apparu [X fois] : [date/contexte], [date/contexte]
→ Capitalisé : NON
→ Type : Résistance / Obstacle
→ Action proposée : [drop / schedule 48h / reframe / déblocage : quoi]
```

**Exemple 2 drifts** :
```
🌊 DRIFT : Refacto service paint-session
→ Apparu 3 fois : 2026-03-12 daily, 2026-03-18 session, 2026-03-25 daily
→ Capitalisé : NON
→ Type : Résistance
→ Action proposée : Schedule 48h ou drop

🌊 DRIFT : Contacter prof Brno
→ Apparu 2 fois : 2026-03-20 daily, 2026-03-24 session
→ Capitalisé : NON
→ Type : Obstacle — attente email
→ Action proposée : Vérifier réponse, sinon relancer
```

**PAUSE avant Étape 5 — Attendre validation Victor.** Pour chaque drift, Victor répond : `validé`, `invalidé [raison]`, ou `déjà en [colonne kanban]`.

### Drifts invalidés par Victor
Lister ici avec commentaire (si fourni) :
```
- [Sujet] — [raison Victor si fournie]
```

---

## Étape 5 — Créer les tickets validés

Pour chaque drift **validé** :

| Condition | Destination | Action |
|-----------|-------------|--------|
| Note orpheline existe dans `Todos/` | Kanban concerné | Lier `[[Note]]` en Idea, signaler à Victor |
| Lié à projet actif, pas de note orpheline | Kanban projet — colonne Idea | Créer ticket drift |
| Lié à projet, kanban inexistant | Claude Code Kanban | Créer ticket drift + signaler Victor pour création kanban projet |
| Tech/Claude Code, aucun projet | Claude Code Kanban — colonne Idea | Créer ticket drift |
| Perso/hobby, aucun projet | Claude Code Kanban — colonne Idea | Créer ticket drift |
| Mérite note knowledge | Destination appropriée | Créer note + lier ticket |

Drifts **invalidés** : déjà listés dans "Drifts invalidés" (voir Étape 4), ne pas relancer.

**Ticket drift** — utiliser le skill `create-ticket` avec :
- `type` = `💡 Idée`
- `column` = `Idea`
- `project` = projet concerné (ou null pour Claude Code Kanban)
- `context` = résumé en 1 phrase de la récurrence

Ajouter dans le corps de la note les sections suivantes :

## Idée récurrente
[Description telle qu'apparue]

## Occurrences
- [date] : "[extrait]"
- [date] : "[extrait]"
```

**CRÉER VIA MCP APRÈS VALIDATION, PAS AVANT.**

---

## Étape finale — Mettre à jour le tracker

Après completion du drift (validation de Victor incluse), mettre à jour `99 - Claude Code/command-tracker.md` :
- Ligne `/drift` → remplacer la date par la date du jour au format `YYYY-MM-DD`

Si command-tracker inaccessible ou malformé :
- Logger le timestamp dans le rapport final
- Signaler à Victor : "command-tracker non accessible, drift validé manuellement le YYYY-MM-DD"
- Continuer sans bloquer la création des tickets

---

## Règles absolues

- **Zéro action autonome** : PAUSE avant tout création, validation Victor obligatoire
- Ciblé 15j uniquement — pas de harvest complet
- Vérifier l'existant : kanban + Todos/ orphelins
- Orpheline trouvée → lier au kanban, pas créer doublon
- Créer via MCP après validation — ne pas demander Victor
- Une idée = un ticket unique
- Drifts invalidés non relancés

## Edge cases

| Scénario | Gestion |
|----------|---------|
| Aucun drift détecté | Message "tout capitalisé", terminer |
| Kanban inexistant pour projet | Créer ticket dans Claude Code Kanban + signaler Victor (voir Étape 5) |
| Note orpheline non trouvée | Chercher récursivement `04 - Projects/` + `09 - Inbox/`, signaler à Victor si absente |
| Victor invalide un drift | Lister en "Drifts invalidés" (Étape 4), zéro création |
| Command-tracker inaccessible | Logger dans le rapport + signaler Victor, continuer sans bloquer (voir Étape finale) |
| Drift mentionné 1 fois daily + 1 fois session | Compte comme 2 occurrences (sources distinctes) → signaler |
| Drift en session, zéro daily note ce jour-là | Ne pas pénaliser, compter l'occurrence session seule |
