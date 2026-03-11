import { prisma } from "@/lib/prisma";
import { ensureUploadsDir, generateFilename, getUploadsDir } from "@/lib/uploads";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { schedules: true } },
    },
  });
  return NextResponse.json(media);
}

export async function POST(req: NextRequest) {
  try {
    await ensureUploadsDir();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and video files (MP4, WebM, MOV) are allowed" },
        { status: 400 }
      );
    }

    const filename = generateFilename(file.name);
    const filepath = path.join(getUploadsDir(), filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    const media = await prisma.media.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
