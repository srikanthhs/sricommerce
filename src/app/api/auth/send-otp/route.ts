import { NextResponse } from "next/server";
import { createOtp, normalizePhone } from "@/lib/auth";

export async function POST(req: Request) {
  const { phone: raw } = await req.json().catch(() => ({}));
  const phone = normalizePhone(raw);
  if (!phone) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  const code = createOtp(phone);
  return NextResponse.json({ ok: true, ...(process.env.NODE_ENV !== "production" && { devCode: code }) });
}
