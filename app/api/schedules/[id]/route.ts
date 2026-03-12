import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const scheduleId = parseInt(id, 10);
  if (isNaN(scheduleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ...(body.screenId && { screenId: parseInt(body.screenId, 10) }),
        ...(body.mediaId && { mediaId: parseInt(body.mediaId, 10) }),
        ...(body.startTime && { startTime: body.startTime }),
        ...(body.endTime && { endTime: body.endTime }),
      },
      include: { screen: true, media: true },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Update schedule error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const scheduleId = parseInt(id, 10);
  if (isNaN(scheduleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await prisma.schedule.delete({ where: { id: scheduleId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete schedule error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
