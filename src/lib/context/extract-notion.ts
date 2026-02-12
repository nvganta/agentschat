import { Client } from "@notionhq/client";

export async function extractNotionPage(
  pageUrl: string,
  apiKey: string
): Promise<{ title: string; content: string }> {
  const pageId = extractPageId(pageUrl);
  if (!pageId) {
    throw new Error("Invalid Notion page URL");
  }

  const notion = new Client({ auth: apiKey });

  // Get page title
  const page = await notion.pages.retrieve({ page_id: pageId });
  const title = extractPageTitle(page);

  // Get all blocks (content) with pagination
  const blocks: string[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const block of response.results) {
      const text = extractBlockText(block);
      if (text) blocks.push(text);
    }
    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);

  return {
    title: title || "Notion Page",
    content: blocks.join("\n"),
  };
}

function extractPageId(url: string): string | null {
  // Notion URLs: https://www.notion.so/workspace/Page-Title-<32-hex-id>
  // or https://www.notion.so/<32-hex-id>
  const match =
    url.match(/([a-f0-9]{32})/i) || url.match(/([a-f0-9-]{36})/i);
  return match ? match[1] : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractPageTitle(page: any): string {
  const props = page.properties || {};
  for (const key of Object.keys(props)) {
    if (props[key].type === "title" && props[key].title?.length > 0) {
      return props[key].title.map((t: any) => t.plain_text).join("");
    }
  }
  return "";
}

function extractBlockText(block: any): string {
  const type = block.type;
  if (!type) return "";

  const data = block[type];
  if (!data) return "";

  if (data.rich_text) {
    return data.rich_text.map((t: any) => t.plain_text).join("");
  }
  if (data.text) {
    return data.text.map((t: any) => t.plain_text).join("");
  }
  return "";
}
/* eslint-enable @typescript-eslint/no-explicit-any */
