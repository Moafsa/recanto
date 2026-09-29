import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, upsertUser } from "@/lib/session";
import { normalizePhone } from "@/lib/phone";
import { createTitle, scheduleLocalPayments } from "@/lib/titles";
import { chargeTitle } from "@/lib/asaas";
import { depInputError, cpfValid } from "@/lib/rules";

// Admin cadastra sócio + título (opcionalmente convertendo um lead e/ou gerando cobrança no Asaas).
const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  cpf: z.string().optional(),
  installments: z.union([z.literal(3), z.literal(6), z.literal(12)]),
  lot: z.enum(["PROMO", "NORMAL"]).optional(),
  chargeMode: z.enum(["ASAAS", "MANUAL"]).default("MANUAL"),
  leadId: z.string().optional(),
  notes: z.string().optional(),
  dependents: z.array(z.object({ name: z.string().min(2), relation: z.enum(["SPOUSE", "CHILD", "FATHER", "MOTHER", "IN_LAW"]), birthDate: z.string(), cpf: z.string() })).default([]),
});

export async function POST(req: Request) {
  if (!(await requireUser(["ADMIN", "STAFF"]))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = schema.safeParse(await req.json().catch(() => ({})));
  if (!b.success) { const i = b.error.issues[0]; return NextResponse.json({ error: i?.path.includes("dependents") ? "Preencha nome, data de nascimento e CPF de cada dependente" : i?.path.includes("name") ? "Informe o nome completo" : i?.message?.startsWith("CPF") ? i.message : "Confira os dados informados" }, { status: 400 }); }
  const d = b.data;
  for (const dep of d.dependents) { const bad = depInputError(dep); if (bad) return NextResponse.json({ error: bad }, { status: 400 }); }
  if (d.cpf && d.cpf.replace(/\D/g, "").length === 11 && !cpfValid(d.cpf)) return NextResponse.json({ error: "CPF do titular inválido" }, { status: 400 });
  const phone = d.phone ? normalizePhone(d.phone) : null;
  if (d.phone && !phone) return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
  if (!phone && !d.email) return NextResponse.json({ error: "Informe telefone ou e-mail" }, { status: 400 });
  const cpf = d.cpf?.replace(/\D/g, "");
  if (d.chargeMode === "ASAAS" && (!cpf || (cpf.length !== 11 && cpf.length !== 14)))
    return NextResponse.json({ error: "CPF/CNPJ obrigatório para cobrança no Asaas" }, { status: 400 });

  const user = await upsertUser({ email: d.email || null, phone, name: d.name });
  if (cpf) await db.user.update({ where: { id: user.id }, data: { cpf, name: user.name ?? d.name } });

  const title = await createTitle({ holderId: user.id, installments: d.installments, lot: d.lot, dependents: d.dependents, notes: d.notes });
  let payUrl: string | undefined;
  try {
    if (d.chargeMode === "ASAAS") payUrl = (await chargeTitle(title.id, cpf!)).entryUrl;
    else await scheduleLocalPayments(title.id);
  } catch (e) {
    await db.title.update({ where: { id: title.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ error: `Falha ao gerar cobrança: ${(e as Error).message}` }, { status: 502 });
  }
  if (d.leadId) await db.lead.update({ where: { id: d.leadId }, data: { status: "WON" } }).catch(() => {});
  return NextResponse.json({ ok: true, titleId: title.id, number: title.number, payUrl });
}
