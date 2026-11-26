import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkToolAccess, isInsideRoot } from "./sandbox";

let base: string;
let root: string;
let outside: string;
let fileLinks = true;

beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "agentschat-sandbox-"));
  root = join(base, "repo");
  outside = join(base, "outside");
  mkdirSync(join(root, "src"), { recursive: true });
  mkdirSync(outside);
  mkdirSync(join(base, "repo-sibling"));
  writeFileSync(join(root, "src", "index.ts"), "export {};");
  writeFileSync(join(outside, "secret.txt"), "secret");
  // Junctions need no special rights on Windows and are plain symlinks elsewhere.
  symlinkSync(outside, join(root, "linked-out"), "junction");
  symlinkSync(join(root, "src"), join(root, "linked-in"), "junction");
  try {
    symlinkSync(join(outside, "secret.txt"), join(root, "secret-link.txt"), "file");
  } catch {
    fileLinks = false; // Windows without Developer Mode can't make file symlinks.
  }
});

afterAll(() => rmSync(base, { recursive: true, force: true }));

const allowed = { allowed: true };

describe("isInsideRoot", () => {
  it("accepts the root, relative paths and absolute paths inside it", () => {
    expect(isInsideRoot(".", root)).toBe(true);
    expect(isInsideRoot("src/index.ts", root)).toBe(true);
    expect(isInsideRoot(join(root, "src", "index.ts"), root)).toBe(true);
    expect(isInsideRoot("src/not-written-yet.ts", root)).toBe(true);
  });

  it("rejects .. traversal, even when it passes through the repo first", () => {
    expect(isInsideRoot("../outside/secret.txt", root)).toBe(false);
    expect(isInsideRoot("src/../../outside/secret.txt", root)).toBe(false);
    expect(isInsideRoot("..", root)).toBe(false);
  });

  it("rejects absolute paths elsewhere, including a sibling that shares the name prefix", () => {
    expect(isInsideRoot(join(outside, "secret.txt"), root)).toBe(false);
    expect(isInsideRoot(join(base, "repo-sibling"), root)).toBe(false);
  });

  it("follows a symlinked folder out of the repo", () => {
    expect(isInsideRoot("linked-out/secret.txt", root)).toBe(false);
    expect(isInsideRoot("linked-out", root)).toBe(false);
    expect(isInsideRoot("linked-out/does-not-exist.txt", root)).toBe(false);
  });

  it("allows a symlink that points back inside the repo", () => {
    expect(isInsideRoot("linked-in/index.ts", root)).toBe(true);
  });

  it.runIf(fileLinks)("follows a symlinked file out of the repo", () => {
    expect(isInsideRoot("secret-link.txt", root)).toBe(false);
  });
});

describe("checkToolAccess", () => {
  it("allows reads and searches inside the repo", () => {
    expect(checkToolAccess("Read", { file_path: join(root, "src", "index.ts") }, root)).toEqual(
      allowed
    );
    expect(checkToolAccess("Glob", { pattern: "**/*.ts" }, root)).toEqual(allowed);
    expect(checkToolAccess("Glob", { pattern: "*.ts", path: "src" }, root)).toEqual(allowed);
    expect(checkToolAccess("Grep", { pattern: "export", glob: "*.ts" }, root)).toEqual(allowed);
    expect(checkToolAccess("Grep", { pattern: "export", path: join(root, "src") }, root)).toEqual(
      allowed
    );
  });

  it("denies Read outside the repo by traversal, absolute path, home or symlink", () => {
    for (const file_path of [
      "../outside/secret.txt",
      join(root, "..", "outside", "secret.txt"),
      join(outside, "secret.txt"),
      "~/.ssh/id_rsa",
      join(root, "linked-out", "secret.txt"),
    ]) {
      expect(checkToolAccess("Read", { file_path }, root).allowed, file_path).toBe(false);
    }
  });

  it.runIf(fileLinks)("denies Read through a symlinked file", () => {
    expect(checkToolAccess("Read", { file_path: "secret-link.txt" }, root).allowed).toBe(false);
  });

  it("denies Glob and Grep that search outside the repo", () => {
    expect(checkToolAccess("Glob", { pattern: "*", path: outside }, root).allowed).toBe(false);
    expect(checkToolAccess("Glob", { pattern: "*", path: "linked-out" }, root).allowed).toBe(false);
    expect(checkToolAccess("Grep", { pattern: "secret", path: ".." }, root).allowed).toBe(false);
    expect(checkToolAccess("Grep", { pattern: "x", path: "linked-out" }, root).allowed).toBe(false);
  });

  it("denies glob patterns that climb out or start from an absolute path", () => {
    for (const pattern of ["../**/*", "src/../../**", "/etc/*", "C:/Users/**", "~/**", "{..,src}/*"]) {
      expect(checkToolAccess("Glob", { pattern }, root).allowed, pattern).toBe(false);
    }
    expect(checkToolAccess("Grep", { pattern: "x", glob: "../**" }, root).allowed).toBe(false);
  });

  it("denies other tools and malformed input", () => {
    expect(checkToolAccess("Bash", { command: "cat /etc/passwd" }, root).allowed).toBe(false);
    expect(checkToolAccess("Write", { file_path: "src/x.ts" }, root).allowed).toBe(false);
    expect(checkToolAccess("Read", {}, root).allowed).toBe(false);
    expect(checkToolAccess("Read", { file_path: 42 }, root).allowed).toBe(false);
  });
});
