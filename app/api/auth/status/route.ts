import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const adminCount = await prisma.admin.count();
  return NextResponse.json({ setup: adminCount === 0 });
}
