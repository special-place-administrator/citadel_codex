# Codex Remaining Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port all remaining upstream Citadel skills (15), agent configs (4), fix infrastructure issues, and produce final documentation so citadel_codex is a complete Codex-native equivalent.

**Architecture:** Work in dependency order across 7 phases. Phase 0 fixes infrastructure that affects all later work. Phases 1-4 port skills from zero-dependency to highest-dependency. Phase 5 ports agent configs. Phase 6 produces final docs. Each skill port follows the same pattern: read upstream, strip Claude refs, rewrite `.planning/` to `.citadel/`, verify discovery + routing.

**Tech Stack:** Markdown, Node.js built-ins, git

---

## Dependency Graph

```
Phase 0 (Infrastructure)
    │
    ├── Phase 1 (Standalone skills: marshal, doc-gen, refactor, test-gen, design)
    │       │
    │       ├── Phase 2 (Tier-1 deps: create-skill, triage, experiment)
    │       │       │
    │       │       ├── Phase 3 (Tier-2 deps: create-app, research-fleet, autopilot, postmortem)
    │       │       │       │
    │       │       │       └── Phase 4 (Browser-dependent: live-preview, qa)
    │       │       │
    │       │       └───────────┘
    │       │
    │       └───────────────────┘
    │
    └── Phase 5 (Agent configs — independent of skill phases)
            │
            └── Phase 6 (Final docs: QUICKSTART.md, docs/SKILLS.md)
```

Phase 5 can run in parallel with Phases 2-4.
Phase 6 depends on all prior phases.

---

## Phase 0: Infrastructure Fixes

### Task 0.1: Fix YAML multi-line description parsing in skill discovery

The `discoverSkills()` function in `core/router/classify-intent.js` uses `^description:\s*(.+)$` which captures `>-` from YAML multi-line syntax instead of the actual text. This causes `status` output to show `>-` for most skill descriptions.

**Files:**
- Modify: `core/router/classify-intent.js` (function `discoverSkills`, lines 71-92)
- Modify: `runtime/commands/status.js` (no code change needed if fix is in router)

- [ ] **Step 1: Write a test script to verify current broken behavior**

Create `tests/infra/skill-discovery.test.js`:

```javascript
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
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `node tests/infra/skill-discovery.test.js`
Expected: Multiple `FAIL` lines showing `>-` as description.

- [ ] **Step 3: Fix the `discoverSkills` function**

In `core/router/classify-intent.js`, replace the `discoverSkills` function body. The fix: when the description regex captures a YAML multi-line indicator (`>-`, `>`, `|`, `|-`), read the next non-empty line as the actual description instead.

Replace the description extraction block:

```javascript
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const descMatch = content.match(/^description:\s*(.+)$/m);

    skills.push({
      name: nameMatch ? nameMatch[1].trim() : dir,
      dir,
      description: descMatch ? descMatch[1].trim() : '',
    });
```

With:

```javascript
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node tests/infra/skill-discovery.test.js`
Expected: All `OK` lines, no `FAIL`.

- [ ] **Step 5: Verify status output**

Run: `node runtime/cli.js status`
Expected: All skill descriptions show real text, not `>-`.

- [ ] **Step 6: Commit**

```bash
git add core/router/classify-intent.js tests/infra/skill-discovery.test.js
git commit -m "fix: parse YAML multi-line descriptions in skill discovery"
```

### Task 0.2: Add .gitattributes for line ending normalization

**Files:**
- Create: `.gitattributes`

- [ ] **Step 1: Create .gitattributes**

```
# Normalize line endings
* text=auto

# Force LF for scripts and source
*.js text eol=lf
*.cjs text eol=lf
*.md text eol=lf
*.json text eol=lf
*.ps1 text eol=crlf
```

- [ ] **Step 2: Commit**

```bash
git add .gitattributes
git commit -m "chore: add .gitattributes for line ending normalization"
```

---

## Phase 1: Standalone Skills (no dependencies on other unported skills)

All skills in this phase are self-contained — they don't reference other unported skills. The porting pattern is identical for each:

1. Read upstream `C:\Users\rakovnik\Citadel\skills\{name}\SKILL.md`
2. Replace `.planning/` with `.citadel/`
3. Remove `/do`, `.claude/`, `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT` references
4. Replace slash command references (`/marshal`, `/archon`, etc.) with neutral phrasing
5. Write to `skills/{name}/SKILL.md`
6. Verify: `node tests/infra/skill-discovery.test.js` passes, `node runtime/cli.js route "{keyword}"` matches

### Task 1.1: Port marshal skill

**Files:**
- Create: `skills/marshal/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\marshal\SKILL.md` (153 lines, 0 Claude refs)

- [ ] **Step 1: Read upstream skill**

Read `C:\Users\rakovnik\Citadel\skills\marshal\SKILL.md`.

- [ ] **Step 2: Port to Codex-native**

Write `skills/marshal/SKILL.md` with:
- `>-` descriptions work (multi-line YAML) — will be parsed correctly after Task 0.1
- Replace any `.planning/` paths with `.citadel/`
- Replace `/do` references with `node runtime/cli.js` equivalents
- Replace `/archon`, `/fleet` with "archon skill", "fleet skill" phrasing
- Keep frontmatter: `name`, `description`, `user-invocable: true`, `trigger_keywords`
- Add trigger keywords: `marshal`, `orchestrate`, `chain skills`, `multi-step`

- [ ] **Step 3: Verify discovery**

Run: `node runtime/cli.js route "orchestrate a multi-step refactoring"`
Expected: Routes to `skill:marshal`.

- [ ] **Step 4: Verify no Claude refs**

Run: `grep -E 'CLAUDE_PROJECT_DIR|CLAUDE_PLUGIN_ROOT|\.claude/' skills/marshal/SKILL.md`
Expected: No matches.

- [ ] **Step 5: Commit**

```bash
git add skills/marshal/SKILL.md
git commit -m "feat: port marshal skill (single-session orchestrator)"
```

### Task 1.2: Port doc-gen skill

**Files:**
- Create: `skills/doc-gen/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\doc-gen\SKILL.md` (243 lines, 0 Claude refs)

- [ ] **Step 1: Read upstream and port**

Same porting pattern as Task 1.1. Key adaptations:
- Replace `.planning/` → `.citadel/`
- Add trigger keywords: `document`, `docs`, `docstring`, `readme`, `doc-gen`

- [ ] **Step 2: Verify discovery**

Run: `node runtime/cli.js route "generate documentation for this module"`
Expected: Routes to `skill:doc-gen`.

- [ ] **Step 3: Verify no Claude refs and commit**

```bash
grep -E 'CLAUDE_|\.claude/' skills/doc-gen/SKILL.md  # expect no matches
git add skills/doc-gen/SKILL.md
git commit -m "feat: port doc-gen skill (documentation generator)"
```

### Task 1.3: Port refactor skill

**Files:**
- Create: `skills/refactor/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\refactor\SKILL.md` (291 lines, 0 Claude refs)

- [ ] **Step 1: Read upstream and port**

Same porting pattern. Add trigger keywords: `refactor`, `rename`, `extract`, `split file`.

- [ ] **Step 2: Verify discovery and commit**

```bash
node runtime/cli.js route "refactor this module into smaller files"
grep -E 'CLAUDE_|\.claude/' skills/refactor/SKILL.md
git add skills/refactor/SKILL.md
git commit -m "feat: port refactor skill (safe multi-file refactoring)"
```

### Task 1.4: Port test-gen skill

**Files:**
- Create: `skills/test-gen/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\test-gen\SKILL.md` (169 lines, 0 Claude refs)

- [ ] **Step 1: Read upstream and port**

Same porting pattern. Add trigger keywords: `test`, `generate tests`, `write tests`, `test-gen`.

- [ ] **Step 2: Verify discovery and commit**

```bash
node runtime/cli.js route "generate tests for the router"
grep -E 'CLAUDE_|\.claude/' skills/test-gen/SKILL.md
git add skills/test-gen/SKILL.md
git commit -m "feat: port test-gen skill (test generation)"
```

### Task 1.5: Port design skill

**Files:**
- Create: `skills/design/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\design\SKILL.md` (172 lines, 1 Claude ref, 2 .planning refs)

- [ ] **Step 1: Read upstream and port**

Same porting pattern. Additional adaptations needed:
- Replace 1 Claude reference
- Replace 2 `.planning/` references with `.citadel/`
- Add trigger keywords: `design`, `style guide`, `design manifest`, `visual consistency`

- [ ] **Step 2: Verify discovery and commit**

```bash
node runtime/cli.js route "create a design manifest"
grep -E 'CLAUDE_|\.claude/|\.planning/' skills/design/SKILL.md
git add skills/design/SKILL.md
git commit -m "feat: port design skill (design manifest generator)"
```

### Task 1.6: Update router with new Tier 0 patterns

After porting 5 new skills, add their keywords to the `PATTERN_ROUTES` array in the router so Tier 0 matching works immediately.

**Files:**
- Modify: `core/router/classify-intent.js` (PATTERN_ROUTES array)

- [ ] **Step 1: Add new pattern routes**

Add to the `PATTERN_ROUTES` array:

```javascript
  { patterns: [/\bmarshal\b/i, /\borchestrate\b/i, /\bchain skills\b/i, /\bmulti.?step\b/i], target: 'skill:marshal', description: 'Single-session orchestration' },
  { patterns: [/\bdocument\b/i, /\bdocs?\b/i, /\bdocstring\b/i, /\breadme\b/i], target: 'skill:doc-gen', description: 'Documentation generation' },
  { patterns: [/\brefactor\b/i, /\brename\b/i, /\bextract\b/i, /\bsplit file\b/i], target: 'skill:refactor', description: 'Safe multi-file refactoring' },
  { patterns: [/\btest.?gen\b/i, /\bgenerate tests\b/i, /\bwrite tests\b/i], target: 'skill:test-gen', description: 'Test generation' },
  { patterns: [/\bdesign manifest\b/i, /\bstyle guide\b/i, /\bvisual consistency\b/i], target: 'skill:design', description: 'Design manifest generation' },
```

- [ ] **Step 2: Verify routing for each new skill**

Run:
```bash
node runtime/cli.js route "orchestrate a refactoring"
node runtime/cli.js route "generate docs for this"
node runtime/cli.js route "refactor the auth module"
node runtime/cli.js route "generate tests for auth"
node runtime/cli.js route "create a design manifest"
```

All should route to the correct skill.

- [ ] **Step 3: Commit**

```bash
git add core/router/classify-intent.js
git commit -m "feat: add Tier 0 routing patterns for phase 1 skills"
```

---

## Phase 2: Tier-1 Dependency Skills

These skills reference already-ported skills or depend on Phase 1 skills.

### Task 2.1: Port create-skill skill

**Files:**
- Create: `skills/create-skill/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\create-skill\SKILL.md` (345 lines, 11 Claude refs)

This is the highest-adaptation skill. It has 11 Claude-specific references.

- [ ] **Step 1: Read upstream skill**

Read the full upstream file. Identify all Claude references:
- `.claude/skills/` directory references → replace with `skills/`
- `/do` references → replace with `node runtime/cli.js`
- `CLAUDE_PLUGIN_ROOT` → remove
- Skill registration in `harness.json` → replace with `skills/` directory convention
- Hook-based auto-trigger → replace with manual invocation docs

- [ ] **Step 2: Port with full adaptation**

Write `skills/create-skill/SKILL.md`. Key changes:
- Skill output directory: `skills/{name}/SKILL.md` (not `.claude/skills/`)
- Registration: place in `skills/` dir and it's auto-discovered
- No harness.json update needed
- Add trigger keywords: `create skill`, `new skill`, `repeated pattern`, `extract pattern`

- [ ] **Step 3: Verify no Claude refs**

```bash
grep -cE 'CLAUDE_|\.claude/' skills/create-skill/SKILL.md  # expect 0
```

- [ ] **Step 4: Commit**

```bash
git add skills/create-skill/SKILL.md
git commit -m "feat: port create-skill (skill creation from patterns)"
```

### Task 2.2: Port triage skill

**Files:**
- Create: `skills/triage/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\triage\SKILL.md` (363 lines, 3 Claude refs, 1 .planning ref)

- [ ] **Step 1: Read upstream and port**

Adaptations:
- Replace 3 Claude references
- Replace `.planning/` → `.citadel/`
- Replace `/do` routing references
- Add trigger keywords: `triage`, `prioritize`, `assess`, `classify issues`

- [ ] **Step 2: Verify and commit**

```bash
grep -cE 'CLAUDE_|\.claude/|\.planning/' skills/triage/SKILL.md
git add skills/triage/SKILL.md
git commit -m "feat: port triage skill (issue classification and prioritization)"
```

### Task 2.3: Port experiment skill

**Files:**
- Create: `skills/experiment/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\experiment\SKILL.md` (130 lines, 0 Claude refs, 3 .planning refs)

- [ ] **Step 1: Read upstream and port**

Adaptations:
- Replace 3 `.planning/` → `.citadel/` references
- Add trigger keywords: `experiment`, `optimize`, `A/B`, `measure`, `try`

- [ ] **Step 2: Verify and commit**

```bash
grep -cE '\.planning/' skills/experiment/SKILL.md
git add skills/experiment/SKILL.md
git commit -m "feat: port experiment skill (metric-driven optimization)"
```

### Task 2.4: Update router with Phase 2 patterns

**Files:**
- Modify: `core/router/classify-intent.js`

- [ ] **Step 1: Add Phase 2 Tier 0 patterns**

```javascript
  { patterns: [/\bcreate skill\b/i, /\bnew skill\b/i, /\brepeated pattern\b/i], target: 'skill:create-skill', description: 'Create skill from pattern' },
  { patterns: [/\btriage\b/i, /\bprioritize\b/i, /\bclassify issues\b/i], target: 'skill:triage', description: 'Issue triage and prioritization' },
  { patterns: [/\bexperiment\b/i, /\boptimize\b/i, /\bA\/B\b/i, /\bmeasure\b/i], target: 'skill:experiment', description: 'Metric-driven optimization' },
```

- [ ] **Step 2: Verify routing and commit**

```bash
node runtime/cli.js route "create a new skill from this pattern"
node runtime/cli.js route "triage these issues"
node runtime/cli.js route "experiment with different approaches"
git add core/router/classify-intent.js
git commit -m "feat: add Tier 0 routing for phase 2 skills"
```

---

## Phase 3: Tier-2 Dependency Skills

These depend on skills ported in Phases 1-2.

### Task 3.1: Port create-app skill

**Files:**
- Create: `skills/create-app/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\create-app\SKILL.md` (200 lines, 0 Claude refs, 2 .planning refs)

Depends on: prd (ported), architect (ported), marshal (Phase 1), archon (already ported).

- [ ] **Step 1: Read upstream and port**

Adaptations:
- Replace `.planning/` → `.citadel/`
- Replace `/prd`, `/architect`, `/archon` → "prd skill", "architect skill", etc.
- Add trigger keywords: `create app`, `build app`, `new app`, `generate app`

- [ ] **Step 2: Verify and commit**

```bash
grep -cE 'CLAUDE_|\.claude/|\.planning/' skills/create-app/SKILL.md
git add skills/create-app/SKILL.md
git commit -m "feat: port create-app skill (end-to-end app creation)"
```

### Task 3.2: Port research-fleet skill

**Files:**
- Create: `skills/research-fleet/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\research-fleet\SKILL.md` (182 lines, 0 Claude refs, 4 .planning refs)

Depends on: fleet (ported), research (ported).

- [ ] **Step 1: Read upstream and port**

Adaptations:
- Replace 4 `.planning/` → `.citadel/`
- Replace `/fleet`, `/research` → skill references
- Add trigger keywords: `research fleet`, `parallel research`, `multi-angle research`

- [ ] **Step 2: Verify and commit**

```bash
git add skills/research-fleet/SKILL.md
git commit -m "feat: port research-fleet skill (parallel multi-scout research)"
```

### Task 3.3: Port autopilot skill

**Files:**
- Create: `skills/autopilot/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\autopilot\SKILL.md` (111 lines, 0 Claude refs, 5 .planning refs)

Depends on: triage (Phase 2), marshal (Phase 1).

- [ ] **Step 1: Read upstream and port**

Adaptations:
- Replace 5 `.planning/` → `.citadel/`
- Replace `/triage`, `/marshal` → skill references
- Add trigger keywords: `autopilot`, `process pending`, `pipeline`, `intake`

- [ ] **Step 2: Verify and commit**

```bash
git add skills/autopilot/SKILL.md
git commit -m "feat: port autopilot skill (intake-to-delivery pipeline)"
```

### Task 3.4: Port postmortem skill

**Files:**
- Create: `skills/postmortem/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\postmortem\SKILL.md` (166 lines, 1 Claude ref, 4 .planning refs)

Depends on: archon campaigns (already ported).

- [ ] **Step 1: Read upstream and port**

Adaptations:
- Replace 1 Claude reference
- Replace 4 `.planning/` → `.citadel/`
- Add trigger keywords: `postmortem`, `retro`, `what broke`, `debrief`

- [ ] **Step 2: Verify and commit**

```bash
git add skills/postmortem/SKILL.md
git commit -m "feat: port postmortem skill (campaign retrospective)"
```

### Task 3.5: Update router with Phase 3 patterns

**Files:**
- Modify: `core/router/classify-intent.js`

- [ ] **Step 1: Add Phase 3 patterns and commit**

```javascript
  { patterns: [/\bcreate app\b/i, /\bbuild app\b/i, /\bnew app\b/i, /\bgenerate app\b/i], target: 'skill:create-app', description: 'End-to-end app creation' },
  { patterns: [/\bresearch fleet\b/i, /\bparallel research\b/i, /\bmulti.?angle research\b/i], target: 'skill:research-fleet', description: 'Parallel multi-scout research' },
  { patterns: [/\bautopilot\b/i, /\bprocess pending\b/i, /\bpipeline\b/i], target: 'skill:autopilot', description: 'Intake-to-delivery pipeline' },
  { patterns: [/\bpostmortem\b/i, /\bretro\b/i, /\bwhat broke\b/i, /\bdebrief\b/i], target: 'skill:postmortem', description: 'Campaign postmortem' },
```

```bash
git add core/router/classify-intent.js
git commit -m "feat: add Tier 0 routing for phase 3 skills"
```

---

## Phase 4: Browser-Dependent Skills

These require Playwright or browser tooling. They are lower priority and may not be usable in all environments.

### Task 4.1: Port live-preview skill

**Files:**
- Create: `skills/live-preview/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\live-preview\SKILL.md` (144 lines, 0 Claude refs, 4 .planning refs)

- [ ] **Step 1: Read upstream and port**

Adaptations:
- Replace 4 `.planning/` → `.citadel/`
- Add trigger keywords: `preview`, `screenshot`, `visual check`, `does it render`
- Note in the skill header that Playwright is an optional dependency

- [ ] **Step 2: Verify and commit**

```bash
git add skills/live-preview/SKILL.md
git commit -m "feat: port live-preview skill (mid-build visual verification)"
```

### Task 4.2: Port qa skill

**Files:**
- Create: `skills/qa/SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\qa\SKILL.md` (200 lines, 2 Claude refs, 3 .planning refs)

Depends on: live-preview (Task 4.1).

- [ ] **Step 1: Read upstream and port**

Adaptations:
- Replace 2 Claude references
- Replace 3 `.planning/` → `.citadel/`
- Add trigger keywords: `qa`, `test the app`, `browser test`, `click through`

- [ ] **Step 2: Verify and commit**

```bash
git add skills/qa/SKILL.md
git commit -m "feat: port qa skill (browser-based QA via Playwright)"
```

### Task 4.3: Update router with Phase 4 patterns

**Files:**
- Modify: `core/router/classify-intent.js`

- [ ] **Step 1: Add Phase 4 patterns and commit**

```javascript
  { patterns: [/\bpreview\b/i, /\bscreenshot\b/i, /\bvisual check\b/i, /\bdoes it render\b/i], target: 'skill:live-preview', description: 'Mid-build visual verification' },
  { patterns: [/\bqa\b/i, /\btest the app\b/i, /\bbrowser test\b/i, /\bclick through\b/i], target: 'skill:qa', description: 'Browser QA via Playwright' },
```

```bash
git add core/router/classify-intent.js
git commit -m "feat: add Tier 0 routing for browser-dependent skills"
```

---

## Phase 5: Agent Configs (parallel with Phases 2-4)

Port the 4 agent prompt files from upstream. These are markdown prompts that describe agent behavior for multi-agent orchestration.

### Task 5.1: Port all agent configs

**Files:**
- Create: `agents/arch-reviewer.md`
- Create: `agents/archon.md`
- Create: `agents/fleet.md`
- Create: `agents/knowledge-extractor.md`
- Reference: `C:\Users\rakovnik\Citadel\agents\*.md`

- [ ] **Step 1: Read all 4 upstream agent files**

Read each file. Total adaptation needed: 2 Claude refs across all 4 files.

- [ ] **Step 2: Port all 4 agent configs**

For each file:
- Replace `.claude/` → `.citadel/` or remove
- Replace `CLAUDE_PROJECT_DIR` → `process.cwd()` equivalent
- Replace `.planning/` → `.citadel/`
- Keep the agent identity, protocol, and quality gates intact

- [ ] **Step 3: Verify no Claude refs**

```bash
grep -rE 'CLAUDE_|\.claude/|\.planning/' agents/
```
Expected: No matches.

- [ ] **Step 4: Commit**

```bash
git add agents/
git commit -m "feat: port agent configs (arch-reviewer, archon, fleet, knowledge-extractor)"
```

---

## Phase 6: Final Documentation

### Task 6.1: Create QUICKSTART.md

**Files:**
- Create: `QUICKSTART.md`

- [ ] **Step 1: Write Codex-native quickstart**

Content outline:
1. Clone the repo
2. Run `node runtime/cli.js init` to scaffold state
3. Run `node runtime/cli.js setup` to detect stack and generate config
4. Run `node runtime/cli.js status` to see installed skills
5. Try a skill: invoke the review or research skill on a file
6. Run checks: `node runtime/checks/quality-gate.js`
7. Explore: `node runtime/cli.js route "your intent"`

Keep it to one page. No Claude references.

- [ ] **Step 2: Commit**

```bash
git add QUICKSTART.md
git commit -m "docs: add Codex-native QUICKSTART.md"
```

### Task 6.2: Create docs/SKILLS.md reference

**Files:**
- Create: `docs/SKILLS.md`

- [ ] **Step 1: Generate skill reference**

For each of the 24 installed skills, document:
- Name, description, trigger keywords
- Category (orchestration, creation, quality, research, utility)
- Key inputs and outputs
- Dependencies on other skills

Generate this by reading all `skills/*/SKILL.md` frontmatter and first-section content.

- [ ] **Step 2: Commit**

```bash
git add docs/SKILLS.md
git commit -m "docs: add complete skill reference (24 skills)"
```

### Task 6.3: Update migration-map.md with final status

**Files:**
- Modify: `docs/migration-map.md`

- [ ] **Step 1: Move all deferred items to their final status**

Update every `deferred` entry in the migration map to either `adapted` or `rejected`. After this task, no entries should have status `deferred`.

- [ ] **Step 2: Update import-audit with final tally**

Update `docs/import-audit-2026-03-26.md` to reflect that the "Defer for later adaptation" section is now empty — all items have been ported or permanently excluded.

- [ ] **Step 3: Commit**

```bash
git add docs/migration-map.md docs/import-audit-2026-03-26.md
git commit -m "docs: finalize migration map — all items resolved"
```

### Task 6.4: Final verification sweep

- [ ] **Step 1: Verify zero Claude refs in entire repo**

```bash
grep -rE 'CLAUDE_PROJECT_DIR|CLAUDE_PLUGIN_ROOT|\.claude/' --include='*.js' --include='*.md' --include='*.json' .
```
Expected: Only mentions in migration/audit docs (quoted references, not live code).

- [ ] **Step 2: Verify all skills discoverable**

```bash
node tests/infra/skill-discovery.test.js
node runtime/cli.js status
```
Expected: 24 skills, all with real descriptions.

- [ ] **Step 3: Syntax check all JS files**

```bash
find runtime core -name '*.js' -o -name '*.cjs' | xargs -I{} node --check {}
```
Expected: All pass.

- [ ] **Step 4: Final commit and push**

```bash
git add -A
git status  # review for any stray files
git push origin main
```
