import { NextResponse } from "next/server";
import { promoSlots } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await promoSlots());
}
