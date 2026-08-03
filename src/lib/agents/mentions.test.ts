import { describe, expect, it } from "vitest";
import { resolveMentions } from "./mentions";

const members = [
  { id: 1, name: "Frontend" },
  { id: 2, name: "Frontend Agent" },
  { id: 3, name: "Backend Agent" },
];

describe("resolveMentions", () => {
  it("returns every agent when there is no mention", () => {
    expect(resolveMentions("Review this change", members)).toEqual(members);
  });

  it("matches a multi-word agent name exactly", () => {
    expect(resolveMentions("@Frontend Agent review this", members)).toEqual([
      members[1],
    ]);
  });

  it("does not also match a shorter overlapping name", () => {
    expect(resolveMentions("@Frontend Agent, please respond", members)).toEqual([
      members[1],
    ]);
  });

  it("matches multiple agents while preserving response order", () => {
    expect(
      resolveMentions("@Backend Agent ask @Frontend Agent for input", members)
    ).toEqual([members[1], members[2]]);
  });

  it("matches a mention after opening punctuation", () => {
    expect(resolveMentions("(@Frontend Agent please review)", members)).toEqual([
      members[1],
    ]);
  });

  it("matches a mention after inline punctuation", () => {
    expect(resolveMentions("Hi,@Backend Agent please review", members)).toEqual([
      members[2],
    ]);
  });

  it("falls back to every agent for an unknown mention", () => {
    expect(resolveMentions("@Unknown please respond", members)).toEqual(members);
  });
});
