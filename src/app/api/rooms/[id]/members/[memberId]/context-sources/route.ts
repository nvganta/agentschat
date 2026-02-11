import { NextRequest, NextResponse } from "next/server";
import {
  createContextSource,
  getContextSources,
} from "@/lib/db/queries";
import { extractPdfText } from "@/lib/context/extract-pdf";
import { extractUrlText } from "@/lib/context/extract-url";
import { extractNotionPage } from "@/lib/context/extract-notion";
import { extractTextFileContent } from "@/lib/context/extract-text-file";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const sources = getContextSources(parseInt(memberId));
    return NextResponse.json(sources);
  } catch (error) {
    console.error("Error fetching context sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch context sources" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const memberIdNum = parseInt(memberId);

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      return handleFileUpload(request, memberIdNum);
    } else {
      return handleJsonSource(request, memberIdNum);
    }
  } catch (error) {
    console.error("Error adding context source:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to add context source",
      },
      { status: 500 }
    );
  }
}

async function handleFileUpload(request: NextRequest, memberId: number) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;

  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 10MB)" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let content: string;
  const title = file.name;

  if (type === "pdf") {
    content = await extractPdfText(buffer);
  } else if (type === "text_file") {
    content = extractTextFileContent(buffer);
  } else {
    return NextResponse.json(
      { error: "Invalid file type" },
      { status: 400 }
    );
  }

  if (!content.trim()) {
    return NextResponse.json(
      { error: "No text content could be extracted from this file" },
      { status: 400 }
    );
  }

  const source = createContextSource({
    memberId,
    type: type as "pdf" | "text_file",
    title,
    content,
    fileName: file.name,
  });

  return NextResponse.json(source, { status: 201 });
}

async function handleJsonSource(request: NextRequest, memberId: number) {
  const body = await request.json();

  if (body.type === "manual") {
    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const source = createContextSource({
      memberId,
      type: "manual",
      title: body.title || "Manual context",
      content: body.content.trim(),
    });

    return NextResponse.json(source, { status: 201 });
  }

  if (body.type === "url") {
    if (!body.url?.trim()) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const { title, content } = await extractUrlText(body.url.trim());

    const source = createContextSource({
      memberId,
      type: "url",
      title,
      content,
      sourceUrl: body.url.trim(),
    });

    return NextResponse.json(source, { status: 201 });
  }

  if (body.type === "notion") {
    if (!body.url?.trim()) {
      return NextResponse.json(
        { error: "Notion page URL is required" },
        { status: 400 }
      );
    }

    const notionKey =
      body.notionApiKey?.trim() || process.env.NOTION_API_KEY;
    if (!notionKey) {
      return NextResponse.json(
        { error: "Notion API key is required (set per-request or in .env)" },
        { status: 400 }
      );
    }

    const { title, content } = await extractNotionPage(
      body.url.trim(),
      notionKey
    );

    const source = createContextSource({
      memberId,
      type: "notion",
      title,
      content,
      sourceUrl: body.url.trim(),
    });

    return NextResponse.json(source, { status: 201 });
  }

  return NextResponse.json(
    { error: "Invalid source type" },
    { status: 400 }
  );
}
