import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { brl, PARK } from "@/lib/park";
import ChatWidget from "@/components/ChatWidget";
import DependentsEditor from "@/components/DependentsEditor";
import LogoutButton from "@/components/LogoutButton";

const statusLabel: Record<string, [string, string]> = {
  PENDING: ["Aguardando entrada", "bg-sun/20 text-sun"],
  ACTIVE: ["Ativo", "bg-teal/25 text-aqua"],
  OVERDUE: ["Em atraso", "bg-coral/25 text-coral"],
  CANCELLED: ["Cancelado", "bg-white/10 text-cream/50"],
  RECEIVED: ["Pago", "bg-teal/25 text-aqua"],
  REFUNDED: ["Estornado", "bg-white/10 text-cream/50"],
};

export const dynamic = "force-dynamic";

export default async function Painel() {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");
  const titles = await db.title.findMany({
    where: { holderId: user.id, status: { not: "CANCELLED" } },
    include: { dependents: true, payments: { orderBy: { dueDate: "asc" } } },
    orderBy: { number: "asc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep to-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl">Recanto<span className="text-aqua"> da Lagoa</span></Link>
        <div className="flex items-center gap-4 text-sm"><span className="hidden text-cream/60 sm:block">{user.name || user.email || user.phone}</span>
          {user.role !== "MEMBER" && <Link href="/admin" className="rounded-full border border-aqua/40 px-4 py-2 text-aqua">Admin</Link>}
          <LogoutButton /></div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 pb-20 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <h1 className="font-display text-4xl font-light sm:text-5xl">Olá, <span className="italic text-aqua">{(user.name || "sócio").split(" ")[0]}</span></h1>

          {titles.length === 0 && (
            <div className="glass rounded-3xl p-8">
              <h2 className="font-display text-2xl">Você ainda não tem um título</h2>
              <p className="mt-2 text-cream/65">Garanta o título familiar na pré-temporada. A reabertura é em {PARK.openingLabel}.</p>
              <Link href="/painel/titulo" className="btn-shine mt-6 inline-block rounded-full bg-gradient-to-r from-sun to-coral px-7 py-3.5 font-bold text-ink">Contratar título</Link>
            </div>
          )}

          {titles.map((t) => {
            const [label, cls] = statusLabel[t.status] ?? ["—", ""];
            return (
              <section key={t.id} className="glass rounded-3xl p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><div className="text-[11px] uppercase tracking-[0.3em] text-aqua">Título nº</div><div className="font-display text-5xl font-light">{String(t.number).padStart(3, "0")}</div></div>
                  <span className={`rounded-full px-4 py-1.5 text-xs font-bold ${cls}`}>{label}</span>
                </div>
                <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-cream/50">Cobranças</h3>
                <div className="divide-y divide-white/10">
                  {t.payments.map((p) => {
                    const [pl, pc] = statusLabel[p.status] ?? ["—", ""];
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                        <div><div>{p.kind === "ENTRY" ? "Entrada" : `Parcela ${p.number}/${t.installments}`}</div><div className="text-xs text-cream/50">vence {p.dueDate.toLocaleDateString("pt-BR")}</div></div>
                        <div className="flex items-center gap-3"><span className="font-semibold">{brl(p.valueCents)}</span><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${pc}`}>{pl}</span>
                          {p.invoiceUrl && p.status !== "RECEIVED" && <a href={p.invoiceUrl} target="_blank" className="rounded-full bg-aqua px-3 py-1.5 text-xs font-bold text-ink">Pagar</a>}</div>
                      </div>
                    );
                  })}
                </div>
                <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-cream/50">Dependentes</h3>
                <DependentsEditor titleId={t.id} deps={t.dependents.map((d) => ({ id: d.id, name: d.name, relation: d.relation, birthDate: d.birthDate ? d.birthDate.toISOString() : null, cpf: d.cpf }))} />
              </section>
            );
          })}
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start"><ChatWidget embedded /></aside>
      </main>
    </div>
  );
}
