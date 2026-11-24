import { describe, expect, it } from "vitest";
import { isLocalRequest } from "./local-request";

function headers(values: Record<string, string>) {
  return new Headers(values);
}

describe("isLocalRequest", () => {
  it("accepts the user's own browser on this machine", () => {
    expect(isLocalRequest(headers({ host: "localhost:3000" }))).toBe(true);
    expect(
      isLocalRequest(
        headers({ host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" })
      )
    ).toBe(true);
    expect(
      isLocalRequest(
        headers({ host: "[::1]:3000", origin: "http://[::1]:3000" })
      )
    ).toBe(true);
  });

  it("rejects other machines and DNS rebinding hosts", () => {
    expect(isLocalRequest(headers({ host: "192.168.1.20:3000" }))).toBe(false);
    expect(isLocalRequest(headers({ host: "attacker.example:3000" }))).toBe(
      false
    );
    expect(isLocalRequest(headers({}))).toBe(false);
  });

  it("rejects posts from other websites", () => {
    expect(
      isLocalRequest(
        headers({ host: "localhost:3000", origin: "https://attacker.example" })
      )
    ).toBe(false);
    expect(
      isLocalRequest(headers({ host: "localhost:3000", origin: "null" }))
    ).toBe(false);
    expect(
      isLocalRequest(
        headers({ host: "localhost:3000", origin: "http://localhost:4000" })
      )
    ).toBe(false);
  });
});
