import { getDb, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RandomCaseRow {
  id: string;
  name: string;
  photoUrls: unknown;
  lostProvince: string | null;
  lostCity: string | null;
  lostDate: string | null;
  gender: string | null;
}

export async function GET() {
  const db = await getDb();

  const rows: RandomCaseRow[] = await db
    .select({
      id: schema.cases.id,
      name: schema.cases.name,
      photoUrls: schema.cases.photoUrls,
      lostProvince: schema.cases.lostProvince,
      lostCity: schema.cases.lostCity,
      lostDate: schema.cases.lostDate,
      gender: schema.cases.gender,
    })
    .from(schema.cases)
    .where(eq(schema.cases.status, "approved"))
    .orderBy(sql`RANDOM()`)
    .limit(3);

  const items = rows.map((row) => {
    let photos: string[] = [];
    try {
      photos = typeof row.photoUrls === "string"
        ? JSON.parse(row.photoUrls)
        : (row.photoUrls as string[]) ?? [];
    } catch {
      photos = [];
    }

    return {
      id: row.id,
      name: row.name,
      photo: photos[0] ?? null,
      lostProvince: row.lostProvince,
      lostCity: row.lostCity,
      lostDate: row.lostDate,
      gender: row.gender,
    };
  });

  return Response.json({ items });
}
