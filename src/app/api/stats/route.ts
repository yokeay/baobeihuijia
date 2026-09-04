import { getDb, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { getPool } from "@/lib/db/adapter-local-pg";
import { getCasesTableName, SYNCED_COUNTRIES } from "@/lib/db/country-helpers";

let cache: { total: number; found: number; ts: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < 3600_000) {
    return Response.json(cache);
  }

  const db = await getDb();
  const [cnTotalRow] = await db.select({ n: count() }).from(schema.cases).where(eq(schema.cases.status, "approved"));
  const [cnFoundRow] = await db.select({ n: count() }).from(schema.cases).where(eq(schema.cases.status, "found"));

  let total = Number(cnTotalRow.n);
  let found = Number(cnFoundRow.n);

  const pool = getPool();
  for (const countryCode of SYNCED_COUNTRIES) {
    const tableName = getCasesTableName(countryCode);
    const [totalResult, foundResult] = await Promise.all([
      pool.query(`SELECT count(*)::int AS n FROM "${tableName}" WHERE status = $1`, ["approved"]),
      pool.query(`SELECT count(*)::int AS n FROM "${tableName}" WHERE status = $1`, ["found"]),
    ]);
    total += totalResult.rows[0]?.n ?? 0;
    found += foundResult.rows[0]?.n ?? 0;
  }

  cache = { total, found, ts: now };
  return Response.json(cache);
}

