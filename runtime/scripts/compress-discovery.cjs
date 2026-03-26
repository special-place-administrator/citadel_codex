#!/usr/bin/env node

/**
 * Compress agent output into a short discovery brief for later waves.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.env.CITADEL_PROJECT_DIR || process.cwd();
const STATE_DIR = path.join(PROJECT_ROOT, '.citadel');
const BRIEFS_DIR = path.join(STATE_DIR, 'fleet', 'briefs');
const STATS_FILE = path.join(STATE_DIR, 'telemetry', 'compression-stats.jsonl');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--input') {
      args.input = value;
      i += 1;
    } else if (key === '--output') {
      args.output = value;
      i += 1;
    } else if (key === '--session') {
      args.session = value;
      i += 1;
    } else if (key === '--agent') {
      args.agent = value;
      i += 1;
    } else if (key === '--wave') {
      args.wave = Number.parseInt(value, 10);
      i += 1;
    } else if (key === '--status') {
      args.status = value;
      i += 1;
    }
  }
  return args;
}

function extractHandoff(text) {
  const match = text.match(/---\s*HANDOFF\s*---\s*\n([\s\S]*?)(?:\n---|$)/i);
  if (!match) return null;
  return match[1].trim().split('\n')
    .map(line => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function extractDecisions(text) {
  const decisions = [];
  for (const line of text.split('\n')) {
    if (/\b(decided|decision|chose|chosen|picked)\b/i.test(line) && line.length < 200) {
      decisions.push(line.replace(/^[-*]\s*/, '').trim());
    }
  }
  return decisions.slice(0, 5);
}

function extractFiles(text) {
  const files = new Set();
  const matches = text.match(/(?:src|lib|app|pages|components|api|test|spec)\/[\w\-./]+\.\w+/g);
  if (!matches) return [];
  for (const match of matches) files.add(match);
  return [...files].slice(0, 10);
}

function extractFailures(text) {
  const failures = [];
  for (const line of text.split('\n')) {
    if (/\b(failed|error|broke|broken|couldn't|cannot|blocked)\b/i.test(line) && line.length < 200) {
      failures.push(line.replace(/^[-*]\s*/, '').trim());
    }
  }
  return failures.slice(0, 3);
}

function compress(rawText, agentName, status) {
  const handoff = extractHandoff(rawText);
  const decisions = extractDecisions(rawText);
  const files = extractFiles(rawText);
  const failures = extractFailures(rawText);

  const lines = [`## Agent: ${agentName || 'unknown'}`];
  lines.push(`**Status:** ${status || (failures.length > 0 ? 'partial' : 'complete')}`);

  if (handoff && handoff.length > 0) {
    lines.push(`**Built:** ${handoff.slice(0, 2).join('. ')}`);
    if (handoff.length > 2) {
      lines.push(`**Remaining:** ${handoff.slice(2).join('; ')}`);
    }
  }

  if (decisions.length > 0) {
    lines.push('**Decisions:**');
    for (const decision of decisions) lines.push(`- ${decision}`);
  }

  if (failures.length > 0) {
    lines.push('**Failures:**');
    for (const failure of failures) lines.push(`- ${failure}`);
  }

  if (files.length > 0) {
    lines.push(`**Files:** ${files.join(', ')}`);
  }

  return lines.join('\n');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const args = parseArgs(process.argv);
  const rawText = args.input ? fs.readFileSync(args.input, 'utf8') : fs.readFileSync(0, 'utf8');
  const brief = compress(rawText, args.agent, args.status);

  try {
    ensureDir(path.dirname(STATS_FILE));
    fs.appendFileSync(STATS_FILE, `${JSON.stringify({
      timestamp: new Date().toISOString(),
      agent: args.agent || 'unknown',
      inputChars: rawText.length,
      outputChars: brief.length,
      ratio: rawText.length > 0 ? (brief.length / rawText.length).toFixed(3) : '0.000',
    })}\n`);
  } catch {
    // Non-critical telemetry failure.
  }

  if (args.output) {
    ensureDir(path.dirname(args.output));
    fs.writeFileSync(args.output, brief);
    console.log(`Brief written to ${args.output} (${brief.length} chars)`);
    return;
  }

  ensureDir(BRIEFS_DIR);
  process.stdout.write(brief);
}

main();
