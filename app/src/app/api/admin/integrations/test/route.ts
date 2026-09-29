import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { getConfig } from "@/lib/config";
import { asaas } from "@/lib/asaas";
import { sendText } from "@/lib/conextbot";
import { normalizePhone } from "@/lib/phone";
import { sendMail, verifySmtp } from "@/lib/mail";

// Testa cada integração com as chaves salvas. Retorna { ok, message }.
export async function POST(req: Request) {
  const me = await requireUser(["ADMIN"]);
  if (!me) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = z.object({ which: z.enum(["ia", "asaas", "whatsapp", "smtp"]), to: z.string().optional() }).safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  try {
    if (b.data.which === "ia") {
      const provider = await getConfig("AI_PROVIDER");
      if (provider === "anthropic") {
        const key = await getConfig("ANTHROPIC_API_KEY"); if (!key) throw new Error("Chave da Anthropic não configurada");
        const r = await fetch("https://api.anthropic.com/v1/models", { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } });
        if (!r.ok) throw new Error(`Anthropic ${r.status}: chave recusada`);
        return NextResponse.json({ ok: true, message: "Anthropic respondeu: chave válida." });
      }
      const key = await getConfig("OPENAI_API_KEY"); if (!key) throw new Error("Chave da OpenAI não configurada");
      const r = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${key}` } });
      if (!r.ok) throw new Error(`OpenAI ${r.status}: chave recusada`);
      return NextResponse.json({ ok: true, message: "OpenAI respondeu: chave válida." });
    }
    if (b.data.which === "asaas") {
      const bal = await asaas<{ balance: number }>("/finance/balance");
      return NextResponse.json({ ok: true, message: `Asaas conectado. Saldo: ${Number(bal.balance).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.` });
    }
    if (b.data.which === "whatsapp") {
      const to = normalizePhone(b.data.to || "");
      if (!to) throw new Error("Informe um número de WhatsApp para receber o teste");
      await sendText(to, "✅ Teste do sistema Recanto da Lagoa: a integração com o ConextBot está funcionando.");
      return NextResponse.json({ ok: true, message: `Mensagem de teste enviada para +${to}.` });
    }
    const to = b.data.to?.includes("@") ? b.data.to : me.email;
    await verifySmtp();
    if (to) { await sendMail(to, "Teste SMTP · Recanto da Lagoa", "<p>Se você recebeu este e-mail, o SMTP está funcionando ✅</p>"); return NextResponse.json({ ok: true, message: `Conexão SMTP ok. E-mail de teste enviado para ${to}.` }); }
    return NextResponse.json({ ok: true, message: "Conexão SMTP ok (informe um e-mail para receber um teste)." });
  } catch (e) {
    return NextResponse.json({ ok: false, message: (e as Error).message });
  }
}
