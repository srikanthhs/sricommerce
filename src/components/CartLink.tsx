"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { rupees } from "@/lib/pricing";

export function CartLink() {
  const { items } = useCart();
  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);
  return (
    <Link href="/cart" className="flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white">
      🛒 {count ? `${count} item${count > 1 ? "s" : ""} · ${rupees(total)}` : "My Cart"}
    </Link>
  );
}
