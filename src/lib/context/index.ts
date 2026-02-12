export { extractPdfText } from "./extract-pdf";
export { extractUrlText } from "./extract-url";
export { extractNotionPage } from "./extract-notion";
export { extractTextFileContent } from "./extract-text-file";

import type { ContextSource } from "@/lib/db/schema";

const MAX_CONTEXT_CHARS = 100_000;

const TYPE_LABELS: Record<string, string> = {
  manual: "Manual Context",
  pdf: "PDF Document",
  url: "Web Page",
  notion: "Notion Page",
  text_file: "Text File",
};

/**
 * Combines all context sources for a member into a single string
 * suitable for injection into the system prompt.
 */
export function combineContextSources(sources: ContextSource[]): string {
  if (sources.length === 0) return "";

  let combined = sources
    .map((source) => {
      const label = TYPE_LABELS[source.type] || source.type;
      return `--- ${label}: ${source.title} ---\n${source.content}`;
    })
    .join("\n\n");

  if (combined.length > MAX_CONTEXT_CHARS) {
    combined =
      combined.slice(0, MAX_CONTEXT_CHARS) +
      `\n\n[Content truncated — ${combined.length - MAX_CONTEXT_CHARS} characters omitted]`;
  }

  return combined;
}
