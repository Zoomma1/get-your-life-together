#!/usr/bin/env node
// secret-guard.js — PreToolUse hook for Bash
// Blocks commands likely to leak secrets into Claude Code tool results / JSONL transcripts.
// Created 2026-04-09 after audit revealing postgres URL leaks across 47 files.
//
// How it works:
// 1. Claude Code pipes tool_input JSON to this hook before running Bash commands.
// 2. We inspect the `command` field for patterns that expose secrets in stdout.
// 3. If a pattern matches, we output a permissionDecision=deny with a reason.
// 4. Silent allow otherwise (exit 0).
//
// Patterns blocked (all case-sensitive where relevant):
// - cat/less/more/head/tail/bat/nano/vi/vim/code on .env, .pem, id_rsa, id_ed25519, .aws/credentials
// - printenv with no arg, bare `env` (without `env SOMETHING=...`)
// - export VAR_TOKEN/SECRET/KEY/PASSWORD=...
// - curl/wget with `Authorization: Bearer` or `--user user:pass` in command
// - git remote -v (may leak token-embedded URLs)
// - echo $SOMETHING_TOKEN or similar
//
// Override: prefix command with `# FORCE: ` comment to bypass (e.g. when you KNOW it's safe).

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
];

let input = '';
const timeout = setTimeout(() => process.exit(0), 5000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(timeout);
  try {
    const data = JSON.parse(input);
    if (data.tool_name !== 'Bash') {
      process.exit(0);
    }
    const command = (data.tool_input && data.tool_input.command) || '';

    // Bypass if user explicitly marked the command as safe
    if (/^\s*#\s*FORCE:/i.test(command)) {
      process.exit(0);
    }

    for (const { re, why } of DANGER_PATTERNS) {
      if (re.test(command)) {
        const out = {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason:
              `secret-guard: blocked — ${why}. ` +
              `Command: ${command.slice(0, 120)}${command.length > 120 ? '…' : ''}. ` +
              `If you are 100% sure this is safe, prefix the command with "# FORCE: " to bypass.`
          }
        };
        process.stdout.write(JSON.stringify(out));
        process.exit(0);
      }
    }

    // All clear
    process.exit(0);
  } catch (e) {
    // Never block on parse errors — fail open
    process.exit(0);
  }
});
