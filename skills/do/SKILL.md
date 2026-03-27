---
name: do
description: >-
  Unified router that auto-routes user intent to the right orchestrator or skill.
  Classifies input by scope, complexity, persistence needs, and parallelism, then
  dispatches to the cheapest path that can handle it: direct action, skill, marshal,
  archon, or fleet. Single entry point for all work.
user-invocable: true
auto-trigger: false
trigger_keywords:
  - do
  - just do it
  - handle this
  - figure it out
last-updated: 2026-03-27
---

# do — Unified Intent Router

## Identity

You are the single entry point for all work. The user says what they want.
You figure out which orchestrator or skill handles it. No more choosing between
marshal, archon, fleet, or individual skills.

## Orientation

Use `do` when the user wants something done but doesn't know (or care) which
tool handles it. The router biases aggressively toward the cheapest path —
under-routing (skill fails, user re-invokes) is far cheaper than over-routing
(archon spends 30 minutes on a typo fix).

## Commands

| Command | Behavior |
|---|---|
| `do [anything]` | Classify intent, route to cheapest capable path |
| `do status` | Show active campaigns, fleet sessions, pending intake |
| `do continue` | Resume most recent active campaign or fleet session |
| `do --list` | Show all skills grouped by category with trigger keywords |

## Protocol

Classification runs top-to-bottom. First match wins. Each tier is cheaper than the next.

### Step 0: Skill Registry Check (Cost: ~0 on hit)

Before routing, verify the skill registry is current.

1. Scan `skills/` for all directories containing `SKILL.md`
2. Read only lines 1-10 of each SKILL.md (frontmatter: `name`, `description`, `trigger_keywords`)
3. Build the in-session routing table from frontmatter

**This means:**
- Every invocation has a current view of all installed skills
- New skill dropped in? Routes immediately on next invocation
- No registration step required — discovery is automatic

### Tier 0: Pattern Match (Cost: ~0 tokens | Latency: instant)

Regex/keyword on raw input. Catches trivial commands and well-known skill triggers:

| Pattern | Action |
|---|---|
| "status" | Show active campaigns, fleet sessions, pending intake |
| "continue" or "keep going" or "resume" | Resume active campaign or fleet session |
| "review", "code review" | Invoke skill: `review` |
| "research fleet", "multi-scout", "parallel research" | Invoke skill: `research-fleet` |
| "research", "investigate", "look into" | Invoke skill: `research` |
| "scaffold", "new module", "new component" | Invoke skill: `scaffold` |
| "architect", "architecture" | Invoke skill: `architect` |
| "prd", "requirements", "spec" | Invoke skill: `prd` |
| "debug", "root cause", "diagnose" | Invoke skill: `systematic-debugging` |
| "handoff", "session summary" | Invoke skill: `session-handoff` |
| "campaign", "multi-session", "phases" | Invoke skill: `archon` |
| "fleet", "parallel", "multiple agents" | Invoke skill: `fleet` |
| "marshal", "orchestrate", "chain skills", "multi-step" | Invoke skill: `marshal` |
| "document", "docs", "docstring", "readme" | Invoke skill: `doc-gen` |
| "refactor", "rename", "extract", "split file" | Invoke skill: `refactor` |
| "test-gen", "generate tests", "write tests" | Invoke skill: `test-gen` |
| "design manifest", "style guide", "visual consistency" | Invoke skill: `design` |
| "create skill", "new skill", "repeated pattern" | Invoke skill: `create-skill` |
| "triage", "prioritize", "classify issues" | Invoke skill: `triage` |
| "experiment", "optimize", "A/B", "measure" | Invoke skill: `experiment` |
| "create app", "new app", "build app", "full-stack" | Invoke skill: `create-app` |
| "autopilot", "intake pipeline", "auto-deliver" | Invoke skill: `autopilot` |
| "postmortem", "retrospective", "lessons learned" | Invoke skill: `postmortem` |
| "live preview", "visual check", "screenshot" | Invoke skill: `live-preview` |
| "qa", "playwright", "browser test", "e2e test" | Invoke skill: `qa` |

If matched → read the skill's SKILL.md and follow its instructions. Done.

### Tier 1: Active State Short-Circuit (Cost: ~0 tokens | Latency: <100ms)

Check for active campaigns or fleet sessions:

1. Scan `.citadel/campaigns/` for files with `Status: active`
2. Scan `.citadel/fleet/briefs/` for files with `status: active` or `needs-continue`
3. If input scope matches an active campaign → invoke archon to continue it
4. If fleet session needs continuation → invoke fleet to continue it

If matched → resume the active work. Done.

### Tier 2: Skill Keyword Match (Cost: ~0 tokens | Latency: <10ms)

Match input against installed skill names and directory names from `skills/*/SKILL.md`.

If ONE skill matches → invoke it directly. Done.
If MULTIPLE skills match → fall through to Tier 3.

### Tier 3: LLM Complexity Classifier (Cost: ~500 tokens | Latency: ~1-2s)

When Tiers 0-2 don't resolve, classify across 6 dimensions:

```
SCOPE: single-file | single-domain | cross-domain | platform-wide
COMPLEXITY: 1 (trivial) | 2 (simple) | 3 (moderate) | 4 (complex) | 5 (campaign)
INTENT: fix | build | create | add | audit | redesign | research | improve
REQUIRES_PERSISTENCE: true | false (multi-session?)
REQUIRES_PARALLEL: true | false (independent sub-tasks?)
REQUIRES_TASTE: true | false (quality judgment beyond tests?)
```

**Routing rules (first match wins):**

| Condition | Route |
|---|---|
| INTENT is "create", Complexity >= 3 | `create-app` |
| INTENT is "create", Complexity <= 2 | `scaffold` |
| INTENT is "add", existing source files present | `create-app` (feature mode) |
| INTENT is "add", no existing source files | `scaffold` |
| Complexity 1, single skill match | Skill directly |
| Complexity 1, no skill match | Do it yourself (direct action) |
| Complexity 2, single domain | `marshal` |
| Complexity 2-3, known skill domain | Skill, with marshal fallback |
| Complexity 3, cross-domain | `marshal` |
| Complexity 3-4, requires persistence | `archon` |
| Complexity 4, requires taste/judgment | `archon` |
| Complexity 4-5, requires parallel | `fleet` |
| Complexity 5, platform-wide | `fleet` |
| Confidence < 0.7 | `marshal` (safe default) |

**Important:** A repeated pattern complaint ("I keep doing X manually", "the agent
always makes this mistake") should route to `create-skill`. A repeated pattern
is a skill waiting to be extracted.

### After Classification

1. Announce the routing decision: "Routing to [target] because [one-sentence reason]"
2. Read the target skill's SKILL.md and follow its instructions
3. If the target fails or the user says "wrong tool", try the next tier up

## do status

Show the current state of orchestration:

```
=== Citadel Codex Status ===

Campaigns:
  {slug}: {status} — Phase {N}/{total} — {direction summary}
  (none active)

Fleet Sessions:
  {slug}: {status} — Wave {N} — {agents} agents
  (none active)

Intake:
  {N} pending items in .citadel/intake/
  Invoke autopilot to process them.

Skills: {N} installed
```

## do --list

List all installed skills:

```
=== Installed Skills ===

ORCHESTRATION
  do [intent]            Universal router (this skill)
  marshal [direction]    Single-session orchestrator
  archon [direction]     Multi-session campaigns
  fleet [direction]      Parallel campaigns with coordination safety
  autopilot              Intake-to-delivery pipeline

APP CREATION
  prd                    Product requirements document
  architect              Implementation architecture from PRD
  create-app             End-to-end app creation (5 tiers)

CODE QUALITY
  review                 5-pass structured code review
  test-gen               Generate tests that actually run
  refactor               Safe multi-file refactoring
  qa                     Browser QA via Playwright

RESEARCH & DEBUGGING
  research               Structured investigation with findings
  research-fleet         Parallel multi-scout research
  experiment             Metric-driven optimization loops
  systematic-debugging   Root cause analysis (4-phase)

DOCUMENTATION & DESIGN
  doc-gen                Documentation generation (3 modes)
  design                 Design manifest generator
  postmortem             Campaign postmortem
  live-preview           Mid-build visual verification

META
  scaffold               Project-aware scaffolding
  create-skill           Create new skills from patterns
  session-handoff        Session context transfer
  triage                 Issue classification and prioritization
```

## Escape Hatches

Direct skill invocation ALWAYS works and bypasses the router. If you know
exactly what skill you want, invoke it directly — don't go through `do`.

The router is additive, not a gate. Power users who know what they want
should use direct invocation.

## Quality Gates

- Tiers 0-2 must resolve instantly (no API calls, no LLM tokens)
- Tier 3 classification must be transparent (announce reasoning)
- Never route a trivial task (complexity 1) to archon or fleet
- Never route a multi-session task to a bare skill
- If routing fails, default to marshal (safe middle ground)

## Exit Protocol

After routing and execution complete:
- If the routed skill produces a HANDOFF, relay it to the user
- If the task was trivial (Tier 0), just show the result
- Do not add overhead to simple tasks
