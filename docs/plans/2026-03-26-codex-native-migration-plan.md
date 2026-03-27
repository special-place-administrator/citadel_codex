# Codex Native Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Codex note:** This plan is intended for the next execution phase in `E:\project\citadel_codex`.

**Goal:** Turn the current bootstrap baseline into a usable Codex-native orchestration repo by rebuilding the missing runtime layer, porting the highest-value reusable skills, and replacing Claude-bound setup/router behavior with Codex-specific equivalents.

**Architecture:** Keep Citadel's durable state model and orchestration ladder, but move runtime behavior into explicit Codex commands and scripts instead of Claude hooks and plugin lifecycle events. Treat the upstream Citadel repo as a source of concepts and selectively reusable logic, not as a codebase to mirror wholesale.

**Tech Stack:** Markdown, Node.js built-ins, git, Codex tool/runtime conventions

---

### Task 1: Build the Codex-native runtime bootstrap

**Files:**
- Create: `runtime/cli.js`
- Create: `runtime/bootstrap/init-state.js`
- Create: `runtime/bootstrap/sync-templates.js`
- Modify: `package.json`
- Reference: `C:\Users\rakovnik\Citadel\hooks_src\init-project.js`

**Step 1: Write the failing bootstrap expectation**

Document expected behavior in a smoke script or checklist:
- `node runtime/cli.js init` creates the `.citadel/` directory tree if missing
- templates from `.citadel/templates/` are copied or verified in place
- no `.claude/`, plugin, or hook assumptions are introduced

**Step 2: Implement minimal state initialization**

Add `runtime/bootstrap/init-state.js` to create:
- `.citadel/campaigns/`
- `.citadel/coordination/{claims,instances}/`
- `.citadel/fleet/{briefs,outputs}/`
- `.citadel/{intake,postmortems,research,screenshots,telemetry}/`

**Step 3: Implement template synchronization**

Add `runtime/bootstrap/sync-templates.js` to ensure the tracked templates remain available for new repos or resync operations without copying upstream plugin internals.

**Step 4: Expose a CLI entrypoint**

Update `package.json` scripts so `npm run init:state` and `node runtime/cli.js init` both work.

**Step 5: Verify**

Run:
- `node runtime/cli.js init`
- `git status --short`
Expected:
- no errors
- only intended `.citadel/` state effects

### Task 2: Rebuild the missing runtime checks as explicit Codex commands

**Files:**
- Create: `runtime/checks/post-edit.js`
- Create: `runtime/checks/quality-gate.js`
- Create: `runtime/checks/circuit-breaker.js`
- Create: `docs/runtime.md`
- Reference: `C:\Users\rakovnik\Citadel\hooks_src\post-edit.js`
- Reference: `C:\Users\rakovnik\Citadel\hooks_src\quality-gate.js`
- Reference: `C:\Users\rakovnik\Citadel\hooks_src\circuit-breaker.js`

**Step 1: Define what survives the migration**

Keep:
- per-file or per-scope verification logic
- anti-pattern scanning
- failure-loop detection concepts

Drop:
- Claude hook event payload dependence
- `CLAUDE_PROJECT_DIR`
- automatic lifecycle wiring

**Step 2: Implement command-driven equivalents**

Design them as explicit invocations such as:
- `node runtime/checks/post-edit.js --path runtime/scripts/coordination.js`
- `node runtime/checks/quality-gate.js --scope .`

**Step 3: Document invocation model**

Write `docs/runtime.md` to explain how Codex should call these checks during normal work since there is no Claude hook bus.

**Step 4: Verify**

Run each command on a known file and confirm exit codes and output shape are stable.

### Task 3: Replace `/do` and `setup` with a Codex-native command surface

**Files:**
- Create: `core/router/classify-intent.js`
- Create: `runtime/commands/status.js`
- Create: `runtime/commands/continue.js`
- Create: `runtime/commands/setup.js`
- Create: `docs/command-surface.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\do\SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\setup\SKILL.md`

**Step 1: Extract router requirements from upstream**

Keep the useful routing concepts:
- cheapest-capable-path bias
- active campaign continuation
- skill keyword matching
- escalation from direct execution to orchestrators

**Step 2: Redefine the interface for Codex**

Replace slash commands with explicit runtime commands or documented operating patterns:
- `node runtime/cli.js status`
- `node runtime/cli.js continue`
- `node runtime/cli.js setup`

**Step 3: Implement the minimum viable router**

Start with:
- active campaign detection from `.citadel/campaigns/`
- fleet continuation detection from `.citadel/fleet/`
- static skill registry from `skills/*/SKILL.md`

**Step 4: Verify**

Run the commands in an empty-state repo and in a repo with a seeded campaign file.

### Task 4: Port the next high-value skills

**Files:**
- Create: `skills/review/SKILL.md`
- Create: `skills/research/SKILL.md`
- Create: `skills/scaffold/SKILL.md`
- Create: `skills/prd/SKILL.md`
- Create: `skills/architect/SKILL.md`
- Modify: `README.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\review\SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\research\SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\scaffold\SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\prd\SKILL.md`
- Reference: `C:\Users\rakovnik\Citadel\skills\architect\SKILL.md`

**Step 1: Port the least Claude-bound skills first**

Prioritize:
1. `review`
2. `research`
3. `scaffold`
4. `prd`
5. `architect`

**Step 2: Remove Claude-only assumptions during porting**

Eliminate:
- `/do` references
- `.claude/skills/`
- CLAUDE.md-specific instructions where a repo-level equivalent is better

**Step 3: Update repository documentation**

Expand `README.md` with the current supported skill set and the new command surface.

**Step 4: Verify**

Search the target repo for:
- `CLAUDE_PROJECT_DIR`
- `CLAUDE_PLUGIN_ROOT`
- `/do`
- `/plugin`
Expected:
- only migration notes and audit docs mention them

### Task 5: Add verification and migration documentation

**Files:**
- Create: `tests/runtime/coordination.smoke.ps1`
- Create: `tests/runtime/discovery-compression.smoke.ps1`
- Create: `docs/migration-map.md`
- Modify: `docs/architecture.md`

**Step 1: Add smoke checks for current runtime helpers**

Cover:
- `runtime/scripts/coordination.js`
- `runtime/scripts/compress-discovery.cjs`
- `runtime/scripts/parse-handoff.cjs`

**Step 2: Write a migration map**

Create `docs/migration-map.md` with a table:
- upstream path
- Codex-native destination
- action: imported, adapted, deferred, or rejected
- rationale

**Step 3: Update architecture docs**

Make `docs/architecture.md` reflect the real command/runtime model after Tasks 1-4 land.

**Step 4: Verify**

Run:
- smoke scripts
- `node --check` for all runtime `.js` and `.cjs` files
- `git diff --stat`

### Task 6: Decide what never gets ported

**Files:**
- Modify: `docs/import-audit-2026-03-26.md`
- Modify: `docs/migration-map.md`

**Step 1: Mark permanent exclusions**

Likely permanent exclusions:
- `.claude-plugin/`
- `hooks/hooks-template.json`
- `scripts/install-hooks.js`
- direct hook wiring from `hooks_src/`

**Step 2: Separate rejected from deferred**

Rejected means not part of the Codex architecture.
Deferred means still useful but waiting on the runtime foundation.

**Step 3: Verify**

Ensure the docs clearly distinguish:
- what was already adapted
- what is next
- what is intentionally out of scope
