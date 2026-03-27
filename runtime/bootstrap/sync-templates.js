#!/usr/bin/env node

/**
 * sync-templates.js — Ensure tracked templates are present
 *
 * Copies templates from .citadel/templates/ into the corresponding
 * state directories when they are missing. Idempotent — never
 * overwrites an existing file at the destination.
 *
 * No Claude plugin, hook, or env assumptions.
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_MAP = [
  // [source relative to .citadel/templates/, destination relative to .citadel/]
  ['intake-item.md', 'intake/_TEMPLATE.md'],
];

function syncTemplates(projectRoot) {
  const root = projectRoot || process.cwd();
  const templatesDir = path.join(root, '.citadel', 'templates');
  const citadelDir = path.join(root, '.citadel');
  const synced = [];

  if (!fs.existsSync(templatesDir)) {
    console.log('No .citadel/templates/ directory — nothing to sync.');
    return synced;
  }

  for (const [src, dest] of TEMPLATE_MAP) {
    const srcPath = path.join(templatesDir, src);
    const destPath = path.join(citadelDir, dest);

    if (!fs.existsSync(srcPath)) continue;
    if (fs.existsSync(destPath)) continue;

    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(srcPath, destPath);
    synced.push(`${src} → ${dest}`);
  }

  return synced;
}

module.exports = { syncTemplates, TEMPLATE_MAP };

if (require.main === module) {
  const synced = syncTemplates();
  if (synced.length) {
    console.log('Synced templates:', synced.join(', '));
  } else {
    console.log('All templates already in place.');
  }
}
