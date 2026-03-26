# Campaigns

Campaigns are the persistence mechanism for multi-session work.

## Pipeline

Intake -> Brief -> Plan -> Build -> Verify -> Archive

## State Location

Campaign state lives in `.citadel/campaigns/`.

Each campaign file should record:

- direction: the original user request
- claimed scope: directories or files the campaign owns
- phases: ordered work units with clear done conditions
- feature ledger: what was actually built
- decision log: choices and rationale
- active context: current session status
- continuation state: the next step in machine-readable form

## Templates

Use `.citadel/templates/campaign.md` as the starting point for new campaigns.

Keep end conditions concrete. Prefer file existence checks, command success, or explicit review items over vague completion statements.
