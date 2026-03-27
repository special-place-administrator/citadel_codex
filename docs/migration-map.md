# Migration Map

Upstream: `C:\Users\rakovnik\Citadel`
Target: `E:\project\citadel_codex`

## Status Legend

- **imported**: Copied with minimal changes
- **adapted**: Ported with Claude-specific logic removed/rewritten
- **deferred**: Useful but waiting on runtime foundation
- **rejected**: Not part of Codex architecture (permanent exclusion)

## File Map

| Upstream Path | Codex Destination | Status | Rationale |
|---|---|---|---|
| `.citadel/templates/campaign.md` | `.citadel/templates/campaign.md` | imported | Neutral state template |
| `.citadel/templates/fleet-session.md` | `.citadel/templates/fleet-session.md` | imported | Neutral state template |
| `.citadel/templates/intake-item.md` | `.citadel/templates/intake-item.md` | imported | Neutral state template |
| `docs/examples/campaign-example.md` | `docs/examples/campaign-example.md` | imported | Documentation |
| `scripts/coordination.js` | `runtime/scripts/coordination.js` | imported | Runtime utility |
| `scripts/compress-discovery.cjs` | `runtime/scripts/compress-discovery.cjs` | imported | Runtime utility |
| `scripts/parse-handoff.cjs` | `runtime/scripts/parse-handoff.cjs` | imported | Runtime utility |
| `hooks_src/init-project.js` | `runtime/bootstrap/init-state.js` + `sync-templates.js` | adapted | Rebuilt as explicit CLI, dropped CLAUDE_PROJECT_DIR and plugin-root refs |
| `hooks_src/post-edit.js` | `runtime/checks/post-edit.js` | adapted | Dropped stdin JSON protocol, health module, CLAUDE env |
| `hooks_src/quality-gate.js` | `runtime/checks/quality-gate.js` | adapted | Dropped hook context, health module, made CLI-driven |
| `hooks_src/circuit-breaker.js` | `runtime/checks/circuit-breaker.js` | adapted | State moved to .citadel/telemetry/, CLI flags replace stdin |
| `skills/do/SKILL.md` | `core/router/classify-intent.js` + `runtime/commands/` | adapted | Routing concepts kept, slash commands replaced with CLI |
| `skills/setup/SKILL.md` | `runtime/commands/setup.js` | adapted | Stack detection kept, hook install and CLAUDE.md generation dropped |
| `skills/archon/SKILL.md` | `skills/archon/SKILL.md` | imported | Already portable |
| `skills/fleet/SKILL.md` | `skills/fleet/SKILL.md` | imported | Already portable |
| `skills/session-handoff/SKILL.md` | `skills/session-handoff/SKILL.md` | imported | Already portable |
| `skills/systematic-debugging/SKILL.md` | `skills/systematic-debugging/SKILL.md` | imported | Already portable |
| `skills/review/SKILL.md` | `skills/review/SKILL.md` | adapted | Removed CLAUDE.md references in convention loading |
| `skills/research/SKILL.md` | `skills/research/SKILL.md` | adapted | Changed .planning/ to .citadel/ paths |
| `skills/scaffold/SKILL.md` | `skills/scaffold/SKILL.md` | adapted | Removed /do and /setup references |
| `skills/prd/SKILL.md` | `skills/prd/SKILL.md` | adapted | Changed .planning/ to .citadel/, removed /do references |
| `skills/architect/SKILL.md` | `skills/architect/SKILL.md` | adapted | Changed .planning/ to .citadel/, neutralized handoff |
| `.claude/` | — | rejected | Claude-specific state directory |
| `.claude-plugin/` | — | rejected | Plugin manifest, not applicable |
| `hooks/hooks-template.json` | — | rejected | Hook bus config, replaced by explicit CLI |
| `hooks_src/harness-health-util.js` | — | rejected | Hook-specific shared utility |
| `scripts/install-hooks.js` | — | rejected | Hook installer, not needed |
| `skills/create-app/SKILL.md` | — | deferred | Complex, depends on full orchestrator stack |
| `skills/create-skill/SKILL.md` | — | deferred | Useful, waiting on skill registration infra |
| `skills/marshal/SKILL.md` | — | deferred | Single-session orchestrator, needs runtime |
| `skills/doc-gen/SKILL.md` | — | deferred | Documentation generator |
| `skills/refactor/SKILL.md` | — | deferred | Refactoring orchestrator |
| `skills/test-gen/SKILL.md` | — | deferred | Test generation |
| `skills/experiment/SKILL.md` | — | deferred | Metric-driven optimization |
| `skills/autopilot/SKILL.md` | — | deferred | Intake pipeline automation |
| `skills/live-preview/SKILL.md` | — | deferred | Browser-based preview |
| `skills/qa/SKILL.md` | — | deferred | Browser QA via Playwright |
| `skills/postmortem/SKILL.md` | — | deferred | Campaign postmortem |
| `skills/design/SKILL.md` | — | deferred | Design manifest |
| `skills/research-fleet/SKILL.md` | — | deferred | Multi-scout research |
| `agents/` | — | deferred | Agent configs, needs Codex agent model |
| `docs/SKILLS.md` | — | deferred | Skill reference doc |
| `docs/HOOKS.md` | — | rejected | Hook documentation, not applicable |
| `QUICKSTART.md` | — | deferred | Needs rewrite for Codex |
