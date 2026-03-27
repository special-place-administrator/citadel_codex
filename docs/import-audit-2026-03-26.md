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

- agent prompt files under `agents/`
- assets that support richer documentation
- remaining skills: `create-app`, `create-skill`, `marshal`, `doc-gen`, `refactor`, `test-gen`, `experiment`, `autopilot`, `live-preview`, `qa`, `postmortem`, `design`, `research-fleet`
- upstream `QUICKSTART.md` (needs full rewrite for Codex)

Ported since initial audit (2026-03-27):

- `skills/review/`, `skills/research/`, `skills/scaffold/`, `skills/prd/`, `skills/architect/` — adapted with .citadel paths and Claude refs removed
- `hooks_src/init-project.js` → `runtime/bootstrap/init-state.js` + `sync-templates.js`
- `hooks_src/post-edit.js` → `runtime/checks/post-edit.js`
- `hooks_src/quality-gate.js` → `runtime/checks/quality-gate.js`
- `hooks_src/circuit-breaker.js` → `runtime/checks/circuit-breaker.js`
- `skills/do/SKILL.md` → `core/router/classify-intent.js` + `runtime/commands/`
- `skills/setup/SKILL.md` → `runtime/commands/setup.js`

## Permanent Exclusions (Rejected)

These will NEVER be ported — they are structurally incompatible with Codex:

| Path | Reason |
|------|--------|
| `.claude/` | Claude-specific project state and settings directory |
| `.claude-plugin/` | Plugin manifest and installation surface |
| `hooks/hooks-template.json` | Hook bus configuration, replaced by explicit CLI |
| `hooks_src/harness-health-util.js` | Shared utility for hook-specific telemetry and config |
| `scripts/install-hooks.js` | Hook installer, not needed (no hook bus in Codex) |
| `docs/HOOKS.md` | Hook documentation, not applicable |
| `CLAUDE.md` (upstream) | Claude plugin installation instructions |

## Why These Were Excluded

- `.claude*` content is tied to Claude-specific project state and plugin mechanics.
- Hook files depend on Claude lifecycle events and environment variables (`CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`).
- The hook bus model (stdin JSON events, exit codes as signals) is replaced by explicit CLI invocation.
- `/do` and `/plugin` workflows assumed a Claude command surface — concepts were kept but interface was rebuilt.
- Upstream top-level docs describe installation as a Claude plugin, which would mislead Codex users.

See [migration-map.md](migration-map.md) for the complete file-by-file mapping.
