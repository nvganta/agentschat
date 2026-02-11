import type { AgentAdapter, AgentRunParams, AgentChunk } from "../types";

export const geminiAdapter: AgentAdapter = {
  async *run(_params: AgentRunParams): AsyncGenerator<AgentChunk> {
    yield {
      type: "error",
      content: "Gemini engine is not implemented yet. Please use Claude.",
    };
  },
};
