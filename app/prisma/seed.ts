import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  await db.setting.upsert({ where: { key: "promoLimit" }, update: {}, create: { key: "promoLimit", value: "200" } });
  console.log("Seed ok. Admins são definidos por ADMIN_EMAILS / ADMIN_PHONES no .env (viram ADMIN no 1º login).");
}
main().finally(() => db.$disconnect());
