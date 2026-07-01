import { getDb, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();

  const items = await db
    .select()
    .from(schema.clues)
    .where(and(
      eq(schema.clues.caseId, id),
      eq(schema.clues.status, "approved")
    ))
    .orderBy(desc(schema.clues.createdAt));

  return Response.json({ items });
}
