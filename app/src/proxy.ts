import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me-dev-secret-change-me");

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("rl_session")?.value;
  let ok = false;
  if (token) {
    try { await jwtVerify(token, key()); ok = true; } catch {}
  }
  if (!ok) return NextResponse.redirect(new URL("/entrar", req.url));
  return NextResponse.next();
}

// A checagem de papel (ADMIN/STAFF) é feita nas próprias páginas/rotas.
export const config = { matcher: ["/painel/:path*", "/admin/:path*"] };
