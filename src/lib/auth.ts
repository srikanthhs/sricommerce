import { cookies } from "next/headers";
import crypto from "node:crypto";
import { all, one, run } from "./db";
import type { User } from "./types";

export const SESSION_COOKIE = "qc_session";

export function adminPhones(): string[] {
  // The 9999999999 fallback is for local development only; production must set ADMIN_PHONES.
  const fallback = process.env.NODE_ENV === "production" ? "" : "9999999999";
  return (process.env.ADMIN_PHONES ?? fallback).split(",").map((p) => p.trim()).filter(Boolean);
}

// Until an SMS provider is connected, the OTP can be shown on screen so people can try the app.
// Admin numbers never get an on-screen code: read it from the server logs instead.
export function showOtpOnScreen(phone: string): boolean {
  const demo = process.env.NODE_ENV !== "production" || process.env.SHOW_OTP_ON_SCREEN === "true";
  return demo && !(process.env.NODE_ENV === "production" && adminPhones().includes(phone));
}

export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export async function createOtp(phone: string): Promise<string> {
  // TODO: send via an SMS provider (MSG91, Twilio). Until then the code is logged and,
  // outside production, returned to the client so the flow can be tested.
  const code = String(crypto.randomInt(100000, 1000000));
  await run(
    "INSERT INTO otps (phone, code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (phone) DO UPDATE SET code = $2, expires_at = $3",
    [phone, code, Date.now() + 5 * 60_000],
  );
  console.log(`[otp] ${phone}: ${code}`);
  return code;
}

export async function verifyOtp(phone: string, code: string): Promise<string | null> {
  const row = await one<{ code: string; expires_at: string }>("SELECT code, expires_at FROM otps WHERE phone = $1", [phone]);
  if (!row || Number(row.expires_at) < Date.now() || row.code !== code) return null;
  await run("DELETE FROM otps WHERE phone = $1", [phone]);
  await run("INSERT INTO users (phone) VALUES ($1) ON CONFLICT (phone) DO NOTHING", [phone]);
  const [{ id }] = await all<{ id: number }>("SELECT id FROM users WHERE phone = $1", [phone]);
  const token = crypto.randomBytes(32).toString("hex");
  await run("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [token, id]);
  return token;
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await one<User>(
    "SELECT u.id, u.phone, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = $1",
    [token],
  );
  return user ?? null;
}

export function isAdmin(user: User | null): boolean {
  return !!user && adminPhones().includes(user.phone);
}
