import { execFileSync } from "child_process";
import { readFileSync, realpathSync, statSync } from "fs";
import { join } from "path";

const UPSTREAM = /github\.com[/:]nvganta\/agentschat(\.git)?\/?$/i;

function git(dir, args) {
  return execFileSync("git", ["-C", dir, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function samePath(a, b) {
  const norm = (p) => realpathSync.native(p).replace(/[\/]+$/, "");
  return process.platform === "win32"
    ? norm(a).toLowerCase() === norm(b).toLowerCase()
    : norm(a) === norm(b);
}

/**
 * Checks that an existing folder is a clone of AgentsChat before the CLI runs
 * `npm ci` and `npm run dev` in it, since those run whatever scripts it holds.
 * Returns null when it is, or a sentence saying why not.
 */
export function checkExistingCheckout(dir) {
  try {
    if (!statSync(dir).isDirectory()) return `"${dir}" exists but is not a folder.`;
  } catch {
    return `"${dir}" can't be read.`;
  }

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  } catch {
    return `"${dir}/" has no readable package.json, so it isn't an AgentsChat checkout.`;
  }
  if (pkg?.name !== "agentschat") {
    return `"${dir}/" holds a package named "${pkg?.name}", not "agentschat".`;
  }

  let top;
  let origin;
  try {
    top = git(dir, ["rev-parse", "--show-toplevel"]);
    origin = git(dir, ["remote", "get-url", "origin"]);
  } catch {
    return `"${dir}/" is not a git clone of AgentsChat.`;
  }
  if (!samePath(top, dir)) {
    return `"${dir}/" sits inside another git repository (${top}) rather than being its own clone.`;
  }
  if (!UPSTREAM.test(origin)) {
    return `"${dir}/" is a clone of ${origin}, not github.com/nvganta/agentschat.`;
  }
  return null;
}
