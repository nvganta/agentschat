import type { AgentAdapter, AgentRunParams, AgentChunk } from "../types";

export const codexAdapter: AgentAdapter = {
  async *run(_params: AgentRunParams): AsyncGenerator<AgentChunk> {
    yield {
      type: "error",
      content: "Codex engine is not implemented yet. Please use Claude.",
    };
  },
};
