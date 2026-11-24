import { execFileSync } from "node:child_process";

export function repositoryBranch(repoPath: string): string | null {
  try {
    const root = execFileSync(
      "git",
      ["-C", repoPath, "rev-parse", "--show-toplevel"],
      { encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    if (!root) return null;
    return execFileSync(
      "git",
      ["-C", repoPath, "rev-parse", "--abbrev-ref", "HEAD"],
      { encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
  } catch {
    return null;
  }
}
