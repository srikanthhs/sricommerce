import { getDb, tx } from "./db";
import { findZone } from "./catalog";
import { deliveryFee, MAX_QTY_PER_ITEM } from "./pricing";
import { ORDER_FLOW, type Order, type OrderItem, type OrderStatus, type Product } from "./types";

export class OrderError extends Error {}

export type CartLine = { productId: number; qty: number };

export function placeOrder(userId: number, lines: CartLine[], address: string, pincode: string): Order {
  if (!lines.length) throw new OrderError("Your cart is empty.");
  if (address.trim().length < 10) throw new OrderError("Please enter a complete delivery address.");
  const zone = findZone(pincode);
  if (!zone) throw new OrderError("Sorry, we don't deliver to this pincode yet.");

  return tx((db) => {
    let subtotal = 0;
    const items: { p: Product; qty: number }[] = [];
    for (const line of lines) {
      const qty = Math.floor(line.qty);
      if (!(qty >= 1 && qty <= MAX_QTY_PER_ITEM)) throw new OrderError("Invalid quantity in cart.");
      const p = db.prepare("SELECT * FROM products WHERE id = ? AND active = 1").get(line.productId) as Product | undefined;
      if (!p) throw new OrderError("An item in your cart is no longer available.");
      if (p.stock < qty) throw new OrderError(`Only ${p.stock} left of ${p.name}.`);
      subtotal += p.price * qty;
      items.push({ p, qty });
    }
    const fee = deliveryFee(subtotal);
    const { lastInsertRowid } = db
      .prepare(
        "INSERT INTO orders (user_id, address, pincode, subtotal, delivery_fee, total, eta_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(userId, address.trim(), pincode, subtotal, fee, subtotal + fee, zone.eta_minutes);
    const orderId = Number(lastInsertRowid);
    const addItem = db.prepare("INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)");
    const takeStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    for (const { p, qty } of items) {
      addItem.run(orderId, p.id, p.name, p.price, qty);
      takeStock.run(qty, p.id);
    }
    return db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Order;
  });
}

export function getOrder(id: number) {
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Order | undefined;
  if (!order) return undefined;
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as OrderItem[];
  return { order, items };
}

export function listOrders(userId?: number): Order[] {
  const db = getDb();
  return (
    userId
      ? db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC").all(userId)
      : db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 200").all()
  ) as Order[];
}

export function setOrderStatus(id: number, status: OrderStatus): Order {
  return tx((db) => {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Order | undefined;
    if (!order) throw new OrderError("Order not found.");
    if (order.status === "delivered" || order.status === "cancelled") throw new OrderError("Order is already closed.");
    if (status !== "cancelled" && ORDER_FLOW.indexOf(status) <= ORDER_FLOW.indexOf(order.status)) {
      throw new OrderError("Status can only move forward.");
    }
    if (status === "cancelled") {
      // Return the items to stock.
      const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(id) as OrderItem[];
      const restock = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
      for (const it of items) restock.run(it.qty, it.product_id);
    }
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    return db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Order;
  });
}
