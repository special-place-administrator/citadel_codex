# Citadel Codex

Codex-native orchestration foundation derived from [Citadel](https://github.com/SethGammon/Citadel) concepts. Keeps Citadel's orchestration ideas where they transfer cleanly, but rebuilds the integration layer around explicit CLI commands instead of Claude plugins, slash commands, and `.claude` state.

## Quick Start

```bash
node runtime/cli.js init      # Create .citadel/ state tree
node runtime/cli.js setup     # Detect stack, generate config
node runtime/cli.js status    # Show active campaigns/fleet/skills
node runtime/cli.js continue  # Resume active work
node runtime/cli.js route "review my code"  # Test intent routing
```

## Structure

| Directory | Purpose |
|-----------|---------|
| `core/router/` | Intent classification and routing |
| `skills/` | Portable markdown workflow definitions |
| `runtime/bootstrap/` | State initialization and template sync |
| `runtime/commands/` | CLI command implementations (status, continue, setup) |
| `runtime/checks/` | Post-edit verification, quality gate, circuit breaker |
| `runtime/scripts/` | Coordination and handoff utilities |
| `.citadel/` | Campaign, fleet, coordination, and runtime state |
| `docs/` | Architecture, runtime, command surface, and migration docs |

## Skills (9 installed)

| Skill | Description |
|-------|-------------|
| `review` | 5-pass structured code review (correctness, security, performance, readability, consistency) |
| `research` | Focused investigation with confidence levels and source citations |
| `scaffold` | Project-aware file generation matching existing conventions |
| `prd` | Product requirements document from natural language descriptions |
| `architect` | Implementation architecture with phased build plan from PRD |
| `archon` | Multi-session campaign orchestration |
| `fleet` | Parallel agent coordination with safety controls |
| `session-handoff` | Session context transfer between agents |
| `systematic-debugging` | 4-phase root cause analysis |

## Runtime Checks

```bash
node runtime/checks/post-edit.js --path <file>        # Per-file type check + lint
node runtime/checks/quality-gate.js [--scope <dir>]    # Scan changed files for anti-patterns
node runtime/checks/circuit-breaker.js --status        # Failure-loop detection
```

## Intentionally Excluded

- `.claude/` and `.claude-plugin/` directories
- `/do` and `/plugin` slash command assumptions
- Claude lifecycle hook wiring and hook installers
- Claude-specific environment variable conventions (`CLAUDE_PROJECT_DIR`, etc.)

See [docs/command-surface.md](docs/command-surface.md) and [docs/runtime.md](docs/runtime.md) for details.
