'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { run } = require('../../runtime/commands/continue.js');

function captureLog(fn) {
  const lines = [];
  const orig = console.log;
  console.log = (...args) => lines.push(args.join(' '));
  try { fn(); } finally { console.log = orig; }
  return lines.join('\n');
}

describe('continue — no active work', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'campaigns'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'fleet', 'briefs'), { recursive: true });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('returns null when no active campaigns or fleet sessions', () => {
    let result;
    captureLog(() => { result = run(tmpDir); });
    assert.equal(result, null);
  });
});

describe('continue — active campaign', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'campaigns'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'fleet', 'briefs'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.citadel', 'campaigns', 'my-campaign.md'),
      'Status: active\nPhase: 2\n'
    );
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('returns campaign object with correct type and name', () => {
    let result;
    captureLog(() => { result = run(tmpDir); });
    assert.ok(result !== null, 'Expected non-null result');
    assert.equal(result.type, 'campaign');
    assert.equal(result.name, 'my-campaign');
    assert.ok(typeof result.file === 'string', 'Expected file string');
  });
});

describe('continue — active fleet', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'campaigns'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'fleet', 'briefs'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.citadel', 'fleet', 'briefs', 'my-fleet.md'),
      'status: active\n'
    );
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('returns fleet object with correct type and name when no campaigns active', () => {
    let result;
    captureLog(() => { result = run(tmpDir); });
    assert.ok(result !== null, 'Expected non-null result');
    assert.equal(result.type, 'fleet');
    assert.equal(result.name, 'my-fleet');
    assert.ok(typeof result.file === 'string', 'Expected file string');
  });
});

describe('continue — campaign priority over fleet', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'campaigns'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'fleet', 'briefs'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.citadel', 'campaigns', 'my-campaign.md'),
      'Status: active\nPhase: 3\n'
    );
    fs.writeFileSync(
      path.join(tmpDir, '.citadel', 'fleet', 'briefs', 'my-fleet.md'),
      'status: active\n'
    );
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('returns campaign (not fleet) when both are active', () => {
    let result;
    captureLog(() => { result = run(tmpDir); });
    assert.ok(result !== null, 'Expected non-null result');
    assert.equal(result.type, 'campaign');
  });
});
