#!/usr/bin/env node

import { execSync, spawn } from "child_process";
import { createInterface } from "readline";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";

const DIR = "agentschat";

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", ...opts });
}

async function main() {
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
  run("npm install", { cwd: DIR });
  console.log();

  // Set up .env
  const envPath = join(DIR, ".env");
  if (!existsSync(envPath)) {
    const apiKey = await ask(
      "  Enter your Anthropic API key (or press Enter to skip): "
    );
    console.log();

    const lines = ["DATABASE_PATH=./data/agentschat.db"];
    if (apiKey) {
      lines.push(`ANTHROPIC_API_KEY=${apiKey}`);
    } else {
      lines.push("# ANTHROPIC_API_KEY=sk-ant-...");
      console.log(
        "  No key set. You can add it later in agentschat/.env\n"
      );
    }
    writeFileSync(envPath, lines.join("\n") + "\n");
  } else {
    console.log("  .env already exists — skipping setup.\n");
  }

  // Push schema
  console.log("  Setting up database...\n");
  run("npx drizzle-kit push", { cwd: DIR });
  console.log();

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
