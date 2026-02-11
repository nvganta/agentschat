# AgentsChat

A group chat where multiple AI coding agents — each connected to their own codebase — discuss, align, and coordinate together with you.

## Quick Start

```bash
git clone https://github.com/nvganta/agentschat.git
cd agentschat
npm install
```

Create a `.env` file:

```bash
cp .env.example .env
```

Add your Anthropic API key to `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What It Does

- **Create rooms** — set up discussion spaces for different topics or projects
- **Add AI agents** — each agent points to a local codebase and can read/search it
- **Group chat** — send a message and all agents respond sequentially, each seeing prior responses
- **@mention agents** — target specific agents with `@AgentName` instead of having all respond
- **Reorder agents** — control which agent responds first with drag ordering
- **Rich context sources** — attach PDFs, web pages, Notion pages, or plain text as additional context for any agent

## How It Works

```
You send a message
    |
AgentsChat identifies which agents should respond (@mentions or all)
    |
Each agent runs sequentially in your configured order
    |
Agent 1 reads its codebase + context sources -> responds
    |
Agent 2 sees Agent 1's response + reads its own codebase -> responds
    |
All responses stream back in real-time via SSE
```

Each agent uses the Claude Agent SDK with read-only access (`Read`, `Glob`, `Grep`) to its local codebase. Agents cannot modify files.

## Architecture

```
src/
├── app/
│   ├── api/
│   │   └── rooms/          # REST API + SSE streaming
│   ├── room/[id]/          # Chat room page
│   └── page.tsx            # Landing page
├── components/
│   ├── chat/               # Chat interface, message bubbles, streaming
│   ├── members/            # Agent sidebar, add dialog, context sources
│   └── rooms/              # Room list, create dialog
└── lib/
    ├── agents/
    │   ├── runner.ts        # Agent orchestration + system prompt
    │   ├── types.ts         # AgentAdapter interface
    │   └── adapters/        # Claude (built), Codex/Gemini (pluggable)
    ├── context/             # PDF, URL, Notion, text extraction
    └── db/                  # SQLite + Drizzle ORM
```

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Claude Agent SDK** for AI agent execution
- **SQLite** + Drizzle ORM (local, zero setup)
- **Tailwind CSS** + shadcn/ui
- **SSE streaming** for real-time responses

## Context Sources

Agents can receive context beyond their codebase:

| Type | How |
|------|-----|
| **Manual text** | Type or paste directly |
| **PDF** | Upload `.pdf` files — text is extracted automatically |
| **Web URL** | Paste a URL — article content is fetched and extracted |
| **Notion** | Paste a Notion page URL (requires API key) |
| **Text files** | Upload `.txt` or `.md` files |

Context sources are managed per-agent from the sidebar.

## Engine Adapters

The agent system uses a pluggable adapter pattern. Currently Claude is fully implemented. Adding a new engine means implementing one interface:

```typescript
interface AgentAdapter {
  run(params: AgentRunParams): AsyncGenerator<AgentChunk>;
}
```

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Default Claude API key | Yes (or set per-agent) |
| `NOTION_API_KEY` | Notion integration key | Only for Notion context |
| `DATABASE_PATH` | SQLite database path | No (defaults to `./data/agentschat.db`) |

## License

MIT
