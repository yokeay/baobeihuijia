import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/user-auth";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: Request) {
  const session = await getUserFromRequest(request);
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const db = await getDb();
  const user = await db.select().from(schema.users).where(eq(schema.users.id, session.id)).limit(1).then((r: any[]) => r[0] ?? null);
  if (!user) return Response.json({ error: "用户不存在" }, { status: 404 });

  return Response.json({
    id: user.id, username: user.username, avatarSeed: user.avatarSeed, region: user.region, phone: user.phone,
    contacts: {
      wechat: user.contactWechat, qq: user.contactQq, douyin: user.contactDouyin,
      bilibili: user.contactBilibili, x: user.contactX, instagram: user.contactInstagram,
      facebook: user.contactFacebook, email: user.contactEmail,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getUserFromRequest(request);
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();
  const allowed = ["username", "contactWechat", "contactQq", "contactDouyin", "contactBilibili", "contactX", "contactInstagram", "contactFacebook", "contactEmail"];
  const update: Record<string, string> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) return Response.json({ error: "无有效更新字段" }, { status: 400 });

  const db = await getDb();
  await db.update(schema.users).set(update).where(eq(schema.users.id, session.id));
  logActivity({ userId: session.id, username: session.username, action: "update_contact", detail: Object.keys(update).join(",") });
  return Response.json({ ok: true });
}
