"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { deliveryFee, FREE_DELIVERY_ABOVE, rupees } from "@/lib/pricing";

type Zone = { pincode: string; serviceable: boolean; area?: string; eta?: number };

export default function CartPage() {
  const { items, add, remove, clear } = useCart();
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [checked, setChecked] = useState<Zone | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
  const fee = deliveryFee(subtotal);

  const zone = checked?.pincode === pincode ? checked : null;

  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) return;
    fetch(`/api/serviceability?pincode=${pincode}`)
      .then((r) => r.json())
      .then((z) => setChecked({ ...z, pincode }));
  }, [pincode]);

  async function checkout() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map(({ productId, qty }) => ({ productId, qty })), address, pincode }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.status === 401) return (window.location.href = "/login?next=/cart");
    if (!res.ok) return setError(data.error);
    clear();
    window.location.href = `/orders/${data.order.id}`;
  }

  if (!items.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-5xl">🛒</p>
        <p className="mt-3 font-semibold">Your cart is empty</p>
        <Link href="/" className="mt-4 inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <section className="rounded-2xl bg-white p-4">
        <h1 className="mb-3 text-lg font-bold">My Cart</h1>
        <ul className="divide-y">
          {items.map((i) => (
            <li key={i.productId} className="flex items-center gap-3 py-3">
              <span className="text-3xl">{i.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{i.name}</p>
                <p className="text-xs text-gray-500">{i.unit} · {rupees(i.price)}</p>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-green-700 px-2 py-1 text-sm font-semibold text-white">
                <button onClick={() => remove(i.productId)} className="px-1">−</button>
                <span>{i.qty}</span>
                {/* Stock is re-checked on the server when the order is placed. */}
                <button onClick={() => add(i, Infinity)} className="px-1">+</button>
              </div>
              <p className="w-16 text-right text-sm font-semibold">{rupees(i.qty * i.price)}</p>
            </li>
          ))}
        </ul>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl bg-white p-4">
          <h2 className="mb-2 font-bold">Delivery address</h2>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House / flat no., street, landmark"
            rows={3}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-green-700"
          />
          <input
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Pincode"
            inputMode="numeric"
            className="mt-2 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-green-700"
          />
          {zone && (
            <p className={`mt-2 text-xs ${zone.serviceable ? "text-green-700" : "text-red-600"}`}>
              {zone.serviceable ? `Delivering to ${zone.area} in ${zone.eta} minutes` : "Sorry, we don't deliver here yet."}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold">Bill details</h2>
          <Row label="Items total" value={rupees(subtotal)} />
          <Row label="Delivery fee" value={fee ? rupees(fee) : "FREE"} />
          {fee > 0 && <p className="text-xs text-gray-500">Add {rupees(FREE_DELIVERY_ABOVE - subtotal)} more for free delivery</p>}
          <div className="mt-2 border-t pt-2">
            <Row label="Grand total" value={rupees(subtotal + fee)} bold />
          </div>
          <p className="mt-3 text-xs text-gray-500">Payment: Cash on delivery</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={checkout}
            disabled={busy || !zone?.serviceable || address.trim().length < 10}
            className="mt-3 w-full rounded-lg bg-green-700 py-3 font-semibold text-white disabled:opacity-50"
          >
            Place order · {rupees(subtotal + fee)}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
