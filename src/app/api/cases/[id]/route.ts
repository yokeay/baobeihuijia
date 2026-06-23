import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

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

  if (rows.length === 0) {
    return Response.json({ error: "案件不存在" }, { status: 404 });
  }
  return Response.json(rows[0]);
}
