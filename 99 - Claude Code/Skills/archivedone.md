---
name: archivedone
description: Archiver les tickets Done (avec notes liées) dans C:\Archive\ — tous les kanbans ou un seul. Demander confirmation avant toute action physique.
---

# Skill : Archive Done

## Paramètres d'invocation

```bash
/archivedone              # Tous les kanbans
/archivedone [kanban]     # Un kanban spécifique (nom du fichier ou partie du chemin)
```

## Étape 1 — Découvrir les kanbans

Lire `{VAULT_PATH}\{PROJECTS_FOLDER}\INDEX.md` une seule fois.

Construire la liste des kanbans à traiter :

**Kanbans spéciaux** (toujours inclus sauf si filtre kanban appliqué) :
- `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\Claude Code Kanban.md`

**Kanbans projets** — pour chaque projet dans la table "Projets actifs" :
- Ignorer les projets avec mention "No kanban"
- Résoudre le chemin (lien Obsidian `[[...]]` ou chemin direct)
- Si chemin = dossier → chercher le fichier `.md` kanban (généralement `Project management.md`)

Si paramètre `[kanban]` fourni, filtrer la liste (pattern matching sur nom fichier ou chemin).

Lire tous les fichiers kanbans découverts **en parallèle** avec Read.

## Étape 2 — Extraire les tickets Done

Pour chaque kanban lu, extraire tous les items de la section `## Done`.

Classer chaque item selon son type :
- **Avec note liée** : contient `[[NomFichier]]` ou `[[NomFichier|alias]]` (syntaxe Obsidian)
- **Sans note liée** : texte brut, pas de `[[...]]`

Construire deux listes par kanban : tickets avec lien + tickets sans lien.

## Étape 3 — Afficher le résumé et attendre validation

Si **toutes** les colonnes Done sont vides → arrêter, signaler à Victor et ne rien faire.

Sinon, afficher ce qui sera proposé à l'archivage :

**[Nom kanban 1]** — [X tickets archivables] + [Y sans lien]

Archivables (avec note liée) :
- [[NomTicket]] | Titre du ticket
- _(répéter)_

Resteront en Done (sans note liée) :
- Titre du ticket (texte brut)
- _(répéter)_

_(répéter pour chaque kanban avec Done non-vide)_

---

Demander à Victor :
1. Confirmes-tu l'archivage de tous les tickets listés ci-dessus ?
2. Des tickets à exclure ?
3. Des ADRs à traiter séparément (surligner en gras `**ADR-XXX**`) ?

Attendre réponse explicite avant Étape 4.

## Étape 4 — Pré-archivage

Avant tout déplacement de fichier :
- Vérifier que `{VAULT_PATH}\Archive\` existe (créer si absent via bash, signaler à Victor)
- Vérifier chaque fichier à archiver existe physiquement (afficher les chemins résolus)
- Signaler tout lien cassé et demander à Victor : archiver quand même ou ignorer ?

Attendre confirmation avant Étape 5.

## Étape 5 — Exécuter l'archivage

Pour chaque ticket validé en Étape 3 :
1. Copier le fichier vers `{VAULT_PATH}\Archive\` via bash
2. Renommer en `[NomTicket].[ext]` si collision (ajouter `_YYYYMMDD-HHMM` avant ext)

Pour chaque kanban traité, vider uniquement les tickets archivés :
```markdown
## Done

```

Pour chaque ticket copié avec succès, supprimer l'original du dossier source via bash.

Afficher à Victor :
- Liste des fichiers archivés et supprimés
- Prêt pour Étape 6 (mise à jour command-tracker)

## Étape 6 — Mettre à jour command-tracker

Lire `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`.

Chercher la ligne `/archivedone` et mettre à jour sa date au format `YYYY-MM-DD` (jour actuel).

Si fichier absent ou ligne absente : signaler à Victor, ne pas créer.

## Edge cases et déroulement alternatif

| Situation | Comportement |
|-----------|-------------|
| Lien cassé (fichier n'existe pas) | Étape 4 : afficher le chemin impossible, demander à Victor : ignorer ou continuer malgré tout |
| Ticket sans note liée (texte brut) | Afficher en "Resteront en Done", **jamais archiver** |
| Kanban vide (0 items Done) | Inclure dans rapport avec count=0, aucun traitement pour ce kanban |
| INDEX absent | Erreur fatale → arrêter, signaler à Victor, ne pas deviner |
| Section `## Done` absente ou malformée | Signaler à Victor, ignorer le kanban, continuer |
| Victor dit "non" en Étape 3 | Arrêter, ne rien faire, retour sans action |
| Victor exclut certains tickets | Ignorer les tickets exclus, archiver les autres |
| Collision en Archive (fichier existe déjà) | Ajouter `_YYYYMMDD-HHMM` avant l'extension |
| Archive/ n'existe pas | Étape 4 : créer via bash, signaler à Victor |

## Règles absolues (pair-programming)

- **Aucune action physique sans validation Victor** — confirmations structurées en Étapes 3 et 4
- **Laisser le header `## Done`** — juste le vider, ne jamais supprimer la section
- **Tickets sans lien = jamais archivés** — restent en Done
- **ADRs = demander confirmation séparée** avant d'archiver (surligner en gras)
- **Lien cassé ou fichier absent = bloquer** — demander au lieu de supposer
- **Victor choisit** archivage total ou partiel (quels tickets, quels kanbans)
