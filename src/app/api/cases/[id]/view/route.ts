import { getDb, schema } from "@/lib/db";
import { getPool } from "@/lib/db/adapter-local-pg";
import { getCasesTableName, SYNCED_COUNTRIES } from "@/lib/db/country-helpers";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const ua = request.headers.get("user-agent") ?? "";
  const fingerprint = crypto.createHash("md5").update(ip + ua).digest("hex");

  const db = await getDb();
  // Try to record unique view (fingerprint may already exist, that's ok).
  // Foreign-country cases aren't in `cases`, so the FK check fails there — ignore.
  try {
    await db.insert(schema.caseViews).values({ id: uuidv4(), caseId: id, fingerprint });
  } catch {
    // duplicate fingerprint or non-Chinese case, ignore
  }

  // Always increment view count. Cases live in a table per country, and the id
  // itself doesn't say which one, so fall through the synced tables in turn.
  const updated = await db
    .update(schema.cases)
    .set({ viewCount: sql`view_count + 1` })
    .where(eq(schema.cases.id, id))
    .returning({ id: schema.cases.id });

  if (updated.length === 0) {
    const pool = getPool();
    for (const countryCode of SYNCED_COUNTRIES) {
      const result = await pool.query(
        `UPDATE "${getCasesTableName(countryCode)}" SET view_count = view_count + 1 WHERE id = $1`,
        [id]
      );
      if (result.rowCount) break;
    }
  }

  return Response.json({ ok: true });
}
