import { NextRequest, NextResponse } from "next/server";
import { deleteMember, getMember, updateMember } from "@/lib/db/queries";
import { SUPPORTED_ENGINES, type Engine } from "@/lib/agents/types";
import { toClientMember } from "@/lib/members";
import type { UpdateMemberRequest } from "@/types";
import path from "path";
import fs from "fs";

function isDirectory(directoryPath: string): boolean {
  try {
    return fs.statSync(directoryPath).isDirectory();
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const roomId = parseInt(id);
    const memberIdNumber = parseInt(memberId);
    const currentMember = getMember(memberIdNumber);

    if (!currentMember || currentMember.roomId !== roomId) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = (await request.json()) as UpdateMemberRequest;
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

    const engine = body.engine || currentMember.engine;
    if (!SUPPORTED_ENGINES.includes(engine as Engine)) {
      return NextResponse.json(
        { error: "Unsupported agent engine" },
        { status: 400 }
      );
    }

    const updates: Parameters<typeof updateMember>[1] = {
      name: body.name.trim(),
      repoPath,
      engine,
      context: body.context?.trim() || null,
    };

    if (body.clearApiKey) {
      updates.apiKey = null;
    } else if (body.apiKey?.trim()) {
      updates.apiKey = body.apiKey.trim();
    }

    const member = updateMember(memberIdNumber, updates);
    return NextResponse.json(toClientMember(member));
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const roomId = parseInt(id);
    const memberIdNumber = parseInt(memberId);
    const member = getMember(memberIdNumber);

    if (!member || member.roomId !== roomId) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    deleteMember(memberIdNumber);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
