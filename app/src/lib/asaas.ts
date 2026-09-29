// Integração Asaas (v3): cliente + parcelamento do título.
import { db } from "./db";
import { syncTitleStatus } from "./titles";
import { getConfig, asaasBase } from "./config";


export async function asaas<T = any>(path: string, init?: RequestInit): Promise<T> {
  const key = await getConfig("ASAAS_API_KEY");
  if (!key) throw new Error("Chave do Asaas não configurada (Admin → Integrações)");
  const res = await fetch(`${await asaasBase()}${path}`, {
    ...init,
    headers: { access_token: key, "Content-Type": "application/json", "User-Agent": "recanto-da-lagoa", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Asaas ${res.status}: ${JSON.stringify(data)}`);
  return data as T;
}

const reais = (cents: number) => Math.round(cents) / 100;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

export async function ensureCustomer(input: { name: string; email?: string | null; phone?: string | null; cpfCnpj: string }) {
  const found = await asaas<{ data: { id: string }[] }>(`/customers?cpfCnpj=${input.cpfCnpj}`);
  if (found.data?.[0]) return found.data[0].id;
  const created = await asaas<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email || undefined,
      mobilePhone: input.phone?.replace(/^55/, "") || undefined,
      cpfCnpj: input.cpfCnpj,
      notificationDisabled: false,
    }),
  });
  return created.id;
}

/**
 * Gera a entrada (R$ 200, vence em 2 dias) + parcelamento do saldo (1º vencimento em 30 dias).
 * billingType: "PIX" | "BOLETO" | "UNDEFINED" (cliente escolhe na fatura).
 */
export async function chargeTitle(titleId: string, cpfCnpj: string, billingType: "PIX" | "BOLETO" | "UNDEFINED" = "UNDEFINED") {
  const title = await db.title.findUniqueOrThrow({ where: { id: titleId }, include: { holder: true } });
  const holder = title.holder;
  const customer = await ensureCustomer({
    name: holder.name || "Sócio Recanto da Lagoa",
    email: holder.email, phone: holder.phone, cpfCnpj,
  });

  const now = new Date();
  const entry = await asaas<{ id: string; invoiceUrl: string; dueDate: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer, billingType, value: reais(title.entryCents), dueDate: isoDate(addDays(now, 2)),
      description: `Entrada – Título de Sócio nº ${title.number}`, externalReference: `${title.id}:ENTRY`,
    }),
  });
  await db.payment.create({
    data: { titleId, asaasId: entry.id, kind: "ENTRY", number: 0, valueCents: title.entryCents, dueDate: new Date(entry.dueDate), billingType, invoiceUrl: entry.invoiceUrl },
  });

  // Saldo = total − entrada, dividido no valor de parcela da opção escolhida.
  const first = addDays(now, 30);
  const inst = await asaas<{ data?: { id: string; invoiceUrl: string; dueDate: string }[] }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer, billingType, dueDate: isoDate(first),
      installmentCount: title.installments, installmentValue: reais(title.installmentCents),
      description: `Título de Sócio nº ${title.number}`, externalReference: `${title.id}:INST`,
    }),
  });
  // Asaas devolve a 1ª parcela; lista as demais pelo installment id.
  const installmentId = (inst as any).installment as string | undefined;
  const list = installmentId
    ? await asaas<{ data: { id: string; invoiceUrl: string; dueDate: string; value: number }[] }>(`/installments/${installmentId}/payments`)
    : { data: [inst as any] };
  let n = 1;
  for (const p of list.data.sort((a, b) => a.dueDate.localeCompare(b.dueDate))) {
    await db.payment.create({
      data: { titleId, asaasId: p.id, kind: "INSTALLMENT", number: n++, valueCents: title.installmentCents, dueDate: new Date(p.dueDate), billingType, invoiceUrl: p.invoiceUrl },
    });
  }
  return { entryUrl: entry.invoiceUrl };
}

/** Mapeia evento do webhook Asaas → estado interno. */
export async function applyWebhook(event: string, payment: { id: string; status?: string; paymentDate?: string }) {
  const local = await db.payment.findUnique({ where: { asaasId: payment.id } });
  if (!local) return;
  const map: Record<string, string> = {
    PAYMENT_RECEIVED: "RECEIVED", PAYMENT_CONFIRMED: "RECEIVED",
    PAYMENT_OVERDUE: "OVERDUE", PAYMENT_REFUNDED: "REFUNDED", PAYMENT_DELETED: "CANCELLED",
  };
  const status = map[event];
  if (!status) return;
  await db.payment.update({
    where: { id: local.id },
    data: { status, paidAt: status === "RECEIVED" ? new Date(payment.paymentDate || Date.now()) : null },
  });
  await syncTitleStatus(local.titleId);
}
