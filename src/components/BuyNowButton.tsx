"use client";

import { useRouter } from "next/navigation";
import type { CartItem } from "./CartProvider";
import type { Product } from "@/lib/types";

export const BUY_NOW_KEY = "qc_buynow";
export type BuyNowItem = CartItem & { maxStock: number };

// Skips the cart: checkout opens with only this product, and the saved cart is left alone.
export function BuyNowButton({ product }: { product: Product }) {
  const router = useRouter();
  if (product.stock <= 0) return null;
  return (
    <button
      onClick={() => {
        const item: BuyNowItem = {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          price: product.price,
          emoji: product.emoji,
          qty: 1,
          maxStock: product.stock,
        };
        try {
          sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(item));
        } catch {}
        router.push("/cart?buynow=1");
      }}
      className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-500"
    >
      Buy now
    </button>
  );
}
