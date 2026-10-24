export const FREE_DELIVERY_ABOVE = 19900;
export const DELIVERY_FEE = 2500;
export const MAX_QTY_PER_ITEM = 10;

export function deliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
}

export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
