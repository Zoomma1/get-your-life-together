---
name: essay-check
description: Synthèse des essays formalisés depuis le dernier check — lit les essays de `03 - Knowledge/Essays/` modifiés depuis last_check, identifie 2-3 patterns sourcés avec leur relation à {USER_NAME}.md (Nouveau/Confirme/Contredit/Nuance), pose 1 question ouverte sourcée, propose un patch {USER_NAME}.md (§ patterns observés) après validation. Déclenché par `/closeday` Étape 6 tous les 7j ou en standalone `/essay-check`.
---

# Skill : Essay Check

## Déclenchement

- Via `/closeday` Étape 6 si le command-tracker indique `/essay-check` overdue ≥7j
- Commande directe : `/essay-check`

## Étape 1 — Collecter les essays à traiter

1. Lire `99 - Claude code/command-tracker.md` → extraire la date de la ligne `| /essay-check | YYYY-MM-DD | 7 jours |`
2. Si entrée absente ou date invalide → fallback `last_check = aujourd'hui - 30 jours`
3. Glob `03 - Knowledge/Essays/**/*.md` (récursif pour couvrir d'éventuels sous-dossiers)
4. Filtrer par `mtime > last_check` — essays créés **ou** modifiés depuis le dernier check
5. Exclure `INDEX.md` s'il existe dans le dossier

**Si liste vide** → message à Victor : "Aucun essay modifié depuis YYYY-MM-DD — rien à synthétiser." + **mettre à jour le tracker à la date du jour** (le check a eu lieu) + fin du skill.

**Sinon** → annoncer la liste à Victor :
> Essay check — N essays à lire depuis YYYY-MM-DD :
> - [[essay-1]] — modifié YYYY-MM-DD
> - [[essay-2]] — modifié YYYY-MM-DD

## Étape 2 — Lecture et analyse

Lire **en parallèle** :
- Chaque essay filtré (contenu intégral)
- `01 - Me/{USER_NAME}.md` — pour connaître les patterns déjà documentés (section "Patterns observés")

Identifier 2-3 thèmes émergents qui sont **formalisés** dans l'essay (pas juste mentionnés en passant) et qui correspondent à une de ces catégories :

- **[Nouveau]** — pattern absent de `{USER_NAME}.md`
- **[Confirme]** — pattern `{USER_NAME}.md` existant, nouvelle source qui le consolide
- **[Contredit]** — pattern `{USER_NAME}.md` existant remis en cause par l'essay
- **[Nuance]** — pattern existant complété ou limité par une zone que l'essay explore

Pour chaque thème, noter :
- Essay(s) concerné(s)
- Phrase clé ou passage court extrait (1-2 phrases max)
- Catégorie ci-dessus

**Règle critique** : se concentrer sur ce qui est *formalisé* dans un essay (pensée posée), pas les idées récurrentes non traitées (domaine de `/drift`) ni les actions hebdo (domaine de `/closeweek`).

## Étape 3 — Synthèse + question ouverte

Présenter à Victor **dans le chat** (aucune écriture vault à ce stade) :

```
Essay check — N essays lus depuis YYYY-MM-DD :
- [[essay-1]] — modifié YYYY-MM-DD
- [[essay-2]] — modifié YYYY-MM-DD

Patterns détectés :

1. [Titre pattern] — [Nouveau|Confirme|Contredit|Nuance]
   [Résumé 1-2 phrases de ce que le pattern dit].
   Sourcé dans [[essay X]] : "[phrase clé extraite]"

2. [...]
3. [...]

1 question pour creuser (sourcée sur un pattern précis) :
[Question non générique, ancrée sur un thème émergent — ex: contradiction entre deux essays, pattern nouveau qui mérite un statut, nuance qui ouvre une zone floue]
```

**Règles pour la question** :
- Toujours 1 question, jamais zéro, jamais plus de 1 (le skill doit rester léger)
- Sourcée sur un pattern précis identifié à l'Étape 2
- Pas générique ("comment tu te sens ?") — préciser sur la formulation de l'essay

Attendre réponse Victor (timeout 45s).

**Timeout / pas de réponse** → skip Étape 4 sans écriture, passer directement à Étape 5 (mise à jour tracker), fin.

## Étape 4 — Patch {USER_NAME}.md (conditionnel)

Après réponse de Victor, pour chaque pattern qu'il valide ou enrichit :

| Catégorie       | Action proposée                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------- |
| **[Nouveau]**   | Ajout d'un nouveau bullet dans `§ "Patterns observés (harvest YYYY-MM)"` — créer la sous-section du mois en cours si absente |
| **[Confirme]**  | Enrichissement du pattern existant : nouvelle source + date, formulation affinée si besoin      |
| **[Contredit]** | Révision du pattern avec nuance explicite (conserver le pattern antérieur + ajouter le nouveau point) |
| **[Nuance]**    | Ajout d'un bullet enfant sous le pattern existant                                              |

Présenter le **diff exact** (old → new) à Victor patch par patch, attendre OK avant chaque Edit.

**Timeout 45s** par patch → skip ce patch, continuer au suivant.
**Refus explicite** ("non" / "skip") → ne pas écrire ce patch, noter raison éventuelle (peut être utile au prochain check).

## Étape 5 — Mettre à jour command-tracker

**Toujours**, même si :
- Aucun patch n'a été accepté
- Timeout en Étape 3 ou 4
- Liste vide en Étape 1

Éditer `99 - Claude code/command-tracker.md` :
```
| /essay-check    | YYYY-MM-DD         | 7 jours               |
```
Date du jour (format ISO).

Le check a eu lieu, même si rien n'a été écrit — c'est la cadence qui compte, pas l'écriture systématique.

## Règles

1. **Scope essays uniquement** — `03 - Knowledge/Essays/*.md` et sous-dossiers. Exclure explicitement : dumps (`00 - Daily notes/`), thinking sessions, brouillons d'essays dans `04 - Projects/Project ideas/essay-*.md` (pas encore formalisés).
2. **Toujours présenter avant d'écrire** — chaque patch `{USER_NAME}.md` attend un OK explicite. Pas de batch silencieux.
3. **Filtre mtime strict** — ne jamais re-traiter un essay déjà pris en compte dans un check précédent (évite doublons d'enrichissement {USER_NAME}.md).
4. **Pas de doublon avec /closeweek ou /drift** — se concentrer sur ce qui est *formalisé* dans un essay, pas les idées récurrentes non traitées ni les actions hebdo.
5. **Fallback {USER_NAME}.md absent** → skip Étape 4 silencieusement, faire juste la synthèse en chat + update tracker.
6. **Timeout standard 45s** par interaction — skip ou continuer sans écrire selon l'étape.
7. **Append-only dans {USER_NAME}.md** — ne jamais supprimer un pattern existant, seulement enrichir/nuancer (historique préservé). Pour un [Contredit], ajouter la contradiction sous le pattern existant au lieu de réécrire.
8. **Tracker mis à jour même si rien n'est écrit** — le check est compté à partir du moment où il est déclenché.
