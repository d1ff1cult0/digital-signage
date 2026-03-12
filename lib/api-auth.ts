import { NextResponse } from "next/server";
import { getAuthCookie, verifyToken } from "./auth";

export async function requireAuth(): Promise<NextResponse | null> {
  const token = await getAuthCookie();
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
