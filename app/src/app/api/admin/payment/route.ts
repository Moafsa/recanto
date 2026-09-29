import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { syncTitleStatus } from "@/lib/titles";

// Baixa manual (dinheiro/PIX direto), cancelamento ou reabertura de cobrança.
const schema = z.object({ id: z.string(), action: z.enum(["RECEIVE", "CANCEL", "REOPEN"]) });

export async function POST(req: Request) {
  if (!(await requireUser(["ADMIN", "STAFF"]))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = schema.safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const p = await db.payment.findUnique({ where: { id: b.data.id } });
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data =
    b.data.action === "RECEIVE" ? { status: "RECEIVED", paidAt: new Date() } :
    b.data.action === "CANCEL" ? { status: "CANCELLED", paidAt: null } :
    { status: p.dueDate < new Date() ? "OVERDUE" : "PENDING", paidAt: null };
  await db.payment.update({ where: { id: p.id }, data });
  await syncTitleStatus(p.titleId);
  return NextResponse.json({ ok: true, note: p.asaasId ? "Cobrança vinculada ao Asaas: dê baixa/cancele lá também para não cobrar duas vezes." : undefined });
}
