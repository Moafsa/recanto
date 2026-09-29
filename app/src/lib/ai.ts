// Pérola: assistente única para site, painel do sócio e WhatsApp.
import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "./config";
import { db, promoSlots } from "./db";
import { depState } from "./rules";
import { PARK, TITLE_PLAN, DAILY, HOURS, brl } from "./park";


export type Channel = "SITE" | "PAINEL" | "WHATSAPP";

function knowledge(slotsLeft: number) {
  const opts = TITLE_PLAN.options.map((o) => `${o.installments}x de ${brl(o.valueCents)}`).join(" | ");
  return `Você é a Pérola, assistente virtual oficial do Parque ${PARK.name}. Atenda com tom amigável, acolhedor e familiar.
Meta atual: vender títulos de novos sócios (pré-temporada). O parque reabre oficialmente em ${PARK.openingLabel}.

REGRAS
- Seja objetiva, cordial e persuasiva ao oferecer o título de sócio, destacando economia e exclusividade.
- Vagas restantes do lote promocional: ${slotsLeft} de ${TITLE_PLAN.promoLimit}. Só mencione escassez com este número real.
- Responda SOMENTE com base na base de conhecimento abaixo. Nunca invente preços, datas ou regras.
- Mensagens curtas (estilo WhatsApp), no máximo 1–2 emojis, uma pergunta por vez.
- Se for a primeira mensagem, diga que é a assistente virtual do parque.
- Orçamento de locação (salão de festas, camping para grupos) ou qualquer dúvida/negociação fora da base: use a ferramenta escalar_para_leo e informe o contato do ${PARK.leo.name}: ${PARK.leo.display} (WhatsApp).
- Quando o cliente demonstrar interesse real ou passar nome/telefone, use registrar_lead.
- Regras de conduta, se o assunto surgir: educada, mas firme (só cite a GCM se perguntarem).

BASE DE CONHECIMENTO
1. Localização: ${PARK.address}.
2. Título familiar (pré-temporada): ${brl(TITLE_PLAN.promoCents)} para as ${TITLE_PLAN.promoLimit} primeiras famílias. Valor normal depois: ${brl(TITLE_PLAN.normalCents)}.
   Incluídos: titular, cônjuge, filhos (até 21 anos), pai, mãe e sogros.
   Pagamento: entrada de ${brl(TITLE_PLAN.entryCents)} + saldo negociável em: ${opts}.
3. Diárias (não sócios): adulto ${brl(DAILY.adultPix * 100)} no PIX ou ${brl(DAILY.adultCash * 100)} em dinheiro; criança ${brl(DAILY.childPix * 100)} no PIX ou ${brl(DAILY.childCash * 100)} em dinheiro. Taxa de rolha ${brl(DAILY.corkage * 100)} (só se levar as próprias bebidas).
4. Funcionamento (a partir de ${PARK.openingLabel}): ${HOURS.days}. Acesso ${HOURS.access}. Piscinas ${HOURS.pools}.
5. Estrutura: quiosques para churrasco (locação R$ 50 a R$ 100); pedalinhos R$ 20 por 20 min (máx. 2 adultos e 1 criança); salão de festas até 120 pessoas sentadas (churrasqueira, fogão, geladeira e pia) — valores sob orçamento com o ${PARK.leo.name}.
   Camping: uso regular exclusivo para sócios, R$ 20 por pessoa/dia. Para grupos (empresas, associações, igrejas, escoteiros): R$ 20 por pessoa/dia, exige lista prévia de identificação — alinhar com o ${PARK.leo.name}.
6. Conduta: ambiente estritamente familiar. Falta de postura: uma advertência; na segunda ocorrência a administração aciona a Guarda Civil Municipal para retirada imediata.`;
}

type ToolDef = { name: string; description: string; schema: Record<string, unknown> };
const toolDefs: ToolDef[] = [
  {
    name: "registrar_lead",
    description: "Registra um interessado (lead) no sistema quando ele informar nome/telefone ou demonstrar interesse real.",
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string", description: "Telefone com DDD" },
        interest: { type: "string", enum: ["TITULO", "DIARIA", "FESTA", "CAMPING", "OUTRO"] },
        notes: { type: "string" },
      },
      required: ["interest"],
    },
  },
  {
    name: "escalar_para_leo",
    description: "Sinaliza que o atendimento precisa de um humano (orçamentos, negociação, dúvidas fora da base).",
    schema: { type: "object", properties: { motivo: { type: "string" } }, required: ["motivo"] },
  },
];

async function memberContext(userId: string) {
  const titles = await db.title.findMany({
    where: { holderId: userId },
    include: { payments: { orderBy: { dueDate: "asc" } }, dependents: true },
  });
  if (!titles.length) return "\n\nCONTEXTO: usuário logado, ainda sem título.";
  const lines = titles.map((t) => {
    const next = t.payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
    return `Título nº ${t.number} (${t.status}); ${t.dependents.length} dependentes (${t.dependents.map((d) => { const st = depState(d); return `${d.name}${st.blocked ? " – BLOQUEADO(A) por ter mais de 21 anos" : ""}`; }).join(", ") || "nenhum"}); próxima cobrança: ${next ? `${brl(next.valueCents)} em ${next.dueDate.toLocaleDateString("pt-BR")} (${next.status})` : "nenhuma"}.`;
  });
  return `\n\nCONTEXTO DO SÓCIO LOGADO (pode responder sobre estes dados):\n${lines.join("\n")}`;
}

type Turn = { role: "user" | "assistant"; content: string };
type ToolCall = { id: string; name: string; input: Record<string, string> };
type LlmResult = { text: string; calls: ToolCall[] };

async function runTool(call: ToolCall, ctx: { sessionId: string; channel: Channel; phone?: string | null; leadId: string | null }) {
  const input = call.input;
  if (call.name === "registrar_lead") {
    const phone = input.phone?.replace(/\D/g, "") || ctx.phone || null;
    const lead = ctx.leadId
      ? await db.lead.update({ where: { id: ctx.leadId }, data: { name: input.name || undefined, phone: phone || undefined, interest: input.interest, notes: input.notes || undefined } })
      : await db.lead.create({ data: { name: input.name, phone, interest: input.interest, notes: input.notes, source: ctx.channel === "WHATSAPP" ? "WHATSAPP" : "CHAT" } });
    ctx.leadId = lead.id;
    await db.chatSession.update({ where: { id: ctx.sessionId }, data: { leadId: lead.id } });
    return "ok";
  }
  if (call.name === "escalar_para_leo") {
    if (ctx.leadId) await db.lead.update({ where: { id: ctx.leadId }, data: { status: "NEGOTIATING", notes: `Escalado: ${input.motivo}` } });
    return `Encaminhado. Informe ao cliente o contato do ${PARK.leo.name}: ${PARK.leo.display}.`;
  }
  return "ferramenta desconhecida";
}

/** Uma rodada no Claude. `msgs` é mutável para acumular tool_use/tool_result. */
async function callAnthropic(system: string, msgs: Anthropic.MessageParam[], apiKey: string, model: string): Promise<{ result: LlmResult; raw: Anthropic.ContentBlock[]; stop: string | null }> {
  const res = await new Anthropic({ apiKey }).messages.create({
    model, max_tokens: 700, system, messages: msgs,
    tools: toolDefs.map((t) => ({ name: t.name, description: t.description, input_schema: t.schema as Anthropic.Tool.InputSchema })),
  });
  return {
    raw: res.content, stop: res.stop_reason,
    result: {
      text: res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n").trim(),
      calls: res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use").map((b) => ({ id: b.id, name: b.name, input: b.input as Record<string, string> })),
    },
  };
}

async function callOpenAI(messages: any[], apiKey: string, model: string): Promise<{ result: LlmResult; message: any }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, messages, temperature: 0.4, max_tokens: 700,
      tools: toolDefs.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.schema } })),
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const message = (await res.json()).choices?.[0]?.message ?? {};
  return {
    message,
    result: {
      text: String(message.content ?? "").trim(),
      calls: (message.tool_calls ?? []).map((c: any) => ({ id: c.id, name: c.function?.name, input: safeJson(c.function?.arguments) })),
    },
  };
}
const safeJson = (s: string) => { try { return JSON.parse(s || "{}"); } catch { return {}; } };

export async function replyTo(opts: {
  sessionId: string;
  channel: Channel;
  userId?: string | null;
  phone?: string | null;
  leadId?: string | null;
}): Promise<string> {
  const fallback = `Oi! Sou a Pérola 💧 No momento estou em manutenção. Fale com o ${PARK.leo.name}: ${PARK.leo.display}.`;
  const provider = (await getConfig("AI_PROVIDER")) === "anthropic" ? "anthropic" : "openai";
  const apiKey = await getConfig(provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY");
  if (!apiKey) return fallback;

  const history = await db.chatMessage.findMany({ where: { sessionId: opts.sessionId }, orderBy: { createdAt: "desc" }, take: 20 });
  const turns: Turn[] = history.reverse().map((m) => ({ role: m.role as Turn["role"], content: m.content }));
  const { left } = await promoSlots();
  const system = knowledge(left) + (opts.userId ? await memberContext(opts.userId) : "");
  const ctx = { sessionId: opts.sessionId, channel: opts.channel, phone: opts.phone, leadId: opts.leadId ?? null };
  let text = "";

  try {
    if (provider === "anthropic") {
      const model = await getConfig("AI_MODEL");
      const msgs: Anthropic.MessageParam[] = turns.map((t) => ({ role: t.role, content: t.content }));
      for (let i = 0; i < 4; i++) {
        const r = await callAnthropic(system, msgs, apiKey, model);
        text = r.result.text;
        if (r.stop !== "tool_use") break;
        msgs.push({ role: "assistant", content: r.raw });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const c of r.result.calls) results.push({ type: "tool_result", tool_use_id: c.id, content: await runTool(c, ctx) });
        msgs.push({ role: "user", content: results });
      }
    } else {
      const model = await getConfig("OPENAI_MODEL");
      const msgs: any[] = [{ role: "system", content: system }, ...turns];
      for (let i = 0; i < 4; i++) {
        const r = await callOpenAI(msgs, apiKey, model);
        text = r.result.text;
        if (!r.result.calls.length) break;
        msgs.push(r.message);
        for (const c of r.result.calls) msgs.push({ role: "tool", tool_call_id: c.id, content: await runTool(c, ctx) });
      }
    }
  } catch (e) {
    console.error("[ai]", e);
    return fallback;
  }
  return text || `Vou pedir para o ${PARK.leo.name} te ajudar: ${PARK.leo.display}.`;
}

/** Fluxo completo: grava msg do usuário, gera resposta, grava resposta. */
export async function chat(opts: {
  channel: Channel;
  externalId: string;
  message: string;
  userId?: string | null;
  phone?: string | null;
}) {
  let session = await db.chatSession.findFirst({
    where: { channel: opts.channel, externalId: opts.externalId },
    orderBy: { createdAt: "desc" },
  });
  if (!session) {
    let leadId: string | null = null;
    if (opts.phone) {
      const lead = await db.lead.findFirst({ where: { phone: opts.phone } });
      leadId = lead?.id ?? (await db.lead.create({ data: { phone: opts.phone, source: "WHATSAPP" } })).id;
    }
    session = await db.chatSession.create({
      data: { channel: opts.channel, externalId: opts.externalId, userId: opts.userId ?? null, leadId },
    });
  }
  await db.chatMessage.create({ data: { sessionId: session.id, role: "user", content: opts.message } });
  if (session.humanTakeover) return { reply: null, sessionId: session.id };

  const reply = await replyTo({ sessionId: session.id, channel: opts.channel, userId: opts.userId ?? session.userId, phone: opts.phone, leadId: session.leadId });
  await db.chatMessage.create({ data: { sessionId: session.id, role: "assistant", content: reply } });
  return { reply, sessionId: session.id };
}
