import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { sendText } from "@/lib/conextbot";

// Leo assume / devolve a conversa para a IA, ou responde manualmente pelo painel.
export async function POST(req: Request) {
  if (!(await requireUser(["ADMIN", "STAFF"]))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = z.object({ sessionId: z.string(), takeover: z.boolean().optional(), text: z.string().optional() }).safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const s = await db.chatSession.findUnique({ where: { id: b.data.sessionId } });
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (b.data.takeover !== undefined) await db.chatSession.update({ where: { id: s.id }, data: { humanTakeover: b.data.takeover } });
  if (b.data.text) {
    await db.chatMessage.create({ data: { sessionId: s.id, role: "assistant", content: b.data.text } });
    if (s.channel === "WHATSAPP" && s.externalId) await sendText(s.externalId, b.data.text);
  }
  return NextResponse.json({ ok: true });
}
