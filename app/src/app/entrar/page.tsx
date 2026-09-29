"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle } from "lucide-react";
import WaterCanvas from "@/components/WaterCanvas";
import { ease } from "@/components/ui";

function Login() {
  const params = useSearchParams();
  const next = params.get("next");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState(params.get("erro") ? "Não foi possível entrar com o Google. Tente novamente." : "");
  const [busy, setBusy] = useState(false);

  async function call(url: string, body: object) {
    setBusy(true); setErr("");
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(d.error || "Erro"); return null; }
    return d;
  }
  const request = async (e: React.FormEvent) => { e.preventDefault(); const d = await call("/api/auth/otp/request", { phone }); if (d) { setPhone(d.phone); setStep("code"); } };
  const verify = async (e: React.FormEvent) => { e.preventDefault(); const d = await call("/api/auth/otp/verify", { phone, code }); if (d) window.location.href = next && next.startsWith("/painel") ? next : d.redirect; };
  const field = "w-full rounded-2xl border border-white/15 bg-black/30 px-5 py-4 text-base outline-none transition placeholder:text-cream/35 focus:border-aqua";

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-b from-[#0a3a48] to-ink p-5">
      <WaterCanvas />
      <Link href="/" className="absolute left-6 top-6 z-10 flex items-center gap-2 text-sm text-cream/70 hover:text-white"><ArrowLeft size={16} /> Voltar ao site</Link>
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1, ease }} className="glass relative z-10 w-full max-w-md rounded-[2rem] bg-deep/70 p-8 sm:p-10">
        <Image src="/fotos/logo.png" alt="Recanto da Lagoa" width={84} height={84} className="mb-5 rounded-2xl bg-white" />
        <div className="font-display text-3xl font-light">Área do <span className="italic text-aqua">sócio</span></div>
        <p className="mt-2 text-sm text-cream/60">Entre para acompanhar seu título, pagamentos e dependentes.</p>

        <a href="/api/auth/google" className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-white py-3.5 text-sm font-bold text-ink transition hover:scale-[1.02]">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
          Continuar com Google
        </a>
        <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-cream/35"><span className="h-px flex-1 bg-white/10" />ou<span className="h-px flex-1 bg-white/10" /></div>

        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.form key="p" onSubmit={request} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" placeholder="WhatsApp com DDD" className={field} />
              <button disabled={busy} className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal to-aqua py-4 font-bold text-ink disabled:opacity-60"><MessageCircle size={18} />{busy ? "Enviando…" : "Receber código no WhatsApp"}</button>
            </motion.form>
          ) : (
            <motion.form key="c" onSubmit={verify} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <p className="text-sm text-cream/65">Enviamos um código de 6 dígitos para <b>+{phone}</b>.</p>
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required autoFocus inputMode="numeric" placeholder="000000" className={`${field} text-center font-display text-3xl tracking-[0.5em]`} />
              <button disabled={busy || code.length !== 6} className="btn-shine w-full rounded-full bg-gradient-to-r from-sun to-coral py-4 font-bold text-ink disabled:opacity-60">{busy ? "Verificando…" : "Entrar"}</button>
              <button type="button" onClick={() => { setStep("phone"); setCode(""); }} className="w-full text-sm text-cream/55 hover:text-white">Trocar número</button>
            </motion.form>
          )}
        </AnimatePresence>
        {err && <p className="mt-4 text-sm text-coral">{err}</p>}
      </motion.div>
    </div>
  );
}

export default function Page() { return <Suspense><Login /></Suspense>; }
