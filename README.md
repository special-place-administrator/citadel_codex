# Citadel Codex

Codex-native fork target for Citadel. This repository keeps Citadel's orchestration ideas where they transfer cleanly, but rebuilds the integration layer around Codex instead of Claude plugins, slash commands, and `.claude` state.

The current baseline includes:
- `core/` for future orchestration logic
- `skills/` for portable markdown workflows
- `runtime/scripts/` for reusable coordination and handoff utilities
- `.citadel/` for neutral campaign, fleet, and runtime state
- `docs/` for architecture, campaign, fleet, and import audit notes

Intentionally not included yet:
- `.claude/` and `.claude-plugin/`
- `/do` and `/plugin` command assumptions
- Claude lifecycle hook wiring and hook installers
- Claude-specific environment variable conventions
