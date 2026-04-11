#!/usr/bin/env node
// SessionEnd hook — automatic session recap
// Fires on /clear (reason: "clear") and process exit.
// Reads the JSONL transcript, condenses it, calls claude --print for recap generation,
// then creates or appends to Sessions/YYYY-MM-DD.md in the vault.
//
// Requires ~/.claude/vault-config.json :
//   { "vaultPath": "/absolute/path/to/vault", "userName": "Prénom" }

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// --- Config ---

let VAULT_SESSIONS;
let USER_NAME = "l'utilisateur";

try {
  const configPath = path.join(os.homedir(), '.claude', 'vault-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  VAULT_SESSIONS = path.join(config.vaultPath, '99 - Claude Code', 'Sessions');
  if (config.userName) USER_NAME = config.userName;
} catch (_) {
  process.exit(0);
}

const MIN_MESSAGES = 3;

// --- Helpers ---

function getDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function extractMessages(jsonlContent) {
  const messages = [];
  for (const line of jsonlContent.trim().split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if (e.type === 'file-history-snapshot') continue;

      if (e.type === 'user' && !e.isMeta) {
        const c = e.message?.content;
        let text = typeof c === 'string'
          ? c
          : Array.isArray(c) ? c.filter(b => b.type === 'text').map(b => b.text).join(' ') : '';
        text = text.trim().substring(0, 800);
        if (text) messages.push(`[${USER_NAME}] ${text}`);
      }

      if (e.type === 'assistant') {
        const c = e.message?.content;
        if (!Array.isArray(c)) continue;
        const text = c.filter(b => b.type === 'text').map(b => b.text).join(' ').trim().substring(0, 1200);
        const tools = c.filter(b => b.type === 'tool_use').map(b => {
          const inp = b.input || {};
          const detail = inp.file_path || inp.pattern || inp.command || inp.query || '';
          return detail ? `${b.name}(${String(detail).substring(0, 60)})` : b.name;
        });
        if (text) messages.push(`[Claude] ${text}`);
        if (tools.length) messages.push(`[Tools] ${tools.join(', ')}`);
      }
    } catch (_) {}
  }
  return messages;
}

function buildPrompt(messages, time) {
  return `Voici le transcript condensé d'une session Claude Code (${time}).
Génère un recap de session structuré en markdown.
Réponds uniquement avec le texte markdown — pas d'explication, pas d'outils.

Résume la session en couvrant :

1. **Ce qui a été fait** — liste concise des tâches accomplies, décisions prises.
2. **Fichiers discutés ou consultés** — fichiers abordés pendant la session.
3. **Décisions techniques / ADR** — si une décision notable a été prise, la mentionner.
4. **État à la fin** — ce qui reste, prochaine étape logique.
5. **Comment ${USER_NAME} a vécu la session** :
   - Flow : avançait vite, peu de blocages, réponses directes
   - Concentré : progressait bien mais avec effort
   - Bloqué : difficultés techniques, plusieurs tentatives
   - Frustré : signaux de frustration (reformulations, corrections)
   - Fatigué : réponses courtes, moins d'engagement, pauses fréquentes
   - Satisfait : objectif atteint, bon avancement
   Ne pas inventer — si aucun signal clair → noter "Neutre / pas de signal particulier".

FORMAT :

## Session ${time} — [titre court de ce qui a été fait]

### ✅ Accompli
- ...

### 🔧 Fichiers discutés / consultés
- ...

### 🧠 Décisions prises
- ...

### ⏭️ Prochaine étape
...

### 🧭 État de ${USER_NAME}
[Flow / Concentré / Bloqué / Frustré / Fatigué / Satisfait] — [une phrase de contexte]

RÈGLES :
- Ne jamais inventer des informations absentes du transcript
- Si la session est vide ou trop courte → réponds uniquement le mot SKIP
- Langue : français

TRANSCRIPT :
${messages.join('\n')}`;
}

// --- Main ---

let raw = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => raw += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const { transcript_path } = JSON.parse(raw);
    if (!transcript_path || !fs.existsSync(transcript_path)) return process.exit(0);

    const messages = extractMessages(fs.readFileSync(transcript_path, 'utf8'));
    if (messages.length < MIN_MESSAGES) return process.exit(0);

    const time = getTime();
    const date = getDate();
    const sessionFile = path.join(VAULT_SESSIONS, `${date}.md`).replace(/\\/g, '/');
    const prompt = buildPrompt(messages, time);

    // Spawn claude with stdin pipe — avoids shell redirection and argument length limits
    const child = spawn('claude', ['--print', '--output-format', 'text'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000
    });

    let stdout = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stdin.on('error', () => {});
    child.stdin.write(prompt, 'utf8');
    child.stdin.end();

    child.on('close', () => {
      const recap = stdout.trim();
      if (!recap || recap.toUpperCase() === 'SKIP') return process.exit(0);

      if (fs.existsSync(sessionFile)) {
        fs.appendFileSync(sessionFile, '\n\n---\n\n' + recap, 'utf8');
      } else {
        fs.writeFileSync(sessionFile, recap, 'utf8');
      }
      process.exit(0);
    });

    child.on('error', () => process.exit(0));

  } catch (_) {
    process.exit(0);
  }
});
