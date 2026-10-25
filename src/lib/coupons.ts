import { all, type Queryable } from "./db";
import { discountFor, rupees } from "./pricing";
import type { Coupon } from "./types";

export class CouponError extends Error {}

export function normalizeCode(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
}

// Returns the discount in paise for `code` on a cart worth `subtotal`, or throws CouponError
// with a message the shopper can read. Pass `q` to run inside an order transaction.
export async function couponDiscount(
  code: string,
  subtotal: number,
  userId: number | null,
  q?: Queryable,
): Promise<{ coupon: Coupon; discount: number }> {
  const run = <T,>(sql: string, params: (string | number)[]) =>
    q ? q.query<T>(sql, params).then((r) => r.rows) : all<T>(sql, params);
  const [coupon] = await run<Coupon>("SELECT * FROM coupons WHERE code = $1 AND active = 1", [code]);
  if (!coupon) throw new CouponError("This coupon code isn't valid.");
  if (subtotal < coupon.min_subtotal) {
    throw new CouponError(`Add ${rupees(coupon.min_subtotal - subtotal)} more to use ${coupon.code}.`);
  }
  if (coupon.first_order_only && userId) {
    const [{ n }] = await run<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM orders WHERE user_id = $1 AND status <> 'cancelled'",
      [userId],
    );
    if (n > 0) throw new CouponError(`${coupon.code} is only for your first order.`);
  }
  return { coupon, discount: discountFor(coupon, subtotal) };
}

export function listCoupons(): Promise<Coupon[]> {
  return all<Coupon>("SELECT * FROM coupons ORDER BY created_at DESC");
}
