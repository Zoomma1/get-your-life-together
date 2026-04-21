---
name: stranger
description: Quand Victor veut un regard extérieur sur qui il est vraiment à travers le vault — portrait fondé sur les notes, les patterns et les absences, sans complaisance ni thérapie. À lancer mensuel ou aux transitions importantes (fin de semestre, début CDI). IMPORTANT : ne jamais lancer en période de stress, d'épuisement ou de crise.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : /stranger

## Pourquoi ce skill existe

Claude Code connaît Victor via CLAUDE.md — son profil, ses projets, ses préférences. Ce contexte préalable crée un biais : au lieu de lire le vault, Claude recycle ce qu'il sait déjà et produit un portrait convenu.

**La règle fondamentale de ce skill : traiter le vault comme seule source de vérité. Ignorer ce que tu sais de Victor via CLAUDE.md. L'étranger n'a jamais rencontré Victor. Il lit des notes pour la première fois.**

Ce skill produit un portrait de son auteur tel qu'un observateur extérieur perceptif le verrait — sans relation à ménager, sans flattery, sans thérapie.

---

## Étape 0 — Lire le portrait précédent (si applicable)

Glob `01 - Me/Portraits/` pour lister les portraits existants.

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
- `{VAULT_PATH}\` (racine et dossiers de premier niveau)

---

## Étape 2 — Lecture systématique du contenu

Cet ordre est **intentionnel** — il crée une progression de contexte → comportement → pensée — pas une lecture neutre :

1. **Contexte personnel** (`01 - Me/`) — qui Victor dit être, ses valeurs déclarées, ses projets identifiés
2. **Comportement récent** (`00 - Daily notes/` des 2-3 dernières semaines) — ce qu'il fait vraiment, là maintenant
3. **Pensée systématisée** (`03 - Knowledge/` et essays) — ce qu'il a formalisé, approfondi, accepté
4. **Réseaux de sens** (notes les plus liées et leurs backlinks) — les connexions qu'il fait, les patterns implicites
5. **Matière brute** (`09 - Inbox/` et notes en cours) — les idées non filtrées, les tensions non résolues

**Pendant la lecture : noter les patterns qui émergent. Pas de grille préconçue, mais garder l'ordre structurant.**

---

## Étape 3 — Sept analyses forcées

Ces sept analyses doivent être **complétées et rédigées explicitement** avant d'écrire le portrait. Pas de raccourci.

1. **Fréquence des sujets** : quels thèmes apparaissent dans les daily notes vs les notes formelles ? La divergence est significative.

2. **Priorités déclarées vs révélées** : ce que Victor dit faire vs ce qu'il fait vraiment d'après les notes. L'écart est le vrai sujet.

3. **Patterns émotionnels** : dans les daily notes, quand l'énergie monte ? Quand elle chute ? Quels déclencheurs apparaissent ?

4. **Monde social** : qui est mentionné, avec quelle fréquence, dans quel contexte ? Qui est absent des notes ?

5. **Questions récurrentes** : pas les curiosités passagères — les obsessions. Ce qui revient sans être résolu.

6. **Empreinte du style d'écriture** : ton, longueur, structure, vocabulaire récurrent. Ce que la façon d'écrire dit de la façon de penser.

7. **Absences conspicues** : ce qui devrait être là *selon ce que Victor a lui-même déclaré faire* et ne l'est pas. Exemples : Victor dit mettre un accent sur la famille, mais elle n'apparaît pas dans les daily notes. Victor déclare TDD comme non-négociable, mais les tests ne sont jamais mentionnés dans les retours de session. Les angles morts révèlent autant que ce qui est présent.

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

Ce que Victor fait vraiment de son attention et de son énergie — déduit des patterns, pas des déclarations. Inclure les écarts entre priorités déclarées et révélées.

### Section 3 — Trajectoire

Où Victor va, d'après les notes. Pas ce qu'il dit vouloir faire — ce vers quoi il gravite réellement.

### Section 4 — Patterns invisibles

Les schémas que Victor ne voit probablement pas lui-même. Les récurrences, les structures, les contradictions qui ne sont visibles que de l'extérieur.

### Section 5 — La question non posée

La question que le vault ne pose jamais mais que tout pointe vers elle. Identifier cette question par :
- **Récurrence non résolvable** : un thème qui revient sans jamais être traité à la racine (pas juste "j'ai eu une mauvaise journée", mais un pattern structurel)
- **Tension non nommée** : deux éléments du vault qui sont en conflit implicite (ex : valeur déclarée vs comportement révélé, but énoncé vs énergie réelle)
- **Vide actif** : quelque chose que Victor se pose clairement (traces dans les notes) mais n'explore jamais publiquement

**Cette section se termine par une question directe à la deuxième personne, posée à Victor.**

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

Présenter le portrait complet à Victor sans préambule, sans explication de la méthode, sans demander si c'est ok.

Après le portrait, une seule ligne : "Tu veux qu'on creuse quelque chose ?"

**C'est la seule action supplémentaire autorisée. Pas de :** suggestions de travail, synthèse méthodologique, confirmation du processus, interprétation des réactions.

Puis créer `01 - Me/Portraits/YYYY-MM-DD.md` avec le portrait complet (les 5 ou 6 sections + les 7 analyses préliminaires). Créer le dossier `Portraits/` s'il n'existe pas. Confirmer à Victor : *"Portrait sauvegardé dans `01 - Me/Portraits/`."*

Un portrait, c'est un portrait. Pas un plan.

Mettre à jour `99 - Claude Code/command-tracker.md` : ligne `/stranger` → remplacer la date par la date du jour au format `YYYY-MM-DD`.

---

## Étape 6 — Capitalisation guidée (après que Victor ait creusé)

**Conditionnel** : ne déclencher cette étape que **si** Victor a engagé une discussion après le portrait (réponse à "Tu veux qu'on creuse quelque chose ?"). Si Victor laisse le portrait tel quel ou clôt la session, **skip** cette étape.

Le portrait peut faire émerger des éléments nouveaux : patterns à promouvoir en pattern confirmé, contradictions à nommer, signaux d'alerte à ajouter, tensions à formaliser, faits oraux à archiver. Ces éléments **disparaissent** s'ils ne sont pas capitalisés à chaud — la session `/stranger` du 2026-04-15 a montré que la phase post-portrait est aussi importante que le portrait lui-même (4 fichiers `01 - Me/` enrichis, 1 fichier créé, ADR-018 issu de la discussion).

Quand Victor a creusé un point, **proposer explicitement** une capitalisation cible :

> **Ce qu'on vient de creuser mériterait peut-être :**
> - **Promotion en pattern confirmé** dans `{PERSONAL_FOLDER}/{USER_NAME}.md` (section "Patterns observés") — si on a touché un comportement récurrent sourcé sur 3+ instances
> - **Nouveau signal d'alerte** dans `01 - Me/Signaux d'alerte.md` — si on a nommé un mode d'échec ou une dérive structurelle
> - **Tension active** dans `01 - Me/Aspiration.md` — si on a mis le doigt sur une contradiction entre deux choses que Victor veut
> - **Note de contexte** créée dans `01 - Me/` — si Victor a livré du contexte oral riche qui n'existe nulle part dans le vault (historique, anecdote fondatrice, fait biographique)
> - **ADR transverse** dans `99 - Claude Code/ADR/` — si la discussion a produit une décision réutilisable qui mérite d'être formalisée
>
> Tu valides quoi ?

Pour chaque élément validé : appliquer l'édit / créer le fichier / enrichir la note cible. Présenter les fichiers touchés à la fin.

**Règles importantes** :
- Ne **jamais** écrire dans `01 - Me/` ou créer une ADR sans validation explicite — la phase introspective est sensible, pas de capitalisation silencieuse
- **Ne pas surcharger** : si Victor n'a creusé qu'un seul point, ne pas inventer 5 capitalisations possibles. Le ratio capitalisation/discussion doit rester sobre
- Si le portrait n'a déclenché aucune discussion → skip, le portrait suffit

---

## Fréquence recommandée

- Mensuel comme exercice de recalibrage
- Aux transitions importantes (nouveau projet, nouveau contexte, retour d'un long voyage)
- Pas pendant les périodes de forte charge ou de stress
