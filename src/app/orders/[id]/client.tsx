"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import type { Product } from "@/lib/types";

// Poll for status changes until real-time updates (websockets / push) are added.
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}

export function CancelOrderButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-4">
      <button
        className="text-sm font-semibold text-red-600"
        onClick={async () => {
          if (!confirm("Cancel this order?")) return;
          const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
          if (!res.ok) setError((await res.json()).error);
          router.refresh();
        }}
      >
        Cancel order
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Puts this order's items back in the cart at today's prices, skipping anything out of stock.
export function OrderAgainButton({ lines }: { lines: { qty: number; product?: Product }[] }) {
  const router = useRouter();
  const { addMany } = useCart();
  const [note, setNote] = useState<string | null>(null);
  const available = lines.filter((l) => l.product && l.product.active && l.product.stock > 0);

  return (
    <div className="mt-4">
      <button
        disabled={!available.length}
        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        onClick={() => {
          addMany(
            available.map(({ qty, product: p }) => ({
              item: { productId: p!.id, name: p!.name, unit: p!.unit, price: p!.price, emoji: p!.emoji },
              qty,
              maxStock: p!.stock,
            })),
          );
          if (available.length < lines.length) {
            setNote("Some items are out of stock and weren't added.");
            setTimeout(() => router.push("/cart"), 1500);
          } else {
            router.push("/cart");
          }
        }}
      >
        Order again
      </button>
      {!available.length && <p className="mt-1 text-xs text-gray-500">These items are currently out of stock.</p>}
      {note && <p className="mt-1 text-xs text-amber-700">{note}</p>}
    </div>
  );
}
