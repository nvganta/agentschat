import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fakeAdapter } from "./fake";

describe("test adapter", () => {
  it("labels its response, lists repository files and acknowledges earlier agents", async () => {
    const dir = mkdtempSync(join(tmpdir(), "agentschat-test-"));
    try {
      writeFileSync(join(dir, "orders.ts"), "export const orders = [];");
      const chunks = [];
      for await (const chunk of fakeAdapter.run({
        cwd: dir,
        prompt: "What changes?",
        systemPrompt: "Responses from other agents",
        apiKey: "",
      }))
        chunks.push(chunk);
      expect(chunks[0].content).toContain("Test adapter, not AI");
      expect(chunks[0].content).toContain("orders.ts");
      expect(chunks[0].content).toContain("earlier agent's response");
      expect(chunks.at(-1)?.type).toBe("done");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
