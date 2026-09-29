import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { chargeTitle } from "@/lib/asaas";
import { createTitle } from "@/lib/titles";
import { depInputError, cpfValid } from "@/lib/rules";

// Sócio logado contrata o título: cria Title PENDING e gera cobranças no Asaas.
const schema = z.object({
  installments: z.union([z.literal(3), z.literal(6), z.literal(12)]),
  cpf: z.string().transform((s) => s.replace(/\D/g, "")).refine((s) => s.length === 11 || s.length === 14, "CPF/CNPJ inválido"),
  name: z.string().min(3),
  dependents: z.array(z.object({
    name: z.string().min(2),
    relation: z.enum(["SPOUSE", "CHILD", "FATHER", "MOTHER", "IN_LAW"]),
    birthDate: z.string(),
    cpf: z.string(),
  })).max(12).default([]),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Faça login" }, { status: 401 });
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) { const i = body.error.issues[0]; return NextResponse.json({ error: i?.path.includes("dependents") ? "Preencha nome, data de nascimento e CPF de cada dependente" : i?.path.includes("name") ? "Informe o nome completo" : i?.message?.startsWith("CPF") ? i.message : "Confira os dados informados" }, { status: 400 }); }

  for (const d of body.data.dependents) {
    const bad = depInputError(d);
    if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  }
  if (body.data.cpf.length === 11 && !cpfValid(body.data.cpf)) return NextResponse.json({ error: "CPF do titular inválido" }, { status: 400 });
  await db.user.update({ where: { id: user.id }, data: { name: body.data.name, cpf: body.data.cpf } });
  const title = await createTitle({ holderId: user.id, installments: body.data.installments, dependents: body.data.dependents });

  try {
    const { entryUrl } = await chargeTitle(title.id, body.data.cpf);
    return NextResponse.json({ ok: true, titleId: title.id, payUrl: entryUrl, lot: title.lot });
  } catch (e) {
    await db.title.update({ where: { id: title.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ error: "Não foi possível gerar a cobrança. Tente novamente.", detail: (e as Error).message }, { status: 502 });
  }
}
