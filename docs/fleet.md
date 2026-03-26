# Fleet

Fleet is the parallel execution layer for work that decomposes into multiple non-overlapping streams.

## Core Idea

Wave-based execution lets multiple agents work in parallel, then share discoveries before the next wave starts.

## State Location

Fleet state lives in:

- `.citadel/fleet/briefs/`
- `.citadel/fleet/outputs/`
- `.citadel/templates/fleet-session.md`

## Required Invariants

- Same-wave scopes must not overlap.
- Each wave should produce a compressed discovery brief per agent.
- Later waves should start with the accumulated discoveries from earlier waves.
- Merge conflicts and blocked work must be written back into the fleet session state.

## Runtime Support

The current baseline includes helper scripts for scope coordination and discovery compression. Agent spawning and lifecycle integration remain a later Codex-native runtime task.
