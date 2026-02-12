export interface AgentRunParams {
  prompt: string;
  cwd: string;
  systemPrompt: string;
  apiKey: string;
}

export interface AgentChunk {
  type: "chunk" | "done" | "error";
  content: string;
}

export interface AgentAdapter {
  run(params: AgentRunParams): AsyncGenerator<AgentChunk>;
}

export const SUPPORTED_ENGINES = ["claude", "codex", "gemini"] as const;
export type Engine = (typeof SUPPORTED_ENGINES)[number];
