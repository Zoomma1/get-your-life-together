---
name: closeweek
description: Bilan hebdomadaire — synthèse des réalisations, apprentissages (orientés insight), patterns détectés et projection semaine suivante. Crée une note dans Weekly/. Déclenché quand l'utilisateur prononce "closeweek", "bilan de la semaine", "on boucle la semaine" ou via `/closeweek [YYYY-WXX]`.
---

# Skill : Close Week

L'objectif de ce bilan n'est pas de raconter la semaine mais de détecter les patterns avant qu'ils deviennent des drifts — prioriser ce qui est actionnable ou révélateur.

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Déclenchement & Rappel

**Invocation directe (vocalisée)** :
- l'utilisateur prononce trigger : "closeweek", "bilan de la semaine", "on boucle la semaine", "c'est quoi le bilan"
- Claude Code détecte et lance le skill automatiquement

**Invocation manuelle (commande)** :
- `/closeweek` seul → traite semaine ISO courante (semaine calendaire de aujourd'hui)
- `/closeweek 2026-W14` → traite semaine spécifique (ex: semaine antérieure pour rattrapage)

**Rappel automatique** :
- Lors de `/today` : vérifier `command-tracker.md` → si écart > 7 jours depuis dernier `/closeweek`, afficher message "Dernière closeweek : W##, il y a N jours. Relancer?" (ne pas déclencher automatiquement closeweek, juste notifier l'utilisateur)

---

## Étape 1 — Déterminer le mode d'exécution

**Calculer la semaine cible** : argument YYYY-WXX passé ou semaine ISO courante par défaut. Déduire lundi (J0) et dimanche (J6) pour délimiter les fichiers à consulter.

**Décider du flux selon la situation** :

| Condition | Action |
|-----------|--------|
| Argument antérieur à semaine courante (ex: on est W14, argument W12) | **Mode final** : créer/écraser `YYYY-WXX.md` |
| Semaine courante (aujourd'hui ∈ W) ET après dimanche 23h59 | **Mode final** : créer/écraser `YYYY-WXX.md` |
| Semaine courante (aujourd'hui ∈ W) ET avant dimanche 23h59 | **Mode draft** : créer `YYYY-WXX-draft.md` avec en-tête "*(Bilan partiel — à finaliser dimanche)*". Continuer normalement après création. |
| Note `YYYY-WXX.md` existe déjà (mode final) | Afficher contenu existant. Prodemander : `[A] ajouter des éléments manquants`, `[R] remplacer complètement`, `[C] créer version nouvelle (YYYY-WXX-v2.md)`. Attendre réponse. |
| Semaines manquantes détectées (entre dernière closeweek et cible) | Afficher liste en ordre ascendant. Proposer : `[T] traiter d'abord les semaines manquantes` ou `[S] sauter et traiter semaine cible`. Attendre réponse. |

**En cas de semaines manquantes validées `[T]`** : traiter la plus ancienne d'abord (appeler closeweek récursivement sur chaque), puis revenir à semaine cible.

---

## Étape 2 — Collecter le matériau

**Lecteur séquentiel** (dans cet ordre) :

1. Lire dernière closeweek antérieure à la cible dans `[NOTES_FOLDER]/Weekly/` → extraire threads non clos et apprentissages récurrents
2. Lire daily notes de la semaine dans `[NOTES_FOLDER]/` (fichiers formatés selon `DATE_FORMAT` dans plage lundi-dimanche cible)
3. Lire sessions de la semaine dans `99 - Claude Code/Sessions/` (fichiers formatés selon `DATE_FORMAT` dans plage lundi-dimanche cible)

**Edge case : 0 daily notes trouvées**
- Afficher : "0 daily notes trouvées pour W##. Procéder?"
- Proposer : `[P] procéder depuis sessions seules` ou `[A] annuler bilan`. Attendre réponse.
- Si `[P]` : afficher "Bilan allégé (sources : sessions seulement)". Continuer avec Étape 3.

**Classer le matériau par impact observable** :

| Niveau | Définition | Action |
|--------|-----------|--------|
| **1** | Décision structurante (change orientation/orga/direction) | Toujours inclure |
| **2** | Nouveau pattern/workflow/habitude détecté | Toujours inclure |
| **3** | Réalisation ponctuelle (insight contextuel) | Inclure si pertinent |
| **4** | Routine (sans surprise notable) | Omettable |

Les **threads non clos** et apprentissages **récurrents** remontent en tête de bilan.

**Edge case : Semaine vide (aucun contenu niveau 1-2)**
- Rédiger court bilan minimaliste (3-4 items). Inclure ligne : "Semaine stable — peu d'événements ou routines consolidées."

**Si sessions nombreuses (3+ par jour)** : synthétiser par jour ou par projet (ex: "Lundi : Projet A setup + tests", "Mercredi : Projet B + réunion"). Ne pas énumérer chaque session.

---

## Étape 3 — Rédiger la note

**Template** :

```markdown
# Semaine WXX — YYYY
*Du [lundi JJ/MM] au [dimanche JJ/MM]*
*[Bilan partiel — à finaliser dimanche]* ← ajouter si mode draft

## Continuité depuis la semaine précédente
[Threads non clos, apprentissages récurrents issus W-1]
← Omettre cette section si aucun fil à poursuivre

## ✅ Réalisé
- ...

## 💡 Apprentissages
*Formuler en "X révèle que...", "X signifie que..." — pas de récap factuel brut.*
- ...

## 🔁 Bloquages & Patterns
*Ce qui a fonctionné, ce qui a bloqué, patterns émergents.*
- Fonctionnement : ...
- Blocage : ...
- Pattern détecté : ...
← Omettre entièrement si aucun blocage/pattern cette semaine

## 🔗 Thème connecteur
*Meta-pattern reliant réalisations/blocages en 1 phrase.*
← Omettre si absent

## ➡️ Semaine suivante
- ...
← Omettre si vide
```

**Règles d'écriture** :
- Sections optionnelles (Continuité, Bloquages & Patterns, Thème connecteur, Semaine suivante) : omettre **silencieusement** si vides — ne jamais laisser section titre vide
- Insight > recap : chaque point doit impliquer quelque chose pour la suite
- Peu de contenu (< 3 items total) : court bilan + expliciter pourquoi (ex: "Semaine stable — peu d'événements")

---

## Étape 4 — Mettre à jour le tracker

**Action 1 : Mettre à jour command-tracker.md AVANT création note**

Lire `99 - Claude Code/command-tracker.md`. Ajouter ou mettre à jour ligne :
```
/closeweek [YYYY-WXX] → exécuté [YYYY-MM-DD HH:MM]
```

Confirmation implicite : si lecture + écriture réussissent, continuer à Étape 5.

---

## Étape 5 — Créer la note

**Chemin final** : `[NOTES_FOLDER]/Weekly/YYYY-WXX.md` ou `YYYY-WXX-draft.md` selon mode (Étape 1)

**Générer la note** avec le contenu rédigé (Étape 3).

**Signal de succès à l'utilisateur** :
- Afficher lien direct vers note créée
- Message : "Semaine W## bilan créé" (ou "draft créé — à finaliser dimanche")

---

## Conversion draft → final

**Dimanche après 23h59** (ou relecture l'utilisateur plus tôt) :

Lancer `/closeweek 2026-W14` sur même semaine. Le système détecte draft existant (Étape 1, condition 4). l'utilisateur choisit `[R] remplacer complètement` → rédaction nouvelle remplace le draft.

Alternativement, l'utilisateur peut relancer mercredi et choisir `[A] ajouter manquants` pour enrichir le draft puis relancer dimanche `[R]`.

---

## Règles absolues

- La mise à jour comportementale du profil utilisateur (`[ME_FOLDER]/[NOM].md`) est le rôle de `/closemonth`, pas de ce skill
- Traiter une semaine à la fois si plusieurs semaines en retard — proposer l'ordre (Étape 1, condition 5)
- Insight > recap : valeur = ce que la semaine implique, pas ce qu'elle contient

---

## Edge cases — Résolution

| Scénario | Réponse |
|----------|---------|
| Lancé mercredi semaine courante | Mode draft (Étape 1). Note `YYYY-WXX-draft.md` créée. Signal : "À finaliser dimanche : `/closeweek` ou `/closeweek YYYY-WXX` → `[R]`". |
| 0 daily notes semaine | Étape 2 : afficher choix `[P]/[A]`. Si `[P]` : message "Bilan allégé (sessions seules)". Continuer. |
| Calendrier ISO chevauchant 2 mois (ex W13 = mar-avr) | Utiliser ISO W13, mentionner plage dates dans en-tête (ex "Du 24/03 au 30/03"). |
| Draft existant pour semaine cible | Étape 1, condition 4 : proposer `[A]/[R]/[C]`. Attendre réponse avant continuer. |
| command-tracker.md absent/cassé | Inférer depuis dates création fichiers : lister tous `YYYY-WXX.md` dans `Weekly/`, extraire MAX(date modif), déduire W courante. Afficher "Tracker absent — reconstruction basée sur fichiers. Continuer?" Attendre confirmation. |
| Erreur calcul ISO (dates invalides) | Afficher : "Impossible de calculer semaine ISO pour [argument]. Vérifier format YYYY-WXX ou date argument. Relancer?" Attendre nouveau argument. |
| Aucun contenu niveau 1-2 (semaine vide) | Rédiger court bilan minimaliste (3-4 items) + ligne "Semaine stable — peu d'événements ou routines consolidées." |

---

## Pair-programming

- Aucune action autonome : toute décision (mode final/draft, traitement semaines manquantes, procédure 0 daily notes) attend validation explicite de l'utilisateur
- Tracker avant note : mise à jour `command-tracker.md` se fait en premier (Étape 4), avant création note (Étape 5)
- Choix proposés sont clairs et contextualisés : jamais "Continuer?" sans option explicite
