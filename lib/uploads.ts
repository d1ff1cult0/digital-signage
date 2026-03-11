import path from "path";
import fs from "fs/promises";

export function getUploadsDir(): string {
  return path.resolve(process.env.UPLOADS_DIR || "./uploads");
}

export async function ensureUploadsDir(): Promise<void> {
  const dir = getUploadsDir();
  await fs.mkdir(dir, { recursive: true });
}

export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
  };
  return mimeMap[ext] || "application/octet-stream";
}
