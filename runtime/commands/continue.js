#!/usr/bin/env node

/**
 * continue.js — Resume the most recent active campaign or fleet session
 *
 * Usage: node runtime/cli.js continue
 *        node runtime/commands/continue.js
 */

const fs = require('fs');
const path = require('path');
const { detectActiveState } = require('../../core/router/classify-intent.js');

function run(projectRoot) {
  const root = projectRoot || process.cwd();
  const active = detectActiveState(root);

  if (active.campaigns.length === 0 && active.fleet.length === 0) {
    console.log('No active campaigns or fleet sessions to continue.');
    console.log('Run "node runtime/cli.js status" to see current state.');
    return null;
  }

  // Prefer campaigns over fleet
  if (active.campaigns.length > 0) {
    const campaign = active.campaigns[0];
    const campaignFile = path.join(root, '.citadel', 'campaigns', campaign + '.md');
    const content = safeRead(campaignFile);

    console.log(`=== Resuming Campaign: ${campaign} ===\n`);

    // Extract current phase and direction
    const phase = content.match(/Phase:\s*(.+)/i);
    const direction = content.match(/Direction:\s*(.+)/i);

    if (phase) console.log(`Current phase: ${phase[1].trim()}`);
    if (direction) console.log(`Direction: ${direction[1].trim()}`);

    console.log(`\nCampaign file: .citadel/campaigns/${campaign}.md`);
    return { type: 'campaign', name: campaign, file: campaignFile };
  }

  if (active.fleet.length > 0) {
    const session = active.fleet[0];
    const sessionFile = path.join(root, '.citadel', 'fleet', 'briefs', session + '.md');

    console.log(`=== Resuming Fleet Session: ${session} ===\n`);
    console.log(`Session file: .citadel/fleet/briefs/${session}.md`);
    return { type: 'fleet', name: session, file: sessionFile };
  }

  return null;
}

function safeRead(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

module.exports = { run };

if (require.main === module) {
  run();
}
