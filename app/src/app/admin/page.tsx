import Link from "next/link";
import { redirect } from "next/navigation";
import { db, promoSlots } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { brl } from "@/lib/park";
import { getConfig, listConfig } from "@/lib/config";
import { L, billing, channel, interest, leadStatus, lot as lotL, payKind, payStatus, source, statusTone } from "@/lib/labels";
import { depState } from "@/lib/rules";
import LogoutButton from "@/components/LogoutButton";
import { LeadStatus, ChatRow } from "./client";
import { NewMember, SettingsForm } from "./forms";
import MembersList, { type MTitle } from "./members";
import Integrations from "./integrations";

export const dynamic = "force-dynamic";

const allTabs = [["visao", "Visão geral"], ["leads", "Leads"], ["socios", "Sócios e títulos"], ["pagamentos", "Pagamentos"], ["conversas", "Conversas"], ["integracoes", "Integrações"], ["config", "Configurações"]] as const;
const dt = (d: Date) => d.toLocaleDateString("pt-BR");
const Pill = ({ s, map }: { s: string; map: Record<string, string> }) => <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold ${statusTone[s] ?? ""}`}>{map[s] ?? s}</span>;

export default async function Admin({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const me = await requireUser(["ADMIN", "STAFF"]);
  if (!me) redirect("/painel");
  const isAdmin = me.role === "ADMIN";
  const tabs = allTabs.filter(([k]) => isAdmin || (k !== "integracoes" && k !== "config"));
  const aba = (await searchParams).aba || "visao";

  const [slots, leads, titles, payments, sessions, received, open] = await Promise.all([
    promoSlots(),
    db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    db.title.findMany({ include: { holder: true, dependents: true, payments: { orderBy: [{ kind: "asc" }, { number: "asc" }] } }, orderBy: { number: "desc" } }),
    db.payment.findMany({ include: { title: { include: { holder: true } } }, orderBy: { dueDate: "asc" }, take: 500 }),
    db.chatSession.findMany({ include: { messages: { orderBy: { createdAt: "asc" } }, lead: true, user: true }, orderBy: { updatedAt: "desc" }, take: 60 }),
    db.payment.aggregate({ where: { status: "RECEIVED" }, _sum: { valueCents: true } }),
    db.payment.aggregate({ where: { status: { in: ["PENDING", "OVERDUE"] } }, _sum: { valueCents: true } }),
  ]);
  const overdue = payments.filter((p) => p.status === "OVERDUE").length;
  const activeTitles = titles.filter((t) => t.status === "ACTIVE");
  const peopleWithAccess = activeTitles.reduce((s, t) => s + 1 + t.dependents.filter((d) => !depState(d).blocked).length, 0);
  const blockedDeps = titles.filter((t) => t.status !== "CANCELLED").reduce((s, t) => s + t.dependents.filter((d) => depState(d).blocked).length, 0);

  const kpis: [string, string][] = [
    ["Vagas do lote promocional", `${slots.left} de ${slots.limit}`],
    ["Sócios ativos", String(activeTitles.length)],
    ["Pessoas com acesso", String(peopleWithAccess)],
    ["Dependentes bloqueados (+21)", String(blockedDeps)],
    ["Leads", String(leads.length)],
    ["Recebido", brl(received._sum.valueCents ?? 0)],
    ["A receber", brl(open._sum.valueCents ?? 0)],
    ["Parcelas vencidas", String(overdue)],
  ];
  const funnel = (["NEW", "CONTACTED", "NEGOTIATING", "WON", "LOST"] as const).map((s) => [s, leads.filter((l) => l.status === s).length] as const);

  const mTitles: MTitle[] = titles.map((t) => ({
    id: t.id, number: t.number, holder: t.holder.name || "Sem nome", phone: t.holder.phone || "", email: t.holder.email || "", cpf: t.holder.cpf || "",
    lot: t.lot, plan: `Entrada ${brl(t.entryCents)} + ${t.installments}x ${brl(t.installmentCents)}`, status: t.status, since: dt(t.createdAt), notes: t.notes || "", installments: t.installments,
    payments: t.payments.map((p) => ({ id: p.id, kind: p.kind, number: p.number, valueCents: p.valueCents, due: dt(p.dueDate), status: p.status, billingType: p.billingType, asaas: !!p.asaasId, invoiceUrl: p.invoiceUrl })),
    deps: t.dependents.map((d) => ({ id: d.id, name: d.name, relation: d.relation, birthDate: d.birthDate ? d.birthDate.toISOString() : null, cpf: d.cpf })),
  }));

  const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-cream/50 whitespace-nowrap";
  const td = "px-4 py-3 text-sm";
  const tab = (k: string, l: string) => <Link key={k} href={`/admin?aba=${k}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${aba === k ? "bg-aqua font-bold text-ink" : "text-cream/65 hover:bg-white/10"}`}>{l}</Link>;

  return (
    <div className="min-h-screen bg-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="whitespace-nowrap font-display text-xl">Recanto<span className="text-aqua"> · admin</span></Link>
          <nav className="hidden gap-1 lg:flex">{tabs.map(([k, l]) => tab(k, l))}</nav>
        </div>
        <div className="flex items-center gap-3 text-sm"><span className="hidden text-cream/50 sm:block">{me.name || me.email || me.phone}</span><LogoutButton /></div>
      </header>
      <nav className="scroll-thin flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 lg:hidden">{tabs.map(([k, l]) => tab(k, l))}</nav>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        {aba === "visao" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{kpis.map(([l, v]) => <div key={l} className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-widest text-cream/50">{l}</div><div className="mt-2 font-display text-3xl">{v}</div></div>)}</div>
            <div className="glass rounded-3xl p-6">
              <h2 className="mb-5 font-display text-2xl">Funil de leads</h2>
              <div className="space-y-3">{funnel.map(([s, n]) => (
                <div key={s} className="flex items-center gap-4"><span className="w-32 text-sm text-cream/70">{leadStatus[s]}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-teal to-aqua" style={{ width: `${leads.length ? (n / leads.length) * 100 : 0}%` }} /></div><span className="w-8 text-right text-sm">{n}</span></div>
              ))}</div>
              {!leads.length && <p className="mt-4 text-sm text-cream/45">Nenhum lead ainda. Eles chegam pelo formulário do site, pelo chat e pelo WhatsApp.</p>}
            </div>
            {isAdmin && (await getConfig("OPENAI_API_KEY") === "" && (await getConfig("ANTHROPIC_API_KEY")) === "" || (await getConfig("ASAAS_API_KEY")) === "" || (await getConfig("CONEXTBOT_API_KEY")) === "") && (
              <Link href="/admin?aba=integracoes" className="block rounded-2xl border border-sun/40 bg-sun/10 p-5 text-sm text-sun">Falta configurar integrações (IA, Asaas, ConextBot…). Clique para abrir a tela de Integrações →</Link>
            )}
          </div>
        )}

        {aba === "leads" && (
          <div className="glass scroll-thin overflow-x-auto rounded-3xl">
            <table className="w-full"><thead><tr><th className={th}>Nome</th><th className={th}>WhatsApp</th><th className={th}>Origem</th><th className={th}>Interesse</th><th className={th}>Data</th><th className={th}>Situação</th><th className={th}></th></tr></thead>
              <tbody className="divide-y divide-white/5">{leads.map((l) => (
                <tr key={l.id}><td className={td}>{l.name || "—"}</td><td className={td}>{l.phone ? <a className="text-aqua" target="_blank" href={`https://wa.me/${l.phone}`}>{l.phone}</a> : "—"}</td><td className={td}>{L(source, l.source)}</td><td className={td}>{L(interest, l.interest)}</td><td className={td}>{dt(l.createdAt)}</td>
                  <td className={td}><LeadStatus id={l.id} status={l.status} /></td><td className={td}>{l.status !== "WON" && <NewMember lead={{ id: l.id, name: l.name, phone: l.phone, email: l.email }} label="Virar sócio" />}</td></tr>
              ))}</tbody></table>
            {!leads.length && <p className="p-6 text-cream/50">Nenhum lead ainda.</p>}
          </div>
        )}

        {aba === "socios" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between"><h2 className="font-display text-3xl">Sócios e títulos</h2><NewMember /></div>
            <MembersList titles={mTitles} />
          </div>
        )}

        {aba === "pagamentos" && (
          <div className="glass scroll-thin overflow-x-auto rounded-3xl">
            <table className="w-full"><thead><tr><th className={th}>Titular</th><th className={th}>Título</th><th className={th}>Cobrança</th><th className={th}>Valor</th><th className={th}>Vencimento</th><th className={th}>Forma</th><th className={th}>Situação</th></tr></thead>
              <tbody className="divide-y divide-white/5">{payments.map((p) => (
                <tr key={p.id}><td className={td}>{p.title.holder.name || p.title.holder.phone}</td><td className={td}>{String(p.title.number).padStart(3, "0")}</td><td className={td}>{payKind(p.kind, p.number, p.title.installments)}</td><td className={td}>{brl(p.valueCents)}</td><td className={td}>{dt(p.dueDate)}</td><td className={td}>{L(billing, p.billingType)}</td><td className={td}><Pill s={p.status} map={payStatus} /></td></tr>
              ))}</tbody></table>
            {!payments.length && <p className="p-6 text-cream/50">Nenhuma cobrança ainda.</p>}
          </div>
        )}

        {aba === "conversas" && (
          <div className="grid gap-4 lg:grid-cols-2">{sessions.map((s) => (
            <ChatRow key={s.id} id={s.id} channel={L(channel, s.channel)} who={s.lead?.name || s.user?.name || s.externalId || "Visitante"} takeover={s.humanTakeover} messages={s.messages.map((m) => ({ role: m.role, content: m.content }))} />
          ))}{!sessions.length && <p className="text-cream/50">Nenhuma conversa ainda.</p>}</div>
        )}

        {aba === "integracoes" && isAdmin && <Integrations items={await listConfig()} appUrl={await getConfig("APP_URL")} />}

        {aba === "config" && isAdmin && (
          <div className="space-y-6">
            <SettingsForm promoLimit={slots.limit} used={slots.used} />
            <div className="glass max-w-md rounded-3xl p-6"><h3 className="mb-3 font-display text-2xl">Exportar (Excel/CSV)</h3>
              <div className="flex flex-wrap gap-2">{[["leads", "Leads"], ["titulos", "Sócios e títulos"], ["pagamentos", "Pagamentos"]].map(([k, l]) => <a key={k} href={`/api/admin/export?tipo=${k}`} className="rounded-full border border-aqua/40 px-4 py-2 text-sm text-aqua">{l}</a>)}</div></div>
          </div>
        )}
      </main>
    </div>
  );
}
