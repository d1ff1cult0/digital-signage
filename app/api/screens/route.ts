import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const screens = await prisma.screen.findMany({
    include: {
      schedules: {
        include: { media: true },
        orderBy: { startTime: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(screens);
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const screen = await prisma.screen.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(screen, { status: 201 });
  } catch (error) {
    console.error("Create screen error:", error);
    return NextResponse.json({ error: "Failed to create screen" }, { status: 500 });
  }
}
