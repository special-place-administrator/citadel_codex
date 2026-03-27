# Skill Reference

24 skills organized by category. Each skill is a markdown workflow definition in `skills/<name>/SKILL.md`.

## Entry Point

| Skill | Description |
|-------|-------------|
| **`do`** | **Unified intent router — single entry point for all work.** Classifies user intent through 4 tiers, routes to the cheapest capable skill or orchestrator. Start here. |

## Core Orchestration

| Skill | Description |
|-------|-------------|
| `archon` | Multi-session campaign orchestrator. Breaks work into phases, tracks progress in `.citadel/campaigns/`, and preserves context across sessions. |
| `fleet` | Parallel campaign coordinator. Splits work into non-overlapping waves, shares discoveries between waves, and records results. |
| `marshal` | Meta-orchestrator that chains skills and context into a completed deliverable within a single session. |
| `autopilot` | Intake-to-delivery pipeline. Processes pending items from `.citadel/intake/`: briefs new ideas, executes approved work through the orchestration ladder. |

## Development Lifecycle

| Skill | Description |
|-------|-------------|
| `prd` | Generates a Product Requirements Document from a natural language app description. Asks clarifying questions and researches conventions. |
| `architect` | Given a PRD, produces an implementation architecture: file tree, component breakdown, data model, and a phased build plan. |
| `scaffold` | Project-aware file generation. Reads existing codebase conventions and generates files that match the project's patterns. |
| `create-app` | End-to-end app creation from a single description. Five tiers: blank project, guided, templated, fully generated, or feature addition. |

## Code Quality

| Skill | Description |
|-------|-------------|
| `review` | 5-pass structured code review: correctness, security, performance, readability, consistency. |
| `refactor` | Safe multi-file refactoring with automatic rollback. Establishes a type/test baseline, plans all changes, executes file-by-file with verification. |
| `test-gen` | Generate and verify tests (happy path, edge cases, error paths) using the project's own framework and patterns. |
| `qa` | Browser-based QA verification. Launches a real browser, navigates the app, clicks buttons, fills forms, and tests user flows. |
| `live-preview` | Mid-build visual verification loop. Takes screenshots of components during construction to catch visual regressions early. |

## Research and Investigation

| Skill | Description |
|-------|-------------|
| `research` | Focused research investigations. Converts questions into structured findings with confidence levels and source citations. |
| `research-fleet` | Parallel research using Fleet wave mechanics. Spawns multiple scout agents, each investigating a different angle of the same question. |
| `systematic-debugging` | Four-phase root cause analysis: observe, hypothesize, verify, fix. Enforces investigation before code changes. |
| `triage` | GitHub issue and PR investigator. Pulls open issues/PRs, classifies them, searches the codebase for root cause or review points. |

## Documentation and Design

| Skill | Description |
|-------|-------------|
| `doc-gen` | Documentation generator with three modes: function-level (JSDoc/docstrings), module-level (directory READMEs), and API reference. |
| `design` | Generates and maintains a design manifest for visual consistency. Reads current styles and documents the design system. |
| `postmortem` | Auto-generates a structured postmortem from a completed campaign. Reads the campaign file, telemetry logs, and feature log. |

## Meta-Skills

| Skill | Description |
|-------|-------------|
| `create-skill` | Creates new skills from repeating patterns. Interview-driven: discovers the task, analyzes failure modes, generates the SKILL.md. |
| `experiment` | Automated optimization loop with scalar fitness function. Proposes changes in isolated worktrees, measures with a metric runner. |
| `session-handoff` | Summarize the current session into a compact HANDOFF block for the next session or delegated agent. |

## Agent Configs (4)

Agent configs in `agents/` define specialized agent roles:

| Agent | Purpose |
|-------|---------|
| `arch-reviewer` | Architecture review agent for design validation |
| `archon` | Campaign orchestration agent |
| `fleet` | Fleet coordination agent |
| `knowledge-extractor` | Knowledge extraction from codebases and documentation |

## Routing

Skills are discoverable through the intent router (`core/router/classify-intent.js`):

```bash
node runtime/cli.js route "review my code"        # Routes to skill:review
node runtime/cli.js route "create a new app"       # Routes to skill:create-app
node runtime/cli.js route "debug this crash"       # Routes to skill:systematic-debugging
```

All 23 skills have Tier 0 keyword patterns for instant routing. Skills without a Tier 0 match fall through to Tier 2 (skill registry name matching).
