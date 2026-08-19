# ClawOps baseline

- Recorded: 2026-08-19
- Upstream: `robsannaa/mission-control`
- Upstream commit: `4c64bab32390e9e8f863df5279133dbc22350c04`
- Package: `@openclaw/dashboard` v0.15.0
- Node.js: `v26.7.0`
- OpenClaw: `2026.7.1-2 (0790d9f)`
- Canonical workspace: `/home/misho/.openclaw/workspace`
- Project root: `/home/misho/.openclaw/workspace/projects`
- Mission Control config: no pre-existing installation/config found

## Upstream verification

- `npm ci`: succeeded (11 audit findings: 1 low, 2 moderate, 8 high)
- `npm test`: 373 passed, 3 failed, 1 skipped
- `npm run build`: succeeded under Node.js v26.7.0

## Pre-existing test failures

The three failures were observed before ClawOps changes:

1. awareness intake expected HTTP 201 but received 400;
2. awareness cron settle test requires the system `sqlite3` executable;
3. awareness durable-store test requires the system `sqlite3` executable.

ClawOps changes must not classify these as introduced regressions.
