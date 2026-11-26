import { realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

/** The only tools an agent gets, all read-only. */
export const AGENT_TOOLS = ["Read", "Glob", "Grep"] as const;

export type ToolDecision = { allowed: true } | { allowed: false; reason: string };

/**
 * Resolves a path the way the filesystem will: `..` collapsed and every symlink or
 * junction followed. A path that doesn't exist yet resolves through its nearest
 * existing parent, so a missing file under a symlinked folder still lands where
 * the symlink points.
 */
export function realPath(target: string): string {
  const missing: string[] = [];
  let current = resolve(target);
  for (;;) {
    try {
      return join(realpathSync.native(current), ...missing.reverse());
    } catch {
      const parent = dirname(current);
      if (parent === current) return resolve(target);
      missing.push(current.slice(parent.length).replace(/^[\\/]/, ""));
      current = parent;
    }
  }
}

/** True when `target`, read relative to `root`, ends up inside `root` once resolved. */
export function isInsideRoot(target: string, root: string): boolean {
  const realRoot = realPath(root);
  const realTarget = realPath(resolve(realRoot, target));
  const rel = relative(realRoot, realTarget);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function deny(reason: string): ToolDecision {
  return { allowed: false, reason };
}

/** Globs are matched by the tool, not resolved here, so refuse anything that could climb out. */
function unsafeGlob(pattern: string): boolean {
  return pattern.includes("..") || isAbsolute(pattern) || /^[~/\\]|^[a-zA-Z]:/.test(pattern);
}

/**
 * Decides whether an agent may run a tool call. Every path it names must stay
 * inside its own repository folder, `root`, after `..` and symlinks are resolved.
 */
export function checkToolAccess(
  toolName: string,
  input: Record<string, unknown>,
  root: string
): ToolDecision {
  if (!(AGENT_TOOLS as readonly string[]).includes(toolName)) {
    return deny(`${toolName} is not available to agents.`);
  }

  const paths: string[] = [];
  const pathKey = toolName === "Read" ? "file_path" : "path";
  const value = input[pathKey];
  if (value !== undefined) {
    if (typeof value !== "string") return deny(`${pathKey} must be a string.`);
    paths.push(value);
  } else if (toolName === "Read") {
    return deny("Read needs a file_path.");
  }

  for (const key of toolName === "Glob" ? ["pattern"] : toolName === "Grep" ? ["glob"] : []) {
    const pattern = input[key];
    if (pattern === undefined) continue;
    if (typeof pattern !== "string" || unsafeGlob(pattern)) {
      return deny(`The ${key} must stay inside this repository.`);
    }
  }

  for (const path of paths) {
    if (path.startsWith("~") || !isInsideRoot(path, root)) {
      return deny(`${path} is outside this agent's repository.`);
    }
  }
  return { allowed: true };
}
