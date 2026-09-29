import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { CFG, listConfig, setConfig } from "@/lib/config";

// Só ADMIN. Nunca devolve segredos: apenas máscara (••••1234) e origem (painel/.env/padrão).
export async function GET() {
  if (!(await requireUser(["ADMIN"]))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ items: await listConfig() });
}

// values: { CHAVE: "novo valor" }. Para segredos, campo vazio = manter. clear: ["CHAVE"] apaga o valor do painel.
export async function POST(req: Request) {
  if (!(await requireUser(["ADMIN"]))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = z.object({ values: z.record(z.string(), z.string()).default({}), clear: z.array(z.string()).default([]) }).safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const known = new Set(CFG.map((c) => c.key));
  for (const [k, v] of Object.entries(b.data.values)) {
    if (!known.has(k)) continue;
    const def = CFG.find((c) => c.key === k)!;
    if (def.secret && v.trim() === "") continue; // manter
    await setConfig(k, v);
  }
  for (const k of b.data.clear) if (known.has(k)) await setConfig(k, "");
  return NextResponse.json({ ok: true, items: await listConfig() });
}
