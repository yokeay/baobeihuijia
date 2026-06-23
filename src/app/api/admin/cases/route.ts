import { getDb, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { getAdminFromCookies } from "@/lib/auth";

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.cases)
    .orderBy(desc(schema.cases.createdAt))
    .limit(200);

  return Response.json(rows);
}
