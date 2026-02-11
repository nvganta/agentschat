import { NextRequest, NextResponse } from "next/server";
import { deleteContextSource } from "@/lib/db/queries";

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; memberId: string; sourceId: string }>;
  }
) {
  try {
    const { sourceId } = await params;
    deleteContextSource(parseInt(sourceId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting context source:", error);
    return NextResponse.json(
      { error: "Failed to delete context source" },
      { status: 500 }
    );
  }
}
