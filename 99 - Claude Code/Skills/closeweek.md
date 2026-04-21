---
name: closeweek
description: Bilan hebdomadaire — synthèse des réalisations, apprentissages (orientés insight), patterns détectés et projection semaine suivante. Crée une note dans Weekly/. Déclenché quand Victor prononce "closeweek", "bilan de la semaine", "on boucle la semaine" ou via `/closeweek [YYYY-WXX]`.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit une sortie **narrative qualitative**. Son efficacité se mesure sur la **richesse de la sortie produite**, pas sur la compacité structurelle.
>
> **Pour `/evaluateskills`** : en cas de mutation, **dry-run Sonnet obligatoire même si delta < 2**. Ne PAS appliquer `[LEAN]` / `[STRUCTURE]` de manière à décaper les instructions narratives (regroupement, contexte, moments forts, questions ouvertes, ton, narration). La préservation du contenu qualitatif prime sur la réduction de lignes.

# Skill : Close Week

L'objectif de ce bilan n'est pas de raconter la semaine mais de détecter les patterns avant qu'ils deviennent des drifts — prioriser ce qui est actionnable ou révélateur.

## Déclenchement & Rappel

**Invocation directe (vocalisée)** :
- Victor prononce trigger : "closeweek", "bilan de la semaine", "on boucle la semaine", "c'est quoi le bilan"
- Claude Code détecte et lance le skill automatiquement

**Invocation manuelle (commande)** :
- `/closeweek` seul → traite semaine ISO courante (semaine calendaire de aujourd'hui)
- `/closeweek 2026-W14` → traite semaine spécifique (ex: semaine antérieure pour rattrapage)

**Rappel automatique** :
- Lors de `/today` : vérifier `command-tracker.md` → si écart > 7 jours depuis dernier `/closeweek`, afficher message "Dernière closeweek : W##, il y a N jours. Relancer?" (ne pas déclencher automatiquement closeweek, juste notifier Victor)

---

## Étape 1 — Déterminer le mode d'exécution

**Calculer la semaine cible** : argument YYYY-WXX passé ou semaine ISO courante par défaut. Déduire lundi (J0) et dimanche (J6) pour délimiter les fichiers à consulter.

**Décider du flux selon la situation** :

| Condition                                                            | Action                                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Argument antérieur à semaine courante (ex: on est W14, argument W12) | **Mode final** : créer/écraser `YYYY-WXX.md`                                                                                                                                        |
| Semaine courante (aujourd'hui ∈ W) ET aujourd'hui = dimanche         | **Mode final** : créer/écraser `YYYY-WXX.md`                                                                                                                                        |
| Semaine courante (aujourd'hui ∈ W) ET aujourd'hui ≠ dimanche         | **Mode draft** : créer `YYYY-WXX-draft.md` avec en-tête "*(Bilan partiel — à finaliser dimanche)*". Continuer normalement après création.                                           |
| Note `YYYY-WXX.md` existe déjà (mode final)                          | Afficher contenu existant. Proposer à Victor : `[A] ajouter des éléments manquants`, `[R] remplacer complètement`, `[C] créer version nouvelle (YYYY-WXX-v2.md)`. Attendre réponse. |
| Semaines manquantes détectées (entre dernière closeweek et cible)    | Afficher liste en ordre ascendant. Proposer : `[T] traiter d'abord les semaines manquantes` ou `[S] sauter et traiter semaine cible`. Attendre réponse.                             |

**En cas de semaines manquantes validées `[T]`** : traiter la plus ancienne d'abord (appeler closeweek récursivement sur chaque), puis revenir à semaine cible.

---

## Étape 2 — Collecter le matériau

**Lecteur séquentiel** (dans cet ordre) :

1. Lire dernière closeweek antérieure à la cible dans `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\` → extraire threads non clos et apprentissages récurrents
2. Lire daily notes de la semaine dans `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\` (fichiers `YYYY-MM-DD.md` dans plage lundi-dimanche cible)
3. Lire sessions de la semaine dans `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Sessions\` (fichiers `YYYY-MM-DD.md` dans plage lundi-dimanche cible)

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

**Check santé mentale au travail** (actif si `work_hours > 5` au moins 3 jours dans la semaine) :
Évaluer les 10 signaux de `06 - Work/Theodo Extend/signaux-anti-kshuttle.md` sur la semaine écoulée. Marquer chaque signal atteint. Si ≥ 1 flag → inclure section dédiée dans la note (Étape 3). Si aucun flag → omettre silencieusement.

**Si sessions nombreuses (3+ par jour)** : synthétiser par jour ou par projet (ex: "Lundi : FSTG setup + tests", "Mercredi : Ludisep + réunion"). Ne pas énumérer chaque session.

### Collecte orthographe

En parallèle de la lecture du matériau principal — résultat stocké pour Étape 6.

**1. Sessions Postgres** — récupérer les sessions de la semaine :
```bash
psql postgresql://claude:claude@localhost:5433/claude_sessions \
  -t -A -F'|||' \
  -c "SELECT date, title, raw_md FROM sessions WHERE date BETWEEN '[lundi YYYY-MM-DD]' AND '[dimanche YYYY-MM-DD]' ORDER BY date, time"
```
Si 0 résultats → ignorer, continuer.

**2. Réflexions daily notes** — extraire les sections `## 📝 Réflexions` des daily notes déjà lues cette semaine. Concaténer en un seul bloc texte.

**3. Agents Haiku en parallèle** — lancer 1 agent par `raw_md` de session + 1 agent pour le bloc Réflexions agrégé. Prompt exact :
> "Identifie les fautes d'orthographe, accords incorrects ou tournures fautives en français dans ce texte. Retourne uniquement une liste JSON : [{\"erreur\": \"...\", \"correction\": \"...\", \"regle\": \"...\"}]. Maximum 5 items. Si aucune faute détectée → retourne []."

**4. Agréger** — fusionner tous les outputs JSON, compter les occurrences de chaque erreur, retenir les 2-3 plus fréquentes → variable `ortho_items`.
Si `ortho_items` vide → omettre silencieusement en Étape 6.

### Détection récurrence long terme (optionnel, fail silencieux)

Pour chaque **pattern de niveau 1-2** identifié dans le matériau (Patterns détectés, Bloquages) :
```bash
uv run ~/.claude/semantic_search.py "<pattern en 3-5 mots>" --top-k 3 --since <lundi-4semaines>
```
Si similarity ≥ 0.45 sur sessions **antérieures** à la semaine cible → pattern récurrent inter-semaines :
1. **Ancienneté** : date de première occurrence trouvée
2. **Ce qui en a découlé** : relancer `--type accompli --since <date première occurrence>` pour voir les suites
3. **Stocker** dans variable `pattern_recurrents` : liste de `{pattern, première_date, suite}`

Si Postgres/Ollama inaccessible → `pattern_recurrents = []`, non-bloquant, afficher : `⚠️ Détection récurrence indisponible (Postgres/Ollama down) — patterns sourçés sur closweek précédente uniquement.`

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
  *Si pattern récurrent (variable `pattern_recurrents`) :*
  `→ Récurrent depuis YYYY-MM-DD — suite observée : [ce qui en a découlé, 1 phrase]`
← Omettre entièrement si aucun blocage/pattern cette semaine

## 🔗 Thème connecteur
*Meta-pattern reliant réalisations/blocages en 1 phrase.*
← Omettre si absent

## ➡️ Semaine suivante
- ...
← Omettre si vide

## 🚨 Work mental health check
← Inclure uniquement si ≥ 1 signal flaggé ET `work_hours > 5` au moins 3 jours cette semaine

| Signal | Niveau | Statut |
|--------|--------|--------|
| ... | 🟡/🔴 | Flaggé |

→ Action : [Dump Telegram] ou [Check-in Jay si 🔴 ou 2+ flags sur 2+ semaines consécutives]
← Omettre entièrement si aucun signal flaggé
```

**Règles d'écriture** :
- Sections optionnelles (Continuité, Bloquages & Patterns, Thème connecteur, Semaine suivante) : omettre **silencieusement** si vides — ne jamais laisser section titre vide
- Insight > recap : chaque point doit impliquer quelque chose pour la suite
- Peu de contenu (< 3 items total) : court bilan + expliciter pourquoi (ex: "Semaine stable — peu d'événements")

---

## Étape 4 — Mettre à jour le tracker

**Action 1 : Mettre à jour command-tracker.md AVANT création note**

Lire `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`. Ajouter ou mettre à jour ligne :
```
/closeweek [YYYY-WXX] → exécuté [YYYY-MM-DD HH:MM]
```

Confirmation implicite : si lecture + écriture réussissent, continuer à Étape 5.

---

## Étape 5 — Créer la note

**Chemin final** : `{VAULT_PATH}\{DAILY_NOTES_FOLDER}\Weekly\YYYY-WXX.md` ou `YYYY-WXX-draft.md` selon mode (Étape 1)

**Générer la note** avec le contenu rédigé (Étape 3).

**Signal de succès à Victor** :
- Afficher lien direct vers note créée
- Message : "Semaine W## bilan créé" (ou "draft créé — à finaliser dimanche")

---

## Étape 6 — Recap chat

Après création de la note, afficher directement dans le chat (pas dans la note) :

**1. Recap narratif de la semaine** — 3-5 lignes max, orienté sens et mouvement, pas liste de tâches. Inclure le thème connecteur si présent.

**2. Tableau des priorités W+1** — format :

| Priorité | Sujet |
|----------|-------|
| 🔴 Urgent/bloquant | ... |
| 🟠 Important | ... |
| 🟡 À avancer si possible | ... |

Sourcer les priorités depuis la section `➡️ Semaine suivante` de la note + threads non clos détectés en Étape 2.

**3. Work mental health check** (si `work_hours > 5` au moins 3 jours cette semaine) — afficher uniquement si ≥ 1 signal flaggé : liste des flags + action recommandée (dump Telegram / check-in Jay).

**4. Orthographe** (si `ortho_items` non vide) :

```
### ✍️ Orthographe — cette semaine
- "erreur observée" → correction (règle en 1 phrase)
```

Maximum 3 items. Ton neutre, factuel. Omettre silencieusement si `ortho_items` vide.

**Règle** : le recap chat est toujours affiché, même en mode draft.

---

## Conversion draft → final

**Dimanche après 23h59** (ou relecture Victor plus tôt) :

Lancer `/closeweek 2026-W14` sur même semaine. Le système détecte draft existant (Étape 1, condition 4). Victor choisit `[R] remplacer complètement` → rédaction nouvelle remplace le draft.

Alternativement, Victor peut relancer mercredi et choisir `[A] ajouter manquants` pour enrichir le draft puis relancer dimanche `[R]`.

---

## Règles absolues

- La mise à jour comportementale de `Victor.md` est le rôle de `/closemonth`, pas de ce skill
- Traiter une semaine à la fois si plusieurs semaines en retard — proposer l'ordre (Étape 1, condition 5)
- Insight > recap : valeur = ce que la semaine implique, pas ce qu'elle contient

---

## Edge cases — Résolution

| Scénario | Réponse |
|----------|---------|
| Lancé lundi–samedi semaine courante | Mode draft (Étape 1). Note `YYYY-WXX-draft.md` créée. Signal : "À finaliser dimanche : `/closeweek` ou `/closeweek YYYY-WXX` → `[R]`". |
| 0 daily notes semaine | Étape 2 : afficher choix `[P]/[A]`. Si `[P]` : message "Bilan allégé (sessions seules)". Continuer. |
| Calendrier ISO chevauchant 2 mois (ex W13 = mar-avr) | Utiliser ISO W13, mentionner plage dates dans en-tête (ex "Du 24/03 au 30/03"). |
| Draft existant pour semaine cible | Étape 1, condition 4 : proposer `[A]/[R]/[C]`. Attendre réponse avant continuer. |
| command-tracker.md absent/cassé | Inférer depuis dates création fichiers : lister tous `YYYY-WXX.md` dans `Weekly/`, extraire MAX(date modif), déduire W courante. Afficher "Tracker absent — reconstruction basée sur fichiers. Continuer?" Attendre confirmation. |
| Erreur calcul ISO (dates invalides) | Afficher : "Impossible de calculer semaine ISO pour [argument]. Vérifier format YYYY-WXX ou date argument. Relancer?" Attendre nouveau argument. |
| Aucun contenu niveau 1-2 (semaine vide) | Rédiger court bilan minimaliste (3-4 items) + ligne "Semaine stable — peu d'événements ou routines consolidées." |

---

## Pair-programming

- Aucune action autonome : toute décision (mode final/draft, traitement semaines manquantes, procédure 0 daily notes) attend validation explicite de Victor
- Tracker avant note : mise à jour `command-tracker.md` se fait en premier (Étape 4), avant création note (Étape 5)
- Choix proposés sont clairs et contextualisés : jamais "Continuer?" sans option explicite
