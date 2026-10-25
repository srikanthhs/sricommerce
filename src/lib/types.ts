export type Category = { id: number; slug: string; name: string; emoji: string };
export type Product = {
  id: number; category_id: number; name: string; unit: string;
  price: number; mrp: number; stock: number; emoji: string; active: number;
};
export type User = { id: number; phone: string | null; email: string | null; name: string | null };
export type OrderStatus = "placed" | "packed" | "out_for_delivery" | "delivered" | "cancelled";
export type Order = {
  id: number; user_id: number; status: OrderStatus; address: string; pincode: string;
  subtotal: number; delivery_fee: number; total: number; payment_method: string;
  eta_minutes: number; created_at: Date | string; updated_at: Date | string;
  discount: number; coupon_code: string | null;
};
export type Coupon = {
  code: string; description: string; kind: "percent" | "flat"; value: number;
  min_subtotal: number; max_discount: number | null; first_order_only: number; active: number;
};
export type OrderItem = { order_id: number; product_id: number; name: string; price: number; qty: number };

export const ORDER_FLOW: OrderStatus[] = ["placed", "packed", "out_for_delivery", "delivered"];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Order placed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
