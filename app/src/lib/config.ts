// Configurações/integrações editáveis no painel. Valores ficam no banco (segredos criptografados
// com AES-256-GCM, chave derivada de SESSION_SECRET); se não houver no banco, cai para o .env.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { db } from "./db";

export type CfgDef = {
  key: string; group: "geral" | "ia" | "whatsapp" | "asaas" | "google" | "smtp";
  label: string; help?: string; secret?: boolean; env?: string; default?: string;
  options?: { value: string; label: string }[];
};

export const CFG: CfgDef[] = [
  { key: "APP_URL", group: "geral", label: "Endereço do site (URL)", help: "Ex.: https://www.recantodalagoa.com.br — usado nos webhooks e no login Google.", env: "APP_URL", default: "http://localhost:3000" },

  { key: "AI_PROVIDER", group: "ia", label: "Provedor de IA", env: "AI_PROVIDER", default: "openai", options: [{ value: "openai", label: "OpenAI (ChatGPT)" }, { value: "anthropic", label: "Anthropic (Claude)" }] },
  { key: "OPENAI_API_KEY", group: "ia", label: "Chave da OpenAI", help: "Começa com sk-… (platform.openai.com/api-keys)", secret: true, env: "OPENAI_API_KEY" },
  { key: "OPENAI_MODEL", group: "ia", label: "Modelo OpenAI", env: "OPENAI_MODEL", default: "gpt-4.1-mini" },
  { key: "ANTHROPIC_API_KEY", group: "ia", label: "Chave da Anthropic", help: "Só se escolher Claude como provedor.", secret: true, env: "ANTHROPIC_API_KEY" },
  { key: "AI_MODEL", group: "ia", label: "Modelo Anthropic", env: "AI_MODEL", default: "claude-sonnet-5-5" },

  { key: "CONEXTBOT_BASE_URL", group: "whatsapp", label: "URL da API do ConextBot", env: "CONEXTBOT_BASE_URL", default: "https://app.conext.click/api/v1" },
  { key: "CONEXTBOT_API_KEY", group: "whatsapp", label: "API Key do ConextBot", help: "Portal Dev → Meu Número WhatsApp → API Keys (cxk_…).", secret: true, env: "CONEXTBOT_API_KEY" },
  { key: "CONEXTBOT_OTP_TEMPLATE", group: "whatsapp", label: "Template do código de login", help: "Nome do template de autenticação aprovado na Meta. Vazio = texto simples (só funciona na janela de 24h).", env: "CONEXTBOT_OTP_TEMPLATE" },
  { key: "CONEXTBOT_OTP_TEMPLATE_LANG", group: "whatsapp", label: "Idioma do template", env: "CONEXTBOT_OTP_TEMPLATE_LANG", default: "pt_BR" },
  { key: "CONEXTBOT_WEBHOOK_SECRET", group: "whatsapp", label: "Segredo do webhook", help: "Configure o mesmo valor no header x-webhook-secret do ConextBot.", secret: true, env: "CONEXTBOT_WEBHOOK_SECRET" },

  { key: "ASAAS_ENV", group: "asaas", label: "Ambiente", env: "ASAAS_ENV", default: "sandbox", options: [{ value: "sandbox", label: "Teste (sandbox)" }, { value: "production", label: "Produção" }] },
  { key: "ASAAS_API_KEY", group: "asaas", label: "Chave de API do Asaas", help: "Asaas → Integrações → Chave de API ($aact_…).", secret: true, env: "ASAAS_API_KEY" },
  { key: "ASAAS_WEBHOOK_TOKEN", group: "asaas", label: "Token do webhook", help: "Crie um token qualquer e informe o mesmo no webhook do Asaas.", secret: true, env: "ASAAS_WEBHOOK_TOKEN" },

  { key: "SMTP_HOST", group: "smtp", label: "Servidor SMTP", help: "Ex.: smtp.gmail.com, smtp.hostinger.com, smtp.sendgrid.net", env: "SMTP_HOST" },
  { key: "SMTP_PORT", group: "smtp", label: "Porta", help: "465 (SSL) ou 587 (STARTTLS)", env: "SMTP_PORT", default: "587" },
  { key: "SMTP_USER", group: "smtp", label: "Usuário", env: "SMTP_USER" },
  { key: "SMTP_PASS", group: "smtp", label: "Senha (ou senha de app)", secret: true, env: "SMTP_PASS" },
  { key: "SMTP_FROM", group: "smtp", label: "Remetente", help: 'Ex.: Recanto da Lagoa <contato@seudominio.com.br>', env: "SMTP_FROM" },

  { key: "GOOGLE_CLIENT_ID", group: "google", label: "Google Client ID", env: "GOOGLE_CLIENT_ID" },
  { key: "GOOGLE_CLIENT_SECRET", group: "google", label: "Google Client Secret", secret: true, env: "GOOGLE_CLIENT_SECRET" },
];

const aesKey = () => createHash("sha256").update(process.env.SESSION_SECRET || "dev-secret-change-me-dev-secret-change-me").digest();
const enc = (plain: string) => {
  const iv = randomBytes(12); const c = createCipheriv("aes-256-gcm", aesKey(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `enc:${Buffer.concat([iv, c.getAuthTag(), data]).toString("base64")}`;
};
const dec = (v: string) => {
  if (!v.startsWith("enc:")) return v;
  try {
    const b = Buffer.from(v.slice(4), "base64");
    const d = createDecipheriv("aes-256-gcm", aesKey(), b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch { return ""; }
};

const placeholder = (v?: string) => !v || v.endsWith("...") || v.startsWith("troque");

export async function getConfig(key: string): Promise<string> {
  const def = CFG.find((c) => c.key === key);
  try {
    const row = await db.setting.findUnique({ where: { key: `cfg:${key}` } });
    if (row?.value) return dec(row.value);
  } catch {}
  const fromEnv = def?.env ? process.env[def.env] : undefined;
  if (fromEnv && !placeholder(fromEnv)) return fromEnv;
  return def?.default ?? "";
}

export async function setConfig(key: string, value: string) {
  const def = CFG.find((c) => c.key === key);
  if (!def) throw new Error("Chave desconhecida");
  const k = `cfg:${key}`;
  if (value.trim() === "") { await db.setting.deleteMany({ where: { key: k } }); return; }
  const stored = def.secret ? enc(value.trim()) : value.trim();
  await db.setting.upsert({ where: { key: k }, update: { value: stored }, create: { key: k, value: stored } });
}

/** Para a tela: nunca devolve segredos, só máscara e origem. */
export async function listConfig() {
  const out: { key: string; group: string; label: string; help?: string; secret: boolean; options?: CfgDef["options"]; value: string; masked: string; source: "painel" | "env" | "padrão" | "vazio" }[] = [];
  for (const def of CFG) {
    const row = await db.setting.findUnique({ where: { key: `cfg:${def.key}` } }).catch(() => null);
    const envV = def.env ? process.env[def.env] : undefined;
    const source = row?.value ? "painel" : envV && !placeholder(envV) ? "env" : def.default ? "padrão" : "vazio";
    const real = await getConfig(def.key);
    out.push({
      key: def.key, group: def.group, label: def.label, help: def.help, secret: !!def.secret, options: def.options,
      value: def.secret ? "" : real,
      masked: def.secret && real ? `••••••••${real.slice(-4)}` : "",
      source,
    });
  }
  return out;
}

export async function asaasBase() {
  return (await getConfig("ASAAS_ENV")) === "production" ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";
}
