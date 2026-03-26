# Initial Import Audit

Date: 2026-03-26

## Top-Level Comparison

Target repo before bootstrap:

- `.git/`
- `LICENSE`

Source repo top level:

- `.claude/`
- `.claude-plugin/`
- `.planning/`
- `agents/`
- `assets/`
- `docs/`
- `examples/`
- `hooks/`
- `hooks_src/`
- `scripts/`
- `skills/`
- `.gitignore`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `package.json`
- `QUICKSTART.md`
- `README.md`

## Initial Import Set

Import now:

- `.planning/_templates/*` into `.citadel/templates/`
- `.planning` state skeleton as `.citadel/` directories with tracked placeholders
- `scripts/coordination.js`, `scripts/compress-discovery.cjs`, and `scripts/parse-handoff.cjs` into `runtime/scripts/` with `.citadel` path updates
- portable concepts from `docs/ARCHITECTURE.md`, `docs/CAMPAIGNS.md`, and `docs/FLEET.md` rewritten as Codex-native docs
- a minimal skill baseline: `archon`, `fleet`, `session-handoff`, `systematic-debugging`
- `examples/campaign-example.md` for reference
- new root `README.md`, `.gitignore`, and `package.json` for the fork baseline

Defer for later adaptation:

- additional reusable skills such as `review`, `research`, `scaffold`, and `prd`
- agent prompt files under `agents/`
- assets that support richer documentation but are not needed for the first working baseline
- telemetry utilities beyond discovery compression

Do not copy as part of the baseline:

- `.claude/` project state and settings
- `.claude-plugin/` plugin manifest and installation surface
- `hooks/` and `hooks_src/`
- `scripts/install-hooks.js`
- `CLAUDE.md`, `README.md`, and `QUICKSTART.md` from upstream in their current form
- `skills/do/` and `skills/setup/`

## Why These Were Excluded

- `.claude*` content is tied to Claude-specific project state and plugin mechanics.
- hook files depend on Claude lifecycle events and environment variables such as `CLAUDE_PROJECT_DIR` and `CLAUDE_PLUGIN_ROOT`.
- `/do` and `/plugin` workflows assume a Claude command surface that does not exist in Codex.
- upstream top-level docs describe installation and operation as a Claude plugin, which would mislead users of this fork if copied directly.
