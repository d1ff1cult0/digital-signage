import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const DAY_MAP: Record<number, string> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const screenId = parseInt(id, 10);
  if (isNaN(screenId)) {
    return NextResponse.json({ error: "Invalid screen ID" }, { status: 400 });
  }

  const now = new Date();
  const currentDay = DAY_MAP[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

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
