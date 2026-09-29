import nodemailer from "nodemailer";
import { getConfig } from "./config";
import { PARK } from "./park";

export async function smtpConfigured() {
  return !!(await getConfig("SMTP_HOST")) && !!(await getConfig("SMTP_FROM"));
}

async function transport() {
  const port = Number(await getConfig("SMTP_PORT")) || 587;
  const user = await getConfig("SMTP_USER");
  return nodemailer.createTransport({
    host: await getConfig("SMTP_HOST"), port, secure: port === 465,
    auth: user ? { user, pass: await getConfig("SMTP_PASS") } : undefined,
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  if (!(await smtpConfigured())) throw new Error("SMTP não configurado (Admin → Integrações)");
  return (await transport()).sendMail({ from: await getConfig("SMTP_FROM"), to, subject, html });
}

export async function verifySmtp() {
  await (await transport()).verify();
}

const wrap = (title: string, body: string) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;border-radius:16px;background:#062b36;color:#fff7e8">
<h2 style="margin:0 0 12px;color:#8ff5e6">${title}</h2>${body}
<p style="margin-top:28px;font-size:12px;color:#9bb">${PARK.name} · ${PARK.address}</p></div>`;

/** Boas-vindas quando o título é ativado (best effort: nunca quebra o fluxo). */
export async function sendTitleActivated(to: string, name: string, number: number) {
  try {
    if (!(await smtpConfigured())) return;
    await sendMail(to, `Título nº ${String(number).padStart(3, "0")} ativado · ${PARK.name}`,
      wrap("Bem-vindo(a) ao Recanto da Lagoa!", `<p>Olá, ${name}! Sua entrada foi confirmada e o título nº <b>${String(number).padStart(3, "0")}</b> está <b>ativo</b>.</p><p>Reabertura oficial: ${PARK.openingLabel}. Acompanhe cobranças e dependentes na Área do sócio.</p>`));
  } catch (e) { console.error("[mail]", e); }
}
