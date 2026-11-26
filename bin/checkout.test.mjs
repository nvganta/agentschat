import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkExistingCheckout } from "./checkout.mjs";

const dirs = [];

function folder(pkgName, origin) {
  const dir = mkdtempSync(join(tmpdir(), "agentschat-cli-"));
  dirs.push(dir);
  if (pkgName) writeFileSync(join(dir, "package.json"), JSON.stringify({ name: pkgName }));
  if (origin !== undefined) {
    execFileSync("git", ["init", "-q", dir]);
    if (origin) execFileSync("git", ["-C", dir, "remote", "add", "origin", origin]);
  }
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("checkExistingCheckout", () => {
  it("accepts a clone of nvganta/agentschat over https or ssh", () => {
    expect(checkExistingCheckout(folder("agentschat", "https://github.com/nvganta/agentschat.git"))).toBeNull();
    expect(checkExistingCheckout(folder("agentschat", "git@github.com:nvganta/agentschat.git"))).toBeNull();
  });

  it("rejects a folder with no package.json or another package's", () => {
    expect(checkExistingCheckout(folder(null))).toMatch(/no readable package.json/);
    expect(checkExistingCheckout(folder("my-app", "https://github.com/nvganta/agentschat.git"))).toMatch(
      /"my-app"/
    );
  });

  it("rejects a folder that isn't a git clone, or has no origin", () => {
    expect(checkExistingCheckout(folder("agentschat"))).toMatch(/not a git clone/);
    expect(checkExistingCheckout(folder("agentschat", ""))).toMatch(/not a git clone/);
  });

  it("rejects a clone of some other repository", () => {
    expect(checkExistingCheckout(folder("agentschat", "https://github.com/someone/agentschat-evil.git"))).toMatch(
      /not github.com\/nvganta\/agentschat/
    );
  });

  it("rejects a folder that only sits inside an AgentsChat clone", () => {
    const parent = folder("agentschat", "https://github.com/nvganta/agentschat.git");
    const nested = join(parent, "agentschat");
    mkdirSync(nested);
    writeFileSync(join(nested, "package.json"), JSON.stringify({ name: "agentschat" }));
    expect(checkExistingCheckout(nested)).toMatch(/inside another git repository/);
  });

  it("rejects a file where the folder should be", () => {
    const parent = folder(null);
    const file = join(parent, "agentschat");
    writeFileSync(file, "");
    expect(checkExistingCheckout(file)).toMatch(/not a folder/);
  });
});
