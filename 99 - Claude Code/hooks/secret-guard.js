#!/usr/bin/env node
// secret-guard.js — PreToolUse hook for Bash | Read | Edit | Write | Grep
// Blocks operations likely to leak secrets into Claude Code tool results / JSONL transcripts.
// Created 2026-04-09 after audit revealing postgres URL leaks across 47 files.
// Extended 2026-07-28 to the file tools (ticket combler-trous-defense-in-depth-secret-guard-scrubbing-outbound):
// blocking `cat .env` in Bash is pointless while `Read(.env)` and `Grep(glob:".env*")` walk right past.
//
// How it works:
// 1. Claude Code pipes tool_input JSON to this hook before running the tool.
// 2. Bash    → we inspect the `command` field for patterns that expose secrets in stdout.
//    Others  → we inspect the path-ish fields (file_path / path / glob) for sensitive file names.
// 3. If a pattern matches, we output a permissionDecision=deny with a reason.
// 4. Silent allow otherwise (exit 0).
//
// Bash patterns blocked (all case-sensitive where relevant):
// - cat/less/more/head/tail/bat/nano/vi/vim/code on .env, .pem, id_rsa, id_ed25519, .aws/credentials
// - printenv with no arg, bare `env` (without `env SOMETHING=...`)
// - export VAR_TOKEN/SECRET/KEY/PASSWORD=...
// - curl/wget with `Authorization: Bearer` or `--user user:pass` in command
// - git remote -v (may leak token-embedded URLs)
// - echo $SOMETHING_TOKEN or similar
//
// File-tool paths blocked: .env*, *.pem, *.key, id_rsa*, id_ed25519*,
// .aws/credentials, .aws/config, .netrc, .docker/config.json, .ssh/config
// (.env.example / .sample / .template / .dist are allowed — they are templates, not secrets)
//
// Override: Bash only — prefix the command with `# FORCE: ` (e.g. when you KNOW it's safe).
// The file tools have no free-text field to carry an override, so a denied Read/Grep has to
// be re-routed through Bash + `# FORCE: `, deliberately. That friction is the point.

const DANGER_PATTERNS = [
  { re: /\b(cat|less|more|head|tail|bat|nano|vi|vim|code)\s+([^\s|;&]*\/)?\.env(\b|\.|\s|$)/, why: "reading a .env file dumps secrets into the transcript" },
  { re: /\b(cat|less|more|head|tail|bat)\s+([^\s|;&]*\/)?[^\s]*\.(pem|key)(\b|\s|$)/, why: "reading a .pem/.key file dumps private keys into the transcript" },
  { re: /\b(cat|less|more|head|tail|bat)\s+([^\s|;&]*\/)?(id_rsa|id_ed25519|id_dsa|id_ecdsa)(\b|\.|\s|$)/, why: "reading an SSH private key dumps it into the transcript" },
  { re: /\bcat\s+.*\.aws\/credentials/, why: "reading AWS credentials dumps access keys into the transcript" },
  { re: /\bcat\s+.*\.docker\/config/, why: "reading Docker config may dump registry auth tokens" },
  { re: /\bprintenv\b(?!\s+\S)/, why: "bare `printenv` dumps all environment variables" },
  { re: /(^|[;&|]|\s)env\s*($|\||;|&)/, why: "bare `env` dumps all environment variables" },
  { re: /\bexport\s+[A-Z_][A-Z_0-9]*(TOKEN|SECRET|KEY|PASSWORD|PASS|PWD|APIKEY)\s*=\s*[^$]/i, why: "exporting a literal secret places it in the transcript — use a file reference instead" },
  { re: /Authorization:\s*Bearer\s+[A-Za-z0-9._\-]{10,}/, why: "literal Bearer token in command — transcript will store the token" },
  { re: /--user\s+[^\s:]+:[^\s]+/, why: "literal user:password in command — transcript will store the credential" },
  { re: /\bgit\s+remote\s+(-v|--verbose|show)\b/, why: "git remote -v can leak token-embedded URLs if the remote contains credentials" },
  { re: /\becho\s+\$[A-Z_][A-Z_0-9]*(TOKEN|SECRET|KEY|PASSWORD|PASS|PWD|APIKEY)/i, why: "echoing a secret env var places its value in the transcript" },
  { re: /\bhistory\b/, why: "bash history may contain previously typed secrets or passwords" },
  { re: /\bcat\s+([^\s]*\/)?\.netrc\b/, why: "reading .netrc dumps git/ftp/http credentials into the transcript" },
];

// Tools that address a file by path rather than by shell command.
const FILE_TOOLS = new Set(['Read', 'Edit', 'Write', 'Grep']);

// Fields that can carry a path/name in those tools' inputs.
// Grep is included via `path` + `glob`: `Grep(glob: ".env*")` leaks just as well as `Read(.env)`.
const PATH_FIELDS = ['file_path', 'path', 'glob', 'notebook_path'];

// Templates checked into repos on purpose — they hold keys, never values.
// Excluded first so `.env.example` doesn't trip the `.env*` rule below.
const PATH_ALLOWLIST = /(^|\/)\.env\.(example|sample|template|dist)$/i;

// A glob is not a path: ".env*" and "**/*.key" must be reduced to something the
// path patterns below can recognise. Stripping the wildcards is enough —
// ".env*" -> ".env", "**/*.key" -> "/.key", "*.ts" -> ".ts" (matches nothing, as intended).
function normalizeGlob(value) {
  return value.replace(/[*?]/g, '').replace(/\/+/g, '/');
}

const SENSITIVE_PATH_PATTERNS = [
  { re: /(^|\/)\.env(\.|$)/i, why: "a .env file holds live secrets" },
  { re: /\.(pem|key)$/i, why: "a .pem/.key file holds a private key" },
  { re: /(^|\/)(id_rsa|id_ed25519|id_dsa|id_ecdsa)(\.|$)/, why: "this is an SSH private key" },
  { re: /(^|\/)\.aws\/(credentials|config)$/, why: "AWS credentials hold access keys" },
  { re: /(^|\/)\.netrc$/, why: "a .netrc holds git/ftp/http credentials" },
  { re: /(^|\/)\.docker\/config\.json$/, why: "the Docker config holds registry auth tokens" },
  { re: /(^|\/)\.ssh\/config$/, why: "the SSH config exposes host and identity layout" },
];

// Emit the deny verdict and stop. Never returns.
function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `secret-guard: blocked — ${reason}`
    }
  }));
  process.exit(0);
}

let input = '';
const timeout = setTimeout(() => process.exit(0), 5000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(timeout);
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};

    // --- File tools: match on the path, not on a shell command ---
    if (FILE_TOOLS.has(data.tool_name)) {
      for (const field of PATH_FIELDS) {
        const raw = toolInput[field];
        if (typeof raw !== 'string' || !raw) continue;
        const value = field === 'glob' ? normalizeGlob(raw) : raw;
        if (!value || PATH_ALLOWLIST.test(value)) continue;

        for (const { re, why } of SENSITIVE_PATH_PATTERNS) {
          if (re.test(value)) {
            deny(
              `${why}. ${data.tool_name} on "${raw}" would place its contents in the transcript. ` +
              `There is no override on this tool — if you are 100% sure this is safe, ` +
              `route it through Bash with a "# FORCE: " prefix.`
            );
          }
        }
      }
      process.exit(0);
    }

    if (data.tool_name !== 'Bash') {
      process.exit(0);
    }
    const command = toolInput.command || '';

    // Bypass if user explicitly marked the command as safe
    if (/^\s*#\s*FORCE:/i.test(command)) {
      process.exit(0);
    }

    for (const { re, why } of DANGER_PATTERNS) {
      if (re.test(command)) {
        deny(
          `${why}. ` +
          `Command: ${command.slice(0, 120)}${command.length > 120 ? '…' : ''}. ` +
          `If you are 100% sure this is safe, prefix the command with "# FORCE: " to bypass.`
        );
      }
    }

    // All clear
    process.exit(0);
  } catch (e) {
    // Never block on parse errors — fail open
    process.exit(0);
  }
});
