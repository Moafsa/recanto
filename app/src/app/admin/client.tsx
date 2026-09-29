"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { leadStatus } from "@/lib/labels";


export function LeadStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  return (
    <select defaultValue={status} className="rounded-full border border-white/15 bg-deep px-3 py-1.5 text-xs"
      onChange={async (e) => { await fetch("/api/admin/lead", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: e.target.value }) }); router.refresh(); }}>
      {Object.entries(leadStatus).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  );
}

export function ChatRow({ id, channel, who, takeover, messages }: { id: string; channel: string; who: string; takeover: boolean; messages: { role: string; content: string }[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const post = async (body: object) => { await fetch("/api/admin/takeover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: id, ...body }) }); router.refresh(); };
  return (
    <div className="glass flex max-h-[520px] flex-col rounded-3xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div><div className="font-semibold">{who}</div><div className="text-xs text-cream/50">{channel}</div></div>
        <button onClick={() => post({ takeover: !takeover })} className={`rounded-full px-4 py-1.5 text-xs font-bold ${takeover ? "bg-coral text-ink" : "border border-aqua/40 text-aqua"}`}>{takeover ? "Devolver à IA" : "Assumir conversa"}</button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto scroll-thin p-4">
        {messages.map((m, i) => <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-white/10" : "ml-auto bg-teal/25"}`}>{m.content}</div>)}
      </div>
      {takeover && (
        <form onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; await post({ text }); setText(""); }} className="flex gap-2 border-t border-white/10 p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Responder como atendente…" className="flex-1 rounded-full bg-black/30 px-4 py-2 text-sm outline-none" />
          <button className="rounded-full bg-aqua px-4 text-sm font-bold text-ink">Enviar</button>
        </form>
      )}
    </div>
  );
}
