import { NextResponse } from "next/server";
import { normalizePhone, SESSION_COOKIE, SESSION_COOKIE_OPTIONS, verifyOtp } from "@/lib/auth";
import { firebaseEnabled } from "@/lib/firebase";

export async function POST(req: Request) {
  if (firebaseEnabled()) return NextResponse.json({ error: "Use Firebase login." }, { status: 404 });
  const { phone: raw, code } = await req.json().catch(() => ({}));
  const phone = normalizePhone(raw);
  const token = phone && typeof code === "string" ? await verifyOtp(phone, code.trim()) : null;
  if (!token) return NextResponse.json({ error: "Incorrect or expired OTP." }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
