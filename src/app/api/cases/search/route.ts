import { getDb, schema } from "@/lib/db";
import { eq, and, like, desc, sql, type SQL } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const province = searchParams.get("province");
  const city = searchParams.get("city");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  if (!q || !q.trim()) {
    return Response.json({ error: "请输入搜索关键词" }, { status: 400 });
  }

  const db = await getDb();
  const conditions: SQL[] = [
    eq(schema.cases.status, "approved"),
    like(schema.cases.name, `%${q.trim()}%`),
  ];

  if (province) conditions.push(eq(schema.cases.lostProvince, province));
  if (city) conditions.push(eq(schema.cases.lostCity, city));

  const items = await db
    .select({
      id: schema.cases.id,
      name: schema.cases.name,
      gender: schema.cases.gender,
      lostProvince: schema.cases.lostProvince,
      lostCity: schema.cases.lostCity,
      lostDate: schema.cases.lostDate,
      photoUrls: schema.cases.photoUrls,
    })
    .from(schema.cases)
    .where(and(...conditions))
    .orderBy(desc(schema.cases.createdAt))
    .limit(limit);

  return Response.json({ items });
}
