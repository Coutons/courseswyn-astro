import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "courseswyn_admin_session";

function sanitizeToken(token: string | undefined | null): string | null {
  const trimmed = token?.trim();
  return trimmed ? trimmed : null;
}

export function getAllowedAdminTokens(): string[] {
  const envTokens = [
    process.env.ADMIN_PASSWORD,
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD,
    process.env.NEXT_PUBLIC_ADMIN_TOKEN,
    process.env.ADMIN_DEV_TOKEN,
  ]
    .map(sanitizeToken)
    .filter((value): value is string => Boolean(value));

  if (envTokens.length > 0) {
    return envTokens;
  }

  if (process.env.NODE_ENV !== "production") {
    return ["1983", "dev-admin"];
  }

  return [];
}

export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const allowed = getAllowedAdminTokens();
  return allowed.includes(token.trim());
}

export function extractTokenFromRequest(req: NextRequest): string | null {
  const headerToken = sanitizeToken(req.headers.get("x-admin-token"));
  if (headerToken && verifyAdminToken(headerToken)) {
    return headerToken;
  }

  const cookieToken = sanitizeToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (cookieToken && verifyAdminToken(cookieToken)) {
    return cookieToken;
  }

  return null;
}

export function requireAdmin(req: NextRequest): void {
  const token = extractTokenFromRequest(req);
  if (!token) {
    throw new Error("Unauthorized");
  }
}

export async function setAdminSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export function hasAdminSession(req: NextRequest): boolean {
  return Boolean(extractTokenFromRequest(req));
}
