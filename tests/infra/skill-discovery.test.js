#!/usr/bin/env node
const path = require('path');
const { discoverSkills } = require('../../core/router/classify-intent.js');

const skills = discoverSkills(path.resolve(__dirname, '../..'));
let failures = 0;

for (const s of skills) {
  if (s.description === '>-' || s.description === '>' || s.description === '|') {
    console.log(`FAIL: ${s.dir} — description is "${s.description}" (YAML artifact)`);
    failures++;
  } else if (!s.description || s.description.length < 5) {
    console.log(`WARN: ${s.dir} — description too short: "${s.description}"`);
  } else {
    console.log(`OK:   ${s.dir} — "${s.description.slice(0, 60)}"`);
  }
}

process.exit(failures > 0 ? 1 : 0);
