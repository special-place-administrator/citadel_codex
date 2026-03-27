<div align="center">

# Citadel Codex

**Agent orchestration framework for AI-native development workflows**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-49%20passing-brightgreen)](tests/)
[![Skills](https://img.shields.io/badge/Skills-23%20installed-purple)](docs/SKILLS.md)

*Derived from [Citadel](https://github.com/SethGammon/Citadel) concepts, rebuilt as a platform-agnostic CLI.*

</div>

---

## What is Citadel Codex?

Citadel Codex is an **orchestration foundation** for AI coding agents. It provides structured workflows (skills), multi-session campaign management, parallel fleet execution, and an intelligent intent router — all driven through a simple CLI with zero vendor lock-in.

It takes the battle-tested orchestration ideas from the Citadel framework and strips away the platform-specific integration layer, replacing it with explicit CLI commands that work with **any** AI coding assistant: OpenAI Codex, Claude Code, Cursor, Aider, Continue, or your own tooling.

> [!NOTE]
> **This is not a plugin.** Citadel Codex is a standalone framework. No `.claude/` directories, no slash commands, no hook bus. Just Node.js and your terminal.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Skills](#skills)
- [Intent Router](#intent-router)
- [Runtime Checks](#runtime-checks)
- [Orchestration Ladder](#orchestration-ladder)
- [Agent Configs](#agent-configs)
- [npm Scripts](#npm-scripts)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

> [!IMPORTANT]
> Requires **Node.js 18+** and **Git**. No other dependencies — Citadel Codex uses only Node.js built-ins.

### Clone and Initialize

```bash
# Clone the repository
git clone https://github.com/special-place-administrator/citadel_codex.git
cd citadel_codex

# Initialize the state tree
node runtime/cli.js init

# Detect your project stack
node runtime/cli.js setup
```

### Add to an Existing Project

```bash
# Copy citadel_codex into your project (or add as a git submodule)
git submodule add https://github.com/special-place-administrator/citadel_codex.git .citadel-codex

# Initialize state in your project root
node .citadel-codex/runtime/cli.js init
```

### Verify Installation

```bash
node runtime/cli.js status
```

You should see a status report listing 23 installed skills and empty campaign/fleet state.

---

## Quick Start

```bash
# 1. Initialize the .citadel/ state directory
node runtime/cli.js init

# 2. Auto-detect your language, framework, and test runner
node runtime/cli.js setup

# 3. See what's installed and what's active
node runtime/cli.js status

# 4. Route a natural language intent to the right skill
node runtime/cli.js route "review my authentication code"
# → Tier 0: skill:review — Code review

# 5. Resume any active campaign or fleet session
node runtime/cli.js continue
```

> [!TIP]
> Use **npm scripts** for convenience: `npm run status`, `npm run init`, `npm run route -- "debug this crash"`. See [npm Scripts](#npm-scripts) for the full list.

---

## How It Works

Citadel Codex organizes AI agent work into three layers:

```
┌─────────────────────────────────────────────────┐
│                  Intent Router                   │
│  Natural language → skill/command classification │
│  4 tiers: Pattern → State → Registry → LLM      │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│                    Skills                        │
│  23 markdown workflow definitions                │
│  Portable, composable, platform-agnostic         │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              Orchestration State                 │
│  .citadel/ — campaigns, fleet, coordination,     │
│  intake, templates, telemetry, config            │
└─────────────────────────────────────────────────┘
```

1. **You describe what you want** in natural language
2. **The intent router** classifies it to the right skill or command
3. **The skill** provides a structured workflow your AI agent follows
4. **State** is tracked in `.citadel/` for multi-session continuity

---

## Skills

23 skills organized into 6 categories. Each skill is a self-contained markdown workflow definition in `skills/<name>/SKILL.md`.

### Orchestration

| Skill | Description |
|-------|-------------|
| `archon` | Multi-session campaign orchestrator. Breaks work into phases, tracks progress across sessions. |
| `fleet` | Parallel campaign coordinator. Splits work into non-overlapping waves with shared discoveries. |
| `marshal` | Meta-orchestrator that chains skills into a completed deliverable within a single session. |
| `autopilot` | Intake-to-delivery pipeline. Processes pending items from `.citadel/intake/` automatically. |

### Development Lifecycle

| Skill | Description |
|-------|-------------|
| `prd` | Generates a Product Requirements Document from natural language descriptions. |
| `architect` | Produces implementation architecture: file tree, component breakdown, data model, phased build plan. |
| `scaffold` | Project-aware file generation that matches existing codebase conventions. |
| `create-app` | End-to-end app creation from a single description. Five tiers from blank project to feature addition. |

### Code Quality

| Skill | Description |
|-------|-------------|
| `review` | 5-pass structured code review: correctness, security, performance, readability, consistency. |
| `refactor` | Safe multi-file refactoring with automatic rollback and type/test baseline verification. |
| `test-gen` | Generate and verify tests (happy path, edge cases, error paths) using the project's own framework. |
| `qa` | Browser-based QA verification. Launches a real browser, navigates, clicks, fills forms, tests flows. |
| `live-preview` | Mid-build visual verification loop. Takes screenshots during construction to catch regressions early. |

### Research & Investigation

| Skill | Description |
|-------|-------------|
| `research` | Focused investigations with confidence levels and source citations. |
| `research-fleet` | Parallel research using Fleet wave mechanics. Multiple scout agents investigate different angles. |
| `systematic-debugging` | Four-phase root cause analysis: observe, hypothesize, verify, fix. |
| `triage` | GitHub issue and PR investigator. Classifies, searches codebase for root causes. |

### Documentation & Design

| Skill | Description |
|-------|-------------|
| `doc-gen` | Documentation generator: function-level (JSDoc/docstrings), module-level (READMEs), and API reference. |
| `design` | Generates and maintains a design manifest for visual consistency across the project. |
| `postmortem` | Auto-generates a structured postmortem from a completed campaign's telemetry and feature log. |

### Meta

| Skill | Description |
|-------|-------------|
| `create-skill` | Creates new skills from repeating patterns. Interview-driven with failure mode analysis. |
| `experiment` | Automated optimization loop. Proposes changes in isolated worktrees, measures with a fitness function. |
| `session-handoff` | Summarize the current session into a compact HANDOFF block for the next session or agent. |

> [!TIP]
> Run `node runtime/cli.js route "<what you want to do>"` and the router will pick the right skill for you.

---

## Intent Router

The router classifies natural language input into the correct skill or command through **4 tiers**, from cheapest to most expensive:

```
Input: "review my authentication code"
         │
         ▼
┌─ Tier 0: Pattern Match ──────────────────────┐
│  Regex/keyword scan            Cost: ~0       │
│  Latency: <1ms                                │
│  "review" → skill:review  ✓ MATCH             │
└───────────────────────────────────────────────┘
         │ (no match? ↓)
┌─ Tier 1: Active State ───────────────────────┐
│  Scans .citadel/campaigns/ and fleet/briefs/  │
│  Cost: ~0    Latency: <100ms                  │
│  Routes to 'continue' if active work found    │
└───────────────────────────────────────────────┘
         │ (no match? ↓)
┌─ Tier 2: Skill Registry ────────────────────┐
│  Matches input against skills/*/SKILL.md      │
│  Cost: ~0    Latency: <10ms                   │
│  Fuzzy name matching on all 23 skills         │
└───────────────────────────────────────────────┘
         │ (no match? ↓)
┌─ Tier 3: LLM Classifier (optional) ─────────┐
│  Async fallback via OpenAI-compatible API     │
│  Cost: varies    Latency: network-bound       │
│  Requires CITADEL_LLM_ENDPOINT env var        │
└───────────────────────────────────────────────┘
```

### Router Examples

```bash
node runtime/cli.js route "review my code"
# → Tier 0: skill:review — Code review

node runtime/cli.js route "debug this crash"
# → Tier 0: skill:systematic-debugging — Root cause analysis

node runtime/cli.js route "create a new React app"
# → Tier 0: skill:create-app — End-to-end app creation

node runtime/cli.js route "research fleet results"
# → Tier 0: skill:research-fleet — Parallel multi-scout research
```

### Tier 3 LLM Configuration

> [!WARNING]
> Tier 3 is **optional** and requires external API access. Tiers 0-2 handle the vast majority of intents without any API calls.

```bash
# Ollama (local)
export CITADEL_LLM_ENDPOINT="http://localhost:11434/v1/chat/completions"
export CITADEL_LLM_MODEL="llama3"

# OpenAI
export CITADEL_LLM_ENDPOINT="https://api.openai.com/v1/chat/completions"
export CITADEL_LLM_MODEL="gpt-4o-mini"
export CITADEL_LLM_API_KEY="sk-..."
```

Use `classifyAsync()` in code to access Tier 3. The synchronous `classify()` function remains unchanged (Tiers 0-2 only).

---

## Runtime Checks

Three explicit verification commands replacing traditional hook-based automation:

### Post-Edit Check

```bash
node runtime/checks/post-edit.js --path <file>
# or: npm run check:post-edit -- --path src/main.ts
```

Language-adaptive type checking and lint:
- **TypeScript** — `tsc --noEmit`, filters errors to the edited file
- **Python** — `mypy` or `pyright` (whichever is available)
- **Go** — `go vet`
- **Rust** — `cargo check`
- **All JS/TS/CSS** — Performance lint (`confirm()`, `alert()`, `transition-all`)

Exit: `0` = clean, `2` = errors found

### Quality Gate

```bash
node runtime/checks/quality-gate.js [--scope <dir>]
# or: npm run check:quality -- --scope src/
```

Scans git-changed files for anti-patterns:
- `no-confirm-alert` — Catches `confirm()` and `alert()` calls
- `no-transition-all` — Catches `transition-all` in CSS
- `no-magic-intervals` — Catches hardcoded `setInterval` values

Exit: `0` = clean, `1` = violations found

### Circuit Breaker

```bash
node runtime/checks/circuit-breaker.js --record-failure [--tool <name>] [--error <msg>]
node runtime/checks/circuit-breaker.js --status
node runtime/checks/circuit-breaker.js --reset
# or: npm run check:breaker -- --status
```

Tracks consecutive failures and breaks retry loops:
- **3 failures** — Suggests changing approach (exit code 1)
- **5 lifetime trips** — Escalates to "stop and rethink" warning
- State stored in `.citadel/telemetry/circuit-breaker.json`

---

## Orchestration Ladder

> [!IMPORTANT]
> **Always use the cheapest level that fits the work.** Don't use campaigns for a one-file fix. Don't use direct execution for a multi-week refactor.

| Level | When to Use | Entry Point | State |
|-------|-------------|-------------|-------|
| **Direct** | Small, bounded tasks (minutes) | Just do it | None |
| **Skills** | Repeatable workflows (single session) | `route "<intent>"` | None |
| **Marshal** | Multi-skill chains (single session) | `route "orchestrate"` | In-memory |
| **Archon** | Multi-session phased work (days/weeks) | `route "campaign"` | `.citadel/campaigns/` |
| **Fleet** | Parallel wave-based execution | `route "fleet"` | `.citadel/fleet/` |

### Campaign Lifecycle

```
New campaign → .citadel/campaigns/<name>.md
   │
   ├── Phase 1: Research & Design
   ├── Phase 2: Implementation
   ├── Phase 3: Testing & QA
   └── Phase N: Completion
   │
   └── Completed → .citadel/campaigns/completed/
```

### Fleet Execution

```
Fleet brief → .citadel/fleet/briefs/<session>.md
   │
   ├── Wave 1: Agent A (module-1), Agent B (module-2)
   ├── Wave 2: Agent C (integration), Agent D (tests)
   └── Wave N: Final verification
   │
   └── Outputs → .citadel/fleet/outputs/
```

---

## Agent Configs

Four pre-configured agent role definitions in `agents/`:

| Agent | Role |
|-------|------|
| `arch-reviewer` | Architecture review — validates design decisions and structural patterns |
| `archon` | Campaign orchestration — manages phases, tracks progress, preserves context |
| `fleet` | Fleet coordination — assigns work to waves, manages shared discoveries |
| `knowledge-extractor` | Knowledge extraction — pulls structured knowledge from codebases and docs |

---

## npm Scripts

All commands are available as npm scripts for convenience:

### CLI Commands

```bash
npm run init              # Initialize .citadel/ state tree
npm run status            # Show orchestration state
npm run setup             # Detect stack, generate config
npm run continue          # Resume active campaign/fleet
npm run route -- "text"   # Route intent to skill
```

### Runtime Checks

```bash
npm run check:post-edit -- --path <file>    # Type check + lint
npm run check:quality -- --scope <dir>      # Anti-pattern scan
npm run check:breaker -- --status           # Circuit breaker state
```

### Testing

```bash
npm test                  # Run all 49 tests
npm run test:router       # Router tests only
npm run test:commands     # Command tests only
npm run test:checks       # Check tests only
npm run test:infra        # Infrastructure tests only
```

### Utilities

```bash
npm run coord             # Coordination script
npm run coord:status      # Show coordination state
npm run coord:sweep       # Sweep stale claims
npm run compress:discovery  # Compress discovery briefs
npm run parse:handoff     # Parse HANDOFF blocks
```

---

## Project Structure

```
citadel_codex/
├── core/
│   └── router/
│       ├── classify-intent.js     # 4-tier intent router
│       └── llm-classifier.js      # Tier 3 LLM fallback module
├── skills/                        # 23 skill definitions
│   ├── archon/SKILL.md
│   ├── fleet/SKILL.md
│   ├── review/SKILL.md
│   ├── research/SKILL.md
│   └── ... (19 more)
├── agents/                        # 4 agent role configs
│   ├── arch-reviewer.md
│   ├── archon.md
│   ├── fleet.md
│   └── knowledge-extractor.md
├── runtime/
│   ├── cli.js                     # CLI entrypoint
│   ├── bootstrap/
│   │   ├── init-state.js          # Creates .citadel/ directory tree
│   │   └── sync-templates.js      # Syncs templates to state dirs
│   ├── commands/
│   │   ├── status.js              # Show orchestration state
│   │   ├── continue.js            # Resume active work
│   │   └── setup.js               # Stack detection + config
│   ├── checks/
│   │   ├── post-edit.js           # Per-file type check + lint
│   │   ├── quality-gate.js        # Anti-pattern scanning
│   │   └── circuit-breaker.js     # Failure-loop detection
│   └── scripts/
│       ├── coordination.js        # File-based scope claiming
│       ├── compress-discovery.cjs # Brief generation
│       └── parse-handoff.cjs      # HANDOFF block extraction
├── tests/                         # 49 integration tests
│   ├── router/
│   ├── commands/
│   ├── checks/
│   └── infra/
├── docs/
│   ├── architecture.md            # System design
│   ├── command-surface.md         # CLI reference
│   ├── runtime.md                 # Runtime checks docs
│   ├── SKILLS.md                  # Complete skill reference
│   └── migration-map.md           # Upstream migration tracking
├── .citadel/                      # Runtime state (gitignored)
│   ├── campaigns/                 # Active and completed campaigns
│   ├── fleet/briefs/              # Fleet session briefs
│   ├── fleet/outputs/             # Fleet wave outputs
│   ├── coordination/              # Scope claims and instances
│   ├── intake/                    # Queued work items
│   ├── templates/                 # Campaign, fleet, intake templates
│   ├── telemetry/                 # Circuit breaker state, metrics
│   └── config.json                # Stack detection output
├── QUICKSTART.md                  # Getting started guide
├── package.json                   # npm scripts (no dependencies)
└── LICENSE                        # MIT
```

---

## Configuration

### `.citadel/config.json`

Generated by `npm run setup`. Contains auto-detected stack info:

```json
{
  "language": "javascript",
  "framework": "express",
  "packageManager": "npm",
  "testFramework": "node:test"
}
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `CITADEL_LLM_ENDPOINT` | OpenAI-compatible API URL for Tier 3 | *(disabled)* |
| `CITADEL_LLM_MODEL` | LLM model name | `gpt-4o-mini` |
| `CITADEL_LLM_API_KEY` | API key (sent as Bearer token) | *(none)* |

### `.citadel/templates/`

Customizable templates for campaigns, fleet sessions, and intake items. Edit these to match your team's conventions:

- `campaign.md` — Campaign state document template
- `fleet-session.md` — Fleet session brief template
- `intake-item.md` — Intake queue item template

---

## Testing

```bash
# Run the full suite (49 tests)
npm test

# Run by category
npm run test:router       # Intent router — 36 tests
npm run test:commands     # Status + Continue — 6 tests
npm run test:checks       # Circuit breaker + Quality gate — 7 tests
```

Tests use Node.js built-in test runner (`node:test`) and assertions (`node:assert/strict`). **Zero test dependencies.**

---

## Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Getting started in under 2 minutes |
| [docs/architecture.md](docs/architecture.md) | System design, state model, and orchestration ladder |
| [docs/command-surface.md](docs/command-surface.md) | Full CLI command reference |
| [docs/runtime.md](docs/runtime.md) | Runtime checks documentation |
| [docs/SKILLS.md](docs/SKILLS.md) | Complete skill reference with routing examples |
| [docs/migration-map.md](docs/migration-map.md) | File-by-file upstream migration tracking |

---

## What This Is Not

> [!CAUTION]
> Citadel Codex is **deliberately platform-agnostic**. The following are permanently excluded by design:

- **Not a Claude plugin** — No `.claude/` directories, no `.claude-plugin/` manifests
- **Not a hook system** — No stdin JSON event bus, no lifecycle hooks
- **Not slash commands** — No `/do`, `/setup`, `/plugin` — explicit CLI instead
- **Not vendor-locked** — No `CLAUDE_PROJECT_DIR`, no platform-specific env vars

These were consciously removed during the migration from upstream Citadel. See [docs/migration-map.md](docs/migration-map.md) for the complete rationale.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `npm test` — all 49 tests must pass
4. Run `npm run check:quality` — no anti-pattern violations
5. Submit a pull request

When adding a new skill:
1. Create `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`, `trigger_keywords`)
2. Add a Tier 0 pattern to `PATTERN_ROUTES` in `core/router/classify-intent.js`
3. Run `node tests/infra/skill-discovery.test.js` to verify discovery works
4. Update `docs/SKILLS.md` with the new skill

---

## License

[MIT](LICENSE) — Copyright (c) 2026 special-place-administrator

---

<div align="center">

*Built on orchestration concepts from [Citadel](https://github.com/SethGammon/Citadel) by Seth Gammon.*

</div>
