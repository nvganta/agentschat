import { readdir } from "node:fs/promises";
import type { AgentAdapter } from "../types";

const ROSTER_HEADING = "Other repositories in this room";
const ROUND_HEADING = "Responses from other agents";

// Names of the other agents listed in the system prompt's room roster.
function otherAgentNames(systemPrompt: string): string[] {
  const start = systemPrompt.indexOf(ROSTER_HEADING);
  if (start === -1) return [];

  const names: string[] = [];
  for (const line of systemPrompt.slice(start).split("\n").slice(1)) {
    if (!line.startsWith("- ")) break;
    names.push(line.slice(2).split(":")[0]);
  }
  return names;
}

// Explicit opt-in for local verification only (AGENTSCHAT_FAKE_AGENT=1).
// Every response is labelled so it is never mistaken for an AI result.
export const fakeAdapter: AgentAdapter = {
  async *run({ cwd, systemPrompt }) {
    const files = (await readdir(cwd, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
    const others = otherAgentNames(systemPrompt);

    const parts = [
      "[Test adapter, not AI]",
      `Files in this repository: ${files.join(", ") || "none"}.`,
    ];
    if (others.length > 0) {
      parts.push(`Other repositories in the room: ${others.join(", ")}.`);
    }
    if (systemPrompt.includes(ROUND_HEADING)) {
      parts.push("I received the earlier agent's response.");
    }
    parts.push("Review these files for the proposed change.");

    const content = parts.join(" ");
    yield { type: "chunk", content };
    yield { type: "done", content };
  },
};
