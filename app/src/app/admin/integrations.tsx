"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, MessageCircle, CreditCard, Mail, Globe, Copy, Check, Trash2 } from "lucide-react";

type Item = { key: string; group: string; label: string; help?: string; secret: boolean; options?: { value: string; label: string }[]; value: string; masked: string; source: string };

const groups: { id: string; title: string; icon: React.ReactNode; desc: string; test?: "ia" | "asaas" | "whatsapp" | "smtp"; testInput?: string }[] = [
  { id: "ia", title: "Inteligência artificial (Pérola)", icon: <Bot size={20} />, desc: "Responde clientes no site, no painel do sócio e no WhatsApp.", test: "ia" },
  { id: "whatsapp", title: "WhatsApp · ConextBot", icon: <MessageCircle size={20} />, desc: "API oficial da Meta via ConextBot: envia o código de login e conversa com clientes.", test: "whatsapp", testInput: "WhatsApp para receber o teste" },
  { id: "asaas", title: "Pagamentos · Asaas", icon: <CreditCard size={20} />, desc: "Gera entrada e parcelas do título (PIX/boleto) e recebe as baixas automáticas.", test: "asaas" },
  { id: "smtp", title: "E-mail · SMTP", icon: <Mail size={20} />, desc: "Envia e-mails ao sócio (ex.: título ativado).", test: "smtp", testInput: "E-mail para receber o teste" },
  { id: "google", title: "Login com Google", icon: <Globe size={20} />, desc: "Permite entrar com a conta Google." },
  { id: "geral", title: "Geral", icon: <Globe size={20} />, desc: "Endereço público do site." },
];

const sourceBadge: Record<string, string> = { painel: "bg-teal/25 text-aqua", env: "bg-sun/20 text-sun", padrão: "bg-white/10 text-cream/60", vazio: "bg-coral/20 text-coral" };
const field = "w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-aqua";

function Copy1({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return <button type="button" onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }} className="ml-2 inline-flex items-center gap-1 text-aqua">{ok ? <Check size={13} /> : <Copy size={13} />}{ok ? "copiado" : "copiar"}</button>;
}

export default function Integrations({ items, appUrl }: { items: Item[]; appUrl: string }) {
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [testTo, setTestTo] = useState<Record<string, string>>({});
  const provider = vals.AI_PROVIDER ?? items.find((i) => i.key === "AI_PROVIDER")?.value;

  async function save(groupId: string) {
    setBusy(groupId);
    const keys = items.filter((i) => i.group === groupId).map((i) => i.key);
    const values = Object.fromEntries(keys.filter((k) => k in vals).map((k) => [k, vals[k]]));
    const r = await fetch("/api/admin/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values }) });
    setBusy(null);
    setMsg((m) => ({ ...m, [groupId]: { ok: r.ok, text: r.ok ? "Salvo ✓" : "Erro ao salvar" } }));
    if (r.ok) { setVals((v) => Object.fromEntries(Object.entries(v).filter(([k]) => !keys.includes(k)))); router.refresh(); }
  }
  async function clear(key: string) {
    await fetch("/api/admin/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clear: [key] }) });
    router.refresh();
  }
  async function test(g: (typeof groups)[number]) {
    setBusy("t" + g.id);
    const r = await fetch("/api/admin/integrations/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ which: g.test, to: testTo[g.id] }) });
    const d = await r.json().catch(() => ({ ok: false, message: "Erro" }));
    setBusy(null); setMsg((m) => ({ ...m, [g.id]: { ok: !!d.ok, text: d.message || d.error } }));
  }

  const hooks: Record<string, { label: string; url: string; note?: string }[]> = {
    whatsapp: [{ label: "URL do webhook de mensagens", url: `${appUrl}/api/webhooks/whatsapp`, note: "Cole no ConextBot; envie o segredo no header x-webhook-secret." }],
    asaas: [{ label: "URL do webhook", url: `${appUrl}/api/webhooks/asaas`, note: "Asaas → Integrações → Webhooks. Eventos: pagamento recebido, confirmado, vencido, estornado, removido." }],
    google: [{ label: "URI de redirecionamento autorizada", url: `${appUrl}/api/auth/google/callback`, note: "Google Cloud → Credenciais → ID do cliente OAuth." }],
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <p className="text-sm text-cream/60">As chaves são guardadas <b>criptografadas</b> no banco e nunca aparecem de volta na tela. Valor do painel tem prioridade sobre o arquivo <code>.env</code>.</p>
      {groups.map((g) => {
        const rows = items.filter((i) => i.group === g.id && !(g.id === "ia" && ((provider === "openai" && (i.key === "ANTHROPIC_API_KEY" || i.key === "AI_MODEL")) || (provider === "anthropic" && (i.key === "OPENAI_API_KEY" || i.key === "OPENAI_MODEL")))));
        return (
          <section key={g.id} className="glass rounded-3xl p-6 sm:p-7">
            <div className="mb-1 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/20 text-aqua">{g.icon}</span><h3 className="font-display text-2xl">{g.title}</h3></div>
            <p className="mb-5 text-sm text-cream/55">{g.desc}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((i) => (
                <label key={i.key} className={i.key.includes("KEY") || i.key.includes("SECRET") || i.key.includes("URL") || i.key === "SMTP_FROM" ? "sm:col-span-2" : ""}>
                  <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-cream/70">{i.label}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${sourceBadge[i.source]}`}>{i.source === "painel" ? "salvo no painel" : i.source === "env" ? "vem do .env" : i.source === "padrão" ? "padrão" : "não configurado"}</span></span>
                  {i.options ? (
                    <select value={vals[i.key] ?? i.value} onChange={(e) => setVals({ ...vals, [i.key]: e.target.value })} className={`${field} bg-deep`}>{i.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                  ) : (
                    <div className="flex gap-2">
                      <input type={i.secret ? "password" : "text"} autoComplete="off" value={vals[i.key] ?? (i.secret ? "" : i.value)} onChange={(e) => setVals({ ...vals, [i.key]: e.target.value })}
                        placeholder={i.secret ? (i.masked ? `${i.masked} (deixe vazio para manter)` : "Cole a chave aqui") : ""} className={field} />
                      {i.source === "painel" && <button type="button" onClick={() => clear(i.key)} title="Remover valor salvo" className="rounded-xl border border-white/15 px-3 text-coral"><Trash2 size={15} /></button>}
                    </div>
                  )}
                  {i.help && <span className="mt-1 block text-[11px] text-cream/40">{i.help}</span>}
                </label>
              ))}
            </div>
            {hooks[g.id]?.map((h) => (
              <div key={h.url} className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs">
                <div className="text-cream/55">{h.label}</div><code className="break-all text-aqua">{h.url}</code><Copy1 text={h.url} />
                {h.note && <div className="mt-1 text-cream/40">{h.note}</div>}
              </div>
            ))}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={() => save(g.id)} disabled={busy === g.id} className="rounded-full bg-gradient-to-r from-sun to-coral px-6 py-2.5 text-sm font-bold text-ink disabled:opacity-60">{busy === g.id ? "Salvando…" : "Salvar"}</button>
              {g.testInput && <input value={testTo[g.id] ?? ""} onChange={(e) => setTestTo({ ...testTo, [g.id]: e.target.value })} placeholder={g.testInput} className={`${field} max-w-60`} />}
              {g.test && <button onClick={() => test(g)} disabled={busy === "t" + g.id} className="rounded-full border border-aqua/50 px-5 py-2.5 text-sm font-semibold text-aqua disabled:opacity-60">{busy === "t" + g.id ? "Testando…" : "Testar conexão"}</button>}
              {msg[g.id] && <span className={`text-sm ${msg[g.id].ok ? "text-aqua" : "text-coral"}`}>{msg[g.id].text}</span>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
