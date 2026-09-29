import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(req: Request) {
  if (!(await requireUser(["ADMIN"]))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = z.object({ promoLimit: z.number().int().min(0).max(5000) }).safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  await db.setting.upsert({ where: { key: "promoLimit" }, update: { value: String(b.data.promoLimit) }, create: { key: "promoLimit", value: String(b.data.promoLimit) } });
  return NextResponse.json({ ok: true });
}
