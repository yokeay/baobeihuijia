import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getAdminFromCookies } from "@/lib/auth";

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
  await db
    .update(schema.cases)
    .set({
      status,
      reviewedBy: admin.username,
      reviewedAt: new Date().toISOString(),
    })
    .where(eq(schema.cases.id, id));

  return Response.json({ success: true });
}
