import { db, promoSlots } from "./db";
import { TITLE_PLAN } from "./park";
import { sendTitleActivated } from "./mail";

export type DepInput = { name: string; relation: string; birthDate?: string | null; cpf?: string | null };

/** Cria o título (lote PROMO enquanto houver vaga) com dependentes. Não gera cobrança. */
export async function createTitle(opts: { holderId: string; installments: 3 | 6 | 12; dependents?: DepInput[]; lot?: "PROMO" | "NORMAL"; notes?: string }) {
  const option = TITLE_PLAN.options.find((o) => o.installments === opts.installments)!;
  const slots = await promoSlots();
  const lot = opts.lot ?? (slots.left > 0 ? "PROMO" : "NORMAL");
  const last = await db.title.aggregate({ _max: { number: true } });
  return db.title.create({
    data: {
      number: (last._max.number ?? 0) + 1,
      holderId: opts.holderId,
      lot,
      totalCents: lot === "PROMO" ? TITLE_PLAN.promoCents : TITLE_PLAN.normalCents,
      entryCents: TITLE_PLAN.entryCents,
      installments: option.installments,
      installmentCents: option.valueCents,
      notes: opts.notes,
      dependents: { create: (opts.dependents ?? []).map((d) => ({ name: d.name, relation: d.relation, cpf: d.cpf ? d.cpf.replace(/\D/g, "") : null, birthDate: d.birthDate ? new Date(d.birthDate) : null })) },
    },
  });
}

/** Agenda entrada (2 dias) + parcelas mensais localmente, sem Asaas (cobrança manual / dinheiro). */
export async function scheduleLocalPayments(titleId: string) {
  const t = await db.title.findUniqueOrThrow({ where: { id: titleId } });
  const now = Date.now();
  const day = 86400000;
  const rows = [{ titleId, kind: "ENTRY", number: 0, valueCents: t.entryCents, dueDate: new Date(now + 2 * day), billingType: "MANUAL" }];
  for (let i = 1; i <= t.installments; i++) {
    const d = new Date(now + 30 * day);
    d.setMonth(d.getMonth() + (i - 1));
    rows.push({ titleId, kind: "INSTALLMENT", number: i, valueCents: t.installmentCents, dueDate: d, billingType: "MANUAL" });
  }
  await db.payment.createMany({ data: rows });
}

/** Regras de negócio ao mudar o status de um pagamento (compartilhado com o webhook). */
export async function syncTitleStatus(titleId: string) {
  const t = await db.title.findUnique({ where: { id: titleId }, include: { payments: true } });
  if (!t || t.status === "CANCELLED") return;
  const entry = t.payments.find((p) => p.kind === "ENTRY");
  const entryPaid = entry?.status === "RECEIVED";
  const overdue = t.payments.some((p) => p.status === "OVERDUE");
  let status = t.status;
  if (!entryPaid) status = "PENDING";
  else status = overdue ? "OVERDUE" : "ACTIVE";
  if (status !== t.status) {
    await db.title.update({ where: { id: t.id }, data: { status, activatedAt: t.activatedAt ?? (status === "ACTIVE" ? new Date() : null) } });
    if (status === "ACTIVE" && !t.activatedAt) {
      const holder = await db.user.findUnique({ where: { id: t.holderId } });
      if (holder?.email) await sendTitleActivated(holder.email, holder.name || "sócio", t.number);
    }
  }
}
