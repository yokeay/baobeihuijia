import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { signToken, setAuthCookie } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return Response.json({ error: "Missing code" }, { status: 400 });
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: "Ov23liHkDF9wZaabg94B",
      client_secret: "f02fc93ba637a8ea4df302b29e35a726ede25b76",
      redirect_uri: "https://wohaoxiangni.com/api/auth/callback/github",
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    return Response.json(
      { error: "Failed to authenticate with GitHub" },
      { status: 401 }
    );
  }

  // Fetch GitHub user info
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/json",
    },
  });

  const githubUser = await userRes.json();

  if (!githubUser.id) {
    return Response.json(
      { error: "Failed to fetch GitHub user" },
      { status: 401 }
    );
  }

  const githubId = String(githubUser.id);
  const githubUsername = githubUser.login;
  const avatarUrl = githubUser.avatar_url;

  const db = await getDb();

  // Find admin by github_id
  let admin = (
    await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.githubId, githubId))
      .limit(1)
  )[0];

  // If not found, auto-create first admin (only if admins table is empty of GitHub admins)
  if (!admin) {
    const allAdmins = await db.select().from(schema.admins);
    const githubAdmins = allAdmins.filter(
      (a: typeof schema.admins.$inferSelect) => a.githubId
    );

    if (githubAdmins.length === 0) {
      // First GitHub login — auto-create admin
      const id = uuidv4();
      await db.insert(schema.admins).values({
        id,
        username: githubUsername,
        githubId,
        githubUsername,
        avatarUrl,
      });
      admin = (
        await db
          .select()
          .from(schema.admins)
          .where(eq(schema.admins.githubId, githubId))
          .limit(1)
      )[0];
    } else {
      return Response.json(
        { error: "You are not authorized to access the admin panel" },
        { status: 403 }
      );
    }
  }

  // Update username/avatar on each login
  await db
    .update(schema.admins)
    .set({ githubUsername, avatarUrl })
    .where(eq(schema.admins.id, admin.id));

  // Audit log for login
  await db.insert(schema.auditLogs).values({
    id: uuidv4(),
    adminId: admin.id,
    adminUsername: admin.username,
    action: "login",
    targetType: "system",
    detail: JSON.stringify({ githubUsername, ip: request.headers.get("x-forwarded-for") || "" }),
  });

  const token = await signToken({
    id: admin.id,
    username: admin.username,
    githubUsername,
    avatarUrl,
  });

  await setAuthCookie(token);

  return Response.redirect("https://wohaoxiangni.com/admin/dashboard");
}
