import { all, one, tx } from "./db";
import { findZone } from "./catalog";
import { deliveryFee, MAX_QTY_PER_ITEM } from "./pricing";
import { ORDER_FLOW, type Order, type OrderItem, type OrderStatus, type Product } from "./types";

export class OrderError extends Error {}

export type CartLine = { productId: number; qty: number };

export async function placeOrder(userId: number, lines: CartLine[], address: string, pincode: string): Promise<Order> {
  if (!lines.length) throw new OrderError("Your cart is empty.");
  if (address.trim().length < 10) throw new OrderError("Please enter a complete delivery address.");
  const zone = await findZone(pincode);
  if (!zone) throw new OrderError("Sorry, we don't deliver to this pincode yet.");

  return tx(async (q) => {
    let subtotal = 0;
    const items: { p: Product; qty: number }[] = [];
    for (const line of lines) {
      const qty = Math.floor(line.qty);
      if (!(qty >= 1 && qty <= MAX_QTY_PER_ITEM)) throw new OrderError("Invalid quantity in cart.");
      if (!Number.isInteger(line.productId)) throw new OrderError("An item in your cart is no longer available.");
      // Row lock so two orders can't oversell the same stock.
      const { rows } = await q.query<Product>("SELECT * FROM products WHERE id = $1 AND active = 1 FOR UPDATE", [line.productId]);
      const p = rows[0];
      if (!p) throw new OrderError("An item in your cart is no longer available.");
      if (p.stock < qty) throw new OrderError(`Only ${p.stock} left of ${p.name}.`);
      subtotal += p.price * qty;
      items.push({ p, qty });
    }
    const fee = deliveryFee(subtotal);
    const { rows } = await q.query<Order>(
      "INSERT INTO orders (user_id, address, pincode, subtotal, delivery_fee, total, eta_minutes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [userId, address.trim(), pincode, subtotal, fee, subtotal + fee, zone.eta_minutes],
    );
    const order = rows[0];
    for (const { p, qty } of items) {
      await q.query("INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES ($1, $2, $3, $4, $5)", [order.id, p.id, p.name, p.price, qty]);
      await q.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [qty, p.id]);
    }
    return order;
  });
}

export async function getOrder(id: number) {
  if (!Number.isInteger(id)) return undefined;
  const order = await one<Order>("SELECT * FROM orders WHERE id = $1", [id]);
  if (!order) return undefined;
  const items = await all<OrderItem>("SELECT * FROM order_items WHERE order_id = $1", [id]);
  return { order, items };
}

export function listOrders(userId?: number): Promise<Order[]> {
  return userId
    ? all<Order>("SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC", [userId])
    : all<Order>("SELECT * FROM orders ORDER BY id DESC LIMIT 200");
}

export function setOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  return tx(async (q) => {
    const order = (await q.query<Order>("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [id])).rows[0];
    if (!order) throw new OrderError("Order not found.");
    if (order.status === "delivered" || order.status === "cancelled") throw new OrderError("Order is already closed.");
    if (status !== "cancelled" && ORDER_FLOW.indexOf(status) <= ORDER_FLOW.indexOf(order.status)) {
      throw new OrderError("Status can only move forward.");
    }
    if (status === "cancelled") {
      // Return the items to stock.
      const items = (await q.query<OrderItem>("SELECT product_id, qty FROM order_items WHERE order_id = $1", [id])).rows;
      for (const it of items) await q.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [it.qty, it.product_id]);
    }
    const { rows } = await q.query<Order>("UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *", [status, id]);
    return rows[0];
  });
}
