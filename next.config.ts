import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "jsdom"],
  // Keep `next dev` from rewriting the repository's own AGENTS.md.
  agentRules: false,
};

export default nextConfig;
