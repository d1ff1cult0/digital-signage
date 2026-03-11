import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const screenId = parseInt(id, 10);
  if (isNaN(screenId)) {
    return NextResponse.json({ error: "Invalid screen ID" }, { status: 400 });
  }

  const screen = await prisma.screen.findUnique({ where: { id: screenId } });
  if (!screen) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }

  const schedules = await prisma.schedule.findMany({
    where: { screenId },
    include: { media: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({
    screen: { id: screen.id, name: screen.name },
    slots: schedules.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      media: {
        id: s.media.id,
        filename: s.media.filename,
        originalName: s.media.originalName,
        mimeType: s.media.mimeType,
      },
    })),
  });
}
