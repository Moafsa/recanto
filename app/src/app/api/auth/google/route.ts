import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getConfig } from "@/lib/config";

export async function GET() {
  const id = await getConfig("GOOGLE_CLIENT_ID");
  if (!id) return NextResponse.redirect(`${await getConfig("APP_URL")}/entrar?erro=google`);
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("rl_oauth", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: id,
    redirect_uri: `${await getConfig("APP_URL")}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();
  return NextResponse.redirect(url);
}
