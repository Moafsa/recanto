import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function PATCH(req: Request) {
  if (!(await requireUser(["ADMIN", "STAFF"]))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = z.object({ id: z.string(), status: z.enum(["NEW", "CONTACTED", "NEGOTIATING", "WON", "LOST"]).optional(), notes: z.string().optional() }).safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await db.lead.update({ where: { id: b.data.id }, data: { status: b.data.status, notes: b.data.notes } });
  return NextResponse.json({ ok: true });
}
