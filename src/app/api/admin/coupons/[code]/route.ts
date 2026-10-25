import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth";
import { normalizeCode } from "@/lib/coupons";
import { one } from "@/lib/db";

// Turn a coupon on or off.
export async function PATCH(req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!isAdmin(await currentUser())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { active } = await req.json().catch(() => ({}));
  if (typeof active !== "boolean") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const code = normalizeCode(decodeURIComponent((await ctx.params).code));
  const coupon = await one("UPDATE coupons SET active = $1 WHERE code = $2 RETURNING *", [active ? 1 : 0, code]);
  if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
  return NextResponse.json({ coupon });
}
