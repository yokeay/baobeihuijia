import { getDb, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";

let cache: { total: number; found: number; ts: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < 3600_000) {
    return Response.json(cache);
  }
  const db = await getDb();
  const [totalRow] = await db.select({ n: count() }).from(schema.cases).where(eq(schema.cases.status, "approved"));
  const [foundRow] = await db.select({ n: count() }).from(schema.cases).where(eq(schema.cases.status, "found"));
  cache = { total: Number(totalRow.n), found: Number(foundRow.n), ts: now };
  return Response.json({ total: cache.total, found: cache.found });
}
