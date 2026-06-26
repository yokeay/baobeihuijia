import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "baobeihuijia-secret-change-me"
);
const COOKIE_NAME = "auth_token";

export interface AdminSession {
  id: string;
  username: string;
  githubUsername?: string;
  avatarUrl?: string;
}

export function signToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function getAdminFromCookies(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.admins)
    .where(eq(schema.admins.id, payload.id))
    .limit(1);

  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    username: rows[0].username,
    githubUsername: rows[0].githubUsername || undefined,
    avatarUrl: rows[0].avatarUrl || undefined,
  };
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
