'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { run } = require('../../runtime/commands/status.js');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

function captureLog(fn) {
  const lines = [];
  const orig = console.log;
  console.log = (...args) => lines.push(args.join(' '));
  try { fn(); } finally { console.log = orig; }
  return lines.join('\n');
}

describe('status — empty state', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'campaigns'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'fleet', 'briefs'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'intake'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'coordination', 'claims'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'coordination', 'instances'), { recursive: true });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it('shows (none active) for campaigns and fleet when directories are empty', () => {
    const output = captureLog(() => run(tmpDir));
    assert.ok(output.includes('(none active)'), `Expected "(none active)" in output:\n${output}`);
    // Should appear twice — once for campaigns, once for fleet
    const count = (output.match(/\(none active\)/g) || []).length;
    assert.ok(count >= 2, `Expected at least 2 occurrences of "(none active)", got ${count}:\n${output}`);
  });
});

describe('status — skills count', () => {
  it('reports 23 installed skills when run against project root', () => {
    const output = captureLog(() => run(PROJECT_ROOT));
    assert.ok(
      output.includes('23 installed'),
      `Expected "23 installed" in output:\n${output}`
    );
  });
});
