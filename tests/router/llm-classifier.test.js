'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { llmClassify } = require('../../core/router/llm-classifier.js');
const { classify, classifyAsync } = require('../../core/router/classify-intent.js');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetch(responseContent) {
  return async (_url, _opts) => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: responseContent } }],
    }),
  });
}

function mockFetchError(err) {
  return async () => { throw err; };
}

function mockFetchBadJson() {
  return async () => ({
    ok: true,
    json: async () => { throw new SyntaxError('Unexpected token'); },
  });
}

function mockFetchNotOk() {
  return async () => ({
    ok: false,
    json: async () => ({}),
  });
}

const SAMPLE_SKILLS = [
  { dir: 'archon', name: 'Archon', description: 'Multi-session campaign orchestrator' },
  { dir: 'fleet',  name: 'Fleet',  description: 'Parallel campaign coordinator' },
  { dir: 'review', name: 'Review', description: 'Code review workflow' },
];

// ── Test: No endpoint configured ──────────────────────────────────────────────

describe('llmClassify — no endpoint configured', () => {
  let savedEndpoint;
  let savedFetch;

  beforeEach(() => {
    savedEndpoint = process.env.CITADEL_LLM_ENDPOINT;
    savedFetch = global.fetch;
    delete process.env.CITADEL_LLM_ENDPOINT;
  });

  afterEach(() => {
    if (savedEndpoint === undefined) {
      delete process.env.CITADEL_LLM_ENDPOINT;
    } else {
      process.env.CITADEL_LLM_ENDPOINT = savedEndpoint;
    }
    global.fetch = savedFetch;
  });

  it('returns null immediately when CITADEL_LLM_ENDPOINT is not set', async () => {
    // fetch should never be called
    global.fetch = async () => { throw new Error('fetch must not be called'); };
    const result = await llmClassify('orchestrate a campaign', SAMPLE_SKILLS);
    assert.equal(result, null);
  });
});

// ── Test: Successful classification ──────────────────────────────────────────

describe('llmClassify — successful classification', () => {
  let savedEndpoint;
  let savedFetch;

  beforeEach(() => {
    savedEndpoint = process.env.CITADEL_LLM_ENDPOINT;
    savedFetch = global.fetch;
    process.env.CITADEL_LLM_ENDPOINT = 'http://localhost:11434/v1/chat/completions';
  });

  afterEach(() => {
    if (savedEndpoint === undefined) {
      delete process.env.CITADEL_LLM_ENDPOINT;
    } else {
      process.env.CITADEL_LLM_ENDPOINT = savedEndpoint;
    }
    global.fetch = savedFetch;
  });

  it('returns skill target when LLM returns a known skill dir name', async () => {
    global.fetch = mockFetch('archon');
    const result = await llmClassify('I need to orchestrate a campaign', SAMPLE_SKILLS);
    assert.ok(result !== null, 'expected non-null result');
    assert.equal(result.target, 'skill:archon');
    assert.equal(typeof result.description, 'string');
    assert.ok(result.description.length > 0);
    assert.equal(typeof result.confidence, 'number');
    assert.ok(result.confidence > 0);
  });

  it('is case-insensitive when matching LLM response to skill dir', async () => {
    global.fetch = mockFetch('  Archon  ');
    const result = await llmClassify('run campaigns', SAMPLE_SKILLS);
    assert.ok(result !== null, 'expected non-null result');
    assert.equal(result.target, 'skill:archon');
  });

  it('strips surrounding quotes from LLM response', async () => {
    global.fetch = mockFetch('"fleet"');
    const result = await llmClassify('parallel agents', SAMPLE_SKILLS);
    assert.ok(result !== null, 'expected non-null result');
    assert.equal(result.target, 'skill:fleet');
  });
});

// ── Test: LLM returns "none" ──────────────────────────────────────────────────

describe('llmClassify — LLM returns "none"', () => {
  let savedEndpoint;
  let savedFetch;

  beforeEach(() => {
    savedEndpoint = process.env.CITADEL_LLM_ENDPOINT;
    savedFetch = global.fetch;
    process.env.CITADEL_LLM_ENDPOINT = 'http://localhost:11434/v1/chat/completions';
  });

  afterEach(() => {
    if (savedEndpoint === undefined) {
      delete process.env.CITADEL_LLM_ENDPOINT;
    } else {
      process.env.CITADEL_LLM_ENDPOINT = savedEndpoint;
    }
    global.fetch = savedFetch;
  });

  it('returns null when LLM replies "none"', async () => {
    global.fetch = mockFetch('none');
    const result = await llmClassify('completely unrecognised input xyz', SAMPLE_SKILLS);
    assert.equal(result, null);
  });

  it('returns null when LLM replies with an unrecognised skill name', async () => {
    global.fetch = mockFetch('totally-unknown-skill');
    const result = await llmClassify('something random', SAMPLE_SKILLS);
    assert.equal(result, null);
  });
});

// ── Test: Fetch throws (timeout / network error) ──────────────────────────────

describe('llmClassify — fetch error / timeout', () => {
  let savedEndpoint;
  let savedFetch;

  beforeEach(() => {
    savedEndpoint = process.env.CITADEL_LLM_ENDPOINT;
    savedFetch = global.fetch;
    process.env.CITADEL_LLM_ENDPOINT = 'http://localhost:11434/v1/chat/completions';
  });

  afterEach(() => {
    if (savedEndpoint === undefined) {
      delete process.env.CITADEL_LLM_ENDPOINT;
    } else {
      process.env.CITADEL_LLM_ENDPOINT = savedEndpoint;
    }
    global.fetch = savedFetch;
  });

  it('returns null (does not throw) when fetch throws a network error', async () => {
    global.fetch = mockFetchError(new Error('ECONNREFUSED'));
    const result = await llmClassify('run archon', SAMPLE_SKILLS);
    assert.equal(result, null);
  });

  it('returns null (does not throw) when fetch throws an AbortError', async () => {
    global.fetch = mockFetchError(Object.assign(new Error('AbortError'), { name: 'AbortError' }));
    const result = await llmClassify('run archon', SAMPLE_SKILLS);
    assert.equal(result, null);
  });

  it('returns null (does not throw) when response is not ok', async () => {
    global.fetch = mockFetchNotOk();
    const result = await llmClassify('run archon', SAMPLE_SKILLS);
    assert.equal(result, null);
  });
});

// ── Test: Invalid response format ─────────────────────────────────────────────

describe('llmClassify — invalid response format', () => {
  let savedEndpoint;
  let savedFetch;

  beforeEach(() => {
    savedEndpoint = process.env.CITADEL_LLM_ENDPOINT;
    savedFetch = global.fetch;
    process.env.CITADEL_LLM_ENDPOINT = 'http://localhost:11434/v1/chat/completions';
  });

  afterEach(() => {
    if (savedEndpoint === undefined) {
      delete process.env.CITADEL_LLM_ENDPOINT;
    } else {
      process.env.CITADEL_LLM_ENDPOINT = savedEndpoint;
    }
    global.fetch = savedFetch;
  });

  it('returns null when response JSON is garbage (json() throws)', async () => {
    global.fetch = mockFetchBadJson();
    const result = await llmClassify('run archon', SAMPLE_SKILLS);
    assert.equal(result, null);
  });

  it('returns null when choices array is missing', async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({}) });
    const result = await llmClassify('run archon', SAMPLE_SKILLS);
    assert.equal(result, null);
  });

  it('returns null when message content is not a string', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: null } }] }),
    });
    const result = await llmClassify('run archon', SAMPLE_SKILLS);
    assert.equal(result, null);
  });
});

// ── Test: classify() sync still works ────────────────────────────────────────

describe('classify — sync function unaffected by Tier 3 addition', () => {
  it('routes "status" to status at tier 0', () => {
    const r = classify('status', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'status');
  });

  it('routes "review my code" to skill:review at tier 0', () => {
    const r = classify('review my code', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'skill:review');
  });
});

// ── Test: classifyAsync returns Tier 0-2 results without hitting LLM ─────────

describe('classifyAsync — Tier 0-2 bypass LLM', () => {
  let savedEndpoint;
  let savedFetch;

  beforeEach(() => {
    savedEndpoint = process.env.CITADEL_LLM_ENDPOINT;
    savedFetch = global.fetch;
    process.env.CITADEL_LLM_ENDPOINT = 'http://localhost:11434/v1/chat/completions';
  });

  afterEach(() => {
    if (savedEndpoint === undefined) {
      delete process.env.CITADEL_LLM_ENDPOINT;
    } else {
      process.env.CITADEL_LLM_ENDPOINT = savedEndpoint;
    }
    global.fetch = savedFetch;
  });

  it('returns tier 0 match without calling fetch', async () => {
    global.fetch = async () => { throw new Error('fetch must not be called for tier 0 match'); };
    const r = await classifyAsync('debug this', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'skill:systematic-debugging');
  });

  it('returns tier 0 match for "continue" without calling fetch', async () => {
    global.fetch = async () => { throw new Error('fetch must not be called for tier 0 match'); };
    const r = await classifyAsync('continue', PROJECT_ROOT);
    assert.equal(r.tier, 0);
    assert.equal(r.target, 'continue');
  });
});

// ── Test: classifyAsync invokes Tier 3 on no-match ───────────────────────────

describe('classifyAsync — invokes Tier 3 on no-match input', () => {
  let savedEndpoint;
  let savedFetch;

  beforeEach(() => {
    savedEndpoint = process.env.CITADEL_LLM_ENDPOINT;
    savedFetch = global.fetch;
    process.env.CITADEL_LLM_ENDPOINT = 'http://localhost:11434/v1/chat/completions';
  });

  afterEach(() => {
    if (savedEndpoint === undefined) {
      delete process.env.CITADEL_LLM_ENDPOINT;
    } else {
      process.env.CITADEL_LLM_ENDPOINT = savedEndpoint;
    }
    global.fetch = savedFetch;
  });

  it('returns tier 3 result when LLM matches on otherwise unroutable input', async () => {
    // "zymurgist pipeline" has no Tier 0-2 match; mock LLM returns "archon"
    global.fetch = mockFetch('archon');
    const r = await classifyAsync('zymurgist pipeline', PROJECT_ROOT);
    assert.equal(r.tier, 3);
    assert.equal(r.target, 'skill:archon');
  });

  it('returns tier -1 when LLM also returns no match', async () => {
    global.fetch = mockFetch('none');
    const r = await classifyAsync('zymurgist pipeline', PROJECT_ROOT);
    assert.equal(r.tier, -1);
    assert.equal(r.target, null);
  });

  it('returns tier -1 when LLM endpoint errors', async () => {
    global.fetch = mockFetchError(new Error('ECONNREFUSED'));
    const r = await classifyAsync('zymurgist pipeline', PROJECT_ROOT);
    assert.equal(r.tier, -1);
    assert.equal(r.target, null);
  });
});
