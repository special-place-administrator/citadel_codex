#!/usr/bin/env node

/**
 * init-state.js — Create the .citadel/ directory tree
 *
 * Idempotent — skips existing directories.
 * No Claude hook, plugin, or env assumptions.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIRS = [
  '.citadel',
  '.citadel/campaigns',
  '.citadel/campaigns/completed',
  '.citadel/coordination',
  '.citadel/coordination/instances',
  '.citadel/coordination/claims',
  '.citadel/fleet',
  '.citadel/fleet/briefs',
  '.citadel/fleet/outputs',
  '.citadel/intake',
  '.citadel/postmortems',
  '.citadel/research',
  '.citadel/screenshots',
  '.citadel/telemetry',
];

function initState(projectRoot) {
  const root = projectRoot || process.cwd();
  const created = [];

  for (const dir of STATE_DIRS) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
      created.push(dir);
    }
  }

  // Drop .gitkeep into empty leaf dirs so git tracks them
  for (const dir of STATE_DIRS) {
    const full = path.join(root, dir);
    const entries = fs.readdirSync(full);
    const gitkeep = path.join(full, '.gitkeep');
    if (entries.length === 0 && !fs.existsSync(gitkeep)) {
      fs.writeFileSync(gitkeep, '');
      created.push(dir + '/.gitkeep');
    }
  }

  return created;
}

module.exports = { initState, STATE_DIRS };

if (require.main === module) {
  const created = initState();
  if (created.length) {
    console.log('Created:', created.join(', '));
  } else {
    console.log('.citadel/ state tree already exists.');
  }
}
