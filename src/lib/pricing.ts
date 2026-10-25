export const FREE_DELIVERY_ABOVE = 19900;
export const DELIVERY_FEE = 2500;
export const MAX_QTY_PER_ITEM = 10;

export function deliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
}

export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export type CouponRule = { kind: "percent" | "flat"; value: number; min_subtotal: number; max_discount: number | null };

// Discount in paise, or 0 when the cart is below the coupon's minimum.
export function discountFor(rule: CouponRule, subtotal: number): number {
  if (subtotal < rule.min_subtotal) return 0;
  let d = rule.kind === "percent" ? Math.floor((subtotal * rule.value) / 100) : rule.value;
  if (rule.max_discount != null) d = Math.min(d, rule.max_discount);
  return Math.min(d, subtotal);
}
