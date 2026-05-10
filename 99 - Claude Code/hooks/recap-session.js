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
  VAULT_SESSIONS = path.join(config.vaultPath, '99 - Claude code', 'Sessions');
  if (config.userName) USER_NAME = config.userName;
} catch (_) {
  process.exit(0);
}

const MIN_MESSAGES = 3;

// --- Trouver pythonw.exe dans l'env uv pour ingest_sessions (sans fenêtre console) ---
const PYTHON_CACHE = path.join(os.homedir(), '.claude', 'cache', 'ingest-python.txt');

function findUvPythonW() {
  // Cache valide ?
  try {
    const cached = fs.readFileSync(PYTHON_CACHE, 'utf8').trim();
    if (cached && fs.existsSync(cached)) return cached;
  } catch (_) {}

  // Scanner les envs uv
  const uvEnvDir = path.join(os.homedir(), 'AppData', 'Local', 'uv', 'cache', 'environments-v2');
  try {
    const envs = fs.readdirSync(uvEnvDir).filter(e => e.startsWith('ingest-sessions-'));
    for (const env of envs) {
      // Préférer pythonw.exe (pas de console) puis python.exe
      for (const exe of ['pythonw.exe', 'python.exe']) {
        const candidate = path.join(uvEnvDir, env, 'Scripts', exe);
        if (fs.existsSync(candidate)) {
          try {
            fs.mkdirSync(path.join(os.homedir(), '.claude', 'cache'), { recursive: true });
            fs.writeFileSync(PYTHON_CACHE, candidate, 'utf8');
          } catch (_) {}
          return candidate;
        }
      }
    }
  } catch (_) {}

  return null;
}

// --- Helpers ---

function getDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function extractSentences(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  if (lines.length === 0) return '';
  if (lines.length <= 2) return lines.join(' ');
  const head = lines.slice(0, 2).join(' ');
  const tail = lines[lines.length - 1];
  return head + ' […] ' + tail;
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
        const text = extractSentences(c.filter(b => b.type === 'text').map(b => b.text).join(' ').trim());
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

// --- Skip logic (utility sessions) ---

function loadSkipPatterns() {
  try {
    const configFile = path.join(path.dirname(VAULT_SESSIONS), 'config', 'recap-skip-skills.json');
    return JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (_) {
    return [];
  }
}

function hasEdits(jsonlContent) {
  for (const line of jsonlContent.trim().split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if (e.type !== 'assistant') continue;
      const c = e.message?.content;
      if (!Array.isArray(c)) continue;
      if (c.some(b => b.type === 'tool_use' && (b.name === 'Edit' || b.name === 'Write' || b.name === 'NotebookEdit'))) return true;
    } catch (_) {}
  }
  return false;
}

function isUtilitySession(messages, jsonlContent) {
  const skipPatterns = loadSkipPatterns();
  if (!skipPatterns.length) return false;
  const firstMsg = messages.find(m => m.startsWith(`[${USER_NAME}]`));
  if (!firstMsg) return false;
  const msgLower = firstMsg.toLowerCase();
  if (!skipPatterns.some(p => msgLower.includes(p.toLowerCase()))) return false;
  return !hasEdits(jsonlContent);
}

function buildPrompt(messages, time) {
  return `Voici le transcript condensé d'une session Claude Code (${time}).
Génère un recap de session suivi optionnellement de propositions de capitalisation.
Réponds uniquement avec le contenu demandé — pas d'explication, pas d'outils.

FORMAT OBLIGATOIRE — deux sections séparées par la ligne "<<<PROPOSALS_SECTION>>>" :

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

<<<PROPOSALS_SECTION>>>

[Laisser vide si rien à capitaliser — ne jamais créer de sections ADR ou Skills vides]

RÈGLES RECAP :
- Ne jamais inventer des informations absentes du transcript
- Si la session est vide ou trop courte → répondre uniquement "SKIP"
- Langue : français

RÈGLES PROPOSALS (ne proposer que si clairement identifié dans la session) :
- ADR : décision d'architecture, de workflow ou de convention structurante et réutilisable
- Skill : skill à créer, modifier ou corriger suite à la session
- Si rien à capitaliser → laisser la section vide (rien après "<<<PROPOSALS_SECTION>>>")
- Si des proposals existent, les formater ainsi :

## Session ${time}

### ADR proposées

- **Titre** : [titre court]
  **Scope** : transverse / [nom projet]
  **Contexte** : [une phrase]

### Skills à mettre à jour

- **Skill** : [nom-du-skill]
  **Action** : update / create
  **Contexte** : [une phrase]

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

    const jsonlContent = fs.readFileSync(transcript_path, 'utf8');

    // Skip child sessions spawned by this hook (entrypoint = sdk-cli)
    if (jsonlContent.split('\n').slice(0, 10).some(l => { try { return JSON.parse(l).entrypoint === 'sdk-cli'; } catch (_) { return false; } })) return process.exit(0);

    // Deduplication: prevent the same transcript from being processed twice
    // (SessionEnd fires once on /clear AND once on process exit for the same session)
    const RECAP_DONE_DIR = path.join(os.homedir(), '.claude', 'cache', 'recap-done');
    const transcriptId = path.basename(transcript_path).replace(/\.jsonl.*$/, '');
    const doneMarker = path.join(RECAP_DONE_DIR, transcriptId);
    try {
      fs.mkdirSync(RECAP_DONE_DIR, { recursive: true });
      // Cleanup markers older than 7 days
      try {
        for (const e of fs.readdirSync(RECAP_DONE_DIR)) {
          const f = path.join(RECAP_DONE_DIR, e);
          if (Date.now() - fs.statSync(f).mtimeMs > 7 * 86400000) fs.unlinkSync(f);
        }
      } catch (_) {}
      // Exclusive create — fails with EEXIST if already processed
      fs.closeSync(fs.openSync(doneMarker, 'wx'));
    } catch (e) {
      if (e.code === 'EEXIST') return process.exit(0);
    }

    const messages = extractMessages(jsonlContent);
    if (messages.length < MIN_MESSAGES) return process.exit(0);
    if (isUtilitySession(messages, jsonlContent)) return process.exit(0);

    const time = getTime();
    const date = getDate();
    const sessionFile = path.join(VAULT_SESSIONS, `${date}.md`).replace(/\\/g, '/');
    const prompt = buildPrompt(messages, time);

    // Spawn claude with stdin pipe — avoids shell redirection and argument length limits
    // Pin to Sonnet 4.6 explicitly to prevent inheriting Sonnet 1M / Opus from the parent session
    // (avoids token spikes and multi-fire compactions that dupplicate recap sections)
    const child = spawn('claude', ['--print', '--model', 'claude-sonnet-4-6', '--output-format', 'text'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    // Hard kill after 90s — timeout option in spawn is not reliable in Bun on Windows,
    // causing zombie processes that accumulate memory indefinitely.
    const hardKill = setTimeout(() => {
      try { child.kill(); } catch (_) {}
      process.exit(0);
    }, 90000);

    let stdout = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stdin.on('error', () => {});
    child.stdin.write(prompt, 'utf8');
    child.stdin.end();

    child.on('close', () => {
      clearTimeout(hardKill);
      const output = stdout.trim();
      if (!output) return process.exit(0);

      // Split on separator — everything before is recap, everything after is proposals
      const SEPARATOR = '<<<PROPOSALS_SECTION>>>';
      const sepIdx = output.indexOf(SEPARATOR);
      const recap = (sepIdx >= 0 ? output.slice(0, sepIdx) : output).trim();
      const proposals = (sepIdx >= 0 ? output.slice(sepIdx + SEPARATOR.length) : '').trim();

      if (!recap || recap.toUpperCase() === 'SKIP') return process.exit(0);

      // Write recap to session file
      if (fs.existsSync(sessionFile)) {
        fs.appendFileSync(sessionFile, '\n\n---\n\n' + recap, 'utf8');
      } else {
        fs.writeFileSync(sessionFile, recap, 'utf8');
      }

      // Ingest + embed the new session in background (fire-and-forget)
      try {
        const ingestScript = path.join(os.homedir(), '.claude', 'ingest_sessions.py');
        const pythonExe = process.platform === 'win32' ? findUvPythonW() : null;
        if (pythonExe) {
          // Appel direct à pythonw.exe — pas de fenêtre console sur Windows
          const ingest = spawn(pythonExe, [ingestScript], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
          });
          ingest.unref();
        } else {
          // Fallback : uv run si l'env n'est pas trouvé
          const ingest = spawn('uv', ['run', ingestScript], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
          });
          ingest.unref();
        }
      } catch (_) {}

      // Write proposals file only if non-empty
      if (proposals) {
        const proposalsFile = path.join(VAULT_SESSIONS, `proposals-${date}.md`).replace(/\\/g, '/');
        if (fs.existsSync(proposalsFile)) {
          fs.appendFileSync(proposalsFile, '\n\n---\n\n' + proposals, 'utf8');
        } else {
          const header = `---\ndate: ${date}\nprocessed: false\n---\n\n`;
          fs.writeFileSync(proposalsFile, header + proposals, 'utf8');
        }
      }

      process.exit(0);
    });

    child.on('error', () => { clearTimeout(hardKill); process.exit(0); });

  } catch (_) {
    process.exit(0);
  }
});
