# AgentsChat

AgentsChat helps a developer discuss a change across related local Git repositories. Add one Claude agent per repository, ask a question, and record the decision and affected files in the room. Agents have read-only code tools; they do not edit your files. Conversations and decisions are stored in local SQLite.

## Run locally

You need Git and Node.js 20.9 or newer (a current LTS release is recommended), plus an Anthropic API key for real agent responses. From this checkout:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The database is created automatically in `data/agentschat.db`. Create a room, add at least two committed Git repositories using absolute paths, and ask what your planned change affects. Add a key in each agent's settings, or set `ANTHROPIC_API_KEY` in your environment before starting. Without a key the room opens, and the agent explains how to configure it. Claude usage incurs provider charges.

Open **Decision & affected files** in the room to write and save the agreed outcome, then export it as Markdown. The decision is authored by you; it is not an automatically verified inventory.

The published `npx agentschat` launcher clones the public repository, so it runs the published revision rather than uncommitted changes in this checkout. The local commands above are the way to try this worktree.

## Verification without provider calls

Set `AGENTSCHAT_FAKE_AGENT=1` before starting the server to use the deterministic test adapter. Its responses are explicitly labelled and only list top-level files; they are not code analysis. Set `DATABASE_PATH` to an isolated path for tests. Do not use fake mode to make product decisions.

```sh
npm run lint
npx tsc --noEmit
npm test
npm run build
```

PDF, URL and Notion imports remain available as optional context, but are not part of the verified cross-repository loop. See [DEVELOPMENT.md](DEVELOPMENT.md) for repository guidance and [LOG.md](LOG.md) for current verification gaps.
