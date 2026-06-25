import { getDb, schema } from "@/lib/db";
import { eq, and, like, or, desc, SQL } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get("province");
  const city = searchParams.get("city");
  const district = searchParams.get("district");
  const gender = searchParams.get("gender");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const db = await getDb();
  const conditions: SQL[] = [eq(schema.cases.status, "approved")];

  if (province) {
    conditions.push(eq(schema.cases.lostProvince, province));
  }
  if (city) {
    conditions.push(eq(schema.cases.lostCity, city));
  }
  if (district) {
    conditions.push(eq(schema.cases.lostDistrict, district));
  }
  if (gender) {
    conditions.push(eq(schema.cases.gender, gender));
  }

  const rows = await db
    .select()
    .from(schema.cases)
    .where(and(...conditions))
    .orderBy(desc(schema.cases.createdAt))
    .limit(limit);

  return Response.json(rows);
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
