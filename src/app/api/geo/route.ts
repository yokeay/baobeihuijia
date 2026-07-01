import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  let countryCode = "CN";

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.countryCode) {
        countryCode = data.countryCode;
      }
    }
  } catch {
    // fallback to CN
  }

  return NextResponse.json({ countryCode });
}
