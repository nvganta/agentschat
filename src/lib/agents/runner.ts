import type { Member, ContextSource } from "@/lib/db/schema";
import type { AgentAdapter, AgentChunk, Engine } from "./types";
import { claudeAdapter } from "./adapters/claude";
import { combineContextSources } from "@/lib/context";

const adapters: Record<Engine, AgentAdapter> = {
  claude: claudeAdapter,
};

function getAdapter(engine: string): AgentAdapter {
  const adapter = adapters[engine as Engine];
  if (!adapter) {
    throw new Error(`Unknown engine: ${engine}`);
  }
  return adapter;
}

export interface RoomRepository {
  name: string;
  repoPath: string;
}

function describeOtherRepositories(
  member: Member,
  roomRepositories: RoomRepository[]
): string {
  const others = roomRepositories.filter(
    (repository) =>
      repository.name !== member.name || repository.repoPath !== member.repoPath
  );
  if (others.length === 0) return "";

  const lines = others.map(
    (repository) => `- ${repository.name}: ${repository.repoPath}`
  );
  return `Other repositories in this room, each with its own agent:
${lines.join("\n")}

When a change in your repository could break or require changes in one of these, say so and name the files on your side that are involved.
`;
}

export function buildSystemPrompt(
  member: Member,
  conversationHistory: string,
  contextSources: ContextSource[] = [],
  roomRepositories: RoomRepository[] = []
): string {
  const additionalSources = contextSources.filter(
    (source) =>
      !(
        source.type === "manual" &&
        source.title === "Manual context" &&
        source.content === member.context
      )
  );

  const contextSections: string[] = [];
  if (member.context) {
    contextSections.push(`Agent instructions:\n${member.context}`);
  }
  if (additionalSources.length > 0) {
    contextSections.push(combineContextSources(additionalSources));
  }
  const contextBlock = contextSections.join("\n\n");

  return `You are "${member.name}", an AI coding agent in AgentsChat.

You are working on a codebase located at: ${member.repoPath}
You can read code but must never edit files.

${describeOtherRepositories(member, roomRepositories)}${contextBlock ? `Additional context:\n${contextBlock}\n` : ""}
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
  roomRepositories?: RoomRepository[];
}

export async function* runAgent(
  options: RunAgentOptions
): AsyncGenerator<AgentChunk> {
  const {
    member,
    userMessage,
    conversationHistory,
    contextSources = [],
    roomRepositories = [],
  } = options;

  const systemPrompt = buildSystemPrompt(
    member,
    conversationHistory,
    contextSources,
    roomRepositories
  );

  // Explicit opt-in for local verification: no provider call is made.
  if (process.env.AGENTSCHAT_FAKE_AGENT === "1") {
    const { fakeAdapter } = await import("./adapters/fake");
    yield* fakeAdapter.run({
      prompt: userMessage,
      cwd: member.repoPath,
      systemPrompt,
      apiKey: "",
    });
    return;
  }

  const apiKey = member.apiKey || process.env.ANTHROPIC_API_KEY || "";

  if (!apiKey) {
    yield {
      type: "error",
      content:
        `Claude is not configured for ${member.name}. Add an Anthropic API ` +
        "key in the agent settings or set ANTHROPIC_API_KEY, then restart.",
    };
    return;
  }

  const adapter = getAdapter(member.engine);

  yield* adapter.run({
    prompt: userMessage,
    cwd: member.repoPath,
    systemPrompt,
    apiKey,
  });
}
