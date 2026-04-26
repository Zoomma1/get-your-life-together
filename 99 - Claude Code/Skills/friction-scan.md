---
name: friction-scan
description: Détecte les patterns de friction dans les sessions Claude Code — corrections répétées, rules CLAUDE.md non respectées, skills non invoqués. Lance agents Haiku parallèles sur les JSONL, consolide avec Sonnet. Intégré dans /closeweek.
---

# Skill : /friction-scan

Analyse les JSONL bruts de `~/.claude/projects/` pour détecter les frictions récurrentes. Produit un rapport priorisé + mise à jour de l'état dans Postgres.

## Étape 0 — Vérifier Postgres

```powershell
docker ps --filter name=claude-postgres --filter status=running --format "{{.Names}}"
```

Si absent : `docker compose -f ~/.claude/docker-compose.yml up -d` et attendre 3s.

---

## Étape 1 — Parser les JSONL

```bash
uv run ~/.claude/parse_jsonl_friction.py 2>/dev/null
```

- Sans argument : fenêtre depuis le dernier scan (état Postgres)
- Retourne JSON : `[{session_id, project, exchanges: [{user, assistant, has_correction, has_ack}]}]`
- Si 0 sessions → afficher "Aucune friction détectée depuis le dernier scan." et stop

---

## Étape 2 — Analyse par agents Haiku (parallèles, batches de 5)

Pour chaque session dans le JSON (batch de 5 simultanés) → lancer un Agent Haiku avec ce prompt :

```
Tu analyses une session Claude Code pour détecter des frictions.

Voici les échanges avec signaux de friction (user → assistant) :
[échanges de la session]

Projet : [project]

Identifie :
1. Corrections répétées : même erreur commise plusieurs fois
2. Règles CLAUDE.md violées : git touché, code sans demande, réponse trop verbose, etc.
3. Skills non invoqués : situation qui aurait dû déclencher /create-ticket, /harvest, etc.

Retourne un JSON strict :
{
  "session_id": "...",
  "project": "...",
  "frictions": [
    {"type": "correction|rule_violation|missed_skill", "description": "...", "evidence": "...", "severity": "low|medium|high"}
  ]
}
Retourne [] si aucune friction réelle détectée. Maximum 5 frictions par session.
```

Collecter tous les JSON retournés.

---

## Étape 3 — Consolidation Sonnet

Passer tous les résultats Haiku à un Agent Sonnet :

```
Tu consolides les frictions détectées par des agents Haiku sur [N] sessions Claude Code.

Voici tous les résultats bruts :
[JSON consolidé]

Produis :
1. Top 10 frictions globales (dédupliquées, priorisées par fréquence + sévérité) avec action corrective
2. Détail par projet (max 5 frictions par projet)

Format de sortie : Markdown structuré, prêt à copier dans un fichier vault.
```

---

## Étape 4 — Écrire le rapport

Créer `99 - Claude Code/Friction scans/YYYY-MM-DD.md` :

```markdown
# Friction scan — YYYY-MM-DD
Période : YYYY-MM-DD → YYYY-MM-DD
Sessions analysées : N (X projets)

## Top 10 frictions globales
1. [friction] → [action corrective]
...

## Détail par projet
### [Projet]
- [friction] → [action]
...
```

Créer le dossier `Friction scans/` s'il n'existe pas.

---

## Étape 5 — Mettre à jour l'état Postgres

```sql
UPDATE friction_scan_state SET last_scan = NOW(), updated_at = NOW() WHERE id = 1;

INSERT INTO friction_scan_runs (period_start, period_end, sessions_count, output_file, summary_md)
VALUES ('[début]', '[fin]', [N], '99 - Claude Code/Friction scans/YYYY-MM-DD.md', '[top 10 en markdown]');
```

Via : `docker exec claude-postgres psql -U claude -d claude_sessions -c "..."`

---

## Étape 6 — Mettre à jour le command-tracker

- Ouvrir `{VAULT_PATH}\{CLAUDE_CODE_FOLDER}\command-tracker.md`
- Ligne `/friction-scan` → remplacer la date par la date du jour au format `YYYY-MM-DD`

---

## Résumé conversationnel

Afficher après le rapport :

```
Friction scan terminé — [N] sessions analysées sur [X] jours.
Rapport : 99 - Claude Code/Friction scans/YYYY-MM-DD.md
Top friction : [#1 du top 10]
```

---

## Règles absolues

- Ne jamais modifier CLAUDE.md ou les skills directement — le scan détecte, Victor décide
- Si Postgres indisponible : signaler et arrêter (pas de fallback fichier JSON — l'état doit être fiable)
- Batches de 5 agents max en parallèle — ne pas surcharger le quota partagé Victor+Jay
