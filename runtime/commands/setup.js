#!/usr/bin/env node

/**
 * setup.js — First-time project setup
 *
 * Detects the project stack, generates .citadel/config.json,
 * and prints a reference card. Codex-native — no Claude harness.json,
 * hook installation, or CLAUDE.md generation.
 *
 * Usage: node runtime/cli.js setup
 *        node runtime/commands/setup.js
 */

const fs = require('fs');
const path = require('path');
const { discoverSkills } = require('../../core/router/classify-intent.js');

function run(projectRoot) {
  const root = projectRoot || process.cwd();

  console.log('=== Citadel Codex Setup ===\n');

  // Step 1: Detect stack
  const stack = detectStack(root);
  console.log('Detected stack:');
  console.log(`  Language:  ${stack.language}`);
  if (stack.framework) console.log(`  Framework: ${stack.framework}`);
  console.log(`  Package:   ${stack.packageManager}`);
  if (stack.testFramework) console.log(`  Tests:     ${stack.testFramework}`);

  // Step 2: Generate config
  const skills = discoverSkills(root);
  const config = {
    language: stack.language,
    framework: stack.framework,
    packageManager: stack.packageManager,
    typecheck: stack.typecheck,
    test: stack.testFramework ? { framework: stack.testFramework } : null,
    skills: skills.map(s => s.dir),
    skillCount: skills.length,
  };

  const configPath = path.join(root, '.citadel', 'config.json');
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`\nConfig written: .citadel/config.json`);

  // Step 3: Verify state tree
  const stateOk = fs.existsSync(path.join(root, '.citadel', 'campaigns'));
  if (!stateOk) {
    console.log('\nState tree missing — run: node runtime/cli.js init');
  } else {
    console.log('State tree: OK');
  }

  // Step 4: Reference card
  console.log(`
┌──────────────────────────────────────────────────────┐
│  CITADEL CODEX READY — ${String(skills.length).padEnd(2)} skills installed${' '.repeat(13)}│
│                                                      │
│  node runtime/cli.js init       Initialize state     │
│  node runtime/cli.js status     Show active work     │
│  node runtime/cli.js continue   Resume active work   │
│  node runtime/cli.js setup      Reconfigure project  │
│                                                      │
│  CHECKS                                              │
│  runtime/checks/post-edit.js    Per-file verify      │
│  runtime/checks/quality-gate.js Scan changed files   │
│  runtime/checks/circuit-breaker.js Failure tracking  │
│                                                      │
│  Skills: ${skills.map(s => s.dir).join(', ').slice(0, 42).padEnd(42)} │
└──────────────────────────────────────────────────────┘`);

  console.log(`\nSetup complete for ${stack.language}${stack.framework ? ' + ' + stack.framework : ''}.`);
  return config;
}

// ── Stack Detection ──────────────────────────────────────────────────────────

function detectStack(root) {
  const stack = {
    language: 'unknown',
    framework: null,
    packageManager: 'npm',
    testFramework: null,
    typecheck: null,
  };

  const has = (file) => fs.existsSync(path.join(root, file));
  const readJson = (file) => {
    try { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); } catch { return null; }
  };

  // Language detection
  if (has('tsconfig.json')) {
    stack.language = 'typescript';
    stack.typecheck = { command: 'npx tsc --noEmit', perFile: true };
  } else if (has('package.json')) {
    stack.language = 'javascript';
  } else if (has('pyproject.toml') || has('requirements.txt') || has('setup.py')) {
    stack.language = 'python';
    stack.typecheck = { command: 'mypy', perFile: true };
  } else if (has('go.mod')) {
    stack.language = 'go';
    stack.typecheck = { command: 'go vet ./...', perFile: false };
  } else if (has('Cargo.toml')) {
    stack.language = 'rust';
    stack.typecheck = { command: 'cargo check', perFile: false };
  } else if (has('pom.xml') || has('build.gradle')) {
    stack.language = 'java';
  }

  // Package manager
  if (has('pnpm-lock.yaml')) stack.packageManager = 'pnpm';
  else if (has('yarn.lock')) stack.packageManager = 'yarn';
  else if (has('bun.lockb')) stack.packageManager = 'bun';
  else if (has('Pipfile') || has('Pipfile.lock')) stack.packageManager = 'pipenv';
  else if (has('poetry.lock')) stack.packageManager = 'poetry';

  // Framework detection (from package.json deps)
  const pkg = readJson('package.json');
  if (pkg) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['next']) stack.framework = 'Next.js';
    else if (deps['react']) stack.framework = 'React';
    else if (deps['vue']) stack.framework = 'Vue';
    else if (deps['svelte']) stack.framework = 'Svelte';
    else if (deps['@angular/core']) stack.framework = 'Angular';
    else if (deps['express']) stack.framework = 'Express';
    else if (deps['fastify']) stack.framework = 'Fastify';
    else if (deps['@nestjs/core']) stack.framework = 'NestJS';

    // Test framework
    if (deps['vitest']) stack.testFramework = 'Vitest';
    else if (deps['jest']) stack.testFramework = 'Jest';
    else if (deps['mocha']) stack.testFramework = 'Mocha';
  }

  // Python frameworks
  if (stack.language === 'python') {
    if (has('manage.py')) stack.framework = 'Django';
    // Could check pyproject.toml for FastAPI/Flask but keep it simple
  }

  return stack;
}

module.exports = { run, detectStack };

if (require.main === module) {
  run();
}
