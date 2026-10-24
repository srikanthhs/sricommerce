import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { verifyFirebasePhone } from "@/lib/firebase-server";

// Exchanges a Firebase ID token (from phone sign-in) for an app session.
export async function POST(req: Request) {
  const { idToken } = await req.json().catch(() => ({}));
  const phone = typeof idToken === "string" ? await verifyFirebasePhone(idToken) : null;
  if (!phone) return NextResponse.json({ error: "Login failed. Please try again." }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(phone), SESSION_COOKIE_OPTIONS);
  return res;
}
