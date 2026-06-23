import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return Response.json({ error: "用户名和密码不能为空" }, { status: 400 });
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.admins)
    .where(eq(schema.admins.username, username))
    .limit(1);

  if (rows.length === 0) {
    return Response.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const valid = await verifyPassword(password, rows[0].passwordHash);
  if (!valid) {
    return Response.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const token = signToken({ id: rows[0].id, username: rows[0].username });

  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return Response.json({ success: true });
}
