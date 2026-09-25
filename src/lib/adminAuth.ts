import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

// Hash both sides to a fixed length first so the comparison is constant-time
// and doesn't leak the length of the real password.
export function passwordMatches(candidate: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof candidate !== "string") return false;
  const digest = (value: string) => createHmac("sha256", "admin-password-compare").update(value).digest();
  return timingSafeEqual(digest(candidate), digest(expected));
}

// The signing key is derived from a server-only secret AND the current admin
// password, so changing ADMIN_PASSWORD immediately invalidates every session.
function signingKey(): Buffer | null {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!password || !secret) return null;
  return createHmac("sha256", secret).update(password).digest();
}

function sign(payload: string, key: Buffer): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createSessionToken(): string | null {
  const key = signingKey();
  if (!key) return null;
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return `${expiresAt}.${sign(expiresAt, key)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const key = signingKey();
  if (!token || !key) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;

  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(expiresAt, key));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > Date.now() / 1000;
}

/**
 * Guard for admin route handlers. Returns a 401 response when the request has
 * no valid session cookie, or null when the caller is allowed through:
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies();
  if (verifySessionToken(store.get(ADMIN_COOKIE)?.value)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// ── Login throttling ────────────────────────────────────────────────────────
// In-memory and per server instance: it stops casual brute-forcing but is not
// shared across serverless instances. Put a real rate limiter (Upstash, Vercel
// Firewall, ...) in front of /api/admin/session for stronger guarantees.
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function loginRetryAfterSeconds(ip: string): number {
  const entry = failedAttempts.get(ip);
  if (!entry) return 0;
  if (entry.resetAt <= Date.now()) {
    failedAttempts.delete(ip);
    return 0;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 0;
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    failedAttempts.set(ip, { count: 1, resetAt: now + LOCKOUT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearFailedLogins(ip: string): void {
  failedAttempts.delete(ip);
}
