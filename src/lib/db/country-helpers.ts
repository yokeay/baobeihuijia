import { getPool } from "./adapter-local-pg";

const CASES_COLUMNS = [
  "id", "name", "gender", "birth_date", "lost_date",
  "lost_province", "lost_city", "lost_district", "lost_address",
  "height", "feature", "photo_urls", "source", "source_url", "source_id",
  "status", "submitter_name", "submitter_contact",
  "reviewed_by", "reviewed_at", "created_at", "updated_at",
  "view_count", "follow_count", "missing_country",
];

export function getCasesTableName(countryCode: string): string {
  if (countryCode === "CN") return "cases";
  return `cases_${countryCode.toLowerCase()}`;
}

export async function ensureCountryTable(countryCode: string) {
  if (countryCode === "CN") return; // cases table created in initDb

  const pool = getPool();
  const tableName = getCasesTableName(countryCode);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gender TEXT,
      birth_date TEXT,
      lost_date TEXT NOT NULL,
      lost_province TEXT,
      lost_city TEXT,
      lost_district TEXT,
      lost_address TEXT,
      height INTEGER,
      feature TEXT,
      photo_urls TEXT NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT,
      source_id TEXT,
      status TEXT DEFAULT 'pending',
      submitter_name TEXT,
      submitter_contact TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now(),
      view_count INTEGER NOT NULL DEFAULT 0,
      follow_count INTEGER NOT NULL DEFAULT 0,
      missing_country TEXT
    );
  `);

  // Backfill columns for tables created before v2.0 added these fields.
  await pool.query(`
    ALTER TABLE "${tableName}"
      ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS follow_count INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS missing_country TEXT;
  `);
}

/** Constructs a parameterised SELECT query against a country table. */
export function buildCasesQuery(params: {
  countryCode: string;
  search?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  gender?: string | null;
  source?: string | null;
  status?: string | null;
}) {
  const tableName = getCasesTableName(params.countryCode);
  const conditions: string[] = [];
  const values: (string | null)[] = [];
  let idx = 1;

  if (params.search) {
    conditions.push(`name ILIKE '%' || $${idx} || '%'`);
    values.push(params.search);
    idx++;
  }
  if (params.province) {
    conditions.push(`lost_province = $${idx}`);
    values.push(params.province);
    idx++;
  }
  if (params.city) {
    conditions.push(`lost_city = $${idx}`);
    values.push(params.city);
    idx++;
  }
  if (params.district) {
    conditions.push(`lost_district = $${idx}`);
    values.push(params.district);
    idx++;
  }
  if (params.gender) {
    conditions.push(`gender = $${idx}`);
    values.push(params.gender);
    idx++;
  }
  if (params.source) {
    conditions.push(`source = $${idx}`);
    values.push(params.source);
    idx++;
  }
  if (params.status) {
    conditions.push(`status = $${idx}`);
    values.push(params.status);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { tableName, where, values, idx };
}

/** Select columns in order matching the API response shape. */
export const CASES_SELECT = CASES_COLUMNS.join(", ");

/** Converts a raw pg row (snake_case columns) to the camelCase shape the frontend expects (matches Drizzle's output for the CN table). */
export function rowToCamelCase(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
    out[camelKey] = value;
  }
  return out;
}
