#!/usr/bin/env node

/**
 * circuit-breaker.js — Failure-loop detection
 *
 * Codex-native replacement for the Claude PostToolUseFailure hook.
 * Tracks consecutive failures and suggests strategy changes.
 *
 * Usage:
 *   node runtime/checks/circuit-breaker.js --record-failure [--tool <name>] [--error <msg>]
 *   node runtime/checks/circuit-breaker.js --reset
 *   node runtime/checks/circuit-breaker.js --status
 *
 * State stored in: .citadel/telemetry/circuit-breaker.json
 *
 * Exit codes:
 *   0 = recorded / status shown
 *   1 = threshold tripped (caller should change approach)
 */

const fs = require('fs');
const path = require('path');

const THRESHOLD = 3;
const HARD_ESCALATION = 5;

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const stateFile = resolveStateFile();

  if (args.includes('--reset')) {
    writeState(stateFile, freshState());
    console.log('[circuit-breaker] State reset.');
    process.exit(0);
  }

  if (args.includes('--status')) {
    const state = readState(stateFile);
    console.log(`[circuit-breaker] Consecutive failures: ${state.consecutiveFailures}`);
    console.log(`  Lifetime trips: ${state.lifetimeTrips}`);
    if (state.lastFailedTool) console.log(`  Last failed tool: ${state.lastFailedTool}`);
    if (state.lastError) console.log(`  Last error: ${state.lastError}`);
    process.exit(0);
  }

  if (args.includes('--record-failure')) {
    const toolIdx = args.indexOf('--tool');
    const errorIdx = args.indexOf('--error');
    const toolName = (toolIdx !== -1 && args[toolIdx + 1]) ? args[toolIdx + 1] : 'unknown';
    const errorMsg = (errorIdx !== -1 && args[errorIdx + 1]) ? args[errorIdx + 1].slice(0, 200) : null;

    const state = readState(stateFile);
    state.consecutiveFailures += 1;
    state.lastFailedTool = toolName;
    state.lastFailureTime = new Date().toISOString();
    state.lastError = errorMsg;

    if (state.consecutiveFailures >= THRESHOLD) {
      state.lifetimeTrips += 1;
      const trips = state.lifetimeTrips;

      // Reset consecutive counter, keep lifetime
      state.consecutiveFailures = 0;
      state.lastFailedTool = null;
      state.lastError = null;
      writeState(stateFile, state);

      console.log(`[circuit-breaker] ${THRESHOLD} consecutive failures (trip #${trips}).`);
      if (toolName !== 'unknown') console.log(`  Last failed tool: ${toolName}`);
      if (errorMsg) console.log(`  Last error: ${errorMsg}`);

      if (trips >= HARD_ESCALATION) {
        console.log(`\nWARNING: ${trips} trips this session. You are stuck in a failure loop.`);
        console.log('STOP trying variations of the same approach. Step back and:');
        console.log('  - Re-read the relevant files from scratch');
        console.log('  - Consider whether the approach is fundamentally wrong');
        console.log('  - Try a completely different strategy');
      } else {
        console.log('\nConsider a different approach:');
        console.log('  - If editing: re-read the file first, the content may have changed');
        console.log('  - If running commands: check if a prerequisite step was missed');
        console.log('  - If searching: try broader/narrower patterns');
        console.log('  - If the same action keeps failing: try an alternative tool');
      }

      process.exit(1);
    }

    writeState(stateFile, state);
    process.exit(0);
  }

  console.error('Usage: node circuit-breaker.js --record-failure | --reset | --status');
  process.exit(1);
}

// ── State ────────────────────────────────────────────────────────────────────

function freshState() {
  return { consecutiveFailures: 0, lifetimeTrips: 0, lastFailedTool: null, lastFailureTime: null, lastError: null };
}

function readState(stateFile) {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return freshState();
  }
}

function writeState(stateFile, state) {
  const dir = path.dirname(stateFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = stateFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, stateFile);
}

function resolveStateFile() {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.citadel'))) {
      return path.join(dir, '.citadel', 'telemetry', 'circuit-breaker.json');
    }
    dir = path.dirname(dir);
  }
  return path.join(process.cwd(), '.citadel', 'telemetry', 'circuit-breaker.json');
}

main();
