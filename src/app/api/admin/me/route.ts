import { getAdminFromCookies } from "@/lib/auth";

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }
  return Response.json(admin);
}
