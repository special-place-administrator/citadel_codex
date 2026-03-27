'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const GATE_SCRIPT = path.resolve(__dirname, '../../runtime/checks/quality-gate.js');

function setupGitRepo(dir) {
  execFileSync('git', ['init'], { cwd: dir, stdio: 'pipe' });
  execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: dir, stdio: 'pipe' });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir, stdio: 'pipe' });
}

function runGate(cwd) {
  return execFileSync('node', [GATE_SCRIPT], {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function runGateExpectFailure(cwd) {
  try {
    execFileSync('node', [GATE_SCRIPT], {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    assert.fail('Expected non-zero exit but quality-gate succeeded');
  } catch (err) {
    return err;
  }
}

describe('quality-gate — no changed files', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    setupGitRepo(tmpDir);
    // Create a minimal package.json so findProjectRoot() anchors here
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'test' }));
    // Commit a clean JS file so HEAD exists
    const cleanFile = path.join(tmpDir, 'clean.js');
    fs.writeFileSync(cleanFile, 'function hello() { return 42; }\nmodule.exports = { hello };\n');
    execFileSync('git', ['add', '.'], { cwd: tmpDir, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('exits 0 and reports no changed files or all clean', () => {
    const output = runGate(tmpDir);
    const hasNoChanged = output.includes('No changed files');
    const hasAllClean = output.includes('all clean');
    assert.ok(
      hasNoChanged || hasAllClean,
      `Expected "No changed files" or "all clean" in output:\n${output}`
    );
  });
});

describe('quality-gate — confirm() violation', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    setupGitRepo(tmpDir);
    // Create minimal package.json so findProjectRoot() anchors here
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'test' }));
    // Commit a clean initial file first
    const cleanFile = path.join(tmpDir, 'app.js');
    fs.writeFileSync(cleanFile, 'function hello() { return 42; }\n');
    execFileSync('git', ['add', '.'], { cwd: tmpDir, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    // Now modify the file to introduce a confirm() call and stage it
    fs.writeFileSync(cleanFile, 'function hello() { return 42; }\nif (confirm("test")) { console.log("yes"); }\n');
    execFileSync('git', ['add', 'app.js'], { cwd: tmpDir, stdio: 'pipe' });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('exits 1 and reports confirm() violation', () => {
    const err = runGateExpectFailure(tmpDir);
    assert.equal(err.status, 1, `Expected exit code 1, got ${err.status}`);
    const output = (err.stdout || '') + (err.stderr || '');
    assert.ok(
      output.includes('confirm'),
      `Expected "confirm" violation message in output:\n${output}`
    );
  });
});
