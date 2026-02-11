import { NextRequest, NextResponse } from "next/server";
import { updateMemberOrder } from "@/lib/db/queries";

// POST /api/rooms/[id]/members/reorder
// Body: { orderedIds: [3, 1, 2] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // validate route
    const body = await request.json();
    const orderedIds: number[] = body.orderedIds;

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    for (let i = 0; i < orderedIds.length; i++) {
      updateMemberOrder(orderedIds[i], i);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering members:", error);
    return NextResponse.json(
      { error: "Failed to reorder members" },
      { status: 500 }
    );
  }
}
