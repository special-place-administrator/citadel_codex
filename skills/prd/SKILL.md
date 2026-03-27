---
name: prd
description: >-
  Generates a Product Requirements Document from a natural language app description.
  Asks clarifying questions, researches similar apps, defines scope, stack, architecture,
  and produces a structured PRD that can be decomposed into a campaign.
user-invocable: true
trigger_keywords:
  - prd
  - requirements
  - spec
  - plan an app
  - design an app
---

# Identity

PRD skill converts "I want an app that does X" into a structured document that
a campaign orchestrator can execute. It does NOT build anything. It produces
the spec that drives the build.

# When to Use

- User describes an app they want to build (greenfield mode)
- User wants to add a feature to an existing project (feature mode)
- User has a vague idea that needs structure
- Before starting any campaign for a new project or feature

# Mode Detection

**Greenfield mode**: No existing source files, or user explicitly says "new app" / "from scratch."

**Feature mode**: The project already has source files. The user describes a feature
to add, not a whole app ("add auth", "add a dashboard").

In feature mode:
- Read the existing file tree and package.json/equivalent before asking questions
- The existing stack is a given — don't recommend alternatives
- End conditions MUST include regression checks
- "Out of Scope" is relative to the feature, not the whole app

# Protocol

## Step 1: UNDERSTAND

Read the user's description. Determine mode (greenfield vs feature).

If any core aspects are unclear, ask up to 3 focused questions. Not a questionnaire.
Just the questions that would change the architecture.

## Step 2: RESEARCH (Optional)

If the app concept has well-known existing implementations:
- Investigate how similar apps typically work
- Identify 2-3 reference apps
- Note common features users expect

Skip this step if the concept is simple enough.

## Step 3: DEFINE

Produce a structured PRD. Write to `.citadel/research/prd-{slug}.md`:

```markdown
# PRD: {App Name or Feature Name}

> Description: {One sentence}
> Author: {user}
> Date: {ISO date}
> Status: draft
> Mode: {greenfield | feature}

## Problem
{What problem does this solve? Why does the user want it?}

## Users
{Who uses this? One or two user types max.}

## Core Features
{Numbered list. Maximum 5 for v1. Each feature is one sentence.}

## Out of Scope (v1)
{Things the user might expect but should NOT be built yet.}

## Technical Decisions
- **Frontend**: {recommendation with reasoning}
- **Backend**: {recommendation with reasoning, or "none"}
- **Database**: {recommendation with reasoning, or "none"}
- **Auth**: {recommendation, or "none"}
- **Deployment**: {recommendation}

## Architecture
{High-level description. 3-5 sentences max. How the pieces connect.}

## Integration Points (feature mode only)
- **Existing files modified**: {list}
- **New files created**: {list}
- **Dependencies added**: {new packages, if any}
- **Patterns followed**: {existing patterns to match}

## End Conditions (Definition of Done)
- [ ] {machine-verifiable condition}
- [ ] {machine-verifiable condition}

## Open Questions
{Anything that couldn't be decided.}
```

## Step 4: REVIEW

Present the PRD summary to the user and ask for approval.

## Step 5: HANDOFF

```
---HANDOFF---
- PRD: {app name}
- Document: .citadel/research/prd-{slug}.md
- Status: {approved | needs-revision}
- Next: Use the architect skill to produce a build plan
---
```

# What PRD Does NOT Do

- Build anything
- Choose a stack without reasoning
- Ask more than 3 clarifying questions
- Produce more than 1-2 pages

# Quality Gates

- Every feature in Core Features is one sentence
- Every technical decision has a reasoning ("because")
- End conditions are machine-verifiable
- Out of Scope section exists and has at least 2 items
- No more than 5 core features for v1
