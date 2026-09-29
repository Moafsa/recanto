"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, ChevronDown } from "lucide-react";
import { TITLE_PLAN, brl } from "@/lib/park";
import { DepFields, draftValid, emptyDep, type DepDraft } from "@/components/DepUI";
import { cpfValid, formatCpf } from "@/lib/rules";

const relOpts = [["SPOUSE", "Cônjuge"], ["CHILD", "Filho(a) até 21"], ["FATHER", "Pai"], ["MOTHER", "Mãe"], ["IN_LAW", "Sogro(a)"]];
const relLabel = Object.fromEntries(relOpts);
const field = "w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-aqua";

async function api(url: string, method: string, body?: object) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, ...d } as { ok: boolean; error?: string; note?: string; number?: number; payUrl?: string };
}

/* ───────── novo sócio (modal) ───────── */
export function NewMember({ lead, label = "Novo sócio" }: { lead?: { id: string; name: string | null; phone: string | null; email: string | null }; label?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: lead?.name ?? "", phone: lead?.phone ?? "", email: lead?.email ?? "", cpf: "", installments: 3, lot: "", chargeMode: "MANUAL", notes: "" });
  const [deps, setDeps] = useState<DepDraft[]>([]);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState<string | null>(null);
  const set = (k: string, v: string | number) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (f.cpf.replace(/\D/g, "").length === 11 && !cpfValid(f.cpf)) return setErr("CPF do titular inválido");
    if (deps.some((d) => !draftValid(d))) return setErr("Complete nome, nascimento e CPF válido de cada dependente (ou remova a linha).");
    setBusy(true);
    const r = await api("/api/admin/members", "POST", {
      name: f.name, phone: f.phone || undefined, email: f.email || undefined, cpf: f.cpf || undefined,
      installments: Number(f.installments), lot: f.lot || undefined, chargeMode: f.chargeMode, notes: f.notes || undefined, leadId: lead?.id,
      dependents: deps.map((d) => ({ ...d })),
    });
    setBusy(false);
    if (!r.ok) return setErr(r.error || "Erro");
    setDone(`Título nº ${String(r.number).padStart(3, "0")} criado.${r.payUrl ? ` Fatura: ${r.payUrl}` : ""}`);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-full bg-gradient-to-r from-sun to-coral px-4 py-2 text-xs font-bold text-ink">{label}</button>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="glass relative my-8 w-full max-w-2xl rounded-3xl bg-deep p-7" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute right-5 top-5 text-cream/60" aria-label="Fechar"><X size={18} /></button>
            <h3 className="font-display text-2xl">Cadastrar sócio e título</h3>
            {done ? (
              <div className="mt-6 space-y-4"><p className="text-aqua">{done}</p><button onClick={() => { setOpen(false); setDone(null); }} className="rounded-full bg-aqua px-5 py-2 text-sm font-bold text-ink">Fechar</button></div>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input required placeholder="Nome completo" value={f.name} onChange={(e) => set("name", e.target.value)} className={field} />
                  <input placeholder="CPF" value={f.cpf} onChange={(e) => set("cpf", formatCpf(e.target.value))} className={field} />
                  <input placeholder="WhatsApp com DDD" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
                  <input type="email" placeholder="E-mail" value={f.email} onChange={(e) => set("email", e.target.value)} className={field} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <select value={f.installments} onChange={(e) => set("installments", Number(e.target.value))} className={`${field} bg-deep`}>
                    {TITLE_PLAN.options.map((o) => <option key={o.installments} value={o.installments}>Entrada + {o.installments}x {brl(o.valueCents)}</option>)}
                  </select>
                  <select value={f.lot} onChange={(e) => set("lot", e.target.value)} className={`${field} bg-deep`}><option value="">Lote automático</option><option value="PROMO">Promocional</option><option value="NORMAL">Normal</option></select>
                  <select value={f.chargeMode} onChange={(e) => set("chargeMode", e.target.value)} className={`${field} bg-deep`}><option value="MANUAL">Cobrança manual (dinheiro / PIX direto)</option><option value="ASAAS">Gerar cobrança no Asaas</option></select>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-cream/60">Dependentes (nascimento e CPF obrigatórios)<button type="button" onClick={() => setDeps([...deps, emptyDep()])} className="flex items-center gap-1 text-aqua"><Plus size={13} />Adicionar</button></div>
                  <div className="space-y-2">{deps.map((d, i) => <DepFields key={i} value={d} onChange={(nd) => setDeps(deps.map((x, j) => (j === i ? nd : x)))} onRemove={() => setDeps(deps.filter((_, j) => j !== i))} />)}</div>
                </div>
                <textarea placeholder="Observações internas" value={f.notes} onChange={(e) => set("notes", e.target.value)} className={`${field} h-16`} />
                {err && <p className="text-sm text-coral">{err}</p>}
                <button disabled={busy} className="w-full rounded-full bg-gradient-to-r from-sun to-coral py-3 font-bold text-ink disabled:opacity-60">{busy ? "Salvando…" : "Criar título"}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ───────── configurações ───────── */
export function SettingsForm({ promoLimit, used }: { promoLimit: number; used: number }) {
  const router = useRouter(); const [v, setV] = useState(promoLimit); const [ok, setOk] = useState(false);
  return (
    <form className="glass max-w-md space-y-4 rounded-3xl p-6" onSubmit={async (e) => { e.preventDefault(); const r = await api("/api/admin/settings", "POST", { promoLimit: Number(v) }); setOk(r.ok); router.refresh(); }}>
      <h3 className="font-display text-2xl">Lote promocional</h3>
      <p className="text-sm text-cream/60">{used} vagas usadas. Ao esgotar, novos títulos entram no valor normal automaticamente.</p>
      <input type="number" min={0} value={v} onChange={(e) => setV(Number(e.target.value))} className={field} />
      <button className="rounded-full bg-aqua px-5 py-2.5 text-sm font-bold text-ink">Salvar limite</button>{ok && <span className="ml-3 text-sm text-aqua">Salvo ✓</span>}
    </form>
  );
}
