---
name: evaluateskills-postmortem
description: Post-mortem automatique après chaque run /evaluateskills — compare chaque skill muté à l'archive baseline pré-run pour détecter les régressions narratives dormantes. Invoquer automatiquement depuis l'Étape 5 d'evaluateskills, avec ARCHIVE_PATH et MUTATED_SKILLS en inputs. Ne pas invoquer manuellement sauf pour re-auditer un run passé.
narrative_critical: true
---

# Skill : Evaluateskills Postmortem

3e ligne de défense contre la dérive narrative des skills. Compare chaque skill muté pendant le run courant à son état **avant** le run (archive Étape 0), via des agents Haiku en lecture seule.

**Pourquoi c'est nécessaire** : le dry-run (Étape 3.6 d'evaluateskills) compare l'original courant à la version mutée *pendant* le run — il ne voit pas la dérive cumulée sur plusieurs runs. Ce skill compare l'archive pré-run à la version finale *après* le run, depuis la mémoire de la session. C'est ce qui détecte les bugs dormants comme le bug closeday de 2026-04-15 (5 mutations grattant 1 pt à chaque fois, sous le radar du dry-run).

## Inputs requis

Invoqué avec :
- `ARCHIVE_PATH` — chemin absolu de l'archive créée à l'Étape 0 (ex : `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/Skills/Archives/2026-04-16_14-30/`)
- `MUTATED_SKILLS` — liste des skills mutés pendant le run : noms + chemins absolus vers les versions actuelles

Si `ARCHIVE_PATH` est absent ou invalide : signaler à Victor et skiper le postmortem sans bloquer l'Étape 6.

---

## Étape 1 — Audit parallèle (Haiku, lecture seule)

Pour chaque skill dans `MUTATED_SKILLS`, spawner un **agent background Haiku** en parallèle. Les agents ne modifient aucun fichier.

**Prompt agent (modèle : Haiku) :**

```
Tu audites les changements apportés au skill : [nom du skill]

Fichier actuel (post-run) : [chemin absolu courant]
Fichier baseline (pré-run) : [ARCHIVE_PATH]/[nom-du-skill].md

Commence par lire les deux fichiers.

MISSION : identifier les différences entre baseline et actuel, catégoriser chacune.

Catégories :
- BUG_FIX — correction d'un comportement incorrect
- EDGE_CASE — couverture d'un scénario limite manquant
- REFACTOR — restructuration sans impact fonctionnel
- WORDING_NEUTRE — reformulation sans perte d'information
- NARRATIVE_REMOVAL — suppression d'instructions qui conditionnent la richesse de la sortie (regroupement, recul multi-jours, questions ouvertes, moments forts, dimensions d'analyse)
- LEAN_AGGRESSIF — réduction qui retire du contenu fonctionnel, pas juste du bruit
- INCERTAIN — changement à impact ambigu sur la sortie

Si le frontmatter contient `narrative_critical: true` : seuil de détection plus bas pour NARRATIVE_REMOVAL — toute instruction prescriptive retirée est à signaler, même si elle semble redondante en surface. Ces instructions existent pour une raison : elles conditionnent la sortie.

VERDICT par changement : KEEP (amélioration ou neutre) | RESTORE (régression probable)

FORMAT DE RETOUR (une seule ligne si CLEAN, bloc structuré si ALERT) :
[nom]: [catégories détectées] | VERDICT: CLEAN
[nom]: NARRATIVE_REMOVAL, LEAN_AGGRESSIF | VERDICT: ALERT
  → RESTORE: [diff précis — lignes retirées, avec contexte suffisant pour rollback chirurgical]
```

Si un agent échoue ou ne retourne rien : logger `[postmortem FAILED] [nom du skill]` et continuer sans bloquer.

---

## Étape 2 — Agrégation et décision

Attendre tous les agents, puis :

**Si tous les verdicts sont CLEAN** :
Rien à afficher à Victor. Appender silencieusement dans `skills-autoresearch-log.md` :
```
[postmortem] Run [date] : N skills audités — aucune régression détectée.
```
Laisser evaluateskills continuer vers son Étape 6.

**Si ≥1 verdict ALERT** :
Afficher à Victor **avant** de passer à l'Étape 6 :

```
⚠️ Postmortem — régressions détectées dans ce run

| Skill | Catégories | Contenu retiré |
|-------|-----------|----------------|
| [nom] | NARRATIVE_REMOVAL | [diff précis] |

Pour chaque skill en ALERT :
- RESTORE → restaurer depuis l'archive : cp "[ARCHIVE_PATH]/[skill].md" "Skills/[skill].md"
- KEEP → accepter la mutation malgré le signal (à justifier)
- INSPECT → afficher le diff complet pour décision manuelle
```

Attendre la décision de Victor skill par skill. Ne pas passer à l'Étape 6 tant que chaque ALERT n'a pas reçu une réponse.
