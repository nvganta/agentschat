# Architecture

src/app: Next.js pages and API routes; src/lib/agents: agent runner and adapters; src/lib/context: imported context; src/lib/db: Drizzle and local SQLite.

## Constraints

Use a temporary DATABASE_PATH for tests. Agent calls require provider access and may cost money. Database push/migrate commands are explicit maintenance actions.

## Detailed references

See [DEVELOPMENT.md](DEVELOPMENT.md) for current package commands and configuration.

This is an orientation map of the current source, not proof that every integration works.
