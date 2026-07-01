import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getAdminFromCookies } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const { id, status } = await request.json();
  if (!id || !["approved", "rejected"].includes(status)) {
    return Response.json({ error: "参数错误" }, { status: 400 });
  }

  const db = await getDb();

  const rows = await db
    .select()
    .from(schema.clues)
    .where(eq(schema.clues.id, id))
    .limit(1);

  if (rows.length === 0) {
    return Response.json({ error: "线索不存在" }, { status: 404 });
  }

  const clue = rows[0];
  if (clue.status !== "pending") {
    return Response.json(
      { error: `线索状态为${clue.status === "approved" ? "已通过" : "已拒绝"}，无法重复审核` },
      { status: 409 }
    );
  }

  const now = new Date();

  await db
    .update(schema.clues)
    .set({
      status,
      reviewedBy: admin.username,
      reviewedAt: now,
    })
    .where(eq(schema.clues.id, id));

  await db.insert(schema.auditLogs).values({
    id: uuidv4(),
    adminId: admin.id,
    adminUsername: admin.username,
    action: status === "approved" ? "approve" : "reject",
    targetType: "clue",
    targetId: id,
    detail: JSON.stringify({
      caseId: clue.caseId,
      previousStatus: clue.status,
    }),
  });

  return Response.json({ success: true });
}
