import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "baobeihuijia-secret-change-me"
);
const TOKEN_KEY = "bbhj_token";

export interface UserSession {
  id: string;
  phone: string;
  username: string;
  avatarSeed: string;
  region: string;
}

export function signUserToken(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("90d")
    .sign(JWT_SECRET);
}

export async function verifyUserToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export function getUserFromRequest(request: Request): Promise<UserSession | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return Promise.resolve(null);
  return verifyUserToken(auth.slice(7));
}

// 随机用户名生成
const ADJECTIVES = ["守候的","思念的","温柔的","坚定的","耐心的","善良的","真诚的","勇敢的","深情的","期待的"];
const NOUNS = ["候鸟","灯塔","蒲公英","向日葵","萤火虫","晨露","暖阳","北极星","信鸽","彩虹"];

export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return adj + noun;
}

export function generateAvatarSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}
