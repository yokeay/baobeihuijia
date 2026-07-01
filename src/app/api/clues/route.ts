import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const body = await request.json();
  const { caseId, content, photoUrls, submitterName, submitterContact } = body;

  if (!caseId || !content?.trim()) {
    return Response.json({ error: "关联案例和线索内容为必填项" }, { status: 400 });
  }

  const db = await getDb();

  const rows = await db
    .select({ id: schema.cases.id, status: schema.cases.status })
    .from(schema.cases)
    .where(eq(schema.cases.id, caseId))
    .limit(1);

  if (rows.length === 0) {
    return Response.json({ error: "关联案例不存在" }, { status: 404 });
  }

  if (rows[0].status !== "approved") {
    return Response.json({ error: "只能为已发布的案例提供线索" }, { status: 400 });
  }

  const id = uuidv4();
  await db.insert(schema.clues).values({
    id,
    caseId,
    content: content.trim(),
    photoUrls: photoUrls || "[]",
    submitterName: submitterName || null,
    submitterContact: submitterContact || null,
  });

  return Response.json({ id }, { status: 201 });
}
