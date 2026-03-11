import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const screens = await prisma.screen.findMany({
    include: {
      schedules: {
        include: { media: true },
        where: { active: true },
      },
    },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(screens);
}
