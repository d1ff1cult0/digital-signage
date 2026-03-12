import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const schedules = await prisma.schedule.findMany({
    include: { screen: true, media: true },
    orderBy: [{ screenId: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const body = await req.json();
    const { screenId, mediaId, startTime, endTime } = body;

    if (!screenId || !mediaId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "screenId, mediaId, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.create({
      data: {
        screenId: parseInt(screenId, 10),
        mediaId: parseInt(mediaId, 10),
        startTime,
        endTime,
      },
      include: { screen: true, media: true },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Create schedule error:", error);
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
}
