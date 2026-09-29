import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSession, upsertUser } from "@/lib/session";
import { getConfig } from "@/lib/config";

export async function GET(req: NextRequest) {
  const app = (await getConfig("APP_URL")) || req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const saved = (await cookies()).get("rl_oauth")?.value;
  if (!code || !state || state !== saved) return NextResponse.redirect(`${app}/entrar?erro=oauth`);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: await getConfig("GOOGLE_CLIENT_ID"),
      client_secret: await getConfig("GOOGLE_CLIENT_SECRET"),
      redirect_uri: `${app}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return NextResponse.redirect(`${app}/entrar?erro=oauth`);
  const { access_token } = await tokenRes.json();
  const info = await (await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${access_token}` } })).json();
  if (!info.email || !info.email_verified) return NextResponse.redirect(`${app}/entrar?erro=email`);

  const user = await upsertUser({ email: info.email, name: info.name });
  await createSession(user.id);
  return NextResponse.redirect(`${app}${user.role === "ADMIN" ? "/admin" : "/painel"}`);
}
