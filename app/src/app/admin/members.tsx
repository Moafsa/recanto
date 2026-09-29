"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Phone, Plus, Search, UserRound, X, Users } from "lucide-react";
import { brl } from "@/lib/park";
import { DepAddForm, DepBadge } from "@/components/DepUI";
import { depState, formatCpf } from "@/lib/rules";
import { L, billing, lot as lotL, payKind, payStatus, relation, statusTone, titleStatus } from "@/lib/labels";

export type MPay = { id: string; kind: string; number: number; valueCents: number; due: string; status: string; billingType: string; asaas: boolean; invoiceUrl: string | null };
export type MDep = { id: string; name: string; relation: string; birthDate: string | null; cpf: string | null };
export type MTitle = { id: string; number: number; holder: string; phone: string; email: string; cpf: string; lot: string; plan: string; status: string; since: string; notes: string; installments: number; payments: MPay[]; deps: MDep[] };

const relOpts: [string, string][] = [["SPOUSE", "Cônjuge"], ["CHILD", "Filho(a) até 21 anos"], ["FATHER", "Pai"], ["MOTHER", "Mãe"], ["IN_LAW", "Sogro(a)"]];
const field = "w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-aqua";
const post = (url: string, method: string, body?: object) => fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json().catch(() => ({})));
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const pill = (s: string, map: Record<string, string>) => <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold ${statusTone[s] ?? ""}`}>{map[s] ?? s}</span>;

function Card({ t }: { t: MTitle }) {
  const router = useRouter();
  const [showPay, setShowPay] = useState(false);
  const [msg, setMsg] = useState("");
  const [notes, setNotes] = useState(t.notes);
  const refresh = () => router.refresh();

  const live = t.payments.filter((p) => p.status !== "CANCELLED");
  const paid = live.filter((p) => p.status === "RECEIVED");
  const paidCents = paid.reduce((s, p) => s + p.valueCents, 0), totalCents = live.reduce((s, p) => s + p.valueCents, 0);
  const pct = totalCents ? (paidCents / totalCents) * 100 : 0;
  const late = live.filter((p) => p.status === "OVERDUE").length;

  return (
    <article className={`glass rounded-3xl p-5 sm:p-6 ${t.status === "CANCELLED" ? "opacity-60" : ""}`}>
      {/* cabeçalho: titular + status */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal to-aqua font-display text-2xl font-semibold text-ink">{initials(t.holder) || <UserRound />}</div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-aqua">Título nº {String(t.number).padStart(3, "0")} · lote {L(lotL, t.lot).toLowerCase()}</div>
            <h3 className="font-display text-2xl leading-tight">{t.holder}</h3>
            <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-cream/55">
              {t.phone && <a href={`https://wa.me/${t.phone}`} target="_blank" className="flex items-center gap-1 hover:text-aqua"><Phone size={12} />{t.phone}</a>}
              {t.email && <span>{t.email}</span>}{t.cpf && <span>CPF {t.cpf}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">{pill(t.status, titleStatus)}
          <select value={t.status} onChange={async (e) => { await post("/api/admin/title", "PATCH", { id: t.id, status: e.target.value }); refresh(); }} className="rounded-full border border-white/15 bg-deep px-2.5 py-1.5 text-xs" aria-label="Alterar status">
            {Object.entries(titleStatus).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      </header>

      {/* progresso de pagamento */}
      <div className="mt-5">
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="text-cream/70">{t.plan}</span>
          <span><b>{paid.length}</b> de {live.length} pagas · <b className="text-aqua">{brl(paidCents)}</b> de {brl(totalCents)}{late > 0 && <b className="ml-2 text-coral">{late} vencida{late > 1 ? "s" : ""}</b>}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-teal to-aqua transition-all" style={{ width: `${pct}%` }} /></div>
      </div>

      {/* dependentes vinculados: sempre visíveis */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-semibold"><Users size={16} className="text-aqua" />Dependentes neste título <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-cream/70">{t.deps.length}</span>{t.deps.some((d) => depState(d).blocked) && <span className="rounded-full bg-coral/25 px-2 py-0.5 text-xs font-bold text-coral">{t.deps.filter((d) => depState(d).blocked).length} bloqueado(s)</span>}</h4>
          <span className="text-[11px] text-cream/40">Filhos(as) têm acesso até 21 anos</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {t.deps.map((d) => {
            const st = depState(d);
            return (
              <div key={d.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${st.blocked ? "border-coral/60 bg-coral/10" : "border-white/10 bg-white/[.06]"}`}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${st.blocked ? "bg-coral/30 text-coral" : "bg-sun/25 text-sun"}`}>{initials(d.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${st.blocked ? "font-semibold text-coral line-through decoration-coral/50" : ""}`}>{d.name}</span>
                  <span className="block text-[11px] text-cream/55">{L(relation, d.relation)}{st.age !== null ? ` · ${st.age} anos` : ""}{d.cpf ? ` · CPF ${formatCpf(d.cpf)}` : ""}</span>
                  <span className="mt-1 block"><DepBadge relation={d.relation} birthDate={d.birthDate} /></span>
                </span>
                <button onClick={async () => { if (!window.confirm(`Remover só o dependente "${d.name}" deste título?`)) return; await post(`/api/dependents?id=${d.id}`, "DELETE"); refresh(); }} className="grid h-8 w-8 place-items-center rounded-full text-cream/40 hover:bg-coral/15 hover:text-coral" aria-label={`Remover ${d.name}`}><X size={15} /></button>
              </div>
            );
          })}
          {!t.deps.length && <p className="text-sm text-cream/45 sm:col-span-2">Nenhum dependente vinculado ainda.</p>}
        </div>
        <DepAddForm titleId={t.id} />
      </section>

      {/* cobranças (recolhível) */}
      <button onClick={() => setShowPay(!showPay)} className="mt-4 flex w-full items-center justify-between rounded-xl px-1 py-1 text-sm font-semibold text-cream/80 hover:text-white">
        Cobranças ({live.length})<ChevronDown size={17} className={`transition ${showPay ? "rotate-180" : ""}`} /></button>
      {showPay && (
        <div className="mt-2 divide-y divide-white/5 rounded-2xl border border-white/10">
          {t.payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
              <span><b>{payKind(p.kind, p.number, t.installments)}</b> · {brl(p.valueCents)}<span className="block text-xs text-cream/45">vence em {p.due} · {L(billing, p.billingType)}</span></span>
              <span className="flex items-center gap-2">{pill(p.status, payStatus)}
                {p.invoiceUrl && p.status !== "RECEIVED" && p.status !== "CANCELLED" && <a href={p.invoiceUrl} target="_blank" className="text-xs text-aqua underline">fatura</a>}
                {p.status !== "RECEIVED" && p.status !== "CANCELLED" && <button className="rounded-full bg-aqua px-3 py-1 text-[11px] font-bold text-ink" onClick={async () => { const r = await post("/api/admin/payment", "POST", { id: p.id, action: "RECEIVE" }); setMsg(r.note || ""); refresh(); }}>Dar baixa</button>}
                {p.status !== "RECEIVED" && p.status !== "CANCELLED" && <button className="text-[11px] text-coral" onClick={async () => { const r = await post("/api/admin/payment", "POST", { id: p.id, action: "CANCEL" }); setMsg(r.note || ""); refresh(); }}>Cancelar</button>}
                {(p.status === "RECEIVED" || p.status === "CANCELLED") && <button className="text-[11px] text-cream/50 underline" onClick={async () => { await post("/api/admin/payment", "POST", { id: p.id, action: "REOPEN" }); refresh(); }}>Reabrir</button>}
              </span>
            </div>
          ))}
        </div>
      )}
      {msg && <p className="mt-2 text-xs text-sun">{msg}</p>}
      <div className="mt-4 flex gap-2"><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações internas" className={field} />
        {notes !== t.notes && <button onClick={async () => { await post("/api/admin/title", "PATCH", { id: t.id, notes }); refresh(); }} className="rounded-xl border border-aqua/40 px-4 text-xs text-aqua">Salvar</button>}</div>
    </article>
  );
}

export default function MembersList({ titles }: { titles: MTitle[] }) {
  const [q, setQ] = useState(""); const [st, setSt] = useState("ALL");
  const list = useMemo(() => titles.filter((t) => (st === "ALL" || t.status === st) && (!q || `${t.holder} ${t.phone} ${t.email} ${t.cpf} ${t.deps.map((d) => d.name).join(" ")} ${t.number}`.toLowerCase().includes(q.toLowerCase()))), [titles, q, st]);
  const people = titles.filter((t) => t.status === "ACTIVE").reduce((s, t) => s + 1 + t.deps.filter((d) => !depState(d).blocked).length, 0);
  const blockedTotal = titles.reduce((s, t) => s + t.deps.filter((d) => depState(d).blocked).length, 0);
  const filters: [string, string][] = [["ALL", "Todos"], ...Object.entries(titleStatus)];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[["Títulos", titles.length], ["Ativos", titles.filter((t) => t.status === "ACTIVE").length], ["Em atraso", titles.filter((t) => t.status === "OVERDUE").length], ["Pessoas com acesso", people], ["Dependentes bloqueados", blockedTotal]].map(([l, v]) => (
          <div key={String(l)} className="glass rounded-2xl p-4"><div className="text-[11px] uppercase tracking-widest text-cream/50">{l}</div><div className="font-display text-3xl">{v}</div></div>))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/40" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, telefone, CPF, dependente ou nº…" className={`${field} pl-10`} /></div>
        <div className="flex flex-wrap gap-1.5">{filters.map(([k, l]) => <button key={k} onClick={() => setSt(k)} className={`rounded-full px-3.5 py-2 text-xs font-semibold ${st === k ? "bg-aqua text-ink" : "border border-white/15 text-cream/70"}`}>{l}</button>)}</div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">{list.map((t) => <Card key={t.id} t={t} />)}</div>
      {!list.length && <p className="py-10 text-center text-cream/50">{titles.length ? "Nenhum resultado para o filtro." : "Nenhum sócio ainda. Use “Novo sócio” ou converta um lead."}</p>}
    </div>
  );
}
