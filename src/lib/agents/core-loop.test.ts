import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";

describe("cross-repository conversation", () => {
  it("persists a discussion and an authored decision without a provider", async () => {
    process.env.DATABASE_PATH = ":memory:";
    process.env.AGENTSCHAT_FAKE_AGENT = "1";
    const { createRoom, createMember, getMessages } =
      await import("@/lib/db/queries");
    const { POST } = await import("@/app/api/rooms/[id]/chat/route");
    const decision = await import("@/app/api/rooms/[id]/decision/route");
    const dir = mkdtempSync(join(tmpdir(), "agentschat-loop-"));
    try {
      writeFileSync(join(dir, "orders.ts"), "export const orders = [];\n");
      const room = createRoom({ name: "Orders" });
      createMember({
        roomId: room.id,
        name: "API",
        repoPath: dir,
        engine: "claude",
      });
      createMember({
        roomId: room.id,
        name: "Web",
        repoPath: dir,
        engine: "claude",
      });
      const params = Promise.resolve({ id: String(room.id) });
      const response = await POST(
        new NextRequest("http://localhost/chat", {
          method: "POST",
          body: JSON.stringify({ content: "What changes?" }),
        }),
        { params }
      );
      const events = await response.text();
      expect(events).toContain("orders.ts");
      expect(events).toContain("earlier agent's response");
      expect(getMessages(room.id).map((m) => m.role)).toEqual([
        "user",
        "assistant",
        "assistant",
      ]);
      await decision.PUT(
        new NextRequest("http://localhost/decision", {
          method: "PUT",
          body: JSON.stringify({ content: "## Decision\nKeep orders.ts" }),
        }),
        { params }
      );
      const saved = await decision.GET(
        new NextRequest("http://localhost/decision"),
        { params }
      );
      expect(await saved.json()).toEqual({
        content: "## Decision\nKeep orders.ts",
      });
    } finally {
      delete process.env.AGENTSCHAT_FAKE_AGENT;
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60000);
});
