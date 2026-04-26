---
name: define-done
description: Génère une checklist de done-criteria avant de démarrer un milestone, pour n'importe quel type de projet. Invoquer via /define-done [NomMilestone] dès que Victor veut cadrer explicitement la fin d'un milestone avant de s'y lancer, éviter le flou post-milestone, ou s'assurer que le scope est complet et vérifiable. Déclencher aussi si Victor dit "on cadre le milestone X", "qu'est-ce que done veut dire pour ce milestone", "définis les critères de fin", "checklist de done pour X" — même sans /define-done explicite.
---

## Argument

`$ARGUMENTS` = nom du milestone. Si vide → demander : "Quel milestone veux-tu cadrer ?"

---

## Étape 1 — Identifier le projet et charger le contexte

Chercher dans l'ordre :
1. **Contexte actif** : un projet est-il en cours de discussion dans la session ? Le retenir.
2. **CLAUDE.md ou session courante** : un README ou kanban a-t-il été lu récemment ?
3. **Demander** : si le projet n'est pas évident → "Pour quel projet ?"

Puis charger ce qui existe — sans supposer une structure fixe :
- Fichier de planning ou kanban (`Project management.md`, `PLANNING.md`, tickets, ou équivalent)
- Documentation de contexte (`README.md`, `claude-code/README.md`, note principale du projet)

---

## Étape 2 — Identifier les éléments du milestone

Chercher les éléments liés à `$ARGUMENTS` dans les sources disponibles :

1. **Section nommée** : le planning a une section `## [NomMilestone]` → prendre tout son contenu
2. **Tag/label** : éléments avec `#[NomMilestone]` ou `milestone: [NomMilestone]`
3. **Correspondance partielle** : éléments dont le titre contient `$ARGUMENTS` (insensible à la casse)
4. **Contexte implicite** : si c'est le seul milestone en cours, les éléments en WIP/Ready lui appartiennent probablement

**Si rien trouvé** : afficher ce qui existe et demander → "Je ne vois pas d'éléments associés à '[NomMilestone]'. Tu veux me dire lesquels en font partie, ou je génère depuis le contexte projet seul ?"
**Attendre avant de continuer.**

---

## Étape 3 — Générer la checklist

Analyser le contexte disponible et produire une checklist adaptée au type de projet.

**Structure en 4 sections :**

```markdown
## Done criteria — [NomMilestone]
> Généré le [date] — [Projet]

### Livrables
- [ ] [Élément/feature/tâche] — [résultat attendu en 1 phrase, formulé côté utilisateur ou bénéficiaire]
- [ ] ...

### Critères de qualité
- [ ] [Critère vérifiable spécifique au projet]
- [ ] ...

### Validation
- [ ] [Comment confirmer que c'est done — test, revue, démo, acceptation]
- [ ] ...

### Conditions de clôture
- [ ] [Action finale pour fermer officiellement le milestone]
- [ ] ...
```

**Adapter les sections au type de projet :**

| Type | Livrables | Validation | Clôture |
|------|-----------|------------|---------|
| **Dev** | features, bugfixes | tests qui passent, pas d'erreur console | déployé en prod |
| **Organisationnel** | décisions prises, actions réalisées | validé par les parties prenantes | CR envoyé/archivé |
| **Apprentissage/recherche** | rapport, code, notes capitalisées | objectifs atteints, exercices faits | capitalisé dans vault |
| **Hardware/infra** | composants installés, config validée | services up, tests fonctionnels | documenté |

**Règle de qualité** : chaque item doit être vérifiable objectivement.
- ❌ "le code est propre" → ✅ "les tests passent sans modification"
- ❌ "c'est bien préparé" → ✅ "l'ordre du jour est envoyé 48h avant"
- ❌ critère flou → `[À préciser : ...]`

**Présenter la checklist avant de sauvegarder.**

---

## Étape 4 — Validation

Attendre que Victor valide, ajuste ou complète les items.

**Ne pas sauvegarder avant confirmation explicite** ("OK", "sauvegarde", "c'est bon").

---

## Étape 5 — Sauvegarder

Sauvegarder la note dans le vault projet :
```
{VAULT_PATH}\{PROJECTS_FOLDER}\[Projet]\milestones\[nom-milestone]-done-criteria.md
```
Créer le dossier `milestones/` s'il n'existe pas.

Si le projet n'est pas dans le vault → demander où sauvegarder.

Frontmatter minimal :
```yaml
---
title: Done criteria — [NomMilestone]
date: [YYYY-MM-DD]
milestone: [NomMilestone]
status: active
---
```

Confirmer : "Sauvegardé → `[chemin]/[nom]-done-criteria.md`"

---

## Règles absolues

- Jamais de sauvegarde sans validation explicite
- Si le milestone est introuvable → afficher ce qui existe et demander, ne pas improviser
- Tous les critères doivent être vérifiables — reformuler ou marquer `[À préciser]`
- La structure des sections s'adapte au projet — ne pas forcer des sections dev sur un projet org
