import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { requestOtp } from "@/lib/otp";

export async function POST(req: Request) {
  const body = z.object({ phone: z.string() }).safeParse(await req.json().catch(() => ({})));
  const phone = body.success ? normalizePhone(body.data.phone) : null;
  if (!phone) return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
  try {
    await requestOtp(phone);
    return NextResponse.json({ ok: true, phone });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 429 });
  }
}
