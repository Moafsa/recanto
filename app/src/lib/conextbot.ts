// Cliente da API do ConextBot (WhatsApp Cloud API oficial da Meta).
// Endpoint: POST {BASE}/messages  |  Authorization: Bearer cxk_...
import { getConfig } from "./config";

export async function conextbotConfigured() {
  return !!(await getConfig("CONEXTBOT_API_KEY"));
}

async function post(body: unknown) {
  const key = await getConfig("CONEXTBOT_API_KEY");
  if (!key) throw new Error("API Key do ConextBot não configurada (Admin → Integrações)");
  const res = await fetch(`${await getConfig("CONEXTBOT_BASE_URL")}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ConextBot ${res.status}: ${await res.text()}`);
  return res.json().catch(() => ({}));
}

export function sendText(to: string, text: string) {
  return post({ to, type: "text", text: { body: text } });
}

/** Template de autenticação (botão "copiar código"), formato padrão da Cloud API. */
export async function sendOtp(to: string, code: string) {
  const name = await getConfig("CONEXTBOT_OTP_TEMPLATE");
  if (!name) return sendText(to, `Seu código de acesso ao Recanto da Lagoa: ${code}\nVálido por 10 minutos. Não compartilhe.`);
  return post({
    to,
    type: "template",
    template: {
      name,
      language: { code: await getConfig("CONEXTBOT_OTP_TEMPLATE_LANG") },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
      ],
    },
  });
}
