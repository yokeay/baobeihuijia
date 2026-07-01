import { getDb, schema } from "@/lib/db";
import { eq, and, like, desc, sql, type SQL } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  getCasesTableName,
  ensureCountryTable,
  buildCasesQuery,
  CASES_SELECT,
} from "@/lib/db/country-helpers";
import { getPool } from "@/lib/db/adapter-local-pg";

const DEFAULT_COUNTRY = "CN";

// HK/MO/TW share the same data table as CN
function normalizeCountryCode(code: string): string {
  const ZH = new Set(["CN", "HK", "MO", "TW"]);
  return ZH.has(code.toUpperCase()) ? "CN" : code.toUpperCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get("countryCode") || DEFAULT_COUNTRY;
  const countryCode = normalizeCountryCode(rawCode);
  const province = searchParams.get("province");
  const city = searchParams.get("city");
  const district = searchParams.get("district");
  const gender = searchParams.get("gender");
  const search = searchParams.get("search");
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);
  const offset = (page - 1) * limit;

  if (countryCode === "CN") {
    const db = await getDb();
    const conditions: SQL[] = [eq(schema.cases.status, "approved")];

    if (province) conditions.push(eq(schema.cases.lostProvince, province));
    if (city) conditions.push(eq(schema.cases.lostCity, city));
    if (district) conditions.push(eq(schema.cases.lostDistrict, district));
    if (gender) conditions.push(eq(schema.cases.gender, gender));
    if (search) conditions.push(like(schema.cases.name, `%${search}%`));

    const where = and(...conditions);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.cases)
      .where(where);

    const total = countRow?.count ?? 0;

    const items = await db
      .select()
      .from(schema.cases)
      .where(where)
      .orderBy(desc(schema.cases.createdAt))
      .limit(limit)
      .offset(offset);

    return Response.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  }

  // Non-CN country — dynamic table
  await ensureCountryTable(countryCode);
  const pool = getPool();
  const { tableName, where, values } = buildCasesQuery({
    countryCode,
    search,
    province,
    city,
    district,
    gender,
    status: "approved",
  });

  const countResult = await pool.query(
    `SELECT count(*)::int FROM "${tableName}" ${where}`,
    values
  );
  const total: number = countResult.rows[0]?.count ?? 0;

  const rows = await pool.query(
    `SELECT ${CASES_SELECT} FROM "${tableName}" ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  return Response.json({ items: rows.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, lostDate, photoUrls } = body;

  if (!name || !lostDate) {
    return Response.json({ error: "姓名和走失日期为必填项" }, { status: 400 });
  }
  if (!photoUrls) {
    return Response.json({ error: "请上传至少一张照片" }, { status: 400 });
  }

  const countryCode = normalizeCountryCode(body.countryCode || DEFAULT_COUNTRY);

  if (countryCode === "CN") {
    const db = await getDb();
    const id = uuidv4();

    await db.insert(schema.cases).values({
      id,
      name,
      gender: body.gender || null,
      birthDate: body.birthDate || null,
      lostDate,
      lostProvince: body.lostProvince || null,
      lostCity: body.lostCity || null,
      lostDistrict: body.lostDistrict || null,
      lostAddress: body.lostAddress || null,
      height: body.height || null,
      feature: body.feature || null,
      photoUrls,
      source: "user_submit",
      status: "pending",
      submitterName: body.submitterName || null,
      submitterContact: body.submitterContact || null,
    });

    return Response.json({ id }, { status: 201 });
  }

  await ensureCountryTable(countryCode);
  const pool = getPool();
  const tableName = getCasesTableName(countryCode);
  const id = uuidv4();

  await pool.query(
    `INSERT INTO "${tableName}" (id, name, gender, birth_date, lost_date, lost_province, lost_city, lost_district, lost_address, height, feature, photo_urls, source, status, submitter_name, submitter_contact) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      id,
      name,
      body.gender || null,
      body.birthDate || null,
      lostDate,
      body.lostProvince || null,
      body.lostCity || null,
      body.lostDistrict || null,
      body.lostAddress || null,
      body.height || null,
      body.feature || null,
      photoUrls,
      "user_submit",
      "pending",
      body.submitterName || null,
      body.submitterContact || null,
    ]
  );

  return Response.json({ id }, { status: 201 });
}
