"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { TITLE_PLAN, brl } from "@/lib/park";
import { DepFields, draftValid, emptyDep, type DepDraft } from "@/components/DepUI";
import { cpfValid, formatCpf } from "@/lib/rules";


export default function Contratar() {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [inst, setInst] = useState<3 | 6 | 12>(3);
  const [deps, setDeps] = useState<DepDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const field = "w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-aqua";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (cpf.replace(/\D/g, "").length === 11 && !cpfValid(cpf)) return setErr("CPF do titular inválido");
    if (deps.some((d) => !draftValid(d))) return setErr("Complete nome, data de nascimento e CPF válido de cada dependente (ou remova a linha).");
    setBusy(true);
    const r = await fetch("/api/titles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, cpf, installments: inst, dependents: deps.map((d) => ({ name: d.name, relation: d.relation, birthDate: d.birthDate, cpf: d.cpf })) }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(d.error || "Erro ao contratar");
    window.location.href = d.payUrl || "/painel";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep to-ink px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/painel" className="text-sm text-cream/60 hover:text-white">← Voltar</Link>
        <h1 className="mb-8 mt-4 font-display text-4xl font-light sm:text-5xl">Contratar <span className="italic text-aqua">título familiar</span></h1>
        <form onSubmit={submit} className="glass space-y-6 rounded-3xl p-7 sm:p-9">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo do titular" className={field} />
            <input required value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} placeholder="CPF do titular" inputMode="numeric" className={field} />
          </div>
          <div>
            <div className="mb-2 text-sm text-cream/60">Entrada de {brl(TITLE_PLAN.entryCents)} + saldo em:</div>
            <div className="grid grid-cols-3 gap-2">
              {TITLE_PLAN.options.map((o) => (
                <button type="button" key={o.installments} onClick={() => setInst(o.installments as 3 | 6 | 12)} className={`rounded-2xl border px-3 py-3 transition ${inst === o.installments ? "border-aqua bg-aqua/15 text-aqua" : "border-white/15"}`}>
                  <div className="text-lg font-bold">{o.installments}x</div><div className="text-xs">{brl(o.valueCents)}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm text-cream/60">Dependentes (nascimento e CPF obrigatórios)
              <button type="button" onClick={() => setDeps([...deps, emptyDep()])} className="flex items-center gap-1 text-aqua"><Plus size={14} /> Adicionar</button></div>
            <div className="space-y-2">
              {deps.map((d, i) => <DepFields key={i} value={d} onChange={(nd) => setDeps(deps.map((x, j) => (j === i ? nd : x)))} onRemove={() => setDeps(deps.filter((_, j) => j !== i))} />)}
            </div>
          </div>
          {err && <p className="text-sm text-coral">{err}</p>}
          <button disabled={busy} className="btn-shine w-full rounded-full bg-gradient-to-r from-sun to-coral py-4 font-bold text-ink disabled:opacity-60">{busy ? "Gerando cobrança…" : "Confirmar e pagar entrada"}</button>
          <p className="text-center text-xs text-cream/45">Você será levado à fatura do Asaas (PIX ou boleto).</p>
        </form>
      </div>
    </div>
  );
}
