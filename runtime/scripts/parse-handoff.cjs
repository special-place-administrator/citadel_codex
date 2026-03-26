#!/usr/bin/env node

const fs = require('fs');

function parseHandoff(text) {
  const match = text.match(/---\s*HANDOFF\s*---\s*\n([\s\S]*?)(?:\n---|\Z)/i);
  if (!match) {
    return { found: false, items: [], raw: '' };
  }

  const raw = match[1].trim();
  const items = raw.split('\n')
    .map(line => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);

  return { found: true, items, raw };
}

function main() {
  const args = process.argv.slice(2);
  let inputFile = null;

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--input' && args[i + 1]) {
      inputFile = args[i + 1];
      i += 1;
    }
  }

  const text = inputFile ? fs.readFileSync(inputFile, 'utf8') : fs.readFileSync(0, 'utf8');
  process.stdout.write(JSON.stringify(parseHandoff(text), null, 2));
}

main();
