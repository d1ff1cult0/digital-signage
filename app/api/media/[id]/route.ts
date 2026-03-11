import { prisma } from "@/lib/prisma";
import { getUploadsDir } from "@/lib/uploads";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mediaId = parseInt(id, 10);
  if (isNaN(mediaId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const filepath = path.join(getUploadsDir(), media.filename);
    try {
      await fs.unlink(filepath);
    } catch {
      // file may already be gone
    }

    await prisma.media.delete({ where: { id: mediaId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
