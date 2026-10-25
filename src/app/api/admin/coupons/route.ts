import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth";
import { normalizeCode } from "@/lib/coupons";
import { one } from "@/lib/db";

export async function POST(req: Request) {
  if (!isAdmin(await currentUser())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const code = normalizeCode(b.code);
  const value = Number(b.value);
  const minSubtotal = Number(b.minSubtotal ?? 0);
  const maxDiscount = b.maxDiscount == null || b.maxDiscount === "" ? null : Number(b.maxDiscount);
  if (!/^[A-Z0-9]{3,20}$/.test(code)) return NextResponse.json({ error: "Code must be 3–20 letters or numbers." }, { status: 400 });
  if (b.kind !== "percent" && b.kind !== "flat") return NextResponse.json({ error: "Choose percent or flat." }, { status: 400 });
  if (!Number.isInteger(value) || value <= 0 || (b.kind === "percent" && value > 100)) {
    return NextResponse.json({ error: "Enter a valid discount." }, { status: 400 });
  }
  if (!Number.isInteger(minSubtotal) || minSubtotal < 0 || (maxDiscount !== null && (!Number.isInteger(maxDiscount) || maxDiscount <= 0))) {
    return NextResponse.json({ error: "Enter valid amounts." }, { status: 400 });
  }
  const description = typeof b.description === "string" && b.description.trim() ? b.description.trim() : code;
  const coupon = await one(
    "INSERT INTO coupons (code, description, kind, value, min_subtotal, max_discount, first_order_only) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (code) DO NOTHING RETURNING *",
    [code, description, b.kind, value, minSubtotal, maxDiscount, b.firstOrderOnly ? 1 : 0],
  );
  if (!coupon) return NextResponse.json({ error: `${code} already exists.` }, { status: 409 });
  return NextResponse.json({ coupon }, { status: 201 });
}
