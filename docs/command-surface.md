# Command Surface

Codex-native command surface replacing Claude's `/do` router and `/setup` skill.
All commands are explicit CLI invocations — no slash commands, no hook bus.

## CLI Entrypoint

```bash
node runtime/cli.js <command> [options]
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Create `.citadel/` state tree and sync templates |
| `status` | Show active campaigns, fleet sessions, intake, skills |
| `continue` | Resume the most recent active campaign or fleet session |
| `setup` | Detect project stack, generate `.citadel/config.json`, print reference card |
| `route "<text>"` | Classify intent and show routing target (for debugging routing) |

## Intent Router

The router (`core/router/classify-intent.js`) classifies input using three tiers:

**Tier 0 — Pattern Match** (cost: ~0, latency: <1ms)
Regex/keyword on raw input. Catches: status, continue, setup, init, review, research, scaffold, architect, prd, debug, handoff, campaign, fleet.

**Tier 1 — Active State Short-Circuit** (cost: ~0, latency: <100ms)
Scans `.citadel/campaigns/` and `.citadel/fleet/briefs/` for active work.
If found, routes to `continue`.

**Tier 2 — Skill Keyword Match** (cost: ~0, latency: <10ms)
Matches input against installed skills discovered from `skills/*/SKILL.md`.

**Tier 3 — LLM Classifier** (cost: varies, latency: network-bound, optional async fallback)
Called only when Tiers 0-2 all miss. Requires `CITADEL_LLM_ENDPOINT` env var. Uses an
OpenAI-compatible chat completions API (Ollama, OpenAI, Anthropic-compatible proxies).
Optional: `CITADEL_LLM_MODEL` (default: `gpt-4o-mini`), `CITADEL_LLM_API_KEY`.
Available via `classifyAsync()` — the synchronous `classify()` function is unchanged.

## Differences from Upstream Citadel

| Aspect | Upstream (`/do`) | Codex-native |
|--------|-------------------|--------------|
| Entry point | `/do [anything]` slash command | `node runtime/cli.js <command>` |
| Router config | `.claude/harness.json` | `.citadel/config.json` |
| Skill discovery | `.claude/skills/` + plugin built-ins | `skills/*/SKILL.md` |
| State directory | `.planning/` | `.citadel/` |
| Hook installation | `scripts/install-hooks.js` | Not needed (explicit invocation) |
| LLM classifier (Tier 3) | Yes | Yes — optional async fallback via `classifyAsync()` |

## npm Scripts

```bash
npm run init:state    # Alias for: node runtime/cli.js init
```

## Adding Commands

To add a new command:
1. Create `runtime/commands/<name>.js` exporting a `run()` function
2. Add it to the `COMMANDS` map in `runtime/cli.js`
3. Document it here
