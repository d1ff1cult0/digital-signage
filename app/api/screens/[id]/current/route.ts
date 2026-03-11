import { prisma } from "@/lib/prisma";
import { getBrusselsNow } from "@/lib/timezone";
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

  const { day: currentDay, time: currentTime } = getBrusselsNow();

  const schedules = await prisma.schedule.findMany({
    where: {
      screenId,
      active: true,
    },
    include: { media: true },
    orderBy: { priority: "desc" },
  });

  const matching = schedules.find((s) => {
    const days = s.days.split(",").map((d) => d.trim().toLowerCase());
    if (!days.includes(currentDay)) return false;
    return currentTime >= s.startTime && currentTime < s.endTime;
  });

  if (!matching) {
    return NextResponse.json({ media: null, schedule: null });
  }

  return NextResponse.json({
    media: matching.media,
    schedule: {
      id: matching.id,
      startTime: matching.startTime,
      endTime: matching.endTime,
      days: matching.days,
      priority: matching.priority,
    },
  });
}
