import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { verifyFirebaseToken } from "@/lib/firebase-server";

// Exchanges a Firebase ID token (from phone or Google sign-in) for an app session.
export async function POST(req: Request) {
  const { idToken } = await req.json().catch(() => ({}));
  const identity = typeof idToken === "string" ? await verifyFirebaseToken(idToken) : null;
  if (!identity) return NextResponse.json({ error: "Login failed. Please try again." }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(identity), SESSION_COOKIE_OPTIONS);
  return res;
}
