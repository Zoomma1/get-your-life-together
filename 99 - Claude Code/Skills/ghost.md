---
name: ghost
description: Répondre à une question dans la voix de l'utilisateur en s'appuyant uniquement sur ce que le vault contient. Utiliser quand l'utilisateur veut savoir "ce qu'il penserait de X" sans brainstormer depuis zéro, pour drafter un essay depuis ses positions existantes, ou pour tester si le vault capture vraiment sa pensée. Exemples : "/ghost Qu'est-ce que tu penses du DDD appliqué aux projets solo ?", "/ghost Comment tu gères la procrastination ?".
---

# Skill : /ghost

## Pré-requis — Charger les paramètres vault

Lire `99 - Claude Code/config/vault-settings.md` → extraire : `DATE_FORMAT`, `NOTES_FOLDER`, `ME_FOLDER`, `HOBBIES_FOLDER`, `KNOWLEDGE_FOLDER`, `PROJECTS_FOLDER`, `INBOX_FOLDER`.

---

Répond à une question comme l'utilisateur l'aurait écrit — en s'appuyant uniquement sur ce que le vault contient. Puis révèle la mécanique derrière la réponse.

La règle fondamentale : chaque claim doit être sourcé dans le vault (VAULT), fortement implicite depuis plusieurs sources (INFERRED), ou explicitement marqué comme extrapolé (EXTRAPOLATED). Au-delà de 50% d'EXTRAPOLATED ou UNKNOWN → refuser et rapporter ce que le vault contient réellement.

---

## Étape 0 — Classer la question et définir le seuil de refus

**Décision 1 : Type de question**

| Type | Exemple | Seuil refus |
|------|---------|-------------|
| Factuelle | "Quelle est ta stack actuelle ?" | >20% EXTRAPOLATED |
| Opinion | "Qu'est-ce que tu penses de X ?" | >40% EXTRAPOLATED |
| Conseil | "Que dirais-tu à quelqu'un sur X ?" | >50% EXTRAPOLATED |
| Personnelle | "Comment tu te sens par rapport à X ?" | >25% EXTRAPOLATED |
| Prédiction | "Qu'est-ce que tu penses qu'il va se passer ?" | >60% EXTRAPOLATED |

Classer la question, noter son seuil refus. Ce seuil guide tout le reste.

**Décision 2 : Profil vocal nécessaire ?**

- Stack/architecture/TDD/DDD → NON (implicite) → aller directement à Étape 2
- Autre → OUI → faire Étape 1 (1-2 notes proches du sujet pour extraire ton)

**Edge cases à refuser d'emblée :**
- Questions hors-scope (sujet ne concerne pas l'utilisateur) → refuser avec "Le vault ne parle pas de [sujet]"
- Demande de jugement sur tiers (ex : "Qu'est-ce que tu penses d'[Personne X] ?") → refuser ("Le vault parle de l'utilisateur, pas de [Personne X]")

---

## Étape 1 — Extraire le profil vocal (si Décision 2 = OUI)

**Recherche rapide (max 2 notes) :**
1. Chercher 1 essay ou daily note _sur le sujet exact_ (pas "voisin")
2. Si absent : chercher 1 note sur **domaine parent** (ex : si sujet = procrastination, lire productivité, neurodivergence, ou patterns de gestion du temps) — chercher contexte qui explique la posture l'utilisateur

**Extraire 3-4 traits dominants UNIQUEMENT :**
- Phrase : courtes/longues, déclaratives/exploratoires ?
- Registre : sec, passionné, mesuré ?
- Formulations l'utilisateur : "c'est pas grave", "on vise quoi", "le truc c'est que" ?
- Jamais de : "il est important de noter", hedging excessif ?

Nota bene : profil vocal est une _contrainte légère_, pas prescription. À utiliser pour anchorer le ton, pas pour copier-coller des phrases.

---

## Étape 2 — Collecter et tagger les preuves

**Recherche dans :** `[NOTES_FOLDER]/`, `[KNOWLEDGE_FOLDER]/`, `[ME_FOLDER]/[NOM].md`, `99 - Claude Code/ADR/`, `99 - Claude Code/Sessions/`

**Stratégie :**
1. Lire 1-2 notes pertinentes dans la zone la plus proche
2. Extraire 3-5 termes adjacents / jargon l'utilisateur (ex : refactoring → design debt, legacy, TDD)
3. Affiner recherches avec ces termes (élargir corpus)

**Pour chaque information, tagger immédiatement :**

| Tag | Définition |
|-----|-----------|
| **VAULT** | Citation directe explicite |
| **INFERRED** | Implicite mais soutenu par 2+ sources indépendantes |
| **EXTRAPOLATED** | Cohérent avec vault, va au-delà de ce qui est écrit |
| **UNKNOWN** | Vault silencieux après recherche |

**Règle obligatoire : lister TOUTES les preuves taggées AVANT Étape 3. Pas de composition sans inventaire.**

---

## Étape 2.5 — Décision de refus (avant Étape 3)

**Compter les preuves :**
- % VAULT, % INFERRED, % EXTRAPOLATED, % UNKNOWN

**Comparer % EXTRAPOLATED au seuil refus de Étape 0 :**

| Situation | Action |
|-----------|--------|
| EXTRAPOLATED ≤ seuil - 10% | Continuer à Étape 3 (vert) |
| Seuil - 10% < EXTRAPOLATED ≤ seuil | Ajouter warning en tête : "Attention : [X%] extrapolé" → continuer |
| EXTRAPOLATED > seuil | Bloquer : **proposer le refus à l'utilisateur (voir ci-dessous) + option "continue quand même ?"** |

**Si refus déclenché — offrir deux chemins :**

**Option A (par défaut) :** refuser avec exposition honnête
```
Mode ghost impossible — trop d'extrapolation.

Type : [TYPE] | Seuil : [Y%] | Extrapolation : [X%]

Contenu du vault :
- [Claim VAULT + source]
- [Claim INFERRED + source]
- [Gap : vault silencieux sur...]

Pour enrichir : ajouter [Gap 1], [Gap 2]
```

**Option B (l'utilisateur peut demander) :** "Réponds quand même mais scorer bas la fidélité vocale (< 7/10)" → accepter, ajouter disclaimer explicite en Étape 4

---

## Étape 3 — Composer et valider la réponse ghost

**Si Étape 1 = NON :** ignorer "profil vocal"
**Si Étape 1 = OUI :** ouvrir par 1-2 traits extraits (anchrage ton)

**Rédiger comme l'utilisateur :**
- Longueur naturelle (pas de padding) — si réponse doit être courte, elle sera courte; si discours, discours. Suivre le ton du vault, pas la convention
- Intégrer tags inline : `[VAULT: note]`, `[INFERRED: source1 + source2]`

**Relecture anti-patterns (dépliez les 6 ci-dessous) :**
1. **Ghost Wikipédia** : réponse neutre au lieu de position l'utilisateur → ajouter la prise de position
2. **Fabricateur confiant** : fluide mais sans données vault → lister preuves d'abord
3. **Ghost Claude** : voix générique (bullet points, "il est important") → l'utilisateur l'écrirait-il ? Si non, refaire
4. **Ghost Thérapeute** : sagesse générale au lieu de vraie réponse → rester technique / personnel l'utilisateur
5. **Ghost Oui** : supposer accord quand vault montre résistance → vérifier INFERRED, signaler contradictions
6. **Ghost Soft** : adoucir positions fermement tenues → lire VAULT/INFERRED, ne pas "mesurer"

**Test rapide :** l'utilisateur utilise parenthèses pour pensées latérales ? "Anyway" ? Questions rhétoriques directes ? Si réponse ne l'imite pas → refaire ou scorer ≤6 fidélité vocale

---

## Étape 4 — Exposition (immédiatement après réponse)

**3 sections obligatoires :**

**Distribution :**
```
VAULT : X% | INFERRED : X% | EXTRAPOLATED : X% | UNKNOWN : X%
```

**Preuves (max 4 claims) :**
- [Claim 1 ligne] → `[source: note, ligne N]`

**Lacune :** 1-2 phrases sur ce qui manque pour pleine confiance.

**Fidélité vocale : X/10**
- 9-10 : l'utilisateur dirait "j'aurais pu écrire ça"
- 7-8 : positions juste, voix l'utilisateur, 1-2 tournures "Claude"
- 5-6 : directionnellement juste, inférence visible
- 3-4 : contenu correct, voix générique
- 1-2 : contenu fabricé ou ton opposé

---

## Étape 5 — Validation l'utilisateur (si besoin)

**Invoquer SEULEMENT SI :**
- Fidélité vocale < 7/10, OU
- EXTRAPOLATED > 30%

**Offrir à l'utilisateur :**
- Valider / rectifier la réponse
- Ajouter nuances / clarifier position vraie
- Enrichir le vault pour sessions futures

**Si valider :** réponse utilisable immédiatement.

---

## Règles absolues — checklist

- [ ] Tagger TOUTES preuves AVANT Étape 3 (pas de composition sans inventaire)
- [ ] Seuil refus (Étape 0) → refuser immédiatement si dépassé (Étape 2.5)
- [ ] Étape 1 : décider consciemment (NON pour stack/archi/TDD, OUI sinon)
- [ ] INFERRED = 2+ sources minimum (1 seule n'suffit pas)
- [ ] Réponse ghost + Étape 4 en un bloc (jamais de découpage)
- [ ] Si fidélité < 7/10 ou EXTRAPOLATED > 30% → soumettre à la validation de l'utilisateur
- [ ] Refus explicit (jamais silencieux) + format standardisé Étape 2.5
