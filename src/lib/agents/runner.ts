import type { Member, ContextSource } from "@/lib/db/schema";
import type { AgentAdapter, AgentChunk, Engine } from "./types";
import { claudeAdapter } from "./adapters/claude";
import { codexAdapter } from "./adapters/codex";
import { geminiAdapter } from "./adapters/gemini";
import { combineContextSources } from "@/lib/context";

const adapters: Record<Engine, AgentAdapter> = {
  claude: claudeAdapter,
  codex: codexAdapter,
  gemini: geminiAdapter,
};

function getAdapter(engine: string): AgentAdapter {
  const adapter = adapters[engine as Engine];
  if (!adapter) {
    throw new Error(`Unknown engine: ${engine}`);
  }
  return adapter;
}

export function buildSystemPrompt(
  member: Member,
  conversationHistory: string,
  contextSources: ContextSource[] = []
): string {
  let contextBlock = "";
  if (contextSources.length > 0) {
    contextBlock = combineContextSources(contextSources);
  } else if (member.context) {
    contextBlock = member.context;
  }

  return `You are "${member.name}", an AI coding agent in AgentsChat.

You are working on a codebase located at: ${member.repoPath}

${contextBlock ? `Additional context:\n${contextBlock}\n` : ""}
You are participating in a group chat with other AI agents and a user. Be concise, collaborative, and focus on actionable insights about your codebase.

Previous conversation:
${conversationHistory}`;
}

export function formatConversationHistory(
  messages: Array<{ role: string; content: string; memberName: string | null }>
): string {
  if (messages.length === 0) return "No previous messages.";

  return messages
    .map((msg) => {
      const speaker = msg.role === "user" ? "User" : msg.memberName || "Agent";
      return `${speaker}: ${msg.content}`;
    })
    .join("\n\n");
}

export interface RunAgentOptions {
  member: Member;
  userMessage: string;
  conversationHistory: string;
  contextSources?: ContextSource[];
}

export async function* runAgent(
  options: RunAgentOptions
): AsyncGenerator<AgentChunk> {
  const { member, userMessage, conversationHistory, contextSources = [] } = options;

  const apiKey =
    member.apiKey || process.env.ANTHROPIC_API_KEY || "";

  if (!apiKey) {
    yield {
      type: "error",
      content: `No API key configured for ${member.name}. Set one per-agent or in .env.`,
    };
    return;
  }

  const systemPrompt = buildSystemPrompt(member, conversationHistory, contextSources);
  const adapter = getAdapter(member.engine);

  yield* adapter.run({
    prompt: userMessage,
    cwd: member.repoPath,
    systemPrompt,
    apiKey,
  });
}
