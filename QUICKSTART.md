# Quickstart

Get Citadel Codex running in your project in under two minutes.

## Prerequisites

- Node.js 18+
- Git repository (Codex stores state in `.citadel/`)

## 1. Initialize State

```bash
node runtime/cli.js init
```

Creates the `.citadel/` directory tree with campaigns, fleet, coordination, intake, templates, and telemetry subdirectories. Add `.citadel/` to `.gitignore` if you don't want state tracked.

## 2. Detect Your Stack

```bash
node runtime/cli.js setup
```

Scans your project for language, framework, package manager, and test framework. Writes `.citadel/config.json` with the detected stack and prints a reference card.

## 3. Check Status

```bash
node runtime/cli.js status
```

Shows active campaigns, fleet sessions, intake items, installed skills, and coordination state.

## 4. Route an Intent

```bash
node runtime/cli.js route "review my authentication code"
```

The intent router classifies input through three tiers:
1. **Pattern match** — keyword/regex on raw input (instant)
2. **Active state** — checks for running campaigns or fleet sessions
3. **Skill registry** — matches against installed `skills/*/SKILL.md` definitions

## 5. Run Checks

```bash
node runtime/checks/post-edit.js --path src/main.js     # Type check + lint
node runtime/checks/quality-gate.js --scope src/         # Anti-pattern scan
node runtime/checks/circuit-breaker.js --status          # Failure-loop state
```

## Orchestration Ladder

Use the cheapest level that fits the work:

| Level | When | Entry Point |
|-------|------|-------------|
| Direct execution | Small, bounded tasks | Just do it |
| Skills | Repeatable workflows | `node runtime/cli.js route "<intent>"` |
| Archon (campaigns) | Multi-session phased work | `skills/archon/SKILL.md` |
| Fleet | Parallel wave-based execution | `skills/fleet/SKILL.md` |

## Installed Skills (23)

Run `node runtime/cli.js status` to list all installed skills with descriptions. See [docs/SKILLS.md](docs/SKILLS.md) for the complete reference.

## Key Differences from Upstream Citadel

- No `.claude/` directory or Claude plugin lifecycle
- No slash commands (`/do`, `/setup`) — explicit CLI instead
- No hook bus — checks are explicit CLI invocations
- State lives in `.citadel/` instead of `.planning/`
- All skills are Codex-native (no `CLAUDE_PROJECT_DIR` references)

## Next Steps

- [docs/architecture.md](docs/architecture.md) — System design and state model
- [docs/command-surface.md](docs/command-surface.md) — Full CLI reference
- [docs/runtime.md](docs/runtime.md) — Runtime checks documentation
- [docs/SKILLS.md](docs/SKILLS.md) — Complete skill reference
