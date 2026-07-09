import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { signUserToken, generateUsername, generateAvatarSeed } from "@/lib/user-auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  const body = await request.json();
  const { phone, countryCode = "+86" } = body;

  if (!phone || !/^\d{7,15}$/.test(phone.replace(/\s/g, ""))) {
    return Response.json({ error: "请输入有效的手机号码" }, { status: 400 });
  }

  const fullPhone = countryCode + phone.replace(/\s/g, "");
  const db = await getDb();

  let user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.phone, fullPhone))
    .limit(1)
    .then((r: any[]) => r[0] ?? null);

  if (!user) {
    const id = uuidv4();
    const username = generateUsername();
    const avatarSeed = generateAvatarSeed();
    const mainlandCodes = ["+86", "+852", "+853", "+886"];
    const region = mainlandCodes.includes(countryCode) ? "mainland" : "overseas";
    await db.insert(schema.users).values({
      id, phone: fullPhone, countryCode, username, avatarSeed, region,
    });
    user = {
      id, phone: fullPhone, countryCode, username, avatarSeed, region,
      contactWechat: null, contactQq: null, contactDouyin: null, contactBilibili: null,
      contactX: null, contactInstagram: null, contactFacebook: null, contactEmail: null,
      createdAt: new Date(), lastActiveAt: new Date(),
    };
  }

  const token = await signUserToken({
    id: user.id,
    phone: user.phone,
    username: user.username,
    avatarSeed: user.avatarSeed,
    region: user.region ?? "unknown",
  });

  logActivity({ userId: user.id, username: user.username, action: "login", detail: fullPhone });

  return Response.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      avatarSeed: user.avatarSeed,
      region: user.region,
      phone: user.phone,
    },
  });
}
