import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function extractUrlText(
  url: string
): Promise<{ title: string; content: string }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (AgentWarRoom Context Fetcher)",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch URL: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent?.trim()) {
    throw new Error("Could not extract readable content from this URL");
  }

  return {
    title: article.title || new URL(url).hostname,
    content: article.textContent.trim(),
  };
}
