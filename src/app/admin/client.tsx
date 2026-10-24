"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_FLOW, STATUS_LABEL, type OrderStatus, type Product } from "@/lib/types";

async function patch(url: string, body: object): Promise<string | null> {
  const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.ok ? null : ((await res.json()).error ?? "Update failed.");
}

export function OrderStatusControl({ orderId, status }: { orderId: number; status: OrderStatus }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  if (status === "delivered" || status === "cancelled") return <span className="text-gray-400">—</span>;
  const next = ORDER_FLOW[ORDER_FLOW.indexOf(status) + 1];

  async function go(s: OrderStatus) {
    setError(await patch(`/api/admin/orders/${orderId}`, { status: s }));
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => go(next)} className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white">
        Mark {STATUS_LABEL[next].toLowerCase()}
      </button>
      <button onClick={() => go("cancelled")} className="text-xs text-red-600">Cancel</button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function ProductRow({ product, category }: { product: Product; category: string }) {
  const router = useRouter();
  const [price, setPrice] = useState(String(product.price / 100));
  const [stock, setStock] = useState(String(product.stock));
  const [active, setActive] = useState(!!product.active);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    const err = await patch(`/api/admin/products/${product.id}`, {
      price: Math.round(Number(price) * 100),
      stock: Number(stock),
      active: active ? 1 : 0,
    });
    setMsg(err ?? "Saved");
    router.refresh();
  }

  return (
    <tr className={product.stock < 10 ? "bg-amber-50" : ""}>
      <td className="p-3">{product.emoji} {product.name} <span className="text-xs text-gray-500">{product.unit}</span></td>
      <td className="p-3 text-gray-500">{category}</td>
      <td className="p-3"><input value={price} onChange={(e) => setPrice(e.target.value)} className="w-20 rounded border px-2 py-1" /></td>
      <td className="p-3"><input value={stock} onChange={(e) => setStock(e.target.value)} className="w-16 rounded border px-2 py-1" /></td>
      <td className="p-3"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /></td>
      <td className="p-3">
        <button onClick={save} className="rounded border border-green-700 px-2 py-1 text-xs font-semibold text-green-700">Save</button>
        {msg && <span className="ml-2 text-xs text-gray-500">{msg}</span>}
      </td>
    </tr>
  );
}
