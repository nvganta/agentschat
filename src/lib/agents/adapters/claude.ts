import { query, type HookCallback, type Options } from "@anthropic-ai/claude-agent-sdk";
import { AGENT_TOOLS, checkToolAccess } from "../sandbox";
import type { AgentAdapter, AgentRunParams, AgentChunk } from "../types";

/**
 * Keeps an agent's Read, Glob and Grep inside its own repository folder. The
 * PreToolUse hook runs before any allow rule, so a permissive settings file can't
 * skip it, and canUseTool covers anything that reaches a permission prompt.
 */
export function sandboxOptions(root: string): Pick<Options, "tools" | "canUseTool" | "hooks"> {
  const guard: HookCallback = async (input) => {
    if (input.hook_event_name !== "PreToolUse") return {};
    const decision = checkToolAccess(
      input.tool_name,
      (input.tool_input ?? {}) as Record<string, unknown>,
      root
    );
    if (decision.allowed) return {};
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: decision.reason,
      },
    };
  };
  return {
    tools: [...AGENT_TOOLS],
    canUseTool: async (toolName, input) => {
      const decision = checkToolAccess(toolName, input, root);
      return decision.allowed
        ? { behavior: "allow", updatedInput: input }
        : { behavior: "deny", message: decision.reason };
    },
    hooks: { PreToolUse: [{ hooks: [guard] }] },
  };
}

export const claudeAdapter: AgentAdapter = {
  async *run(params: AgentRunParams): AsyncGenerator<AgentChunk> {
    const { prompt, cwd, systemPrompt, apiKey } = params;

    try {
      const agent = query({
        prompt,
        options: {
          cwd,
          model: "claude-sonnet-4-5-20250929",
          ...sandboxOptions(cwd),
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
