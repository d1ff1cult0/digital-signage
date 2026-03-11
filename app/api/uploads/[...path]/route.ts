import { getUploadsDir } from "@/lib/uploads";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import nodePath from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filename = segments.join("/");

  const safeName = nodePath.basename(filename);
  const filepath = nodePath.join(getUploadsDir(), safeName);

  try {
    const stat = await fs.stat(filepath);
    const buffer = await fs.readFile(filepath);

    const ext = nodePath.extname(safeName).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
    };

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeMap[ext] || "application/octet-stream",
        "Content-Length": stat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
