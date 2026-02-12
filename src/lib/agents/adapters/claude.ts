import { query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentAdapter, AgentRunParams, AgentChunk } from "../types";

export const claudeAdapter: AgentAdapter = {
  async *run(params: AgentRunParams): AsyncGenerator<AgentChunk> {
    const { prompt, cwd, systemPrompt, apiKey } = params;

    try {
      const agent = query({
        prompt,
        options: {
          cwd,
          model: "claude-sonnet-4-5-20250929",
          allowedTools: ["Read", "Glob", "Grep"],
          systemPrompt,
          maxTurns: 50,
          env: { ...process.env, ANTHROPIC_API_KEY: apiKey },
        },
      });

      let accumulated = "";

      for await (const message of agent) {
        if (message.type === "assistant" && message.message?.content) {
          for (const block of message.message.content) {
            if ("text" in block && block.text) {
              accumulated += block.text;
              yield { type: "chunk", content: block.text };
            }
          }
        } else if (message.type === "result") {
          yield { type: "done", content: accumulated };
          return;
        }
      }

      yield { type: "done", content: accumulated };
    } catch (error) {
      yield {
        type: "error",
        content: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
