#!/usr/bin/env node

import { execSync, spawn } from "child_process";
import { existsSync } from "fs";

const DIR = "agentschat";

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", ...opts });
}

async function main() {
  const major = Number(process.versions.node.split(".")[0]);
  if (
    major < 20 ||
    (major === 20 && Number(process.versions.node.split(".")[1]) < 9)
  ) {
    throw new Error(
      "Node.js 20.9 or newer is required. Install a current Node.js LTS release and try again."
    );
  }
  try {
    execSync("git --version", { stdio: "ignore" });
  } catch {
    throw new Error(
      "Git is required. Install Git from https://git-scm.com and try again."
    );
  }
  console.log();
  console.log("  AgentsChat");
  console.log("  A group chat where AI coding agents collaborate with you.");
  console.log();

  // Clone or reuse
  if (existsSync(DIR)) {
    console.log(`  Directory "${DIR}/" already exists — using it.\n`);
  } else {
    console.log("  Cloning repository...\n");
    run(`git clone --depth 1 https://github.com/nvganta/agentschat.git ${DIR}`);
    console.log();
  }

  // Install dependencies
  console.log("  Installing dependencies...\n");
  run("npm ci", { cwd: DIR });
  console.log();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(
      "  Claude is not configured. Set ANTHROPIC_API_KEY in your environment or add a key in agent settings.\n"
    );
  }

  // Start
  console.log("  Starting AgentsChat at http://localhost:3000\n");

  const child = spawn("npm", ["run", "dev"], {
    cwd: DIR,
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error("\n  Error:", err.message);
  process.exit(1);
});
