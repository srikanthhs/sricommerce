import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getDb } from "./db";
import type { User } from "./types";

export const SESSION_COOKIE = "qc_session";

export function adminPhones(): string[] {
  return (process.env.ADMIN_PHONES ?? "9999999999").split(",").map((p) => p.trim());
}

export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function createOtp(phone: string): string {
  // TODO: send via an SMS provider (MSG91, Twilio). Until then the code is logged and,
  // outside production, returned to the client so the flow can be tested.
  const code = String(crypto.randomInt(100000, 1000000));
  getDb()
    .prepare("INSERT OR REPLACE INTO otps (phone, code, expires_at) VALUES (?, ?, ?)")
    .run(phone, code, Date.now() + 5 * 60_000);
  console.log(`[otp] ${phone}: ${code}`);
  return code;
}

export function verifyOtp(phone: string, code: string): string | null {
  const db = getDb();
  const row = db.prepare("SELECT code, expires_at FROM otps WHERE phone = ?").get(phone) as
    | { code: string; expires_at: number }
    | undefined;
  if (!row || row.expires_at < Date.now() || row.code !== code) return null;
  db.prepare("DELETE FROM otps WHERE phone = ?").run(phone);
  db.prepare("INSERT OR IGNORE INTO users (phone) VALUES (?)").run(phone);
  const { id } = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone) as { id: number };
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, id);
  return token;
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = getDb()
    .prepare("SELECT u.id, u.phone, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?")
    .get(token) as User | undefined;
  return user ?? null;
}

export function isAdmin(user: User | null): boolean {
  return !!user && adminPhones().includes(user.phone);
}
