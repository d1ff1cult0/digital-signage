import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const screenId = parseInt(id, 10);
  if (isNaN(screenId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const screen = await prisma.screen.update({
      where: { id: screenId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
      },
    });
    return NextResponse.json(screen);
  } catch (error) {
    console.error("Update screen error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const screenId = parseInt(id, 10);
  if (isNaN(screenId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await prisma.screen.delete({ where: { id: screenId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete screen error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
