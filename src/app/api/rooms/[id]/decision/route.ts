import { NextRequest, NextResponse } from "next/server";
import { getDecision, getRoom, saveDecision } from "@/lib/db/queries";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const roomId = Number((await params).id);
  if (!getRoom(roomId)) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({ content: getDecision(roomId) });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const roomId = Number((await params).id);
  if (!getRoom(roomId)) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.content !== "string") {
    return NextResponse.json(
      { error: "Decision text is required" },
      { status: 400 }
    );
  }

  saveDecision(roomId, body.content);
  return NextResponse.json({ content: body.content });
}
