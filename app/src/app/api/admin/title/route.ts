import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

// Edição de título e do titular. Cancelar título cancela cobranças pendentes locais (Asaas: cancelar lá também).
const schema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "ACTIVE", "OVERDUE", "CANCELLED"]).optional(),
  notes: z.string().optional(),
  holder: z.object({ name: z.string().min(2).optional(), phone: z.string().optional(), email: z.string().email().optional(), cpf: z.string().optional() }).optional(),
});

export async function PATCH(req: Request) {
  if (!(await requireUser(["ADMIN", "STAFF"]))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = schema.safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const t = await db.title.findUnique({ where: { id: b.data.id } });
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.title.update({
    where: { id: t.id },
    data: {
      status: b.data.status,
      notes: b.data.notes,
      activatedAt: b.data.status === "ACTIVE" && !t.activatedAt ? new Date() : undefined,
    },
  });
  if (b.data.status === "CANCELLED") await db.payment.updateMany({ where: { titleId: t.id, status: { in: ["PENDING", "OVERDUE"] } }, data: { status: "CANCELLED" } });
  if (b.data.holder) {
    const h = b.data.holder;
    await db.user.update({ where: { id: t.holderId }, data: { name: h.name, phone: h.phone?.replace(/\D/g, ""), email: h.email?.toLowerCase(), cpf: h.cpf?.replace(/\D/g, "") } });
  }
  return NextResponse.json({ ok: true });
}
