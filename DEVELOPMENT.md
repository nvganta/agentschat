# Development

## Scope and prerequisites

Use a temporary DATABASE_PATH for tests. Agent calls require provider access and may cost money. Database push/migrate commands are explicit maintenance actions.

Commands below run from the repository root unless a `cd` is shown. Install the runtime required by the package manifest. For Node projects, preserve package-lock.json with `npm ci`; Quiet Orbit uses its pnpm lockfile; the voice service uses uv.lock. Installation may require network access.

## Commands

```text
npm ci
npm run dev
# Verification
npm run lint
npm test
npm run build
```

These commands come from the current manifests; they are not a claim that all checks passed during documentation setup. Check LOG.md for dated results. Builds may require configuration, downloads or external services.

## Configuration

Existing configuration examples: `.env.example`.

Use dummy examples for configuration shape only; supply real credentials outside version control. Client-prefixed variables are public. Export environment variables explicitly when the app has no dotenv loader.

## Source map

src/app: Next.js pages and API routes; src/lib/agents: agent runner and adapters; src/lib/context: imported context; src/lib/db: Drizzle and local SQLite.

## Next verification

Run an isolated two-agent room and verify context imports, failures, and read-only repository access.

## Repository check

`python scripts/check_repository.py` checks the documentation contract and tracked local-secret filenames. GitHub Actions runs this baseline check; it does not certify runtime or deployment readiness.
