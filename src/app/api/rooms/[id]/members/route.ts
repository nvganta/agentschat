import { NextRequest, NextResponse } from "next/server";
import { createMember, getMembers, createContextSource } from "@/lib/db/queries";
import type { CreateMemberRequest } from "@/types";
import path from "path";
import fs from "fs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const allMembers = getMembers(parseInt(id));
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
    if (!fs.existsSync(repoPath)) {
      return NextResponse.json(
        { error: "Repository path does not exist" },
        { status: 400 }
      );
    }

    const member = createMember({
      roomId: parseInt(id),
      name: body.name.trim(),
      repoPath,
      engine: body.engine || "claude",
      context: body.context?.trim() || null,
      apiKey: body.apiKey?.trim() || null,
    });

    // Auto-create a context source from the initial context text
    if (body.context?.trim()) {
      createContextSource({
        memberId: member.id,
        type: "manual",
        title: "Manual context",
        content: body.context.trim(),
      });
    }

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
