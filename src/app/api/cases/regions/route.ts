import { getPool } from "@/lib/db/adapter-local-pg";
import { ensureCountryTable, getCasesTableName, isValidCountryCode } from "@/lib/db/country-helpers";

// Region options are derived from the rows that actually exist for a country,
// not from a static subdivision list — so every option in the dropdown is
// guaranteed to return results, and newly synced countries work for free.
const LEVEL_COLUMNS = {
  province: "lost_province",
  city: "lost_city",
  district: "lost_district",
} as const;

type Level = keyof typeof LEVEL_COLUMNS;

function isLevel(v: string): v is Level {
  return v === "province" || v === "city" || v === "district";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = (searchParams.get("countryCode") || "CN").toUpperCase();
  const level = searchParams.get("level") || "province";

  if (!isValidCountryCode(countryCode)) {
    return Response.json({ error: "Invalid countryCode" }, { status: 400 });
  }
  if (!isLevel(level)) {
    return Response.json({ error: "Invalid level" }, { status: 400 });
  }

  const column = LEVEL_COLUMNS[level];
  const conditions = ["status = 'approved'", `${column} IS NOT NULL`, `${column} <> ''`];
  const values: string[] = [];

  // Narrow by the parent selections so each level only offers reachable values.
  if (level !== "province") {
    const province = searchParams.get("province");
    if (province) {
      values.push(province);
      conditions.push(`lost_province = $${values.length}`);
    }
  }
  if (level === "district") {
    const city = searchParams.get("city");
    if (city) {
      values.push(city);
      conditions.push(`lost_city = $${values.length}`);
    }
  }

  try {
    await ensureCountryTable(countryCode);
    const tableName = getCasesTableName(countryCode);
    const result = await getPool().query(
      `SELECT ${column} AS value, count(*)::int AS count
         FROM "${tableName}"
        WHERE ${conditions.join(" AND ")}
        GROUP BY ${column}
        ORDER BY count(*) DESC, ${column} ASC
        LIMIT 500`,
      values
    );
    return Response.json({
      options: result.rows.map((r: { value: string; count: number }) => ({
        value: r.value,
        count: r.count,
      })),
    });
  } catch {
    // A country with no table yet simply has no regions to offer.
    return Response.json({ options: [] });
  }
}
