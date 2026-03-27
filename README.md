<div align="center">

# Citadel Codex

**AI agent orchestration skills — one entry point, 24 workflows, any harness**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-49%20passing-brightgreen)](tests/)
[![Skills](https://img.shields.io/badge/Skills-24%20installed-purple)](docs/SKILLS.md)

*Codex-native port of [Citadel](https://github.com/SethGammon/Citadel). Same orchestration skills, any AI harness.*

</div>

---

## What is Citadel Codex?

Citadel Codex is a **skill library** for AI coding agents. You install the skills into your harness — [Codex CLI](https://github.com/openai/codex), Claude Code, Cursor, Aider, or any tool that can read markdown skill files — and they give your agent structured workflows for everything from code review to multi-session campaigns.

The single entry point is the **`do` skill**. Tell it what you want in plain language. It classifies your intent, picks the cheapest capable skill, and orchestrates execution. You don't choose between 24 skills — `do` chooses for you.

> [!IMPORTANT]
> **You never run CLI commands directly.** Skills are loaded by your AI harness. The `runtime/` directory provides supporting infrastructure (state management, intent classification, checks) that the skills reference — but users interact through their harness, not through `node` commands.

---

## The `do` Skill — Your Single Entry Point

```
User: "do review my authentication module"
       │
   ┌───▼────────────────────────────────────┐
   │           do (skills/do/SKILL.md)       │
   │                                         │
   │  Tier 0: "review" → skill:review  ✓    │
   │                                         │
   │  → Loads skills/review/SKILL.md         │
   │  → Agent follows 5-pass review workflow │
   └─────────────────────────────────────────┘
```

The `do` skill is what upstream Citadel's `/do` command was — **the unified router that makes all other skills accessible through natural language.** It was the core of Citadel, and it's the core of Citadel Codex.

### What changed from upstream Citadel

| Upstream (Claude Code plugin) | Citadel Codex (any harness) |
|-------------------------------|----------------------------|
| `/do review my code` | `do review my code` (or however your harness invokes skills) |
| Skills in `.claude/skills/` | Skills in `skills/` |
| State in `.planning/` | State in `.citadel/` |
| Routing config in `.claude/harness.json` | Routing built into `do` skill + `classify-intent.js` |
| `CLAUDE_PROJECT_DIR` env var | Standard working directory |
| Claude plugin lifecycle hooks | Explicit check scripts (referenced by skills when needed) |

**What didn't change:** The skills themselves. The orchestration model. The routing logic. The campaign/fleet lifecycle. Everything that made Citadel useful is preserved — just decoupled from Claude's plugin system.

---

## Installation

### In Codex CLI

Point your Codex system prompt or project config at the skills directory:

```
You have access to Citadel Codex skills in the `skills/` directory.
When the user asks you to do something, read `skills/do/SKILL.md` and
follow its routing protocol to find the right skill for the task.
```

### In Claude Code

Add to your `CLAUDE.md` or project instructions:

```
Citadel Codex skills are available in `skills/`. The `do` skill
(skills/do/SKILL.md) is the unified entry point — read it when the
user gives a task, and follow its routing protocol.
```

### In Any Other Harness

The skills are **plain markdown files**. Any AI agent that can read files can use them. Point your agent at `skills/do/SKILL.md` as the entry point.

### Initialize State

Your agent (or you, once) needs to create the `.citadel/` state directory:

```bash
node runtime/cli.js init
```

This creates the directory tree for campaigns, fleet sessions, coordination, intake, templates, and telemetry. After this, the agent manages state through the skills — you don't touch it again.

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Your AI Harness                       │
│          (Codex CLI, Claude Code, Cursor, etc.)          │
└──────────────────────┬──────────────────────────────────┘
                       │ User says: "do [anything]"
                       ▼
┌─────────────────────────────────────────────────────────┐
│              do skill (skills/do/SKILL.md)               │
│                                                          │
│  Tier 0: Pattern match (instant)                         │
│  Tier 1: Active campaign/fleet detection                 │
│  Tier 2: Skill name matching                             │
│  Tier 3: LLM complexity classification (if needed)       │
│                                                          │
│  → Routes to the cheapest capable skill                  │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────────┐
          ▼            ▼                ▼
   ┌──────────┐  ┌──────────┐   ┌──────────┐
   │  Skills  │  │ Marshal  │   │  Archon  │
   │ (direct) │  │ (chain)  │   │(campaign)│
   └──────────┘  └──────────┘   └──────────┘
```

The `do` skill classifies your intent through 4 tiers, each more expensive than the last:

| Tier | Method | Cost | When |
|------|--------|------|------|
| **0** | Regex/keyword match | ~0 tokens | Known skill triggers ("review", "debug", "scaffold") |
| **1** | Active state scan | ~0 tokens | Running campaign or fleet session exists |
| **2** | Skill name match | ~0 tokens | Input contains a skill name |
| **3** | LLM classification | ~500 tokens | Ambiguous input needs complexity analysis |

> [!NOTE]
> **Tiers 0-2 handle 95%+ of requests with zero LLM cost.** Tier 3 only fires for genuinely ambiguous input like "make this codebase better" where the scope and complexity need classification.

---

## Skills (24)

### Orchestration

| Skill | What it does |
|-------|-------------|
| **`do`** | **Unified entry point.** Routes any intent to the right skill. Start here. |
| `marshal` | Chains multiple skills in a single session to produce a deliverable. |
| `archon` | Multi-session campaigns with phases, tracked in `.citadel/campaigns/`. |
| `fleet` | Parallel wave-based execution with shared discoveries between agents. |
| `autopilot` | Processes `.citadel/intake/` queue: briefs ideas, executes approved work. |

### Development Lifecycle

| Skill | What it does |
|-------|-------------|
| `prd` | Generates a Product Requirements Document from a natural language description. |
| `architect` | Takes a PRD, produces file tree, component breakdown, data model, phased build plan. |
| `scaffold` | Generates files matching your project's existing conventions (naming, imports, tests). |
| `create-app` | End-to-end app creation. Five tiers: blank project → guided → templated → generated → feature add. |

### Code Quality

| Skill | What it does |
|-------|-------------|
| `review` | 5-pass code review: correctness, security, performance, readability, consistency. |
| `refactor` | Multi-file refactoring with automatic rollback. Baseline → plan → execute → verify. |
| `test-gen` | Generates tests (happy path, edge cases, error paths) using the project's own framework. |
| `qa` | Browser-based QA. Launches a real browser, navigates, clicks, fills forms, tests user flows. |
| `live-preview` | Screenshots components during construction — catches visual regressions mid-build. |

### Research & Debugging

| Skill | What it does |
|-------|-------------|
| `research` | Structured investigation with confidence levels and source citations. |
| `research-fleet` | Parallel research with multiple scout agents investigating different angles simultaneously. |
| `systematic-debugging` | Four-phase root cause analysis: observe → hypothesize → verify → fix. |
| `triage` | Pulls GitHub issues/PRs, classifies them, searches the codebase for root causes. |

### Documentation & Design

| Skill | What it does |
|-------|-------------|
| `doc-gen` | Three modes: function-level (JSDoc), module-level (READMEs), API reference. |
| `design` | Extracts or generates a design manifest for visual consistency. |
| `postmortem` | Generates a structured retrospective from a completed campaign's telemetry. |

### Meta

| Skill | What it does |
|-------|-------------|
| `create-skill` | Creates new skills from your repeating patterns. Interview-driven. |
| `experiment` | Optimization loop: proposes changes in worktrees, measures with a fitness function. |
| `session-handoff` | Summarizes the session into a HANDOFF block for the next session or agent. |

---

## Orchestration Ladder

> [!IMPORTANT]
> **Always use the cheapest level that fits.** The `do` skill enforces this automatically — it will never route a typo fix to a campaign.

| Level | When | Duration | State |
|-------|------|----------|-------|
| **Direct action** | Trivial: fix typo, rename variable | Minutes | None |
| **Single skill** | Focused: review, debug, scaffold | 10-30 min | None |
| **Marshal** | Multi-skill chain in one session | 1-2 hours | In-memory |
| **Archon** | Multi-session phased work | Days/weeks | `.citadel/campaigns/` |
| **Fleet** | Parallel execution across agents | Hours | `.citadel/fleet/` |

### Campaign Lifecycle (Archon)

```
New campaign → .citadel/campaigns/<name>.md
    ├── Phase 1: Research & Design
    ├── Phase 2: Implementation
    ├── Phase 3: Testing & QA
    └── Phase N: Completion → .citadel/campaigns/completed/
```

### Fleet Execution

```
Brief → .citadel/fleet/briefs/<session>.md
    ├── Wave 1: Agent A (module-1), Agent B (module-2)  [parallel]
    ├── Wave 2: Agent C (integration)  [depends on Wave 1]
    └── Outputs → .citadel/fleet/outputs/
```

---

## Agent Configs

Four pre-built agent role definitions in `agents/`:

| Agent | Role |
|-------|------|
| `arch-reviewer` | Architecture review and design validation |
| `archon` | Campaign phase management and context preservation |
| `fleet` | Wave assignment, discovery sharing, coordination safety |
| `knowledge-extractor` | Structured knowledge extraction from codebases |

---

## Runtime Infrastructure

> [!NOTE]
> This section is for **contributors and harness integrators**, not end users. Your AI agent references these internally when skills need state management or checks.

### State Management

```bash
node runtime/cli.js init       # Create .citadel/ state tree (run once)
node runtime/cli.js setup      # Auto-detect language, framework, test runner
node runtime/cli.js status     # Show campaigns, fleet, intake, skills
node runtime/cli.js continue   # Resume active campaign or fleet session
node runtime/cli.js route "x"  # Test intent classification
```

### Runtime Checks

Skills reference these when they need verification:

| Check | What it does | Exit |
|-------|-------------|------|
| `runtime/checks/post-edit.js --path <file>` | Language-adaptive type check + lint (TS, Python, Go, Rust) | 0=clean, 2=errors |
| `runtime/checks/quality-gate.js [--scope <dir>]` | Anti-pattern scan on git-changed files | 0=clean, 1=violations |
| `runtime/checks/circuit-breaker.js --status` | Failure-loop detection (3 fails = change approach) | 0=ok, 1=tripped |

### Intent Router

The `do` skill's routing logic is backed by `core/router/classify-intent.js`:
- `classify(input)` — synchronous, Tiers 0-2
- `classifyAsync(input)` — async, adds Tier 3 LLM fallback
- Tier 3 uses any OpenAI-compatible endpoint (Ollama, OpenAI, etc.) via `CITADEL_LLM_ENDPOINT`

---

## Project Structure

```
citadel_codex/
├── skills/                         # ← THIS IS THE PRODUCT
│   ├── do/SKILL.md                 #    Unified entry point
│   ├── archon/SKILL.md             #    Campaign orchestrator
│   ├── fleet/SKILL.md              #    Parallel execution
│   ├── marshal/SKILL.md            #    Single-session orchestrator
│   ├── review/SKILL.md             #    Code review
│   ├── ... (19 more skills)
│   └── README: each skill is a self-contained markdown workflow
│
├── agents/                         # Agent role configurations
│   ├── arch-reviewer.md
│   ├── archon.md
│   ├── fleet.md
│   └── knowledge-extractor.md
│
├── core/router/                    # Intent classification engine
│   ├── classify-intent.js          #   4-tier router (pattern → state → registry → LLM)
│   └── llm-classifier.js           #   Tier 3 LLM fallback
│
├── runtime/                        # Supporting infrastructure
│   ├── cli.js                      #   CLI entrypoint (for init/setup, not daily use)
│   ├── bootstrap/                  #   State initialization
│   ├── commands/                   #   Status, continue, setup
│   ├── checks/                     #   Post-edit, quality gate, circuit breaker
│   └── scripts/                    #   Coordination, discovery compression, handoff
│
├── .citadel/                       # Runtime state (created by init)
│   ├── campaigns/                  #   Active campaign files
│   ├── fleet/                      #   Fleet briefs and outputs
│   ├── coordination/               #   Scope claims for concurrent work
│   ├── intake/                     #   Queued work items
│   ├── templates/                  #   Customizable templates
│   └── telemetry/                  #   Circuit breaker state
│
├── tests/                          # 49 integration tests
├── docs/                           # Architecture, skills reference, migration map
├── QUICKSTART.md                   # Getting started guide
└── package.json                    # npm scripts (zero dependencies)
```

---

## Configuration

### Environment Variables (optional)

| Variable | Purpose | Default |
|----------|---------|---------|
| `CITADEL_LLM_ENDPOINT` | OpenAI-compatible API for Tier 3 classification | *(disabled — Tiers 0-2 handle most input)* |
| `CITADEL_LLM_MODEL` | LLM model name | `gpt-4o-mini` |
| `CITADEL_LLM_API_KEY` | API key (Bearer token) | *(none)* |

### `.citadel/config.json`

Generated by `node runtime/cli.js setup`. Contains auto-detected stack:

```json
{
  "language": "javascript",
  "framework": "express",
  "packageManager": "npm",
  "testFramework": "node:test"
}
```

### Templates

Customizable in `.citadel/templates/`:
- `campaign.md` — Campaign state document
- `fleet-session.md` — Fleet session brief
- `intake-item.md` — Intake queue item

---

## Testing

```bash
npm test                  # All 49 tests
npm run test:router       # Intent router (36 tests)
npm run test:commands     # Status + Continue (6 tests)
npm run test:checks       # Circuit breaker + Quality gate (7 tests)
```

Zero test dependencies — uses Node.js built-in `node:test` and `node:assert/strict`.

---

## Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Getting started in 2 minutes |
| [docs/SKILLS.md](docs/SKILLS.md) | Complete skill reference with routing examples |
| [docs/architecture.md](docs/architecture.md) | System design and state model |
| [docs/command-surface.md](docs/command-surface.md) | CLI and routing reference |
| [docs/runtime.md](docs/runtime.md) | Runtime checks documentation |
| [docs/migration-map.md](docs/migration-map.md) | Upstream file-by-file migration tracking |

---

## What Was Preserved from Upstream Citadel

> [!TIP]
> **Everything that mattered.** The skills, the orchestration model, the routing logic, the campaign/fleet lifecycle, the coordination safety, the circuit breaker — all preserved. Only the Claude-specific integration layer was replaced.

**Kept:**
- All 24 skills (including `do` — the unified router)
- Campaign lifecycle with persistent state
- Fleet wave-based parallel execution
- 4-tier intent classification
- Circuit breaker and quality gates
- Coordination and scope claiming
- Session handoff protocol

**Replaced:**
- `.claude/` → `.citadel/` (state directory)
- `.planning/` → `.citadel/` (same)
- `/do` slash command → `do` skill (same logic, harness-agnostic invocation)
- Hook bus (stdin JSON) → Explicit check scripts
- `CLAUDE_PROJECT_DIR` → Standard `process.cwd()`
- Plugin manifest → Plain directory of skills

**Removed (Claude-only plumbing):**
- `.claude-plugin/` manifest
- `hooks-template.json` event bus config
- `harness-health-util.js` shared hook utility
- `install-hooks.js` hook installer
- `docs/HOOKS.md` hook documentation

---

## Contributing

1. Fork the repository
2. Add or modify skills in `skills/`
3. Run `npm test` — all tests must pass
4. Submit a pull request

### Adding a New Skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: my-skill
   description: >-
     What this skill does in one or two sentences.
   trigger_keywords:
     - keyword1
     - keyword2
   ---
   ```
2. Add a Tier 0 pattern in `core/router/classify-intent.js` → `PATTERN_ROUTES`
3. Add the skill to the `do` skill's keyword table and `--list` output
4. Run `node tests/infra/skill-discovery.test.js` to verify discovery

---

## License

[MIT](LICENSE) — Copyright (c) 2026 special-place-administrator

---

<div align="center">

*Built on orchestration concepts from [Citadel](https://github.com/SethGammon/Citadel) by Seth Gammon.*

</div>
