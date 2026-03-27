#!/usr/bin/env node

/**
 * quality-gate.js — Scan changed files for anti-patterns
 *
 * Codex-native replacement for the Claude Stop hook.
 * Scans git-changed files for configurable anti-patterns.
 *
 * Usage:
 *   node runtime/checks/quality-gate.js [--scope <dir>]
 *
 * Exit codes:
 *   0 = clean or no changed files
 *   1 = violations found
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_ROOT = findProjectRoot();

// ── Built-in Rules ───────────────────────────────────────────────────────────

const BUILT_IN_RULES = {
  'no-confirm-alert': {
    test: /\.(ts|tsx|js|jsx)$/,
    patterns: [
      { regex: /\bconfirm\s*\(/, message: 'Uses confirm() — use an in-app modal' },
      { regex: /\balert\s*\(/, message: 'Uses alert() — use an in-app notification' },
    ],
  },
  'no-transition-all': {
    test: /\.(ts|tsx|js|jsx|css|scss)$/,
    patterns: [
      { regex: /transition-all/, message: 'Uses transition-all — name specific properties' },
    ],
  },
  'no-magic-intervals': {
    test: /\.(ts|tsx|js|jsx)$/,
    patterns: [
      { regex: /setInterval\s*\([^,]+,\s*\d+\s*\)/, message: 'Hardcoded setInterval — use a named constant' },
    ],
  },
};

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const scopeIdx = args.indexOf('--scope');
  const scope = (scopeIdx !== -1 && args[scopeIdx + 1]) ? args[scopeIdx + 1] : '.';

  const changedFiles = getChangedFiles(scope);
  if (changedFiles.length === 0) {
    console.log('[quality-gate] No changed files to scan.');
    process.exit(0);
  }

  const enabledRules = Object.keys(BUILT_IN_RULES);
  const violations = [];

  for (const file of changedFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    if (!/\.(ts|tsx|js|jsx|py|go|rs|css|scss)$/.test(file)) continue;

    let content;
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }

    for (const ruleName of enabledRules) {
      const rule = BUILT_IN_RULES[ruleName];
      if (!rule.test.test(file)) continue;

      for (const pattern of rule.patterns) {
        if (pattern.regex.test(content)) {
          violations.push({ file, rule: ruleName, message: pattern.message });
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log(`[quality-gate] ${changedFiles.length} file(s) scanned — all clean.`);
    process.exit(0);
  }

  console.log(`[quality-gate] ${violations.length} issue(s) in changed files:\n`);
  for (const v of violations) {
    console.log(`  ${v.file}: ${v.message}`);
  }
  console.log('\nFix these before finalizing your work.');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getChangedFiles(scope) {
  try {
    let output;
    try {
      output = execFileSync('git', ['diff', '--name-only', 'HEAD'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      output = execFileSync('git', ['diff', '--name-only'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }

    return output.trim().split('\n').filter(Boolean).filter(f => {
      if (scope === '.') return true;
      return f.startsWith(scope.replace(/\\/g, '/'));
    });
  } catch {
    return [];
  }
}

function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json')) ||
        fs.existsSync(path.join(dir, '.citadel'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

main();
