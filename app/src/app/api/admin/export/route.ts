import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { depState } from "@/lib/rules";

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const d = (x?: Date | null) => (x ? x.toISOString().slice(0, 10) : "");

// /api/admin/export?tipo=leads|titulos|pagamentos  → CSV (Excel pt-BR: separador ;)
export async function GET(req: Request) {
  if (!(await requireUser(["ADMIN", "STAFF"]))) return new Response("forbidden", { status: 403 });
  const tipo = new URL(req.url).searchParams.get("tipo") || "leads";
  let rows: unknown[][] = [];

  if (tipo === "leads") {
    const l = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
    rows = [["Nome", "Telefone", "E-mail", "Origem", "Interesse", "Status", "Criado em", "Notas"], ...l.map((x) => [x.name, x.phone, x.email, x.source, x.interest, x.status, d(x.createdAt), x.notes])];
  } else if (tipo === "titulos") {
    const t = await db.title.findMany({ include: { holder: true, dependents: true }, orderBy: { number: "asc" } });
    rows = [["Nº", "Titular", "CPF", "Telefone", "E-mail", "Lote", "Status", "Entrada", "Parcelas", "Valor parcela", "Dependentes", "Criado em"],
      ...t.map((x) => [x.number, x.holder.name, x.holder.cpf, x.holder.phone, x.holder.email, x.lot, x.status, x.entryCents / 100, x.installments, x.installmentCents / 100, x.dependents.map((p) => { const st = depState(p); return `${p.name} (${p.relation}${st.age !== null ? `, ${st.age} anos` : ""}${st.blocked ? ", BLOQUEADO" : ""})`; }).join(" | "), d(x.createdAt)])];
  } else {
    const p = await db.payment.findMany({ include: { title: { include: { holder: true } } }, orderBy: { dueDate: "asc" } });
    rows = [["Titular", "Título", "Tipo", "Parcela", "Valor", "Vencimento", "Status", "Pago em", "Forma"],
      ...p.map((x) => [x.title.holder.name, x.title.number, x.kind, x.number, x.valueCents / 100, d(x.dueDate), x.status, d(x.paidAt), x.billingType])];
  }
  const csv = "﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="recanto-${tipo}.csv"` } });
}
