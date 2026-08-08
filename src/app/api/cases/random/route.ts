import { getDb, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RandomCaseRow {
  id: string;
  name: string;
  photoUrls: unknown;
  lostProvince: string | null;
  lostCity: string | null;
  lostDate: string | null;
  gender: string | null;
  source: string | null;
}

// Simple in-memory rate limiter — max 30 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Periodic cleanup to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 120_000);
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(request: Request) {
  // Token auth
  const expectedToken = process.env.EXTERNAL_API_TOKEN?.trim();
  if (expectedToken) {
    const provided = request.headers.get("x-api-token")?.trim();
    if (!provided || provided !== expectedToken) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // Rate limiting
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return Response.json({ error: "too many requests" }, { status: 429 });
  }

  const db = await getDb();

  const rows: RandomCaseRow[] = await db
    .select({
      id: schema.cases.id,
      name: schema.cases.name,
      photoUrls: schema.cases.photoUrls,
      lostProvince: schema.cases.lostProvince,
      lostCity: schema.cases.lostCity,
      lostDate: schema.cases.lostDate,
      gender: schema.cases.gender,
      source: schema.cases.source,
    })
    .from(schema.cases)
    .where(eq(schema.cases.status, "approved"))
    .orderBy(sql`RANDOM()`)
    .limit(3);

  const items = rows.map((row) => {
    let photos: string[] = [];
    try {
      photos = typeof row.photoUrls === "string"
        ? JSON.parse(row.photoUrls)
        : (row.photoUrls as string[]) ?? [];
    } catch {
      photos = [];
    }

    return {
      id: row.id,
      name: row.name,
      photo: photos[0] ?? null,
      lostProvince: row.lostProvince,
      lostCity: row.lostCity,
      lostDate: row.lostDate,
      gender: row.gender,
      source: row.source ?? null,
    };
  });

  return Response.json({ items });
}
