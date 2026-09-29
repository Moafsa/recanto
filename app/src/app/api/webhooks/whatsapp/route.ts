import { NextResponse } from "next/server";
import { chat } from "@/lib/ai";
import { sendText } from "@/lib/conextbot";
import { getConfig } from "@/lib/config";

// Webhook de mensagens recebidas via ConextBot.
// Aceita o formato padrão da Cloud API (entry[].changes[].value.messages[]) e um formato simples
// { from, text }. Configure no ConextBot a URL: {APP_URL}/api/webhooks/whatsapp
// com o header x-webhook-secret = CONEXTBOT_WEBHOOK_SECRET.

function extract(body: any): { from: string; text: string }[] {
  const out: { from: string; text: string }[] = [];
  for (const e of body?.entry ?? [])
    for (const c of e?.changes ?? [])
      for (const m of c?.value?.messages ?? [])
        if (m?.type === "text" && m.text?.body) out.push({ from: String(m.from), text: String(m.text.body) });
  if (!out.length && body?.from && (body?.text?.body || typeof body?.text === "string"))
    out.push({ from: String(body.from), text: String(body.text?.body ?? body.text) });
  return out;
}

export async function POST(req: Request) {
  const secret = await getConfig("CONEXTBOT_WEBHOOK_SECRET");
  if (secret && req.headers.get("x-webhook-secret") !== secret)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  for (const m of extract(body)) {
    const phone = m.from.replace(/\D/g, "");
    try {
      const { reply } = await chat({ channel: "WHATSAPP", externalId: phone, message: m.text, phone });
      if (reply) await sendText(phone, reply);
    } catch (err) {
      console.error("[whatsapp webhook]", err);
    }
  }
  return NextResponse.json({ ok: true });
}
