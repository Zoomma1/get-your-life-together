---
name: workon
description: Charge le contexte d'une feature Kanban, d'une note ou d'un ticket et démarre une session de travail dessus. Utiliser quand l'utilisateur bascule vers un sujet spécifique (dev, apprentissage, hobby, organisation) après avoir clarifié *quoi* faire. Ne pas charger de skills d'emblée — détecter les besoins à partir du contexte et laisser l'utilisateur décider. Exemples : /workon Add tag management, /workon ML projet VUT, /workon Setup maison. Non-contextes : recall (cherche des notes), specs (génère des specs), refine (challenger un ticket), my-world (charge le jour).
---

Charge le contexte du sujet passé en argument et prépare une session de travail dessus.

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

## Étape 1 — Identifier le sujet

L'argument passé est : $ARGUMENTS

Chercher strictement dans cet ordre :

1. **Titre exact** : une note/ticket/feature dont le titre correspond littéralement à `$ARGUMENTS` (insensible à la casse)
   - Chercher dans : vault notes perso, puis **toutes les colonnes** des Kanban `[PROJECTS_FOLDER]/*/Features/` (Ready, WIP, Specs, Done)
   - Si trouvée → retenir le chemin exact et s'arrêter
2. **Titre partial** : correspondances partielles — première mention de `$ARGUMENTS` dans le titre compte comme match (ex: "Add tag management" match "tag" dans "Tag system", "management" dans "Paint inventory management")
   - Filtrer par pertinence : projets actifs en priorité (trier par date de dernière modification)
   - Si un seul résultat → continuer, si plusieurs → afficher liste (max 5) + demander sélection
3. **Recherche Glob** (fallback) : si aucun résultat → Glob `**/*` sur le vault avec le pattern `$ARGUMENTS`
   - Annoncer : "Aucune correspondance exacte/partielle — j'ai cherché plus largement et trouvé..."

**Si zéro résultat après fallback** :
→ Afficher les options : "Aucune note trouvée pour `$ARGUMENTS`. Tu veux :"
- **Créer une nouvelle note** → demander le type (feature Kanban, knowledge, hobby, organisation ?) et le chemin → créer le fichier vide → **relancer workon** sur ce nouveau chemin
- **Chercher différemment** (préciser comment)
- **Continuer sans contexte** (on démarre les explorations code/conceptuelles directement, sans fichier source)

**Attendre le choix de l'utilisateur avant de continuer vers Étape 2.**

**Retenir la source** (chemin exact, colonne Kanban, ou type de note) — utilisé à l'Étape 5 pour la clôture.

## Étape 2 — Lire et analyser la note

Lire le contenu complet de la note identifiée + tous les liens `[[]]` directement mentionnés.

### Identifier le type et le projet

- **Feature Kanban** : note dans `[PROJECTS_FOLDER]/[X]/Features/` (Ready, WIP, Specs, Done) → repérer le projet `[X]`
- **Note vault** : note en dehors du structure projet → knowledge, hobby, organisation (pas de projet associé)
- **Note vide ou cassée** : fichier vide, orphelin, ou référence morte → signaler immédiatement

**Si note vide** :
→ Afficher : "La note existe mais est vide. Tu veux la développer d'abord, chercher différemment, ou continuer sans elle ?"
→ **Attendre la décision de l'utilisateur.**

### Vérifier les bloquants

Identifier les dépendances explicites (uniquement pour features Kanban) :
- Mots-clés : "bloqué par", "prérequis", "à faire avant", "dépend de", "nécessite"
- Liens `[[]]` en contexte de dépendance (ex: "Voir aussi [[X]]" ≠ "Bloqué par [[X]]")
- Sections "Bloquants", "Dependencies", ou "Prérequis" si présentes
- Fichier `Priority.md` du projet

**Si bloquant identifié** :
→ Afficher : "Ce ticket est bloqué par [[X]] — on travaille sur le bloquant d'abord ?"
→ **Attendre la confirmation de l'utilisateur avant de continuer vers Étape 3.**

**Si aucun bloquant ou note vault** :
→ Continuer directement vers Étape 3.

## Étape 3 — Charger le contexte

### Cas A : Feature Kanban

1. **Lire le README du projet** : `[PROJECTS_FOLDER]/[Projet]/claude-code/README.md`
   - **Si absent** : annoncer "README du projet manquant — charge-toi de le remplir ou on continue sans ?"
2. **Récupérer le chemin local du repo** :
   - Chercher dans CLAUDE.md ou MEMORY.md (ex: `project_fstg_local_path.md`)
   - Si trouvé → retenir pour les recherches de fichiers cette session
   - **Si non trouvé** → demander : "Quel est le chemin local du repo ?" — **attendre avant de continuer**
3. **Résumer en 3-5 lignes** :
   - De quoi il s'agit (domaine métier, contexte)
   - État actuel : specs générées ? code entamé ? tests prêts ?
   - Prochaines étapes : clarifications attendues, premières actions
4. **Invoquer `recall` si pertinent** : si le résumé révèle des concepts métier clés ou des références nécessaires, invoquer `recall` avec ces termes (max 3 mots-clés)
   - Invoquer seulement si termes métier identifiés — ne pas le faire par routine

### Cas B : Note vault (knowledge, hobby, organisation)

1. **Résumer en 2-3 lignes** :
   - Sujet et contexte
   - État actuel (brouillon, structurée, à développer)
2. **Charger les notes liées** : lire les `[[]]` si essentiels
3. **Ne pas invoquer `recall`** — pas nécessaire pour une note vault

## Étape 4 — Proposer une entrée en matière

### Branche Dev (Feature Kanban)

- Rappeler l'approche TDD : "On démarre par les tests ?"
- Proposer : "Besoin d'aide sur l'archi, une question rapide, ou tu y vas direct ?"
- **Skills en réserve** — charger seulement si l'utilisateur dit explicitement :
  - "Montre-moi l'archi / la structure" → pas de skill (pair programming direct)
  - "Quel pattern utiliser ?" → pas de skill (discussion + exemples)
  - "Besoin du skill [nom]" → charger le skill
  - "Tu y vas" → pas de skill, laisser l'utilisateur coder

### Branche Non-dev (Note vault)

Proposer une action concrète selon le type :
- **Knowledge/concept** : "Tu veux approfondir, relier à d'autres notes, ou passer à la pratique ?"
- **Hobby** : "Tu commences par [étape logique] ou [alternative] ?"
- **Organisation** : "On la développe, on la range, ou on en discute d'abord ?"

**Attendre la réponse de l'utilisateur avant de charger des skills ou d'explorer d'autres contextes.**

## Étape 5 — Clôture (quand l'utilisateur annonce "c'est fait" ou "terminé")

### Vérifications adaptées au type (Étape 2)

**Feature Kanban** :
- Les tests passent sans modification ? (pas d'ajustement post-dev)
- Le comportement observable correspond aux specs validées ?
- Code pushé et prêt pour le Kanban Done ?

**Note vault (knowledge, hobby, organisation)** :
- La note est au bon endroit hiérarchiquement ?
- Liens `[[]]` vers notes existantes créés si pertinent ?
- À indexer dans INDEX.md ou MEMORY.md ?

Présenter sous forme :
```
✅ Avant clôture :
- [ ] [Vérif 1]
- [ ] [Vérif 2]
```

### Actions post-validation

Une fois l'utilisateur confirme "Tout bon" :

**Feature Kanban** :
→ "Tu peux déplacer le ticket en Done dans le Kanban. ADR à créer ?" (si décision structurante)

**Note vault** :
→ "À indexer quelque part ?" (INDEX.md, MEMORY.md, Skills/INDEX.md)

Confirmer : "Clôture validée ✓"

## Règles absolues

- **Skills en réserve** : charger seulement si l'utilisateur les demande explicitement ("montre-moi", "quel pattern", "besoin du skill X"). Jamais par anticipation, jamais par inférence de besoin.
- **Ne jamais modifier le vault, Kanban, ou sources** sans validation de l'utilisateur. Workon suggère des actions, l'utilisateur les exécute.
- **Recherche Étape 1 : ordre strict** (exact → partial → glob fallback). Pas de multi-source intelligente.
- **`recall` (Étape 3)** : invoquer seulement si le résumé identifie des termes métier clés pertinents — jamais systématiquement.
- **Edge case : README absent** (Cas A, Étape 3) — demander avant de continuer.
- **Edge case : note cassée/orpheline** (Étape 2) — signaler et demander si on reprend ou on cherche autrement.
- **Validations explicites** : Étape 1→2 (sélection si multiples), Étape 2→3 (si bloquant), Étape 3→4 (si note vide), Étape 4→travail (réponse l'utilisateur).
- **Pas d'inférence** : si "On démarre par les tests ?" reçoit "ouais", commencer. Si silence, demander "tu commences par quoi ?"
