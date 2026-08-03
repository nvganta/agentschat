import { describe, expect, it } from "vitest";
import type { ContextSource, Member } from "@/lib/db/schema";
import { buildSystemPrompt } from "./runner";

const member: Member = {
  id: 1,
  roomId: 1,
  name: "Frontend Agent",
  repoPath: "C:\\Projects\\app",
  engine: "claude",
  sortOrder: 0,
  context: "Own the React interface.",
  apiKey: null,
  createdAt: new Date(),
};

describe("buildSystemPrompt", () => {
  it("always includes agent instructions with attached context", () => {
    const sources: ContextSource[] = [
      {
        id: 1,
        memberId: member.id,
        type: "url",
        title: "Design guide",
        content: "Use the orange visual system.",
        sourceUrl: "https://example.com",
        fileName: null,
        createdAt: new Date(),
      },
    ];

    const prompt = buildSystemPrompt(member, "No previous messages.", sources);

    expect(prompt).toContain("Agent instructions:\nOwn the React interface.");
    expect(prompt).toContain("Use the orange visual system.");
  });

  it("does not duplicate legacy manual context", () => {
    const sources: ContextSource[] = [
      {
        id: 1,
        memberId: member.id,
        type: "manual",
        title: "Manual context",
        content: member.context!,
        sourceUrl: null,
        fileName: null,
        createdAt: new Date(),
      },
    ];

    const prompt = buildSystemPrompt(member, "No previous messages.", sources);

    expect(prompt.match(/Own the React interface\./g)).toHaveLength(1);
  });
});
