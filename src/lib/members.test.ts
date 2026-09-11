import { describe, expect, it } from "vitest";
import type { Member } from "@/lib/db/schema";
import { toClientMember } from "./members";

describe("toClientMember", () => {
  it("reports a configured key without exposing its value", () => {
    const member: Member = {
      id: 1,
      roomId: 1,
      name: "Frontend Agent",
      repoPath: "C:\\Projects\\app",
      engine: "claude",
      sortOrder: 0,
      context: null,
      apiKey: "secret-key",
      createdAt: new Date(),
    };

    const clientMember = toClientMember(member);

    expect(clientMember.hasApiKey).toBe(true);
    expect("apiKey" in clientMember).toBe(false);
  });
});
