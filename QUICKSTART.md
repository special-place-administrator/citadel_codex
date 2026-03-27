# Quickstart

Get Citadel Codex skills running in your AI harness in under two minutes.

## Prerequisites

- An AI coding harness (Codex CLI, Claude Code, Cursor, Aider, or any tool that reads markdown)
- Node.js 18+ (for runtime infrastructure)
- Git repository (state is stored in `.citadel/`)

## 1. Install Skills Into Your Harness

Citadel Codex skills are plain markdown files. Point your harness at the `do` skill as the single entry point.

### Codex CLI

Add to your system prompt or project instructions:

```
You have access to Citadel Codex skills in the `skills/` directory.
When the user asks you to do something, read `skills/do/SKILL.md` and
follow its routing protocol to find the right skill for the task.
```

### Claude Code

Add to your `CLAUDE.md` or project instructions:

```
Citadel Codex skills are available in `skills/`. The `do` skill
(skills/do/SKILL.md) is the unified entry point — read it when the
user gives a task, and follow its routing protocol.
```

### Any Other Harness

Point your agent at `skills/do/SKILL.md` as the entry point. Any AI agent that can read files can use these skills.

## 2. Bootstrap State (One Time)

Have your agent run — or run manually once:

```bash
node runtime/cli.js init
```

Creates the `.citadel/` directory tree for campaigns, fleet sessions, coordination, intake, templates, and telemetry. Add `.citadel/` to `.gitignore` if you don't want state tracked.

## 3. Configure Your Project

Ask your agent:

```
do setup
```

The `setup` skill detects your language, framework, package manager, and test runner. It writes `.citadel/config.json` and prints a reference card of all available skills.

You can also run this directly:

```bash
node runtime/cli.js setup
```

## 4. Start Working

Tell your agent what you need. The `do` skill handles routing:

```
do review my authentication code       → routes to review skill
do debug this crash in login            → routes to systematic-debugging skill
do scaffold a new API endpoint          → routes to scaffold skill
do create an app for task management    → routes to create-app skill
```

The router classifies through 4 tiers (cheapest first):

| Tier | Method | Cost |
|------|--------|------|
| **0** | Keyword/regex match | ~0 tokens |
| **1** | Active campaign/fleet detection | ~0 tokens |
| **2** | Skill name matching | ~0 tokens |
| **3** | LLM classification (ambiguous input only) | ~500 tokens |

## Orchestration Ladder

Use the cheapest level that fits the work — `do` enforces this automatically:

| Level | When | Entry Point |
|-------|------|-------------|
| Direct action | Trivial: fix typo, rename variable | Just do it |
| Single skill | Focused: review, debug, scaffold | `do [intent]` |
| Marshal | Multi-skill chain in one session | `do [complex intent]` |
| Archon | Multi-session phased work | `do [large direction]` |
| Fleet | Parallel execution across agents | `do [platform-wide work]` |

## Runtime Infrastructure (For Reference)

Your agent uses these internally — you don't need to run them directly:

```bash
node runtime/cli.js status     # Show campaigns, fleet, intake, skills
node runtime/cli.js continue   # Resume active campaign or fleet session
node runtime/cli.js route "x"  # Test intent classification
```

### Runtime Checks (Referenced by Skills)

```bash
node runtime/checks/post-edit.js --path src/main.js     # Type check + lint
node runtime/checks/quality-gate.js --scope src/         # Anti-pattern scan
node runtime/checks/circuit-breaker.js --status          # Failure-loop state
```

## Installed Skills (25)

See [docs/SKILLS.md](docs/SKILLS.md) for the complete reference. Ask your agent `do --list` to see all skills with descriptions.

## Next Steps

- [docs/SKILLS.md](docs/SKILLS.md) — Complete skill reference
- [docs/architecture.md](docs/architecture.md) — System design and state model
- [docs/command-surface.md](docs/command-surface.md) — CLI and routing reference
- [docs/runtime.md](docs/runtime.md) — Runtime checks documentation
