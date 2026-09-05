import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getPool } from "./adapter-local-pg";
import { getCasesTableName, CASES_SELECT, rowToCamelCase, SYNCED_COUNTRIES } from "./country-helpers";

export interface CaseRecord {
  id: string;
  name: string;
  gender?: string | null;
  birthDate?: string | null;
  lostDate?: string | null;
  lostProvince?: string | null;
  lostCity?: string | null;
  lostDistrict?: string | null;
  lostAddress?: string | null;
  height?: number | null;
  feature?: string | null;
  photoUrls?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  status?: string | null;
  viewCount?: number | null;
  followCount?: number | null;
  missingCountry?: string | null;
  updatedAt?: Date | string | null;
}

/**
 * Look up one case by id across every country table.
 * IDs are UUIDs so they are globally unique — the country doesn't need to be
 * known upfront. Shared by the detail API route and the server-rendered detail
 * page (which needs the record to build per-case metadata).
 */
export async function findCaseById(id: string): Promise<CaseRecord | null> {
  const db = await getDb();
  const rows = await db.select().from(schema.cases).where(eq(schema.cases.id, id)).limit(1);
  if (rows.length > 0) return rows[0] as CaseRecord;

  const pool = getPool();
  for (const countryCode of SYNCED_COUNTRIES) {
    const tableName = getCasesTableName(countryCode);
    const result = await pool.query(
      `SELECT ${CASES_SELECT} FROM "${tableName}" WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (result.rows.length > 0) {
      return rowToCamelCase(result.rows[0]) as unknown as CaseRecord;
    }
  }

  return null;
}

/** First usable photo URL for a case, or null. */
export function firstPhotoUrl(photoUrls?: string | null): string | null {
  if (!photoUrls) return null;
  try {
    const arr = JSON.parse(photoUrls);
    if (Array.isArray(arr)) {
      const found = arr.find((u: unknown) => typeof u === "string" && u.length > 0);
      return typeof found === "string" ? found : null;
    }
  } catch {
    // malformed JSON — treated as no photo
  }
  return null;
}
