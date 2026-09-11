import { NextRequest, NextResponse } from "next/server";
import { createMember, getMembers } from "@/lib/db/queries";
import { SUPPORTED_ENGINES, type Engine } from "@/lib/agents/types";
import { toClientMember } from "@/lib/members";
import type { CreateMemberRequest } from "@/types";
import path from "path";
import fs from "fs";

function isDirectory(directoryPath: string): boolean {
  try {
    return fs.statSync(directoryPath).isDirectory();
  } catch {
    return false;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const allMembers = getMembers(parseInt(id)).map(toClientMember);
    return NextResponse.json(allMembers);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as CreateMemberRequest;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Agent name is required" },
        { status: 400 }
      );
    }

    if (!body.repoPath?.trim()) {
      return NextResponse.json(
        { error: "Repository path is required" },
        { status: 400 }
      );
    }

    const repoPath = path.resolve(body.repoPath.trim());
    if (!isDirectory(repoPath)) {
      return NextResponse.json(
        { error: "Repository path must be an existing folder" },
        { status: 400 }
      );
    }

    const engine = body.engine || "claude";
    if (!SUPPORTED_ENGINES.includes(engine as Engine)) {
      return NextResponse.json(
        { error: "Unsupported agent engine" },
        { status: 400 }
      );
    }

    const member = createMember({
      roomId: parseInt(id),
      name: body.name.trim(),
      repoPath,
      engine,
      context: body.context?.trim() || null,
      apiKey: body.apiKey?.trim() || null,
    });

    return NextResponse.json(toClientMember(member), { status: 201 });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
