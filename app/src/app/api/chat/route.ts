import { NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/lib/ai";
import { getSessionUser } from "@/lib/session";

// Chat do site (visitante anônimo) e do painel (sócio logado).
export async function POST(req: Request) {
  const body = z
    .object({ message: z.string().min(1).max(1000), visitorId: z.string().min(8).max(64) })
    .safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });

  const user = await getSessionUser();
  const out = await chat({
    channel: user ? "PAINEL" : "SITE",
    externalId: user ? user.id : body.data.visitorId,
    message: body.data.message,
    userId: user?.id,
    phone: user?.phone,
  });
  return NextResponse.json({ reply: out.reply ?? "Um atendente humano vai continuar por aqui." });
}
