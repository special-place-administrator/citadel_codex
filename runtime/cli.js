#!/usr/bin/env node

/**
 * cli.js — Codex-native CLI entrypoint for citadel_codex
 *
 * Usage:
 *   node runtime/cli.js <command> [options]
 *
 * Commands:
 *   init       Create .citadel/ state tree and sync templates
 *   status     Show current orchestration state
 *   continue   Resume active campaign/fleet work
 *   setup      First-time project setup
 *   route      Classify intent and show routing target
 */

const path = require('path');

const COMMANDS = {
  init: runInit,
  status: () => require('./commands/status.js').run(),
  continue: () => require('./commands/continue.js').run(),
  setup: () => require('./commands/setup.js').run(),
  route: runRoute,
};

function runInit() {
  const { initState } = require('./bootstrap/init-state.js');
  const { syncTemplates } = require('./bootstrap/sync-templates.js');

  const root = process.cwd();
  console.log(`Initializing .citadel/ state in ${root} ...`);

  const created = initState(root);
  if (created.length) {
    console.log(`  State: created ${created.length} entries`);
  } else {
    console.log('  State: already exists');
  }

  const synced = syncTemplates(root);
  if (synced.length) {
    console.log(`  Templates: synced ${synced.length} files`);
    for (const s of synced) console.log(`    ${s}`);
  } else {
    console.log('  Templates: all in place');
  }

  console.log('Done.');
}

function runRoute(args) {
  const input = args.join(' ');
  if (!input) {
    console.error('Usage: node runtime/cli.js route "<intent text>"');
    process.exit(1);
  }
  const { classify } = require('../core/router/classify-intent.js');
  const result = classify(input);
  console.log(`Tier ${result.tier}: ${result.target || '(no match)'}`);
  console.log(`  ${result.description}`);
  if (result.confidence < 1) console.log(`  Confidence: ${result.confidence}`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log('Usage: node runtime/cli.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  init      Create .citadel/ state tree and sync templates');
    console.log('  status    Show orchestration state');
    console.log('  continue  Resume active work');
    console.log('  setup     First-time project setup');
    console.log('  route     Classify intent (e.g. route "review my code")');
    process.exit(0);
  }

  const handler = COMMANDS[command];
  if (!handler) {
    console.error(`Unknown command: ${command}`);
    console.error('Run "node runtime/cli.js --help" for available commands.');
    process.exit(1);
  }

  handler(args.slice(1));
}

main();
