import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE = "rl_session";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me-dev-secret-change-me");

export type SessionUser = { id: string; role: string; name: string | null; email: string | null; phone: string | null };

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    const user = await db.user.findUnique({ where: { id: String(payload.uid) } });
    if (!user) return null;
    return { id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone };
  } catch {
    return null;
  }
}

export async function requireUser(roles?: string[]) {
  const u = await getSessionUser();
  if (!u || (roles && !roles.includes(u.role))) return null;
  return u;
}

/** Cria/atualiza usuário pelo e-mail ou telefone e aplica papel ADMIN conforme env. */
export async function upsertUser(input: { email?: string | null; phone?: string | null; name?: string | null }) {
  const email = input.email?.toLowerCase() || null;
  const phone = input.phone || null;
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const adminPhones = (process.env.ADMIN_PHONES || "").split(",").map((s) => s.replace(/\D/g, "")).filter(Boolean);

  let user =
    (email && (await db.user.findUnique({ where: { email } }))) ||
    (phone && (await db.user.findUnique({ where: { phone } }))) ||
    null;

  const isAdmin = (email && admins.includes(email)) || (phone && adminPhones.includes(phone));

  if (!user) {
    user = await db.user.create({
      data: { email, phone, name: input.name ?? null, role: isAdmin ? "ADMIN" : "MEMBER" },
    });
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        email: user.email ?? email,
        phone: user.phone ?? phone,
        name: user.name ?? input.name ?? null,
        ...(isAdmin && user.role !== "ADMIN" ? { role: "ADMIN" } : {}),
      },
    });
  }
  return user;
}
