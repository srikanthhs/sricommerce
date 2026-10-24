import { NextResponse } from "next/server";
import { normalizePhone, SESSION_COOKIE, verifyOtp } from "@/lib/auth";

export async function POST(req: Request) {
  const { phone: raw, code } = await req.json().catch(() => ({}));
  const phone = normalizePhone(raw);
  const token = phone && typeof code === "string" ? verifyOtp(phone, code.trim()) : null;
  if (!token) return NextResponse.json({ error: "Incorrect or expired OTP." }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
