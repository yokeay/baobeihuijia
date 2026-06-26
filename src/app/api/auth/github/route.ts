export async function GET() {
  const clientId = "Ov23liHkDF9wZaabg94B";
  const redirectUri = "https://wohaoxiangni.com/api/auth/callback/github";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user",
  });

  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}
