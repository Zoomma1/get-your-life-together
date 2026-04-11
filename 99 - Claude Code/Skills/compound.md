---
name: compound
description: À lancer 2-3 fois par an sur une question stratégique — carrière, architecture personnelle, architecture personnelle. Répond à la même question à trois moments du vault pour montrer comment la qualité de la réponse évolue quand le contexte s'accumule. Différent de /trace (comprendre comment une idée a évolué) : /compound mesure si le vault rend les réponses vraiment meilleures.
---

# Skill : /compound

Répond à la même question trois fois — à trois moments distincts du vault — avec uniquement le contexte disponible à chaque époque. La contrainte de longueur égale entre les trois réponses est le cœur du skill : elle isole la qualité du volume, et force à voir si le vault améliore vraiment les réponses ou se contente de les allonger.

**Différence avec `/trace`** : `/trace` suit l'évolution d'une idée dans le vault (comprendre). `/compound` répond à une question à trois moments différents (mesurer si le vault pense mieux).

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

---

**Flow complet :** Valider Q (Étape 0) → Analyser vault (Étape 1) → Choisir 3 périodes (Étape 2) → Inventaire contexte (Étape 3) → Prédire (Étape 4) → Générer 3 réponses (Étape 5) → Vérifier anachronismes (Étape 6) → Synthèse + delta (Étape 7) → Sauver (Étape 8).

## Déclenchement

```
/compound [question]
```

**Bonnes questions :**
- Questions dont la réponse dépend du contexte personnel (pas de réponse universelle)
- Questions de stratégie, de posture, ou de prise de décision
- Questions où plus de contexte change la réponse — pas juste sa longueur

**Mauvaises questions :**
- Questions factuelles à réponse stable ("comment fonctionne JWT ?")
- Sujets à peine effleurés dans le vault

---

## Étape 0 — Valider la question et chercher un run précédent

**Valider d'abord :** Est-ce que cette question dépend du contexte personnel de l'utilisateur ?

- **Oui** → continuer
- **Non** → le dire clairement et proposer une reformulation si possible

**Vérifier la profondeur du vault sur ce sujet :** Glob `[KNOWLEDGE_FOLDER]/` et daily notes (`[NOTES_FOLDER]/`). Est-ce que le vault contient au moins **6 mois d'historique substantiel** sur ce sujet ? (Au moins 3+ notes de connaissance OU 20+ daily notes mentionnant le sujet, distribuées sur la période.)
- Si **oui** → continuer
- Si **non** → signaler clairement que le vault est trop jeune pour ce sujet et proposer un null result plutôt que de forcer trois périodes

**Chercher un run précédent :** Glob `[KNOWLEDGE_FOLDER]/Compound/` pour lister les notes existantes (le dossier peut ne pas exister si c'est le premier run — c'est normal). Chercher une note dont le nom contient les termes clés de la question.
- Si trouvée → lire la note : extraire la date du run, les 3 réponses (surtout la Période C — "Maintenant"), et la synthèse finale
- Si absente (dossier vide ou inexistant) → continuer sans comparaison (le delta sera omis à l'Étape 7)

---

## Étape 1 — Analyser la chronologie du vault

Comprendre quand le contexte pertinent s'est vraiment accumulé. Chercher des **points d'inflexion opérationnels** — moments où la densité du contexte change significativement.

**Critères d'analyse :**

- **Densité des daily notes** : mesurer le passage d'une phase "épars" (< 5 mentions/mois) vers "régulier" (5-10 mentions/mois) vers "dense" (> 10 mentions/mois). Noter les dates de transition.
- **Notes de connaissance** : quand les premières notes substantielles sur ce sujet ont-elles été créées ? Lister les dates clés (first mention, major essay, ADR, projet actif, etc.). Une note compte si elle a >100 mots et n'est pas un bookmark.
- **Backlinks entrants** : from quelles notes datées ce sujet est-il référencé ? Permet de voir les reconvergences et l'intégration transversale.
- **Signaux de changement** : changement de ton dans les daily notes, apparition de nouvelles préoccupations, abandon de vieilles questions, nouveaux projets lancés

---

## Étape 2 — Sélectionner trois périodes

Choisir des points d'inflexion réels — **pas des intervalles fixes**. Critère : à quel moment le contexte pertinent sur ce sujet a-t-il significativement augmenté (passage d'une densité à la suivante dans Étape 1) ?

- **Période A (Début)** : Première note substantielle sur ce sujet. Contexte minimal — juste assez pour répondre, pas plus. La date est celle du premier fichier identifié dans Étape 1 (première mention).
- **Période B (Milieu)** : Inflexion notable — à partir de là, la densité a augmenté (passage épars → régulier, ou régulier → dense). Les réponses auraient été visiblement différentes.
- **Période C (Maintenant)** : Vault complet — aujourd'hui, avec tout l'historique accumulé.

**Vault jeune ?** Si tu ne peux identifier qu'une ou deux périodes distinctes (moins de 6 mois d'historique pertinent), le signaler à l'utilisateur — null result est valide, ne pas forcer trois périodes.

Si le vault n'a pas assez de profondeur temporelle sur ce sujet → le dire, ne pas fabriquer.

---

## Étape 3 — Inventaire de contexte par période

Pour chaque période, **lister les fichiers concrets** disponibles à ce moment. Stratégie de sélection :

1. **Identifier tous les fichiers pertinents** : glob `[KNOWLEDGE_FOLDER]/*`, daily notes, `[PROJECTS_FOLDER]/[Projet]/ADR/`, `99 - Claude Code/` si créés avant la période.
2. **Filtrer par date** : éliminer tout ce qui a été créé après la période.
3. **Sélectionner 3-5 des plus pertinents** en priorité : (a) notes dédiées au sujet, (b) ADRs qui révèlent une position, (c) daily notes qui montrent la densité de préoccupation à cette époque. Exclure les bookmarks et notes < 100 mots.
4. **Lister le résultat** : format 3-5 bullet points avec chemin exact.

**Exemple format :**
- `[KNOWLEDGE_FOLDER]/How I think about X — 2025-11-20.md` (décision clé)
- `[NOTES_FOLDER]/2025-11-18.md` (3 mentions de sujet)
- `[PROJECTS_FOLDER]/Rust/ADR/001 — Stack choices.md` (contexte d'apprentissage)

---

## Étape 4 — Prédictions avant génération

Avant d'écrire les trois réponses, formuler une prédiction structurée : comment la qualité et la forme de la réponse va-t-elle changer entre A, B et C ? **Cette étape verrouille ta compréhension avant la génération — elle prévient la confabulation.**

**Format structuré :**
- **Dimension 1** : [Aspect measurable — ex: clarté, profondeur, nuance, résilience, ton, actions concrètes]. Prédiction : "A sera X (parce que [fichiers limités]), B montrera Y (grâce à [nouvelle accumulation]), C atteindra Z (avec [intégration complète])".
- **Dimension 2** : idem (au moins 2 dimensions, max 3)
- **Incertitude** : Une zone où tu ne sais pas prédire — pourquoi c'est flou ?

**Avant de continuer à Étape 5 :** Valide ta prédiction avec l'utilisateur — vérifier qu'elle a du sens au vu des inventaires Étape 3. Adapter si besoin. Continuer seulement quand valider (ou dit "c'est bon, génère").

---

## Étape 5 — Générer les trois réponses

### Contraintes strictes (non-négociables)

1. **Frontière de contexte** — la réponse A utilise UNIQUEMENT le contexte de la période A. Aucune fuite d'info ultérieure. Vérification : chaque fait/référence cité doit exister dans l'inventaire Étape 3 pour cette période.

2. **Longueur égale ±20%** — c'est le cœur du dispositif : elle isole la qualité du volume (pas du baratin). **Mesure stricte** : `wc -w` (word count brut, excluant titres/métadonnée). Moyenne des trois = M. Accepter A/B/C si chacun ∈ [0.8×M, 1.2×M]. Recalculer M si Étape 6 nécessite une réécriture.

3. **Même voix** — première personne, incarnant l'utilisateur à chaque période (pas narrateur externe). La voix peut mûrir A→C (naturel), mais reste toujours celle de l'utilisateur. Pas de condescendance en A, pas d'autosatisfaction en C.

### Format de présentation

```
## Période A — [label temporel]
[Contexte disponible : liste en 2-3 lignes]

[Réponse — X mots]

---

## Période B — [label temporel]
[Contexte disponible : liste en 2-3 lignes]

[Réponse — X mots]

---

## Période C — Maintenant
[Contexte disponible : liste en 2-3 lignes]

[Réponse — X mots]
```

---

## Étape 6 — Vérification

### Contrôle anachronisme
Avant d'accepter les trois réponses, vérifier que A/B ne contiennent AUCUN fait apparu après sa période. Si un anachronisme est trouvé :
1. Identifier précisément : quel fait, quelle date réelle d'apparition dans le vault
2. Réécrire la réponse en supprimant ce fait et le remplaçant par un équivalent disponible à la période
3. Refaire le word count — recalculer M si longueur totale change
4. Loguer le correctif en Étape 7

### Contrôle prédictions
Comparer prédictions Étape 4 vs résultats réels. Qu'est-ce qui a divergé ? Pourquoi ? Integrer ce décalage dans la synthèse finale — c'est une donnée valide.

---

## Étape 7 — Synthèse

Une synthèse courte (5-8 lignes) qui répond à : le vault a-t-il amélioré la qualité de la réponse, ou seulement son volume ?

Si les réponses ne se sont pas significativement améliorées → c'est le résultat. Ne pas forcer une narrative de progression. Un null result est une information valide.

### Delta avec le run précédent (si applicable)

Si un run précédent a été trouvé à l'Étape 0, ajouter cette section :

```
## Delta depuis le run du [YYYY-MM-DD]

**Ce qui a changé** : points de vue qui ont évolué, nouvelles dimensions absentes du run précédent, positions abandonnées ou nuancées.

**Ce qui s'est confirmé** : positions stables entre les deux runs — signe de pensée ancrée.

**Shifts observables** : changements dans le mode de travail, les priorités ou le contexte de l'utilisateur entre les deux runs (déduit du contenu des réponses, pas inventé).

**Qualité du compounding** : la réponse est-elle meilleure, plus nuancée, plus riche ? Ou stagnante ? Être honnête — la stagnation est une information valide.
```

Si aucun run précédent → omettre cette section entièrement.


---

## Étape 8 — Sauver le résultat

Après la synthèse, créer `[KNOWLEDGE_FOLDER]/Compound/YYYY-MM-DD — [question en 3-5 mots].md` avec le contenu complet de la session (question, 3 réponses, vérification, synthèse, delta si applicable). Format de date : `YYYY-MM-DD` (e.g., `2026-04-01`). Toujours créer cette note — elle permet de comparer les runs suivants sur la même question.

Si une note `/compound` sur la même question existe déjà (même sujet, même question) → l'indiquer à l'utilisateur et lui demander s'il veut créer une nouvelle note ou enrichir l'existante. Un même sujet peut avoir plusieurs runs (ex: `[KNOWLEDGE_FOLDER]/Compound/2026-02-15 — how i think about refactoring.md` et `[KNOWLEDGE_FOLDER]/Compound/2026-04-01 — how i think about refactoring.md` = deux snapshots différents).

---

## Anti-patterns (classés par impact — à prévenir)

### Critiques (cassent le skill)
1. **Fuite de contexte** — utiliser en A une info n'existant qu'en C. Invalide A/B/C.
2. **Compounding forcé** — fabriquer une "amélioration" que le vault ne montre pas. Le skill mesure, ne raconte pas.
3. **Réponse A caricaturale** — A doit être honnête (ce que le vault avait), pas volontairement appauvri pour faire contraste.

### Importants (affaiblissent la fiabilité)
4. **Illusion du volume** — plus long ≠ meilleur. Longueur égale existe pour ça.
5. **Résumé de vault** — répondre à la question, pas lister le contenu disponible.
6. **Cheerleading aveugle** — célébrer chaque progression. Un null result est valide et informatif.

### À éviter
7. **Périodes trop proches** — si A et B ne sont séparées que de quelques semaines, le delta sera bruyant. Signaler à l'utilisateur si le vault est trop jeune.

---

## Règles absolues

- **Valider la question d'abord** — si elle ne dépend pas du contexte personnel, le dire clairement
- **Longueur égale ±20%** — non-négociable, c'est le cœur du dispositif
- **Null result = résultat valide** — ne jamais forcer une narrative de progression
- **Prédire avant de générer** — Étape 4 + validation de l'utilisateur avant Étape 5
- **Usage introspectif** — ce skill est pour l'utilisateur, pas une démonstration externe
