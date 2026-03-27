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
| `skills/create-app/SKILL.md` | `skills/create-app/SKILL.md` | adapted | Stripped Claude refs, .planning→.citadel |
| `skills/create-skill/SKILL.md` | `skills/create-skill/SKILL.md` | adapted | Stripped 11 Claude refs, .planning→.citadel |
| `skills/marshal/SKILL.md` | `skills/marshal/SKILL.md` | adapted | .planning→.citadel, neutralized handoff |
| `skills/doc-gen/SKILL.md` | `skills/doc-gen/SKILL.md` | adapted | .planning→.citadel, removed Claude refs |
| `skills/refactor/SKILL.md` | `skills/refactor/SKILL.md` | adapted | .planning→.citadel, removed Claude refs |
| `skills/test-gen/SKILL.md` | `skills/test-gen/SKILL.md` | adapted | .planning→.citadel, removed Claude refs |
| `skills/experiment/SKILL.md` | `skills/experiment/SKILL.md` | adapted | .planning→.citadel, removed Claude refs |
| `skills/autopilot/SKILL.md` | `skills/autopilot/SKILL.md` | adapted | .planning→.citadel, removed Claude refs |
| `skills/live-preview/SKILL.md` | `skills/live-preview/SKILL.md` | adapted | .planning→.citadel, removed Claude refs |
| `skills/qa/SKILL.md` | `skills/qa/SKILL.md` | adapted | .planning→.citadel, removed Claude refs |
| `skills/postmortem/SKILL.md` | `skills/postmortem/SKILL.md` | adapted | .planning→.citadel, removed Claude refs |
| `skills/design/SKILL.md` | `skills/design/SKILL.md` | adapted | .planning→.citadel, removed Claude refs |
| `skills/research-fleet/SKILL.md` | `skills/research-fleet/SKILL.md` | adapted | .planning→.citadel, removed Claude refs |
| `agents/arch-reviewer.md` | `agents/arch-reviewer.md` | adapted | .planning→.citadel, neutralized Claude refs |
| `agents/archon.md` | `agents/archon.md` | adapted | .planning→.citadel, neutralized Claude refs |
| `agents/fleet.md` | `agents/fleet.md` | adapted | .planning→.citadel, neutralized Claude refs |
| `agents/knowledge-extractor.md` | `agents/knowledge-extractor.md` | adapted | .planning→.citadel, neutralized Claude refs |
| `docs/SKILLS.md` | `docs/SKILLS.md` | adapted | Written as Codex-native skill reference |
| `docs/HOOKS.md` | — | rejected | Hook documentation, not applicable |
| `QUICKSTART.md` | `QUICKSTART.md` | adapted | Rewritten for Codex-native workflow |
