---
name: stranger
description: Quand l'utilisateur veut un regard extérieur sur qui il est vraiment à travers le vault — portrait fondé sur les notes, les patterns et les absences, sans complaisance ni thérapie. À lancer mensuel ou aux transitions importantes (fin de semestre, début CDI). IMPORTANT : ne jamais lancer en période de stress, d'épuisement ou de crise.
---

# Skill : /stranger

## Pourquoi ce skill existe

Claude Code connaît l'utilisateur via CLAUDE.md — son profil, ses projets, ses préférences. Ce contexte préalable crée un biais : au lieu de lire le vault, Claude recycle ce qu'il sait déjà et produit un portrait convenu.

**La règle fondamentale de ce skill : traiter le vault comme seule source de vérité. Ignorer ce que tu sais de l'utilisateur via CLAUDE.md. L'étranger n'a jamais rencontré l'utilisateur. Il lit des notes pour la première fois.**

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

---

Ce skill produit un portrait de son auteur tel qu'un observateur extérieur perceptif le verrait — sans relation à ménager, sans flattery, sans thérapie.

---

## Étape 0 — Lire le portrait précédent (si applicable)

Glob `[ME_FOLDER]/Portraits/` pour lister les portraits existants.

- Si au moins un portrait existe → **identifier le plus récent par date ISO dans le nom (YYYY-MM-DD.md), priorité sur modification time**. Lire ce portrait. Extraire : date, les 5 sections du portrait, et les 7 analyses préliminaires.
- Si aucun portrait → continuer directement à l'Étape 1. Le portrait final contiendra uniquement les sections 1-5 (pas de Delta).

Ce portrait précédent sert uniquement de baseline pour la Section 6 (Delta) en fin de portrait. Ne pas l'utiliser pendant la lecture du vault (Étapes 1-2) — garder le regard neuf.

---

## Étape 1 — Cartographie structurelle

Avant de lire le moindre mot, analyser l'architecture du vault :

- Dossiers présents et leur hiérarchie
- Notes orphelines (sans liens entrants)
- Impasses (notes qui ne mènent nulle part)
- Distribution des tags
- Ratio notes actives / notes abandonnées

**Principe : la structure révèle les priorités avant que le contenu ne le fasse.**

Chemins à explorer :
- Racine du vault et dossiers de premier niveau

---

## Étape 2 — Lecture systématique du contenu

Cet ordre est **intentionnel** — il crée une progression de contexte → comportement → pensée — pas une lecture neutre :

1. **Contexte personnel** (`[ME_FOLDER]/`) — qui l'utilisateur dit être, ses valeurs déclarées, ses projets identifiés
2. **Comportement récent** (daily notes des 2-3 dernières semaines — dossier `NOTES_FOLDER` de vault-settings.md) — ce qu'il fait vraiment, là maintenant
3. **Pensée systématisée** (`[KNOWLEDGE_FOLDER]/` et essays) — ce qu'il a formalisé, approfondi, accepté
4. **Réseaux de sens** (notes les plus liées et leurs backlinks) — les connexions qu'il fait, les patterns implicites
5. **Matière brute** (`[INBOX_FOLDER]/` et notes en cours) — les idées non filtrées, les tensions non résolues

**Pendant la lecture : noter les patterns qui émergent. Pas de grille préconçue, mais garder l'ordre structurant.**

---

## Étape 3 — Sept analyses forcées

Ces sept analyses doivent être **complétées et rédigées explicitement** avant d'écrire le portrait. Pas de raccourci.

1. **Fréquence des sujets** : quels thèmes apparaissent dans les daily notes vs les notes formelles ? La divergence est significative.

2. **Priorités déclarées vs révélées** : ce que l'utilisateur dit faire vs ce qu'il fait vraiment d'après les notes. L'écart est le vrai sujet.

3. **Patterns émotionnels** : dans les daily notes, quand l'énergie monte ? Quand elle chute ? Quels déclencheurs apparaissent ?

4. **Monde social** : qui est mentionné, avec quelle fréquence, dans quel contexte ? Qui est absent des notes ?

5. **Questions récurrentes** : pas les curiosités passagères — les obsessions. Ce qui revient sans être résolu.

6. **Empreinte du style d'écriture** : ton, longueur, structure, vocabulaire récurrent. Ce que la façon d'écrire dit de la façon de penser.

7. **Absences conspicues** : ce qui devrait être là *selon ce que l'utilisateur a lui-même déclaré faire* et ne l'est pas. Exemples : l'utilisateur dit mettre un accent sur la famille, mais elle n'apparaît pas dans les daily notes. l'utilisateur déclare TDD comme non-négociable, mais les tests ne sont jamais mentionnés dans les retours de session. Les angles morts révèlent autant que ce qui est présent.

---

## Étape 4 — Le portrait (cinq sections)

**Format : troisième personne tout au long, sauf la question finale.**

**Contraintes non négociables :**
- Minimum 2 observations inconfortables (avec evidence)
- Minimum 2 observations admiratives (avec evidence)
- Chaque claim citée avec une source concrète dans le vault
- Zéro flattery
- Zéro therapy-speak. Pas de "il a besoin de", "il devrait", "il faudrait qu'il". Les observations, pas les prescriptions.
- Zéro hedging diplomatique ("peut-être", "on pourrait dire")
- Zéro résumé générique de ce qui est déjà visible

---

### Section 1 — Première impression

Ce que le vault communique en premier, avant toute analyse. L'impression globale d'un lecteur qui tombe dessus par hasard.

### Section 2 — Priorités réelles

Ce que l'utilisateur fait vraiment de son attention et de son énergie — déduit des patterns, pas des déclarations. Inclure les écarts entre priorités déclarées et révélées.

### Section 3 — Trajectoire

Où l'utilisateur va, d'après les notes. Pas ce qu'il dit vouloir faire — ce vers quoi il gravite réellement.

### Section 4 — Patterns invisibles

Les schémas que l'utilisateur ne voit probablement pas lui-même. Les récurrences, les structures, les contradictions qui ne sont visibles que de l'extérieur.

### Section 5 — La question non posée

La question que le vault ne pose jamais mais que tout pointe vers elle. Identifier cette question par :
- **Récurrence non résolvable** : un thème qui revient sans jamais être traité à la racine (pas juste "j'ai eu une mauvaise journée", mais un pattern structurel)
- **Tension non nommée** : deux éléments du vault qui sont en conflit implicite (ex : valeur déclarée vs comportement révélé, but énoncé vs énergie réelle)
- **Vide actif** : quelque chose que l'utilisateur se pose clairement (traces dans les notes) mais n'explore jamais publiquement

**Cette section se termine par une question directe à la deuxième personne, posée à l'utilisateur.**

### Section 6 — Delta depuis le portrait précédent

*Uniquement si un portrait précédent a été lu à l'Étape 0. Omettre entièrement sinon.*

```
**Ce qui a disparu** : patterns, tensions, sujets présents dans le portrait précédent et absents de celui-ci.

**Ce qui s'est renforcé** : patterns confirmés sur les deux portraits — signaux structurels profonds.

**Ce qui est apparu** : nouvelles dimensions absentes du portrait précédent.

**Shifts dans le mode de travail** : changements dans les priorités déclarées, l'organisation, l'énergie observée, les projets actifs.

**Score de drift** : Faible (continuité visible) / Notable (évolution claire) / Rupture (changement majeur entre les deux portraits)
```

---

## Présentation du résultat

Présenter le portrait complet à l'utilisateur sans préambule, sans explication de la méthode, sans demander si c'est ok.

Après le portrait, une seule ligne : "Tu veux qu'on creuse quelque chose ?"

**C'est la seule action supplémentaire autorisée. Pas de :** suggestions de travail, synthèse méthodologique, confirmation du processus, interprétation des réactions.

Puis créer `[ME_FOLDER]/Portraits/YYYY-MM-DD.md` avec le portrait complet (les 5 ou 6 sections + les 7 analyses préliminaires). Créer le dossier `Portraits/` s'il n'existe pas. Confirmer à l'utilisateur : *"Portrait sauvegardé dans `[ME_FOLDER]/Portraits/`."*

Un portrait, c'est un portrait. Pas un plan.

---

## Fréquence recommandée

- Mensuel comme exercice de recalibrage
- Aux transitions importantes (nouveau projet, nouveau contexte, retour d'un long voyage)
- Pas pendant les périodes de forte charge ou de stress

## Étape finale — Mettre à jour le tracker

Mettre à jour `99 - Claude Code/command-tracker.md` :
- Ligne `/stranger` → remplacer la date par la date du jour au format `DATE_FORMAT`
