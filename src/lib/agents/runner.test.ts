import { describe, expect, it } from "vitest";
import type { ContextSource, Member } from "@/lib/db/schema";
import { buildSystemPrompt, runAgent } from "./runner";

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

describe("room awareness", () => {
  it("tells each agent which other repositories share the room", () => {
    const prompt = buildSystemPrompt(
      member,
      "No previous messages.",
      [],
      [
        { name: member.name, repoPath: member.repoPath },
        { name: "API Agent", repoPath: "/work/api" },
      ]
    );

    expect(prompt).toContain("- API Agent: /work/api");
    expect(prompt).not.toContain(`- ${member.name}:`);
    expect(prompt).toContain("must never edit files");
  });
});

describe("provider configuration", () => {
  it("explains how to configure a missing key", async () => {
    const key = process.env.ANTHROPIC_API_KEY;
    const fake = process.env.AGENTSCHAT_FAKE_AGENT;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AGENTSCHAT_FAKE_AGENT;
    try {
      const chunks = [];
      for await (const chunk of runAgent({
        member,
        userMessage: "Hello",
        conversationHistory: "",
      })) {
        chunks.push(chunk);
      }
      expect(chunks[0].type).toBe("error");
      expect(chunks[0].content).toContain("not configured");
      expect(chunks[0].content).toContain("ANTHROPIC_API_KEY");
    } finally {
      if (key !== undefined) process.env.ANTHROPIC_API_KEY = key;
      if (fake !== undefined) process.env.AGENTSCHAT_FAKE_AGENT = fake;
    }
  });
});
