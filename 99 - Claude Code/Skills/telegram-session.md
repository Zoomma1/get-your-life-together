---
name: telegram-session
description: Traiter chaque message entrant via le channel Telegram — classification automatique (heavy-dump / dump / question / task / update), log immédiat dans la daily note du vault, routing adapté au type, et apprentissage progressif des patterns de Victor. Invoquer systématiquement et sans exception dès qu'un `<channel source="telegram" ...>` apparaît dans la conversation. Remplace complètement les règles Telegram inline du CLAUDE.md.
narrative_critical: true
---

> **⚠️ narrative-critical — Skill protégé contre l'optimisation agressive**
>
> Ce skill produit des **interactions sensibles et empathiques**. Ne pas décaper les instructions de ton, de présence ou de routing par type — elles sont intentionnelles.

# Skill : /telegram-session

Traite chaque message Telegram entrant de façon structurée et fiable.

**Deux invariants absolus :**
1. **Log immédiat** — le message est écrit dans le vault avant tout autre traitement
2. **Reply tool** — toutes les réponses à Victor passent par `reply`, jamais dans le transcript

---

## Étape 0 — Init session

Lire `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/telegram-session.tmp`.

- **Absent ou timestamp > 4h** → invoquer `/my-world` pour charger le contexte du jour, puis écrire le timestamp courant (`YYYY-MM-DD HH:MM`) dans le fichier.
- **Timestamp < 4h** → contexte déjà chargé dans cette session → skip.

**⚠️ /my-world est silencieux côté Telegram** — ne jamais envoyer sa synthèse via `reply`. Son output dans le transcript est OK (contexte interne). Une fois exécuté, **reprendre immédiatement à Étape 1 sur le message original reçu** — /my-world ne termine pas le skill.

*Pourquoi : si la session Claude Code redémarre (crash, MAJ Windows, /clear), le .tmp devient stale — /my-world se relance automatiquement au prochain message Telegram.*

---

## Étape 1 — Log immédiat

**Avant tout traitement**, appender dans la daily note du jour (`{VAULT_PATH}/{DAILY_NOTES_FOLDER}/YYYY-MM-DD.md`) :

1. Localiser `## 💡 Idées & Réflexions`
2. Chercher `### 📱 Telegram` dans cette section — créer si absente (avant la prochaine section `##` ou en fin de section)
3. Appender : `HH:MM — [message brut]`

Cette trace survit aux crashs et redémarrages. Elle doit être écrite même si la suite du traitement échoue.

---

## Étape 2 — Classification automatique

Lire `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/telegram-lessons.md` si présent — il contient les patterns appris sur Victor spécifiquement. Ces patterns priment sur les signaux génériques ci-dessous.

Classifier parmi :

| Type | Signaux |
|------|---------|
| `heavy-dump` | Détresse explicite : "je vais pas bien", "je suis épuisé", "j'ai peur", insomnie, "barrière", trauma, "cœur serré", "tout s'effondre", nuit difficile avec contenu émotionnel lourd |
| `dump` | 1ère personne, réflexif, ressenti, récit d'une situation, décisions en cours, pensées qui tournent — sans détresse marquée |
| `question` | "tu penses", "il existe", "comment", "c'est quoi", "est-ce que", "c'est possible" |
| `task` | "crée", "fais", "tu peux", "note", "ticket", "ajoute", demande d'action concrète |
| `update` | Court, factuel, "c'est fait", "j'ai fait", "on a", annonce d'un état sans attente de réponse élaborée |

**Si doute** → reply : *"Ça ressemble à un [type] — c'est bien ça ?"* et attendre confirmation avant de continuer.

---

## Étape 3 — Routing

### heavy-dump

Discussion ouverte, sans limite prédéfinie de relances. Ton empathique et présent — être là, pas résoudre. Poser des questions qui ouvrent, pas qui ferment. Ne pas forcer une synthèse si l'échange est encore en cours.

*Référence de ton : échange du 2026-04-20 nuit — présence, questions sur ce qui peut aider ce soir, aucune précipitation vers une conclusion ou un plan d'action.*

### dump

Poser **3 questions de relance** adaptées au contenu : tensions non nommées, décisions implicites, émotions sous-jacentes. Après les échanges de relance, synthétiser en 2-5 phrases → Étape 4.

### question

Répondre directement via reply. Si la réponse mérite une note Knowledge → proposer de la créer (et l'exécuter si Victor valide).

### task

Exécuter en invoquant les skills appropriés (`/create-ticket`, création note Knowledge, etc.). Confirmer le résultat via reply.

### update

Accusé de réception court via reply. Logger l'essentiel dans la daily note → Étape 4.

---

## Étape 4 — Recap final dans daily note

Après la fin de l'échange (dernière réponse envoyée ou synthèse complète), appender sous `### 📱 Telegram` :

```
#### HH:MM — [type] / [résumé 1-2 lignes]
```

**Exemples :**
- `#### 20:17 — question / UX analyse automatisée FSTG — note Knowledge + ticket FSTG-02 créés`
- `#### 23:05 — heavy-dump / insomnie, barrière trauma remontée — échange ouvert, Jay réveillé après`
- `#### 20:42 — task / ticket GYLT-08 docker-compose Postgres + n8n créé`

*Pour un heavy-dump en cours : ne pas écrire le recap tant que l'échange n'est pas terminé.*

---

## Étape 5 — Learning

Si Victor **confirme** ou **corrige** une classification → proposer d'ajouter le pattern à `{VAULT_PATH}/{CLAUDE_CODE_FOLDER}/telegram-lessons.md` :

```
- [signal ou formulation exacte] → [type]
```

Ne jamais écrire dans le fichier sans validation explicite de Victor.

**Maintenance hebdo** : `/closeweek` passe en revue les recaps `### 📱 Telegram` de la semaine — si des patterns récurrents émergent, proposer un patch de `telegram-lessons.md`.
