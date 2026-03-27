# Runtime Checks

Codex-native replacements for Claude hook-based verification.
These are explicit CLI commands — no hook bus, no stdin JSON protocol.

## Post-Edit Check

Per-file type checking and lint after editing a file.

```bash
node runtime/checks/post-edit.js --path <file>
```

**What it does:**
- Language-adaptive type checking (TypeScript via tsc, Python via mypy/pyright, Go via go vet, Rust via cargo check)
- Performance lint: detects `confirm()`, `alert()`, `prompt()`, `transition-all`

**Exit codes:** `0` = clean, `2` = type errors found

**When to run:** After editing source files. In a Codex workflow, invoke explicitly on files you've changed before committing.

## Quality Gate

Scans all git-changed files for anti-patterns.

```bash
node runtime/checks/quality-gate.js [--scope <dir>]
```

**What it does:**
- Finds changed files via `git diff --name-only HEAD`
- Checks against built-in rules: `no-confirm-alert`, `no-transition-all`, `no-magic-intervals`
- Optional `--scope` to limit scanning to a subdirectory

**Exit codes:** `0` = clean, `1` = violations found

**When to run:** Before finalizing work — equivalent to a pre-commit check.

## Circuit Breaker

Tracks consecutive failures and suggests strategy changes.

```bash
# Record a failure
node runtime/checks/circuit-breaker.js --record-failure [--tool <name>] [--error <msg>]

# Check current state
node runtime/checks/circuit-breaker.js --status

# Reset counters
node runtime/checks/circuit-breaker.js --reset
```

**What it does:**
- Tracks consecutive failures in `.citadel/telemetry/circuit-breaker.json`
- After 3 consecutive failures: suggests changing approach (exit code 1)
- After 5 lifetime trips: escalates to "stop and rethink" warning

**When to run:** When a tool or command fails repeatedly. Helps break out of retry loops.

## Differences from Upstream Citadel

| Aspect | Upstream (Claude hooks) | Codex-native |
|--------|------------------------|--------------|
| Trigger | Automatic via hook bus | Explicit CLI invocation |
| Input | stdin JSON event payload | CLI arguments |
| State | `.claude/` directory | `.citadel/telemetry/` |
| Config | `harness.json` + `health` module | Self-contained per command |
| Dependencies | `harness-health-util.js` | None (Node.js built-ins only) |
