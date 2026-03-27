#!/usr/bin/env node

/**
 * post-edit.js — Per-file verification after edits
 *
 * Codex-native replacement for the Claude PostToolUse hook.
 * Runs language-adaptive type checking and lightweight lint on a given file.
 *
 * Usage:
 *   node runtime/checks/post-edit.js --path <file>
 *
 * Exit codes:
 *   0 = clean (or non-checkable file type)
 *   2 = type errors or lint violations found
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = findProjectRoot();

// ── CLI ──────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const pathIdx = args.indexOf('--path');
  if (pathIdx === -1 || !args[pathIdx + 1]) {
    console.error('Usage: node runtime/checks/post-edit.js --path <file>');
    process.exit(1);
  }

  const filePath = path.resolve(args[pathIdx + 1]);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');

  const lintWarnings = performanceLint(filePath, relativePath);
  const typeExit = typeCheck(filePath, relativePath);

  if (lintWarnings > 0 && typeExit === 0) {
    // Lint warnings are advisory, don't fail
    process.exit(0);
  }
  process.exit(typeExit);
}

// ── Type Checking ────────────────────────────────────────────────────────────

function typeCheck(filePath, relativePath) {
  if (/\.(ts|tsx)$/.test(filePath) && !/\.d\.ts$/.test(filePath)) {
    return typecheckTypeScript(filePath, relativePath);
  }
  if (/\.py$/.test(filePath)) {
    return typecheckPython(filePath, relativePath);
  }
  if (/\.go$/.test(filePath)) {
    return typecheckGo(filePath);
  }
  if (/\.rs$/.test(filePath)) {
    return typecheckRust();
  }
  return 0;
}

function typecheckTypeScript(filePath, relativePath) {
  try {
    execFileSync('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
      cwd: PROJECT_ROOT,
      timeout: 25000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return 0;
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '');
    const lines = output.split('\n').filter(line => {
      const normalized = line.replace(/\\/g, '/');
      return normalized.includes(relativePath) && line.includes('error TS');
    });
    if (lines.length > 0) {
      console.log(`[typecheck] ${lines.length} error(s) in ${relativePath}:`);
      lines.slice(0, 10).forEach(l => console.log(l));
      if (lines.length > 10) console.log(`  ... and ${lines.length - 10} more`);
      return 2;
    }
    return 0;
  }
}

function typecheckPython(filePath, relativePath) {
  // Try mypy first, fall back to pyright
  for (const cmd of ['mypy', 'pyright']) {
    try {
      execFileSync(cmd, [filePath], {
        cwd: PROJECT_ROOT,
        timeout: 20000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return 0;
    } catch (err) {
      if (err.code === 'ENOENT') continue; // tool not installed
      const output = (err.stdout || '') + (err.stderr || '');
      const lines = output.split('\n').filter(l => l.includes('error'));
      if (lines.length > 0) {
        console.log(`[typecheck] Errors in ${relativePath}:`);
        lines.slice(0, 10).forEach(l => console.log(l));
        return 2;
      }
      return 0;
    }
  }
  return 0; // no checker available
}

function typecheckGo(filePath) {
  const dir = path.dirname(filePath);
  try {
    execFileSync('go', ['vet', './...'], {
      cwd: dir,
      timeout: 20000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return 0;
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '');
    if (output.trim()) {
      console.log(`[typecheck] go vet issues:\n${output.slice(0, 500)}`);
      return 2;
    }
    return 0;
  }
}

function typecheckRust() {
  try {
    execFileSync('cargo', ['check', '--message-format=short'], {
      cwd: PROJECT_ROOT,
      timeout: 30000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return 0;
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '');
    const errors = output.split('\n').filter(l => l.includes('error'));
    if (errors.length > 0) {
      console.log(`[typecheck] cargo check errors:`);
      errors.slice(0, 10).forEach(l => console.log(l));
      return 2;
    }
    return 0;
  }
}

// ── Performance Lint ─────────────────────────────────────────────────────────

function performanceLint(filePath, relativePath) {
  if (!/\.(ts|tsx|js|jsx|css|scss)$/.test(filePath)) return 0;

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return 0;
  }

  const warnings = [];

  if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
    if (/\bconfirm\s*\(/.test(content)) warnings.push('Uses confirm() — use an in-app modal instead');
    if (/\balert\s*\(/.test(content)) warnings.push('Uses alert() — use an in-app notification instead');
    if (/\bprompt\s*\(/.test(content)) warnings.push('Uses prompt() — use an in-app input instead');
  }

  if (/transition-all/.test(content)) {
    warnings.push('Uses transition-all — specify properties explicitly');
  }

  if (warnings.length > 0) {
    console.log(`[lint] ${relativePath}:`);
    warnings.forEach(w => console.log(`  - ${w}`));
  }
  return warnings.length;
}

// ── Util ─────────────────────────────────────────────────────────────────────

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
