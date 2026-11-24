# LOG.md

The founder's memory. Read this first every session. Update it before ending
any working session. Newest entries at the top.

## Status

- State: parked
- Live URL: none, runs locally via npx CLI
- Stranger test: not passing
- Currently working on: validate a real cross-repository discussion and an unaided stranger test
- Blocked on investor: nothing

## Decisions

- 2026-08-02: Added an npx CLI so setup is one command instead of a clone-and-configure ritual.
- 2026-02-11: Chose Next.js + Drizzle with local data; multi-agent chat state lives in the app, not a cloud service.

## Session notes

- 2026-11-24: Reviewed and finished the polish run. Each agent's prompt now lists the other repositories in the room. Decisions moved into the Drizzle schema. Upgraded next and eslint-config-next to 16.4.6 and shadcn to 4.23.0 after `npm audit fix`; audit went from 37 (2 critical) to 8 moderate, all in dev-only tooling. Turned off Next's AGENTS.md rewriting. Removed unused select and separator components. Lint, typecheck, 16 tests and build pass; a headless walk with three temp fixtures, the fake adapter and a no-key server passed at desktop and 390px. A real Claude discussion and the stranger test remain unverified.

- 2026-11-23: Added fresh SQLite initialization, Git repository and branch checks, a read-only tool restriction, a labelled fake adapter, and a saved Markdown decision; removed placeholder engines and improved setup and mobile layout. `npm run lint`, `npx tsc --noEmit`, `npm test` (15 tests), `npm run build`, and a headless Playwright three-fixture discussion/export walkthrough passed. The initial npm install failed on shared-cache permissions; retry with a local cache passed with 37 reported vulnerabilities. A real provider-backed discussion, context imports, published npx revision, and unaided stranger test remain unverified.

- 2026-09-10: Prepared a draft PR from an isolated working tree. Repository handoff and staged-diff checks pass in the isolated PR tree. This documentation PR does not claim a new application runtime acceptance test.


- 2026-09-10: Added repository orientation, agent handoff, setup/check instructions and a documentation CI baseline. Existing implementation and historical evidence remain in place; the repository handoff check and git diff --check passed. Runtime acceptance was not rerun unless a separate entry below explicitly records it. See DEVELOPMENT.md for verification gaps.

- 2026-08-25: Repo joined the Compass portfolio. LOG and FOUNDER stamped by the investor's setup pass. State recorded as parked since Aug 2.
