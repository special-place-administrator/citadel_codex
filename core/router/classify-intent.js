#!/usr/bin/env node

/**
 * classify-intent.js — Minimum viable intent router
 *
 * Classifies user input into a routing target using keyword matching
 * and active state detection. Codex-native — no Claude slash commands,
 * plugin lifecycle, or harness.json dependency.
 *
 * Routing tiers (cheapest first):
 *   Tier 0: Pattern match on raw input (keywords, regex)
 *   Tier 1: Active state short-circuit (campaigns, fleet)
 *   Tier 2: Skill keyword match from skills/
 */

const fs = require('fs');
const path = require('path');

// ── Tier 0: Pattern Match ────────────────────────────────────────────────────

const PATTERN_ROUTES = [
  { patterns: [/\bstatus\b/i], target: 'status', description: 'Show active orchestration state' },
  { patterns: [/\bcontinue\b/i, /\bkeep going\b/i, /\bresume\b/i], target: 'continue', description: 'Resume active work' },
  { patterns: [/\bsetup\b/i, /\bfirst.?run\b/i, /\bconfigure\b/i], target: 'setup', description: 'First-time project setup' },
  { patterns: [/\binit\b/i, /\bbootstrap\b/i], target: 'init', description: 'Initialize state tree' },
  { patterns: [/\breview\b/i, /\bcode review\b/i], target: 'skill:review', description: 'Code review' },
  { patterns: [/\bresearch\b/i, /\binvestigate\b/i, /\blook into\b/i], target: 'skill:research', description: 'Research investigation' },
  { patterns: [/\bscaffold\b/i, /\bnew module\b/i, /\bnew component\b/i], target: 'skill:scaffold', description: 'Scaffolding' },
  { patterns: [/\barchitect\b/i, /\barchitecture\b/i], target: 'skill:architect', description: 'Architecture design' },
  { patterns: [/\bprd\b/i, /\brequirements\b/i, /\bspec\b/i], target: 'skill:prd', description: 'Product requirements' },
  { patterns: [/\bdebug\b/i, /\broot cause\b/i, /\bdiagnose\b/i], target: 'skill:systematic-debugging', description: 'Root cause analysis' },
  { patterns: [/\bhandoff\b/i, /\bsession summary\b/i], target: 'skill:session-handoff', description: 'Session handoff' },
  { patterns: [/\bcampaign\b/i, /\bmulti.?session\b/i, /\bphases\b/i], target: 'skill:archon', description: 'Campaign orchestration' },
  { patterns: [/\bfleet\b/i, /\bparallel\b/i, /\bmultiple agents\b/i], target: 'skill:fleet', description: 'Fleet orchestration' },
  // Phase 1 skills
  { patterns: [/\bmarshal\b/i, /\borchestrate\b/i, /\bchain skills\b/i, /\bmulti.?step\b/i], target: 'skill:marshal', description: 'Single-session orchestration' },
  { patterns: [/\bdocument\b/i, /\bdocs?\b/i, /\bdocstring\b/i, /\breadme\b/i], target: 'skill:doc-gen', description: 'Documentation generation' },
  { patterns: [/\brefactor\b/i, /\brename\b/i, /\bextract\b/i, /\bsplit file\b/i], target: 'skill:refactor', description: 'Safe multi-file refactoring' },
  { patterns: [/\btest.?gen\b/i, /\bgenerate tests\b/i, /\bwrite tests\b/i], target: 'skill:test-gen', description: 'Test generation' },
  { patterns: [/\bdesign manifest\b/i, /\bstyle guide\b/i, /\bvisual consistency\b/i], target: 'skill:design', description: 'Design manifest generation' },
  // Phase 2 skills
  { patterns: [/\bcreate skill\b/i, /\bnew skill\b/i, /\brepeated pattern\b/i], target: 'skill:create-skill', description: 'Create skill from pattern' },
  { patterns: [/\btriage\b/i, /\bprioritize\b/i, /\bclassify issues\b/i], target: 'skill:triage', description: 'Issue triage and prioritization' },
  { patterns: [/\bexperiment\b/i, /\boptimize\b/i, /\bA\/B\b/i, /\bmeasure\b/i], target: 'skill:experiment', description: 'Metric-driven optimization' },
];

// ── Tier 1: Active State Detection ───────────────────────────────────────────

function detectActiveState(projectRoot) {
  const active = { campaigns: [], fleet: [] };

  // Scan campaigns
  const campaignsDir = path.join(projectRoot, '.citadel', 'campaigns');
  if (fs.existsSync(campaignsDir)) {
    for (const file of safeReaddir(campaignsDir)) {
      if (!file.endsWith('.md')) continue;
      const content = safeRead(path.join(campaignsDir, file));
      if (/Status:\s*active/i.test(content)) {
        active.campaigns.push(file.replace('.md', ''));
      }
    }
  }

  // Scan fleet sessions
  const fleetDir = path.join(projectRoot, '.citadel', 'fleet', 'briefs');
  if (fs.existsSync(fleetDir)) {
    for (const file of safeReaddir(fleetDir)) {
      if (!file.endsWith('.md') && !file.endsWith('.json')) continue;
      const content = safeRead(path.join(fleetDir, file));
      if (/status:\s*(active|needs-continue)/i.test(content)) {
        active.fleet.push(file.replace(/\.(md|json)$/, ''));
      }
    }
  }

  return active;
}

// ── Tier 2: Skill Registry ──────────────────────────────────────────────────

function discoverSkills(projectRoot) {
  const skillsDir = path.join(projectRoot, 'skills');
  if (!fs.existsSync(skillsDir)) return [];

  const skills = [];
  for (const dir of safeReaddir(skillsDir)) {
    const skillFile = path.join(skillsDir, dir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    const content = safeRead(skillFile);
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    let description = '';
    const descMatch = content.match(/^description:\s*(.+)$/m);
    if (descMatch) {
      const raw = descMatch[1].trim();
      if (/^[>|]-?$/.test(raw)) {
        // YAML multi-line: grab the indented lines that follow
        const descIdx = content.indexOf(descMatch[0]);
        const after = content.slice(descIdx + descMatch[0].length);
        const lines = after.split('\n');
        const descLines = [];
        for (const line of lines) {
          if (/^\s+\S/.test(line)) {
            descLines.push(line.trim());
          } else if (line.trim() === '') {
            continue;
          } else {
            break;
          }
        }
        description = descLines.join(' ');
      } else {
        description = raw;
      }
    }

    skills.push({
      name: nameMatch ? nameMatch[1].trim() : dir,
      dir,
      description,
    });
  }

  return skills;
}

// ── Classify ─────────────────────────────────────────────────────────────────

function classify(input, projectRoot) {
  const root = projectRoot || process.cwd();

  // Tier 0: Pattern match
  for (const route of PATTERN_ROUTES) {
    for (const pattern of route.patterns) {
      if (pattern.test(input)) {
        return { tier: 0, target: route.target, description: route.description, confidence: 1.0 };
      }
    }
  }

  // Tier 1: Active state
  const active = detectActiveState(root);
  if (active.campaigns.length > 0) {
    return {
      tier: 1,
      target: 'continue',
      description: `Active campaign: ${active.campaigns[0]}`,
      confidence: 0.8,
      context: { campaign: active.campaigns[0] },
    };
  }
  if (active.fleet.length > 0) {
    return {
      tier: 1,
      target: 'continue',
      description: `Active fleet session: ${active.fleet[0]}`,
      confidence: 0.8,
      context: { fleet: active.fleet[0] },
    };
  }

  // Tier 2: Skill keyword match
  const skills = discoverSkills(root);
  const inputLower = input.toLowerCase();
  for (const skill of skills) {
    if (inputLower.includes(skill.name) || inputLower.includes(skill.dir)) {
      return {
        tier: 2,
        target: `skill:${skill.dir}`,
        description: skill.description || skill.name,
        confidence: 0.7,
      };
    }
  }

  // No match
  return { tier: -1, target: null, description: 'No routing match', confidence: 0 };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeReaddir(dir) {
  try { return fs.readdirSync(dir); } catch { return []; }
}

function safeRead(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

module.exports = { classify, detectActiveState, discoverSkills, PATTERN_ROUTES };

if (require.main === module) {
  const input = process.argv.slice(2).join(' ');
  if (!input) {
    console.log('Usage: node classify-intent.js <intent text>');
    process.exit(0);
  }
  const result = classify(input);
  console.log(JSON.stringify(result, null, 2));
}
