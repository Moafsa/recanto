"use client";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { depState, formatCpf } from "@/lib/rules";
import { DepAddForm, DepBadge, REL_LABEL } from "./DepUI";

export type DepView = { id: string; name: string; relation: string; birthDate: string | null; cpf: string | null };

/** Lista de dependentes do sócio. Filho(a) acima de 21 anos aparece em vermelho, como bloqueado(a). */
export default function DependentsEditor({ titleId, deps }: { titleId: string; deps: DepView[] }) {
  const router = useRouter();
  async function remove(id: string, name: string) { if (!window.confirm(`Remover só o dependente "${name}" deste título?`)) return; await fetch(`/api/dependents?id=${id}`, { method: "DELETE" }); router.refresh(); }
  const usable = deps.filter((d) => !depState(d).blocked).length;

  return (
    <div>
      <p className="mb-3 text-xs text-cream/50">{usable} de {deps.length} com acesso · filhos(as) têm acesso até 21 anos</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {deps.map((d) => {
          const s = depState(d);
          return (
            <div key={d.id} className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 ${s.blocked ? "border-coral/60 bg-coral/10" : "border-white/10 bg-white/[.05]"}`}>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-semibold ${s.blocked ? "text-coral line-through decoration-coral/50" : ""}`}>{d.name}</div>
                <div className="text-[11px] text-cream/55">{REL_LABEL[d.relation]}{s.age !== null ? ` · ${s.age} anos` : ""}{d.cpf ? ` · CPF ${formatCpf(d.cpf)}` : ""}</div>
                <div className="mt-1.5"><DepBadge relation={d.relation} birthDate={d.birthDate} /></div>
              </div>
              <button onClick={() => remove(d.id, d.name)} className="grid h-8 w-8 place-items-center rounded-full text-cream/40 hover:bg-coral/15 hover:text-coral" aria-label={`Remover ${d.name}`}><X size={15} /></button>
            </div>
          );
        })}
        {!deps.length && <span className="text-sm text-cream/50">Nenhum cadastrado.</span>}
      </div>
      <DepAddForm titleId={titleId} />
    </div>
  );
}
