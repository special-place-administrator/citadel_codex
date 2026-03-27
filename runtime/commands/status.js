#!/usr/bin/env node

/**
 * status.js — Show current orchestration state
 *
 * Usage: node runtime/cli.js status
 *        node runtime/commands/status.js
 */

const fs = require('fs');
const path = require('path');
const { detectActiveState, discoverSkills } = require('../../core/router/classify-intent.js');

function run(projectRoot) {
  const root = projectRoot || process.cwd();
  const active = detectActiveState(root);
  const skills = discoverSkills(root);
  const intake = countIntake(root);

  console.log('=== Citadel Codex Status ===\n');

  // Campaigns
  console.log('Campaigns:');
  if (active.campaigns.length > 0) {
    for (const c of active.campaigns) {
      const content = safeRead(path.join(root, '.citadel', 'campaigns', c + '.md'));
      const phase = content.match(/Phase:\s*(.+)/i);
      console.log(`  ${c}: active${phase ? ' — ' + phase[1].trim() : ''}`);
    }
  } else {
    console.log('  (none active)');
  }

  // Fleet
  console.log('\nFleet Sessions:');
  if (active.fleet.length > 0) {
    for (const f of active.fleet) {
      console.log(`  ${f}: active`);
    }
  } else {
    console.log('  (none active)');
  }

  // Intake
  console.log('\nIntake:');
  if (intake > 0) {
    console.log(`  ${intake} pending item(s) in .citadel/intake/`);
  } else {
    console.log('  (empty)');
  }

  // Skills
  console.log(`\nSkills: ${skills.length} installed`);
  for (const s of skills) {
    console.log(`  ${s.dir.padEnd(25)} ${s.description.slice(0, 50)}`);
  }

  // Coordination
  const claims = countDir(path.join(root, '.citadel', 'coordination', 'claims'));
  const instances = countDir(path.join(root, '.citadel', 'coordination', 'instances'));
  if (claims > 0 || instances > 0) {
    console.log(`\nCoordination: ${claims} claim(s), ${instances} instance(s)`);
  }

  console.log('');
}

function countIntake(root) {
  const dir = path.join(root, '.citadel', 'intake');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_')).length;
}

function countDir(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

function safeRead(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

module.exports = { run };

if (require.main === module) {
  run();
}
