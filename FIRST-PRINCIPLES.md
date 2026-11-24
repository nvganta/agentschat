# First principles

## Person and moment

A developer responsible for two or three related repositories, say a web app, an API and a shared library. A proposed change crosses their boundaries and they need to understand the consequences before deciding what to do. Today they open one agent session per repo and copy context between them.

## Job

I connect each repository and ask about a change, it gives me a discussion grounded in their code, so I can make and record a cross-repository decision.

## What works today

Judged by running it with `AGENTSCHAT_FAKE_AGENT=1` and three temporary Git fixtures:

- `npm ci` then `npm run dev` starts on a fresh machine. The SQLite database and its tables are created on first request; no `drizzle-kit push` is needed.
- Adding an agent checks that the path is a committed Git repository and says how to fix it when it is not. Each agent shows its folder and current branch.
- Each agent's prompt lists the other repositories in the room and asks it to flag impacts on them. Agents run sequentially and see earlier agents' replies in the same round. Agents get read-only tools (Read, Glob, Grep).
- The room has a "Decision & affected files" panel that saves per room and exports `decision.md`.
- With no key, the room still opens and the agent reply says Claude is not configured and how to fix it.
- The layout works at 390px with no horizontal scroll.

A real Claude-backed discussion has not been verified in this run, because it makes paid calls.

## What is fake, broken or a distraction

- The fake adapter is a verification tool. It is opt-in by environment variable and every reply starts with "[Test adapter, not AI]". It lists files; it does not analyse code.
- The decision is written by the developer. Nothing generates or checks it against the code.
- Codex and Gemini were disabled "coming soon" options. They were removed.
- PDF, URL and Notion context import still exist as optional per-agent context. They are not part of the core loop and were not verified in this run.
- `npx agentschat` clones the published repository, so it only reflects this work once merged.

## Finished for this run

- [x] Start locally with a fresh database and plain messages for missing prerequisites (Node version, Git, API key, non-repo folder).
- [x] Add repositories and see each agent's repo and branch.
- [x] Ask a question and see sequential, read-only, room-aware agent replies, verified with the labelled fake adapter.
- [x] Record a decision with affected files per repository, reload it, and export Markdown.
- [x] Check a 390px layout.
- [ ] A real provider-backed discussion that catches a cross-repo break unprompted.
- [ ] An unaided stranger test.
