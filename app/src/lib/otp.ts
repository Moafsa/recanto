import { createHash, randomInt } from "crypto";
import { db } from "./db";
import { sendOtp, conextbotConfigured } from "./conextbot";

const hash = (phone: string, code: string) =>
  createHash("sha256").update(`${phone}:${code}:${process.env.SESSION_SECRET ?? ""}`).digest("hex");

export async function requestOtp(phone: string) {
  const recent = await db.otpCode.count({
    where: { phone, createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } },
  });
  if (recent >= 4) throw new Error("Muitas tentativas. Aguarde alguns minutos.");

  const code = String(randomInt(100000, 1000000));
  await db.otpCode.create({
    data: { phone, codeHash: hash(phone, code), expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });
  if (process.env.NODE_ENV !== "production" && !(await conextbotConfigured())) {
    console.log(`[DEV] OTP para ${phone}: ${code}`);
    return;
  }
  await sendOtp(phone, code);
}

export async function verifyOtp(phone: string, code: string) {
  const otp = await db.otpCode.findFirst({
    where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= 5) return false;
  if (otp.codeHash !== hash(phone, code)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await db.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  return true;
}
