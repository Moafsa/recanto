import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { verifyOtp } from "@/lib/otp";
import { createSession, upsertUser } from "@/lib/session";

export async function POST(req: Request) {
  const body = z.object({ phone: z.string(), code: z.string().length(6), name: z.string().optional() }).safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const phone = normalizePhone(body.data.phone);
  if (!phone || !(await verifyOtp(phone, body.data.code)))
    return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 401 });
  const user = await upsertUser({ phone, name: body.data.name });
  await createSession(user.id);
  return NextResponse.json({ ok: true, redirect: user.role === "ADMIN" ? "/admin" : "/painel" });
}
