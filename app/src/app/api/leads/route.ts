import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

// Formulário "Quero ser sócio" do site.
export async function POST(req: Request) {
  const body = z
    .object({ name: z.string().min(2).max(80), phone: z.string(), email: z.string().email().optional().or(z.literal("")), interest: z.string().default("TITULO") })
    .safeParse(await req.json().catch(() => ({})));
  const phone = body.success ? normalizePhone(body.data.phone) : null;
  if (!body.success || !phone) return NextResponse.json({ error: "Confira nome e WhatsApp" }, { status: 400 });

  const existing = await db.lead.findFirst({ where: { phone } });
  if (existing) await db.lead.update({ where: { id: existing.id }, data: { name: body.data.name, email: body.data.email || undefined } });
  else await db.lead.create({ data: { name: body.data.name, phone, email: body.data.email || null, interest: body.data.interest, source: "SITE" } });
  return NextResponse.json({ ok: true });
}
