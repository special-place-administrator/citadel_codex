# Integration Tests, npm Scripts, and Tier 3 Classifier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add proper integration test coverage for the router, commands, and checks; add npm convenience scripts; implement a Tier 3 LLM classifier fallback for the intent router.

**Architecture:** Three independent workstreams. Tests use Node.js built-in `assert` and `node --test` (Node 18+). npm scripts are trivial package.json additions. The Tier 3 classifier is a new module that plugs into `classify()` as a fallback when Tiers 0-2 return no match.

**Tech Stack:** Node.js built-in test runner, `node:assert`, `node:test`

---

### Task 1: npm Scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add CLI convenience scripts and test runner**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "init": "node runtime/cli.js init",
    "init:state": "node runtime/cli.js init",
    "status": "node runtime/cli.js status",
    "setup": "node runtime/cli.js setup",
    "continue": "node runtime/cli.js continue",
    "route": "node runtime/cli.js route",
    "check:post-edit": "node runtime/checks/post-edit.js",
    "check:quality": "node runtime/checks/quality-gate.js",
    "check:breaker": "node runtime/checks/circuit-breaker.js",
    "test": "node --test tests/**/*.test.js",
    "test:infra": "node --test tests/infra/*.test.js",
    "test:router": "node --test tests/router/*.test.js",
    "test:commands": "node --test tests/commands/*.test.js",
    "test:checks": "node --test tests/checks/*.test.js",
    "coord": "node runtime/scripts/coordination.js",
    "coord:status": "node runtime/scripts/coordination.js status",
    "coord:sweep": "node runtime/scripts/coordination.js sweep",
    "compress:discovery": "node runtime/scripts/compress-discovery.cjs",
    "parse:handoff": "node runtime/scripts/parse-handoff.cjs"
  }
}
```

- [ ] **Step 2: Verify scripts work**

Run: `npm run status`
Expected: Shows Citadel Codex status output.

Run: `npm test`
Expected: Discovers and runs test files (will find existing `tests/infra/skill-discovery.test.js`).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add npm convenience scripts for CLI, checks, and tests"
```

---

### Task 2: Integration Tests — Router

**Files:**
- Create: `tests/router/classify-intent.test.js`

- [ ] **Step 1: Write router integration tests**

Test cases:
1. **Tier 0 pattern matching**: Each built-in command (status, continue, setup, init) and each skill pattern routes correctly
2. **Pattern precedence**: "research fleet" → skill:research-fleet (not skill:research)
3. **Case insensitivity**: "REVIEW my code" matches skill:review
4. **No match**: Random gibberish returns tier -1
5. **Tier 1 active state detection**: Create temp .citadel/campaigns/ with active campaign file, verify it short-circuits
6. **Tier 2 skill registry**: Verify all 23 skills are discoverable from project root
7. **YAML multi-line parsing**: Skills with `>-` descriptions return real text, not `>-`

Use `node:test` and `node:assert`. Create a temp directory with mock .citadel/ state for Tier 1 tests.

- [ ] **Step 2: Run tests**

Run: `node --test tests/router/classify-intent.test.js`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/router/classify-intent.test.js
git commit -m "test: add integration tests for intent router"
```

---

### Task 3: Integration Tests — Commands

**Files:**
- Create: `tests/commands/status.test.js`
- Create: `tests/commands/continue.test.js`

- [ ] **Step 1: Write status command tests**

Test cases:
1. **Empty state**: No campaigns/fleet/intake → shows "(none active)" for each
2. **With active campaign**: Create temp campaign file with `Status: active`, verify it appears in output
3. **With intake items**: Create temp intake .md files, verify count
4. **Skills listing**: Verify all 23 skills listed

Capture console.log output by temporarily replacing it.

- [ ] **Step 2: Write continue command tests**

Test cases:
1. **No active work**: Returns null, logs "No active campaigns"
2. **Active campaign**: Returns `{ type: 'campaign', name: ... }`
3. **Active fleet**: Returns `{ type: 'fleet', name: ... }`
4. **Campaign over fleet**: When both exist, campaign takes priority

- [ ] **Step 3: Run tests**

Run: `node --test tests/commands/*.test.js`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/commands/
git commit -m "test: add integration tests for status and continue commands"
```

---

### Task 4: Integration Tests — Checks

**Files:**
- Create: `tests/checks/circuit-breaker.test.js`
- Create: `tests/checks/quality-gate.test.js`

- [ ] **Step 1: Write circuit-breaker tests**

Test the exported functions directly (readState, writeState, freshState). Test cases:
1. **freshState**: Returns zeroed state object
2. **Write and read round-trip**: Write state to temp file, read it back, verify match
3. **Threshold behavior**: After 3 consecutive failures, trips and resets counter
4. **Lifetime tracking**: Trips accumulate across resets

Note: circuit-breaker.js calls `main()` at module level, so tests need to import the functions before main runs. Refactor: extract the functions as exports OR test via CLI subprocess.

Best approach: Test via subprocess (`execFileSync('node', ['runtime/checks/circuit-breaker.js', '--record-failure', ...])`) with a temp .citadel/ directory.

- [ ] **Step 2: Write quality-gate tests**

Test the rule matching logic. Test cases:
1. **Clean file**: JS file with no violations → exit 0
2. **confirm() violation**: JS file containing `confirm(` → caught
3. **transition-all violation**: CSS file with `transition-all` → caught
4. **Non-matching file type**: Python file is not checked by JS rules

Test via subprocess with temp files and a git repo.

- [ ] **Step 3: Run tests**

Run: `node --test tests/checks/*.test.js`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/checks/
git commit -m "test: add integration tests for circuit-breaker and quality-gate"
```

---

### Task 5: Tier 3 LLM Classifier

**Files:**
- Create: `core/router/llm-classifier.js`
- Modify: `core/router/classify-intent.js` (add Tier 3 fallthrough in `classify()`)
- Create: `tests/router/llm-classifier.test.js`

- [ ] **Step 1: Write the LLM classifier module**

Design:
- Accepts input text and list of available skills (from discoverSkills)
- Constructs a prompt asking the LLM to pick the best skill or return "none"
- Supports configurable endpoint via env vars:
  - `CITADEL_LLM_ENDPOINT` — API URL (e.g., `http://localhost:11434/v1/chat/completions` for Ollama)
  - `CITADEL_LLM_MODEL` — model name (default: configurable)
  - `CITADEL_LLM_API_KEY` — optional API key
- Uses native `fetch()` (Node 18+) — no dependencies
- Returns `{ target, description, confidence }` or null on failure
- 5-second timeout, graceful fallback to null

- [ ] **Step 2: Write tests for LLM classifier**

Test cases (mock fetch, don't call real LLM):
1. **Successful classification**: Mock fetch returns valid JSON → returns target
2. **Timeout/error**: Mock fetch throws → returns null gracefully
3. **No endpoint configured**: Returns null without attempting call
4. **Invalid LLM response**: Mock returns garbage → returns null

- [ ] **Step 3: Wire Tier 3 into classify()**

In `classify-intent.js`, after the Tier 2 block and before the "No match" return:
- Check if `CITADEL_LLM_ENDPOINT` is set
- If yes, call `llmClassify(input, skills)`
- If it returns a result, return it with `tier: 3`
- Since fetch is async, make classify() support both sync (Tiers 0-2) and async (Tier 3)
- Export a new `classifyAsync(input, projectRoot)` that includes Tier 3
- Keep `classify()` synchronous for backward compatibility (Tiers 0-2 only)

- [ ] **Step 4: Run all tests**

Run: `node --test tests/router/*.test.js`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add core/router/llm-classifier.js core/router/classify-intent.js tests/router/llm-classifier.test.js
git commit -m "feat: add Tier 3 LLM classifier fallback for intent routing"
```

---
