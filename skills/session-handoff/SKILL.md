---
name: session-handoff
description: >-
  Summarize the current session into a compact HANDOFF block for the next
  session or delegated agent.
---

# Session Handoff

## Identity

Turn active work into a concise transfer block.

## Protocol

1. Review the changes made in the current session.
2. Review active campaign or fleet state in `.citadel/` if relevant.
3. Capture:
   - what changed
   - key decisions and reasons
   - blockers or open items
   - the immediate next step

## Output Format

```text
---HANDOFF---
- {what was built or changed}
- {key decisions and tradeoffs}
- {unresolved items or blockers}
- {next action for the next session}
---
```

Keep it short, specific, and actionable.
