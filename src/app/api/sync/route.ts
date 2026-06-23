import { syncFromApi } from "@/lib/sync";
import { getAdminFromCookies } from "@/lib/auth";

export async function POST() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const result = await syncFromApi();
  return Response.json(result);
}
