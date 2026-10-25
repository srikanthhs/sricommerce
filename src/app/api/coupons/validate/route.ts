import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { CouponError, couponDiscount, normalizeCode } from "@/lib/coupons";

// Preview a coupon in the cart. The order API re-checks it against the real prices.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = normalizeCode(body.code);
  const subtotal = Number(body.subtotal);
  if (!code || !Number.isInteger(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });
  }
  const user = await currentUser();
  try {
    const { coupon, discount } = await couponDiscount(code, subtotal, user?.id ?? null);
    const { code: c, description, kind, value, min_subtotal, max_discount } = coupon;
    return NextResponse.json({ discount, coupon: { code: c, description, kind, value, min_subtotal, max_discount } });
  } catch (err) {
    if (err instanceof CouponError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
