"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MAX_QTY_PER_ITEM } from "@/lib/pricing";

export type CartItem = { productId: number; name: string; unit: string; price: number; emoji: string; qty: number };

type CartCtx = {
  items: CartItem[];
  qtyOf: (productId: number) => number;
  add: (item: Omit<CartItem, "qty">, maxStock: number) => void;
  addMany: (lines: { item: Omit<CartItem, "qty">; qty: number; maxStock: number }[]) => number;
  remove: (productId: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "qc_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // Hydrate from storage after mount so server and client markup match.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  function update(next: CartItem[]) {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }

  const value: CartCtx = {
    items,
    qtyOf: (id) => items.find((i) => i.productId === id)?.qty ?? 0,
    add: (item, maxStock) => {
      const existing = items.find((i) => i.productId === item.productId);
      const limit = Math.min(maxStock, MAX_QTY_PER_ITEM);
      if (existing) {
        if (existing.qty >= limit) return;
        update(items.map((i) => (i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i)));
      } else if (limit > 0) {
        update([...items, { ...item, qty: 1 }]);
      }
    },
    // Adds several lines at once (used by "Order again"); returns how many units were added.
    addMany: (lines) => {
      const next = [...items];
      let added = 0;
      for (const { item, qty, maxStock } of lines) {
        const limit = Math.min(maxStock, MAX_QTY_PER_ITEM);
        const i = next.findIndex((c) => c.productId === item.productId);
        const current = i >= 0 ? next[i].qty : 0;
        const want = Math.min(current + qty, limit);
        if (want <= current) continue;
        added += want - current;
        if (i >= 0) next[i] = { ...next[i], ...item, qty: want };
        else next.push({ ...item, qty: want });
      }
      update(next);
      return added;
    },
    remove: (id) =>
      update(items.flatMap((i) => (i.productId !== id ? [i] : i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []))),
    clear: () => update([]),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
