# Codex Baseline Bootstrap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Codex note:** This baseline is being executed natively in the current session.

**Goal:** Establish the first Codex-native Citadel baseline by importing only portable concepts, state templates, and runtime helpers.

**Architecture:** Keep orchestration concepts and state models from Citadel, but relocate persistent state into `.citadel/` and place executable helpers under `runtime/`. Exclude Claude plugin, hook, and slash-command assumptions until a Codex-native runtime exists.

**Tech Stack:** Markdown, Node.js built-in modules, git

---

### Task 1: Compare source and target repositories

**Files:**
- Review: `C:\Users\rakovnik\Citadel`
- Review: `E:\project\citadel_codex`
- Write: `docs/import-audit-2026-03-26.md`

**Step 1: Inventory the target repo**

Run: `Get-ChildItem -Force E:\project\citadel_codex`
Expected: only `.git` metadata and `LICENSE`

**Step 2: Inventory the source repo**

Run: `Get-ChildItem -Force C:\Users\rakovnik\Citadel`
Expected: orchestration docs, skills, scripts, hooks, and Claude-specific plugin surfaces

**Step 3: Classify portable vs non-portable content**

Expected: templates, coordination, and handoff logic are portable; plugin, hooks, and `/do` surfaces are not

### Task 2: Scaffold the Codex-native baseline

**Files:**
- Create: `.citadel/`
- Create: `core/README.md`
- Create: `docs/architecture.md`
- Create: `docs/campaigns.md`
- Create: `docs/fleet.md`
- Create: `README.md`
- Create: `.gitignore`
- Create: `package.json`

**Step 1: Create neutral state directories**

Expected: `.citadel/campaigns`, `.citadel/coordination`, `.citadel/fleet`, `.citadel/intake`, `.citadel/templates`

**Step 2: Add root metadata**

Expected: repository explains Codex-native direction and runtime state conventions

### Task 3: Import the minimum reusable runtime helpers

**Files:**
- Create: `runtime/scripts/coordination.js`
- Create: `runtime/scripts/compress-discovery.cjs`
- Create: `runtime/scripts/parse-handoff.cjs`

**Step 1: Move portable scripts into `runtime/scripts/`**

Expected: helper scripts exist without `.claude` or Claude plugin env assumptions

**Step 2: Rewrite state paths to `.citadel/`**

Expected: generated claims, briefs, and telemetry target the new state directory

### Task 4: Seed a minimal skill set

**Files:**
- Create: `skills/archon/SKILL.md`
- Create: `skills/fleet/SKILL.md`
- Create: `skills/session-handoff/SKILL.md`
- Create: `skills/systematic-debugging/SKILL.md`

**Step 1: Keep portable process logic**

Expected: the skills preserve campaign, fleet, debugging, and handoff concepts

**Step 2: Remove Claude-specific command surfaces**

Expected: no `/do`, `/plugin`, `.claude`, or Claude plugin references remain in the imported baseline skills

### Task 5: Preserve examples and templates

**Files:**
- Copy: `.citadel/templates/*.md`
- Copy: `docs/examples/campaign-example.md`

**Step 1: Import reusable templates**

Expected: campaign, fleet session, and intake templates are available immediately

**Step 2: Keep a concrete example**

Expected: the example campaign remains available as a reference for future runtime work
