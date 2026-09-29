import { NextResponse } from "next/server";
import { applyWebhook } from "@/lib/asaas";
import { getConfig } from "@/lib/config";

export async function POST(req: Request) {
  const token = await getConfig("ASAAS_WEBHOOK_TOKEN");
  if (token && req.headers.get("asaas-access-token") !== token)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.event && body?.payment?.id) await applyWebhook(body.event, body.payment);
  return NextResponse.json({ ok: true });
}
