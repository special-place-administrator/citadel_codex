'use strict';

const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { classify, detectActiveState, discoverSkills, PATTERN_ROUTES } = require('../../core/router/classify-intent.js');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

// ── Tier 0: Built-in commands ─────────────────────────────────────────────────

describe('classify — Tier 0 built-in commands', () => {
  it('routes "status" to status', () => {
    const r = classify('status', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'status');
  });

  it('routes "continue" to continue', () => {
    const r = classify('continue', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'continue');
  });

  it('routes "setup" to setup', () => {
    const r = classify('setup', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'setup');
  });

  it('routes "init" to init', () => {
    const r = classify('init', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'init');
  });
});

// ── Tier 0: Skill patterns ────────────────────────────────────────────────────

describe('classify — Tier 0 skill patterns', () => {
  it('routes "review my code" to skill:review', () => {
    const r = classify('review my code', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'skill:review');
  });

  it('routes "debug this" to skill:systematic-debugging', () => {
    const r = classify('debug this', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'skill:systematic-debugging');
  });

  it('routes "campaign plan" to skill:archon', () => {
    const r = classify('campaign plan', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'skill:archon');
  });

  it('routes "fleet deploy" to skill:fleet', () => {
    const r = classify('fleet deploy', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'skill:fleet');
  });
});

// ── Pattern precedence ────────────────────────────────────────────────────────

describe('classify — pattern precedence', () => {
  it('"research fleet results" routes to skill:research-fleet, not skill:research', () => {
    const r = classify('research fleet results', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'skill:research-fleet');
  });
});

// ── Case insensitivity ────────────────────────────────────────────────────────

describe('classify — case insensitivity', () => {
  it('"REVIEW MY CODE" routes to skill:review', () => {
    const r = classify('REVIEW MY CODE', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'skill:review');
  });
});

// ── No match ─────────────────────────────────────────────────────────────────

describe('classify — no match', () => {
  it('"asdf random gibberish xyz" returns tier -1, target null', () => {
    // Use a fresh temp dir with no campaigns/fleet so Tier 1 is also empty
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'campaigns'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'fleet', 'briefs'), { recursive: true });
    // No skills dir — Tier 2 also empty
    try {
      const r = classify('asdf random gibberish xyz', tmpDir);
      assert.equal(r.tier, -1);
      assert.equal(r.target, null);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ── Tier 1: Active campaign detection ────────────────────────────────────────

describe('classify — Tier 1 active campaign detection', () => {
  let tmpDir;

  it('returns tier 1 and target "continue" when active campaign exists', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-test-'));
    fs.mkdirSync(path.join(tmpDir, '.citadel', 'campaigns'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.citadel', 'campaigns', 'test-campaign.md'),
      'Status: active\nPhase: 1\n'
    );

    const r = classify('hello', tmpDir);
    assert.equal(r.tier, 1);
    assert.equal(r.target, 'continue');

    fs.rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  });

  after(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

// ── Tier 2: Skill discovery ───────────────────────────────────────────────────

describe('discoverSkills', () => {
  it('discovers exactly 24 skills', () => {
    const skills = discoverSkills(PROJECT_ROOT);
    assert.equal(skills.length, 24);
  });

  it('all skills have descriptions longer than 5 chars', () => {
    const skills = discoverSkills(PROJECT_ROOT);
    for (const s of skills) {
      assert.ok(
        s.description.length > 5,
        `Skill "${s.name}" has description too short: "${s.description}"`
      );
    }
  });

  it('no skill has description ">-" or ">"', () => {
    const skills = discoverSkills(PROJECT_ROOT);
    for (const s of skills) {
      assert.notEqual(s.description, '>-', `Skill "${s.name}" has raw YAML marker ">-"`);
      assert.notEqual(s.description, '>', `Skill "${s.name}" has raw YAML marker ">"`);
    }
  });
});

// ── PATTERN_ROUTES structure ──────────────────────────────────────────────────

describe('PATTERN_ROUTES', () => {
  it('all entries have required fields: patterns (array), target (string), description (string)', () => {
    assert.ok(Array.isArray(PATTERN_ROUTES), 'PATTERN_ROUTES should be an array');
    assert.ok(PATTERN_ROUTES.length > 0, 'PATTERN_ROUTES should not be empty');
    for (const route of PATTERN_ROUTES) {
      assert.ok(Array.isArray(route.patterns), `route target="${route.target}" missing patterns array`);
      assert.equal(typeof route.target, 'string', `route is missing string target`);
      assert.equal(typeof route.description, 'string', `route target="${route.target}" missing string description`);
    }
  });
});
