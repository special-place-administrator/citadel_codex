# Architecture

Citadel Codex keeps Citadel's orchestration model but replaces the Claude-specific integration layer.

## Orchestration Ladder

1. Direct execution: small, bounded work in the active session.
2. Skills: focused markdown workflows for repeatable tasks.
3. Archon: multi-session campaign orchestration with persistent state.
4. Fleet: wave-based parallel execution with shared discovery briefs.

The rule is unchanged from upstream Citadel: use the cheapest level that fits the work.

## Repository Layout

- `core/`: future routing, campaign state handling, and orchestration modules.
- `skills/`: portable Codex-oriented skill definitions.
- `runtime/`: helper scripts that support coordination and handoff processing.
- `.citadel/`: neutral runtime state and templates.
- `docs/`: methodology, migration notes, and operating conventions.

## State Model

Persistent state lives under `.citadel/`:

- `.citadel/campaigns/`: active and completed campaign files.
- `.citadel/fleet/`: wave outputs and compressed discovery briefs.
- `.citadel/coordination/`: file-based scope claims and live instances.
- `.citadel/intake/`: optional queued work items.
- `.citadel/templates/`: campaign, fleet session, and intake templates.

This keeps state portable and avoids `.claude/` assumptions.

## Runtime Baseline

The first baseline intentionally imports only three runtime helpers:

- `coordination.js`: file-based scope claiming for concurrent work.
- `compress-discovery.cjs`: brief generation from agent outputs.
- `parse-handoff.cjs`: extraction of structured HANDOFF blocks.

Claude plugin manifests, hook installers, and lifecycle hooks are excluded until they are redesigned for Codex.
