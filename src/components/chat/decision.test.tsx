// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Decision } from "./decision";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Reply = { ok: boolean; body?: unknown };
let pending: { resolve: (reply: Reply) => void; method: string; body?: string }[];
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  pending = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) =>
      new Promise((resolve) => {
        pending.push({
          method: init?.method ?? "GET",
          body: init?.body as string | undefined,
          resolve: (reply) => resolve({ ok: reply.ok, json: async () => reply.body }),
        });
      })
    )
  );
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const textarea = () => container.querySelector("textarea")!;
const button = (name: string) =>
  [...container.querySelectorAll("button")].find((b) => b.textContent === name);

async function reply(reply: Reply) {
  await act(async () => pending.shift()!.resolve(reply));
}

describe("Decision", () => {
  it("can't be edited or saved until the saved decision has loaded", async () => {
    act(() => root.render(<Decision roomId={1} />));
    expect(textarea().disabled).toBe(true);
    expect(button("Save decision")?.disabled).toBe(true);

    await reply({ ok: true, body: { content: "## Decision\nShip it" } });
    expect(textarea().value).toBe("## Decision\nShip it");
    expect(textarea().disabled).toBe(false);
    expect(button("Save decision")?.disabled).toBe(false);
  });

  it("stays locked after a failed load and offers a retry", async () => {
    act(() => root.render(<Decision roomId={1} />));
    await reply({ ok: false });
    expect(textarea().disabled).toBe(true);
    expect(button("Save decision")?.disabled).toBe(true);
    expect(container.textContent).toContain("Could not load the decision");

    act(() => button("Try again")!.click());
    expect(pending.map((p) => p.method)).toEqual(["GET"]);
    await reply({ ok: true, body: { content: "Existing" } });
    expect(textarea().value).toBe("Existing");
    expect(textarea().disabled).toBe(false);
    expect(button("Try again")).toBeUndefined();
  });

  it("saves the loaded decision", async () => {
    act(() => root.render(<Decision roomId={1} />));
    await reply({ ok: true, body: { content: "Existing" } });
    act(() => button("Save decision")!.click());
    expect(pending[0].method).toBe("PUT");
    expect(JSON.parse(pending[0].body!)).toEqual({ content: "Existing" });
    await reply({ ok: true });
    expect(container.textContent).toContain("Saved in this room.");
  });

  it("ignores a load that finishes after switching rooms", async () => {
    act(() => root.render(<Decision roomId={1} />));
    act(() => root.render(<Decision roomId={2} />));
    expect(textarea().disabled).toBe(true);
    const [first, second] = pending.splice(0);
    await act(async () => second.resolve({ ok: true, body: { content: "Room 2" } }));
    await act(async () => first.resolve({ ok: true, body: { content: "Room 1" } }));
    expect(textarea().value).toBe("Room 2");
  });
});
