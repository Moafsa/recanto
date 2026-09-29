"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { ease } from "./ui";

type Msg = { role: "user" | "assistant"; content: string };
const hello: Msg = { role: "assistant", content: "Oi! Sou a Pérola 💧 assistente virtual do Recanto da Lagoa. Posso te ajudar com o título de sócio, diárias, horários e mais." };
const quick = ["Como funciona o título?", "Quais os horários?", "Valor da diária", "Orçamento do salão"];

function visitorId() {
  try {
    let v = localStorage.getItem("rl_visitor");
    if (!v) { v = crypto.randomUUID(); localStorage.setItem("rl_visitor", v); }
    return v;
  } catch { return "anon-" + Math.random().toString(36).slice(2, 12); }
}

export default function ChatWidget({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(embedded);
  const [msgs, setMsgs] = useState<Msg[]>([hello]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy, open]);

  async function send(m: string) {
    if (!m.trim() || busy) return;
    setMsgs((x) => [...x, { role: "user", content: m }]); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: m, visitorId: visitorId() }) });
      const d = await r.json();
      setMsgs((x) => [...x, { role: "assistant", content: d.reply ?? d.error ?? "Tive um problema, tente de novo." }]);
    } catch { setMsgs((x) => [...x, { role: "assistant", content: "Sem conexão agora. Tente novamente em instantes." }]); }
    setBusy(false);
  }

  const panel = (
    <div className={`glass flex flex-col overflow-hidden bg-deep/90 ${embedded ? "h-[70vh] rounded-3xl" : "h-[min(600px,80vh)] w-[min(400px,calc(100vw-2rem))] rounded-[1.8rem] shadow-2xl shadow-black/50"}`}>
      <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-lagoon to-deep px-5 py-4">
        <div className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-aqua to-teal font-display text-lg font-semibold text-ink">P<span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-deep bg-green-400" /></div>
        <div><div className="font-semibold leading-tight">Pérola</div><div className="text-xs text-cream/55">Assistente do Recanto · online</div></div>
        {!embedded && <button onClick={() => setOpen(false)} className="ml-auto text-cream/60 hover:text-white" aria-label="Fechar"><X size={18} /></button>}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto scroll-thin px-4 py-5">
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35, ease }} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-md bg-gradient-to-br from-teal to-aqua text-ink" : "rounded-bl-md bg-white/10"}`}>{m.content}</div>
          </motion.div>
        ))}
        {busy && <div className="flex gap-1.5 pl-2">{[0, 1, 2].map((i) => <motion.span key={i} className="h-2 w-2 rounded-full bg-aqua" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />)}</div>}
        {msgs.length === 1 && <div className="flex flex-wrap gap-2 pt-2">{quick.map((q) => <button key={q} onClick={() => send(q)} className="rounded-full border border-aqua/30 px-3 py-1.5 text-xs text-aqua transition hover:bg-aqua/10">{q}</button>)}</div>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-center gap-2 border-t border-white/10 p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua dúvida…" className="flex-1 rounded-full bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-cream/40 focus:ring-1 focus:ring-aqua" />
        <button disabled={busy || !text.trim()} className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-sun to-coral text-ink disabled:opacity-40" aria-label="Enviar"><Send size={17} /></button>
      </form>
    </div>
  );

  if (embedded) return panel;
  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.9 }} transition={{ duration: 0.45, ease }} className="absolute bottom-20 right-0 origin-bottom-right">{panel}</motion.div>}
      </AnimatePresence>
      <motion.button onClick={() => setOpen(!open)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 3, type: "spring" }}
        className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-aqua to-teal text-ink shadow-2xl shadow-teal/40" aria-label="Falar com a Pérola">
        {!open && <span className="absolute inset-0 rounded-full bg-teal" style={{ animation: "pulseRing 2.4s infinite" }} />}
        <span className="relative">{open ? <X size={26} /> : <MessageCircle size={28} />}</span>
      </motion.button>
    </div>
  );
}
