"use client";

import { useCart } from "./CartProvider";
import type { Product } from "@/lib/types";

export function AddButton({ product }: { product: Product }) {
  const { qtyOf, add, remove } = useCart();
  const qty = qtyOf(product.id);
  const item = { productId: product.id, name: product.name, unit: product.unit, price: product.price, emoji: product.emoji };

  if (product.stock <= 0) {
    return <span className="text-xs font-medium text-gray-400">Out of stock</span>;
  }
  if (qty === 0) {
    return (
      <button
        onClick={() => add(item, product.stock)}
        className="rounded-lg border border-green-700 px-4 py-1 text-sm font-semibold text-green-700 hover:bg-green-50"
      >
        ADD
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-lg bg-green-700 px-2 py-1 text-sm font-semibold text-white">
      <button aria-label="Remove one" onClick={() => remove(product.id)} className="px-1">−</button>
      <span>{qty}</span>
      <button aria-label="Add one" onClick={() => add(item, product.stock)} className="px-1">+</button>
    </div>
  );
}
