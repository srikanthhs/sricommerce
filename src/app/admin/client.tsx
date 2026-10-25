"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_FLOW, STATUS_LABEL, type Category, type OrderStatus, type Product } from "@/lib/types";

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

async function post(url: string, body: object): Promise<string | null> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.ok ? null : ((await res.json()).error ?? "Something went wrong.");
}

const input = "rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-green-700";

export function AddProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const empty = { name: "", unit: "", categoryId: String(categories[0]?.id ?? ""), price: "", mrp: "", stock: "", emoji: "" };
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      className="grid gap-2 rounded-2xl bg-white p-4 sm:grid-cols-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const price = Math.round(Number(f.price) * 100);
        const err = await post("/api/admin/products", {
          name: f.name,
          unit: f.unit,
          categoryId: Number(f.categoryId),
          price,
          mrp: f.mrp ? Math.round(Number(f.mrp) * 100) : price,
          stock: Number(f.stock),
          emoji: f.emoji,
        });
        setMsg(err ?? `Added ${f.name}.`);
        if (!err) {
          setF(empty);
          router.refresh();
        }
      }}
    >
      <input required placeholder="Product name" value={f.name} onChange={set("name")} className={`${input} sm:col-span-2`} />
      <input required placeholder="Unit (e.g. 500 g)" value={f.unit} onChange={set("unit")} className={input} />
      <select value={f.categoryId} onChange={set("categoryId")} className={input}>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input required inputMode="decimal" placeholder="Price ₹" value={f.price} onChange={set("price")} className={input} />
      <input inputMode="decimal" placeholder="MRP ₹ (optional)" value={f.mrp} onChange={set("mrp")} className={input} />
      <input required inputMode="numeric" placeholder="Stock" value={f.stock} onChange={set("stock")} className={input} />
      <input placeholder="Emoji (e.g. 🍉)" value={f.emoji} onChange={set("emoji")} className={input} />
      <div className="flex items-center gap-3 sm:col-span-4">
        <button className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">Add product</button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </form>
  );
}

export function CouponToggle({ code, active }: { code: string; active: boolean }) {
  const router = useRouter();
  return (
    <input
      type="checkbox"
      checked={active}
      onChange={async (e) => {
        await patch(`/api/admin/coupons/${encodeURIComponent(code)}`, { active: e.target.checked });
        router.refresh();
      }}
    />
  );
}

export function CouponForm() {
  const router = useRouter();
  const empty = { code: "", description: "", kind: "percent", value: "", minSubtotal: "", maxDiscount: "", firstOrderOnly: false };
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const paise = (v: string) => (v ? Math.round(Number(v) * 100) : undefined);

  return (
    <form
      className="mt-3 grid gap-2 rounded-2xl bg-white p-4 sm:grid-cols-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const err = await post("/api/admin/coupons", {
          code: f.code,
          description: f.description,
          kind: f.kind,
          value: f.kind === "percent" ? Number(f.value) : paise(f.value),
          minSubtotal: paise(f.minSubtotal) ?? 0,
          maxDiscount: paise(f.maxDiscount) ?? null,
          firstOrderOnly: f.firstOrderOnly,
        });
        setMsg(err ?? `Created ${f.code.toUpperCase()}.`);
        if (!err) {
          setF(empty);
          router.refresh();
        }
      }}
    >
      <input required placeholder="Code (e.g. DIWALI20)" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} className={input} />
      <input placeholder="Description shown to shoppers" value={f.description} onChange={set("description")} className={`${input} sm:col-span-3`} />
      <select value={f.kind} onChange={set("kind")} className={input}>
        <option value="percent">Percent off</option>
        <option value="flat">Flat ₹ off</option>
      </select>
      <input required inputMode="decimal" placeholder={f.kind === "percent" ? "Percent (1–100)" : "Amount ₹"} value={f.value} onChange={set("value")} className={input} />
      <input inputMode="decimal" placeholder="Min order ₹" value={f.minSubtotal} onChange={set("minSubtotal")} className={input} />
      <input inputMode="decimal" placeholder="Max discount ₹" value={f.maxDiscount} onChange={set("maxDiscount")} className={input} />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={f.firstOrderOnly} onChange={(e) => setF({ ...f, firstOrderOnly: e.target.checked })} />
        First order only
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">Create coupon</button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </form>
  );
}
