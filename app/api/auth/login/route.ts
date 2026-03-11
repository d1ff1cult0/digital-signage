import { createToken, hashPassword, setAuthCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const adminCount = await prisma.admin.count();

  if (adminCount === 0) {
    const passwordHash = hashPassword(password);
    await prisma.admin.create({
      data: { username, passwordHash },
    });

    const token = createToken();
    await setAuthCookie(token);
    return NextResponse.json({ ok: true, created: true });
  }

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createToken();
  await setAuthCookie(token);
  return NextResponse.json({ ok: true });
}
