import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth";
import { listCategories, listProducts } from "@/lib/catalog";
import { listOrders } from "@/lib/orders";
import { rupees } from "@/lib/pricing";
import { STATUS_LABEL } from "@/lib/types";
import { OrderStatusControl, ProductRow } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdmin(await currentUser())) notFound();
  const [orders, products, categoryList] = await Promise.all([
    listOrders(),
    listProducts({ includeInactive: true }),
    listCategories(),
  ]);
  const categories = new Map(categoryList.map((c) => [c.id, c.name]));
  const open = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-1 text-lg font-bold">Store dashboard</h1>
        <p className="mb-4 text-sm text-gray-500">{open.length} open orders · {products.filter((p) => p.stock < 10).length} products low on stock</p>
        <div className="overflow-x-auto rounded-2xl bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr><th className="p-3">Order</th><th className="p-3">Placed</th><th className="p-3">Pincode</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Update</th></tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="p-3"><Link href={`/orders/${o.id}`} className="font-semibold text-green-700">#{o.id}</Link></td>
                  <td className="p-3">{new Date(o.created_at).toLocaleString("en-IN")}</td>
                  <td className="p-3">{o.pincode}</td>
                  <td className="p-3">{rupees(o.total)}</td>
                  <td className="p-3">{STATUS_LABEL[o.status]}</td>
                  <td className="p-3"><OrderStatusControl orderId={o.id} status={o.status} /></td>
                </tr>
              ))}
              {!orders.length && <tr><td colSpan={6} className="p-3 text-gray-500">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Inventory</h2>
        <div className="overflow-x-auto rounded-2xl bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price (₹)</th><th className="p-3">Stock</th><th className="p-3">Listed</th><th className="p-3"></th></tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <ProductRow key={p.id} product={p} category={categories.get(p.category_id) ?? ""} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
