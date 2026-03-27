---
name: architect
description: >-
  Given a PRD, produces an implementation architecture: file tree, component
  breakdown, data model, and a phased build plan with end conditions that
  a campaign orchestrator can execute directly. Multi-candidate evaluation
  for key decisions.
user-invocable: true
trigger_keywords:
  - architect
  - architecture
  - design the system
  - file structure
  - plan the build
---

# Identity

Architect skill converts a PRD into a buildable plan. It decides HOW to implement
what the PRD describes. Its output is a campaign-ready architecture document.

# When to Use

- After a PRD is approved (greenfield or feature mode)
- When the user has a clear direction + existing codebase
- When the user has a spec and wants a build plan

# Inputs

One of:
1. A PRD file path — preferred, contains structured requirements
2. A user-provided spec + existing codebase — sufficient
3. Neither — suggest creating a PRD first, but don't hard-gate

# Mode Detection

**Greenfield mode**: PRD with `Mode: greenfield`, or no existing source files.
Produces a complete architecture from scratch.

**Feature mode**: PRD with `Mode: feature`, OR the user describes a feature
and the project has existing source files.

In feature mode:
- Read the existing file tree FIRST
- File Tree section shows ONLY new and modified files
- Phases include a Phase 0: "Baseline" that records current typecheck/test state
- Every phase's end conditions include "no new typecheck errors" and "existing tests pass"

# Protocol

## Step 1: READ

**If PRD exists**, read it. Extract core features, technical decisions, end conditions, out of scope, integration points.

**If no PRD**, read the codebase. Scan file tree, read package.json/equivalent, read main entry points. Use the user's description as the feature spec.

## Step 2: EVALUATE OPTIONS

For any architectural decision where multiple valid approaches exist:
1. Generate 2-3 candidate approaches
2. For each candidate, assess: complexity, risk, maintainability, LLM-friendliness
3. Pick the winner. Document why.

Key decisions warranting multi-candidate evaluation:
- State management approach
- API structure
- Auth implementation pattern
- Database schema design
- Routing strategy

## Step 3: PRODUCE

Write to `.citadel/research/architecture-{slug}.md`:

```markdown
# Architecture: {App Name}

> PRD: .citadel/research/prd-{slug}.md
> Date: {ISO date}

## File Tree
{Greenfield: complete file tree. Feature mode: ONLY new and modified files.}

## Component Breakdown
### Feature: {name}
- Files: {list}
- Dependencies: {what must exist first}
- Complexity: {low/medium/high}

## Data Model
### {Entity name}
- Fields: {name: type}
- Relationships: {connections}

## Key Decisions
### {Decision}: {What was chosen}
- **Chosen**: {approach} — because {reasoning}
- **Rejected**: {alternative} — because {why not}

## Build Phases
### Phase 1: {name}
- **Goal**: {one sentence}
- **Files**: {files created or modified}
- **Dependencies**: {what must exist first, or "none"}
- **End Conditions**:
  - [ ] {machine-verifiable condition}

## Phase Dependency Graph
Phase 1 → Phase 2 → Phase 3

## Risk Register
1. {risk}: {mitigation}
2. {risk}: {mitigation}
3. {risk}: {mitigation}
```

## Step 4: CONNECT TO CAMPAIGN

Convert the architecture into a campaign-ready format:
1. Each build phase becomes a campaign phase
2. End conditions become Phase End Conditions
3. Dependency graph determines phase ordering
4. Parallel-safe phases get flagged for potential fleet execution

Present the summary to the user and ask for approval.

## Step 5: HANDOFF

```
---HANDOFF---
- Architecture: {app name}
- Document: .citadel/research/architecture-{slug}.md
- Phases: {count}
- Estimated complexity: {low/medium/high}
- Next: Campaign ready to execute
---
```

# What Architect Does NOT Do

- Build anything (produces the plan, not the code)
- Skip multi-candidate evaluation for key decisions
- Create phases without end conditions
- Ignore the PRD's "out of scope" section
- Produce a file tree with "..." placeholders

# Quality Gates

- Every phase has at least one machine-verifiable end condition
- Every key decision documents what was rejected and why
- File tree is complete (no placeholders)
- Phase dependencies are explicit
- Risk register has at least 2 entries
