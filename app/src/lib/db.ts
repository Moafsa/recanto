import { PrismaClient } from "@prisma/client";
import { TITLE_PLAN } from "./park";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;

/** Vagas do lote promocional ainda disponíveis (títulos não cancelados no lote PROMO). */
export async function promoSlots() {
  const setting = await db.setting.findUnique({ where: { key: "promoLimit" } });
  const limit = setting ? Number(setting.value) : TITLE_PLAN.promoLimit;
  const used = await db.title.count({ where: { lot: "PROMO", status: { not: "CANCELLED" } } });
  return { limit, used, left: Math.max(0, limit - used) };
}
