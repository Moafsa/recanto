import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { depInputError, onlyDigits } from "@/lib/rules";

// Sócio (ou admin) gerencia dependentes do próprio título.
const dep = z.object({
  titleId: z.string(),
  name: z.string().min(2),
  relation: z.enum(["SPOUSE", "CHILD", "FATHER", "MOTHER", "IN_LAW"]),
  birthDate: z.string(),
  cpf: z.string(),
});

async function canEdit(userId: string, role: string, titleId: string) {
  const t = await db.title.findUnique({ where: { id: titleId } });
  return !!t && (role !== "MEMBER" || t.holderId === userId);
}

export async function POST(req: Request) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Faça login" }, { status: 401 });
  const b = dep.safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ error: "Preencha nome, parentesco, data de nascimento e CPF" }, { status: 400 });
  const bad = depInputError(b.data);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  if (!(await canEdit(u.id, u.role, b.data.titleId))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const cpf = onlyDigits(b.data.cpf);
  const title = await db.title.findUnique({ where: { id: b.data.titleId }, include: { holder: true, dependents: true } });
  if (title?.holder.cpf === cpf || title?.dependents.some((d) => d.cpf === cpf))
    return NextResponse.json({ error: "Este CPF já está neste título" }, { status: 409 });
  const created = await db.dependent.create({
    data: { titleId: b.data.titleId, name: b.data.name.trim(), relation: b.data.relation, cpf, birthDate: new Date(b.data.birthDate) },
  });
  return NextResponse.json({ ok: true, id: created.id });
}

export async function DELETE(req: Request) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Faça login" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const d = id ? await db.dependent.findUnique({ where: { id } }) : null;
  if (!d || !(await canEdit(u.id, u.role, d.titleId))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await db.dependent.delete({ where: { id: d.id } });
  return NextResponse.json({ ok: true });
}
