---
name: fleet
description: >-
  Parallel campaign coordinator. Splits work into non-overlapping waves, shares
  discoveries between waves, and records the state in `.citadel/fleet/`.
---

# Fleet

## Identity

Fleet coordinates parallel workstreams. It exists for tasks that can be decomposed into multiple independent scopes without same-wave file collisions.

## When To Use

- Work naturally splits into 3 or more streams.
- Scopes can be isolated by directory or subsystem.
- Later work benefits from discoveries made in earlier waves.

## Protocol

1. Read repository guidance and active `.citadel/coordination/` claims.
2. Build a work queue with scope, dependencies, wave number, and responsible agent type.
3. Ensure same-wave scopes do not overlap.
4. Run the wave, collect outputs, and extract HANDOFF data.
5. Compress each output into a discovery brief for the next wave.
6. Update the fleet session file with results, discoveries, blockers, and next-wave state.
7. Re-run project verification after merging wave results.

## Quality Gates

- Same-wave scopes never overlap.
- Every wave produces usable discovery briefs.
- Shared context grows between waves instead of being re-discovered.

## Exit Protocol

```text
---HANDOFF---
- Fleet session: {name}
- Wave completed: {wave number}
- Discoveries: {critical shared findings}
- Blockers: {merge conflicts, failed streams, or none}
- Next: {next wave or verification step}
---
```
