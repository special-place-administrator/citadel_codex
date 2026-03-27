'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const BREAKER_SCRIPT = path.resolve(__dirname, '../../runtime/checks/circuit-breaker.js');

function run(args, cwd) {
  return execFileSync('node', [BREAKER_SCRIPT, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function runExpectFailure(args, cwd) {
  try {
    execFileSync('node', [BREAKER_SCRIPT, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    assert.fail('Expected non-zero exit but command succeeded');
  } catch (err) {
    return err;
  }
}

describe('circuit-breaker — --status on fresh state', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'telemetry'), { recursive: true });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('exits 0 and shows Consecutive failures: 0', () => {
    const output = run(['--status'], tmpDir);
    assert.ok(
      output.includes('Consecutive failures: 0'),
      `Expected "Consecutive failures: 0" in:\n${output}`
    );
  });
});

describe('circuit-breaker — --record-failure', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'telemetry'), { recursive: true });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('records one failure and --status shows Consecutive failures: 1', () => {
    run(['--record-failure'], tmpDir);
    const output = run(['--status'], tmpDir);
    assert.ok(
      output.includes('Consecutive failures: 1'),
      `Expected "Consecutive failures: 1" in:\n${output}`
    );
  });
});

describe('circuit-breaker — --reset', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'telemetry'), { recursive: true });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('resets counter to 0 after a failure', () => {
    run(['--record-failure'], tmpDir);
    run(['--reset'], tmpDir);
    const output = run(['--status'], tmpDir);
    assert.ok(
      output.includes('Consecutive failures: 0'),
      `Expected "Consecutive failures: 0" after reset in:\n${output}`
    );
  });
});

describe('circuit-breaker — threshold trip', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'telemetry'), { recursive: true });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('exits with code 1 on the 3rd consecutive failure (THRESHOLD=3)', () => {
    run(['--record-failure'], tmpDir);
    run(['--record-failure'], tmpDir);
    const err = runExpectFailure(['--record-failure'], tmpDir);
    assert.equal(err.status, 1, `Expected exit code 1 on threshold trip, got ${err.status}`);
  });
});

describe('circuit-breaker — after trip, counter resets', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'telemetry'), { recursive: true });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('shows Consecutive failures: 0 and Lifetime trips: 1 after a trip', () => {
    run(['--record-failure'], tmpDir);
    run(['--record-failure'], tmpDir);
    // Third failure triggers the trip (exits 1)
    runExpectFailure(['--record-failure'], tmpDir);
    const output = run(['--status'], tmpDir);
    assert.ok(
      output.includes('Consecutive failures: 0'),
      `Expected "Consecutive failures: 0" after trip in:\n${output}`
    );
    assert.ok(
      output.includes('Lifetime trips: 1'),
      `Expected "Lifetime trips: 1" after trip in:\n${output}`
    );
  });
});
