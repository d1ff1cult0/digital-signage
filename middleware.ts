import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/display",
  "/api/auth",
  "/api/screens/",
  "/api/uploads/",
  "/_next",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("signage_auth")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const parts = token.split(":");
  if (parts.length !== 3) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const [role, expStr, sig] = parts;
  const payload = `${role}:${expStr}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (sig !== expected) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("signage_auth");
    return res;
  }

  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("signage_auth");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
