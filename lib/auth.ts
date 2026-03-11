import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "signage_auth";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "change-me-to-a-random-string") {
    throw new Error("AUTH_SECRET env variable must be set to a secure random string");
  }
  return secret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}

export function createToken(): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `admin:${exp}`;
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return `${payload}:${sig}`;
}

export function verifyToken(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  const payload = `${role}:${expStr}`;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return false;
  }

  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) {
    return false;
  }

  return true;
}

export function verifyTokenRaw(token: string, secret: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  const payload = `${role}:${expStr}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return false;
  }

  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) {
    return false;
  }

  return true;
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthCookie();
  if (!token) return false;
  return verifyToken(token);
}
