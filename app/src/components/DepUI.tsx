"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Plus, ShieldCheck, TriangleAlert } from "lucide-react";
import { CHILD_MAX_AGE, birthValid, cpfValid, depState, formatCpf } from "@/lib/rules";

export const REL_OPTS: [string, string][] = [["SPOUSE", "Cônjuge"], ["CHILD", "Filho(a) até 21 anos"], ["FATHER", "Pai"], ["MOTHER", "Mãe"], ["IN_LAW", "Sogro(a)"]];
export const REL_LABEL: Record<string, string> = { SPOUSE: "Cônjuge", CHILD: "Filho(a)", FATHER: "Pai", MOTHER: "Mãe", IN_LAW: "Sogro(a)" };
export type DepDraft = { name: string; relation: string; birthDate: string; cpf: string };
export const emptyDep = (): DepDraft => ({ name: "", relation: "SPOUSE", birthDate: "", cpf: "" });

const field = "w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-aqua";
const dmy = (d: Date) => d.toLocaleDateString("pt-BR");

/** Situação calculada agora, a partir da data de nascimento. */
export function DepBadge({ relation, birthDate, compact = false }: { relation: string; birthDate?: string | Date | null; compact?: boolean }) {
  const s = depState({ relation, birthDate });
  if (s.blocked)
    return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-coral/25 px-2.5 py-1 text-[11px] font-bold text-coral"><Ban size={12} />Bloqueado{compact ? "" : ` · passou de ${CHILD_MAX_AGE} anos`}</span>;
  if (s.soon && s.turnsBlockedOn)
    return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-sun/20 px-2.5 py-1 text-[11px] font-bold text-sun"><TriangleAlert size={12} />Bloqueia em {dmy(s.turnsBlockedOn)}</span>;
  if (s.missing)
    return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-sun/20 px-2.5 py-1 text-[11px] font-bold text-sun"><TriangleAlert size={12} />Sem data de nascimento</span>;
  return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-teal/20 px-2.5 py-1 text-[11px] font-bold text-aqua"><ShieldCheck size={12} />Liberado</span>;
}

/** Linha de campos do dependente com validação e aviso ao vivo. */
export function DepFields({ value, onChange, onRemove }: { value: DepDraft; onChange: (d: DepDraft) => void; onRemove?: () => void }) {
  const set = (k: keyof DepDraft, v: string) => onChange({ ...value, [k]: v });
  const cpfDigits = value.cpf.replace(/\D/g, "");
  const cpfBad = cpfDigits.length === 11 && !cpfValid(value.cpf);
  const birthBad = !!value.birthDate && !birthValid(value.birthDate);
  const s = depState({ relation: value.relation, birthDate: birthValid(value.birthDate) ? value.birthDate : null });
  const blocked = value.relation === "CHILD" && birthValid(value.birthDate) && s.blocked;
  return (
    <div className={`rounded-2xl border p-3 ${blocked ? "border-coral/60 bg-coral/10" : "border-white/10 bg-black/20"}`}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_.9fr_1fr_auto]">
        <input required placeholder="Nome completo" value={value.name} onChange={(e) => set("name", e.target.value)} className={field} />
        <select value={value.relation} onChange={(e) => set("relation", e.target.value)} className={`${field} bg-deep`}>{REL_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <input required type="date" title="Data de nascimento" value={value.birthDate} onChange={(e) => set("birthDate", e.target.value)} max={new Date().toISOString().slice(0, 10)} className={`${field} ${birthBad ? "border-coral" : ""}`} />
        <input required inputMode="numeric" placeholder="CPF" value={value.cpf} onChange={(e) => set("cpf", formatCpf(e.target.value))} className={`${field} ${cpfBad ? "border-coral" : ""}`} />
        {onRemove && <button type="button" onClick={onRemove} className="px-2 text-sm text-coral" aria-label="Remover">✕</button>}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {cpfBad && <span className="text-coral">CPF inválido</span>}
        {birthBad && <span className="text-coral">Data de nascimento inválida</span>}
        {blocked && <span className="font-semibold text-coral">Tem {s.age} anos: filho(a) acima de {CHILD_MAX_AGE} anos fica bloqueado(a) e não terá acesso.</span>}
        {!blocked && s.soon && s.turnsBlockedOn && <span className="text-sun">Atenção: completa {CHILD_MAX_AGE + 1} anos em {dmy(s.turnsBlockedOn)} e será bloqueado(a).</span>}
        {value.relation === "CHILD" && !value.birthDate && <span className="text-cream/45">Filho(a) tem acesso até {CHILD_MAX_AGE} anos.</span>}
      </div>
    </div>
  );
}

export const draftValid = (d: DepDraft) => d.name.trim().length >= 2 && birthValid(d.birthDate) && cpfValid(d.cpf);

/** Formulário "adicionar dependente" para um título existente (painel do sócio e admin). */
export function DepAddForm({ titleId }: { titleId: string }) {
  const router = useRouter();
  const [d, setD] = useState<DepDraft>(emptyDep());
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!draftValid(d)) return setErr("Preencha nome, data de nascimento e um CPF válido."); setBusy(true); setErr("");
    const r = await fetch("/api/dependents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titleId, ...d }) });
    const j = await r.json().catch(() => ({})); setBusy(false);
    if (!r.ok) return setErr(j.error || "Não foi possível adicionar.");
    setD(emptyDep()); router.refresh();
  }
  return (
    <form onSubmit={add} className="mt-3 space-y-2">
      <DepFields value={d} onChange={setD} />
      <div className="flex items-center gap-3"><button disabled={busy} className="flex items-center gap-1 rounded-xl bg-aqua px-4 py-2 text-sm font-bold text-ink disabled:opacity-60"><Plus size={15} />Vincular dependente</button>{err && <span className="text-sm text-coral">{err}</span>}</div>
    </form>
  );
}
