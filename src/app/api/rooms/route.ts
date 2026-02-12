import { NextRequest, NextResponse } from "next/server";
import { createRoom, getRooms } from "@/lib/db/queries";
import type { CreateRoomRequest } from "@/types";

export async function GET() {
  try {
    const allRooms = getRooms();
    return NextResponse.json(allRooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateRoomRequest;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    const room = createRoom({ name: body.name.trim() });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
