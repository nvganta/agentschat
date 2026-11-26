import { describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import type { HookCallback, Options } from "@anthropic-ai/claude-agent-sdk";

const calls: { options?: Options }[] = [];

// No real Claude call: the SDK is replaced by a stub that records its options.
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  query: (args: { options?: Options }) => {
    calls.push(args);
    return (async function* () {
      yield { type: "result" };
    })();
  },
}));

const { claudeAdapter } = await import("./claude");

const root = join(process.cwd(), "src");

async function optionsForRun() {
  calls.length = 0;
  for await (const chunk of claudeAdapter.run({ prompt: "hi", cwd: root, systemPrompt: "", apiKey: "test" })) {
    void chunk;
  }
  return calls[0].options!;
}

async function hookDecision(options: Options, tool_name: string, tool_input: unknown) {
  const hook = options.hooks!.PreToolUse![0].hooks[0] as HookCallback;
  const result = await hook(
    { hook_event_name: "PreToolUse", tool_name, tool_input, tool_use_id: "t" } as Parameters<HookCallback>[0],
    "t",
    { signal: new AbortController().signal }
  );
  return (result as { hookSpecificOutput?: { permissionDecision?: string } }).hookSpecificOutput
    ?.permissionDecision;
}

describe("claude adapter sandbox", () => {
  it("offers only read-only tools and doesn't pre-approve them past the check", async () => {
    const options = await optionsForRun();
    expect(options.tools).toEqual(["Read", "Glob", "Grep"]);
    expect(options.allowedTools).toBeUndefined();
    expect(options.cwd).toBe(root);
  });

  it("denies a read outside the repo from both the hook and canUseTool", async () => {
    const options = await optionsForRun();
    const outside = { file_path: join(root, "..", "package.json") };
    expect(await hookDecision(options, "Read", outside)).toBe("deny");
    const verdict = await options.canUseTool!("Read", outside, {
      signal: new AbortController().signal,
      toolUseID: "t",
    });
    expect(verdict.behavior).toBe("deny");
  });

  it("lets a read inside the repo through", async () => {
    const options = await optionsForRun();
    const inside = { file_path: join(root, "lib", "agents", "sandbox.ts") };
    expect(await hookDecision(options, "Read", inside)).toBeUndefined();
    const verdict = await options.canUseTool!("Read", inside, {
      signal: new AbortController().signal,
      toolUseID: "t",
    });
    expect(verdict.behavior).toBe("allow");
  });
});
