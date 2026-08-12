#!/usr/bin/env node
// retention-purge.js — SessionStart hook
// Purges old data from ~/.claude/ to keep the data footprint bounded.
// Created 2026-04-09 (ADR-013) after audit revealing 94 secret matches
// across 50 files + unbounded growth of transcripts.
//
// Rules:
//   projects/       > 30 days → deleted
//   file-history/   > 14 days → deleted
//   paste-cache/    >  7 days → deleted
//
// The purge is deliberately INDISCRIMINATE about file type: anything old enough
// under those roots goes. That is what keeps the footprint bounded — an allowlist
// of "deletable" types silently exempts every new kind of file (rotated
// transcripts, workflow scratch, …) and the directory grows without limit.
//
// The one exception is SKIP_DIRS below. It is not a convenience: it is the ONLY
// thing standing between durable agent memory and deletion. A new class of
// durable data under these roots MUST be added there, or it WILL be deleted.
//
// 2026-08-12 — fixed: there was no such exception, so `~/.claude/projects/**/
// memory/*.md` aged past 30 days and was deleted silently, while MEMORY.md
// survived (rewritten on every new entry) and kept pointing at files that no
// longer existed. Confirmed on two machines.
//
// Runs silently. Appends one summary line per run to ~/.claude/cache/last-purge.log.
// Never blocks the session — all errors are swallowed, exit 0 unconditionally.
// Skips itself if the last run was < 6 hours ago (stamp in ~/.claude/cache/last-purge.stamp).

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const CLAUDE = path.join(HOME, '.claude');
const CACHE = path.join(CLAUDE, 'cache');
const LOG = path.join(CACHE, 'last-purge.log');
const STAMP = path.join(CACHE, 'last-purge.stamp');

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;
const THROTTLE_HOURS = 6;

// Directories never descended into, at any depth, for every rule.
// Load-bearing — see the note above before touching this.
const SKIP_DIRS = new Set(['memory']);

const RULES = [
  { dir: path.join(CLAUDE, 'projects'), maxDays: 30, label: 'projects' },
  { dir: path.join(CLAUDE, 'file-history'), maxDays: 14, label: 'file-history' },
  { dir: path.join(CLAUDE, 'paste-cache'), maxDays: 7, label: 'paste-cache' },
];

// Purge files older than cutoff, then remove empty directories bottom-up.
function walkPrune(dir, cutoffMs) {
  let removed = 0;
  if (!fs.existsSync(dir)) return 0;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return 0; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    try {
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        removed += walkPrune(full, cutoffMs);
        try {
          if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
        } catch (_) {}
      } else if (e.isFile()) {
        const st = fs.statSync(full);
        if (st.mtimeMs < cutoffMs) {
          fs.unlinkSync(full);
          removed++;
        }
      }
    } catch (_) {}
  }
  return removed;
}

function run() {
  // Throttle: skip if last run < 6h ago
  try {
    if (fs.existsSync(STAMP)) {
      const last = Number(fs.readFileSync(STAMP, 'utf8').trim()) || 0;
      if (Date.now() - last < THROTTLE_HOURS * MS_HOUR) {
        process.exit(0);
      }
    }
  } catch (_) {}

  const now = Date.now();
  const results = RULES.map(r => {
    const cutoff = now - r.maxDays * MS_DAY;
    const removed = walkPrune(r.dir, cutoff);
    return `${r.label}>${r.maxDays}d:${removed}`;
  });

  try {
    fs.mkdirSync(CACHE, { recursive: true });
    fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${results.join(' ')}\n`);
    fs.writeFileSync(STAMP, String(now));
  } catch (_) {}

  process.exit(0);
}

// SessionStart hooks receive JSON on stdin. Consume then run.
// Fallback: run after 300ms if stdin doesn't emit (manual invocation).
let ran = false;
const fallback = setTimeout(() => { if (!ran) { ran = true; run(); } }, 300);
process.stdin.on('data', () => {});
process.stdin.on('end', () => {
  clearTimeout(fallback);
  if (!ran) { ran = true; run(); }
});
process.stdin.on('error', () => {
  clearTimeout(fallback);
  if (!ran) { ran = true; run(); }
});
