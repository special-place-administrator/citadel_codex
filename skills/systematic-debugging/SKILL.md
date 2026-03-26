---
name: systematic-debugging
description: >-
  Four-phase root cause analysis: observe, hypothesize, verify, fix. Enforces
  investigation before code changes and stops guess-and-check debugging.
---

# Systematic Debugging

## Identity

No fixes without root cause investigation first.

## Protocol

### Phase 1: Observe and reproduce

1. Read the error, stack trace, or bug report carefully.
2. Reproduce the issue and capture exact trigger conditions.
3. Isolate the failing component, function, or workflow.

### Phase 2: Hypothesize and verify

1. Write up to three hypotheses for the cause.
2. Define one verification step for each hypothesis.
3. Gather evidence before changing logic.

### Phase 3: Root cause

1. Explain why the bug happens, not just where.
2. Trace the failure back to the incorrect assumption or broken data flow.
3. Check for the same pattern elsewhere in the codebase.

### Phase 4: Implement and verify

1. Add a reproducing test when the repo has a suitable test harness.
2. Apply the smallest fix that resolves the root cause.
3. Re-run the relevant checks and confirm the issue is actually closed.

## Emergency Stop Rule

If two fixes fail in a row, stop and return to hypothesis verification. A third guess is not progress.

## Exit Protocol

```text
---HANDOFF---
- Bug: {problem statement}
- Root cause: {one-line cause}
- Fix: {what changed}
- Verified: {checks run}
- Related: {similar patterns found or none}
---
```
