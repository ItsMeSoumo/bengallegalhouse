import { cookies } from "next/headers";
import crypto from "crypto";

export const COOKIE_NAME = "admin_token";
const SECRET =
  process.env.ADMIN_JWT_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "sohamcbt_master_admin_secret_key_2026";

/**
 * Creates a signed admin session token using HMAC SHA-256.
 */
export function createAdminToken(): string {
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac("sha256", SECRET).update(timestamp).digest("hex");
  return `${timestamp}.${hmac}`;
}

/**
 * Verifies if an admin session token is valid and not expired (24-hour TTL).
 */
export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // 24-hour expiration check
  const maxAgeMs = 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  const expectedHmac = crypto.createHmac("sha256", SECRET).update(timestampStr).digest("hex");

  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedHmac, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Sets the HTTP-Only admin authentication cookie.
 */
export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60, // 24 hours
  });
}

/**
 * Clears the admin session cookie on logout.
 */
export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Checks if current request has a valid admin session cookie.
 */
export async function isAdminAuthenticatedOnServer(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    return verifyAdminToken(token);
  } catch {
    return false;
  }
}
