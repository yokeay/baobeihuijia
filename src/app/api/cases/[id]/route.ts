import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getPool } from "@/lib/db/adapter-local-pg";
import { getCasesTableName, CASES_SELECT, rowToCamelCase } from "@/lib/db/country-helpers";

// Country tables that actually have synced data (kept in sync with src/lib/sync/*.ts).
// IDs are UUIDs, globally unique, so we can look them up without knowing the country upfront.
const SYNCED_COUNTRIES = ["US", "HK"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.id, id))
    .limit(1);

  if (rows.length > 0) {
    return Response.json(rows[0]);
  }

  const pool = getPool();
  for (const countryCode of SYNCED_COUNTRIES) {
    const tableName = getCasesTableName(countryCode);
    const result = await pool.query(
      `SELECT ${CASES_SELECT} FROM "${tableName}" WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (result.rows.length > 0) {
      return Response.json(rowToCamelCase(result.rows[0]));
    }
  }

  return Response.json({ error: "案件不存在" }, { status: 404 });
}
