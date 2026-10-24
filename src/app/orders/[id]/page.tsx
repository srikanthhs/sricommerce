import { notFound, redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth";
import { getOrder } from "@/lib/orders";
import { rupees } from "@/lib/pricing";
import { ORDER_FLOW, STATUS_LABEL } from "@/lib/types";
import { AutoRefresh, CancelOrderButton } from "./client";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/login?next=/orders/${id}`);
  const found = await getOrder(Number(id));
  if (!found || (found.order.user_id !== user.id && !isAdmin(user))) notFound();
  const { order, items } = found;
  const step = ORDER_FLOW.indexOf(order.status);
  const open = order.status !== "delivered" && order.status !== "cancelled";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {open && <AutoRefresh />}
      <div className="rounded-2xl bg-white p-5">
        <p className="text-sm text-gray-500">Order #{order.id}</p>
        <h1 className="text-xl font-bold">
          {order.status === "cancelled"
            ? "Order cancelled"
            : order.status === "delivered"
              ? "Delivered. Enjoy!"
              : `Arriving in about ${order.eta_minutes} minutes`}
        </h1>
        {order.status !== "cancelled" && (
          <ol className="mt-4 grid grid-cols-4 gap-2">
            {ORDER_FLOW.map((s, i) => (
              <li key={s} className="text-center">
                <div className={`h-1.5 rounded ${i <= step ? "bg-green-600" : "bg-gray-200"}`} />
                <p className={`mt-1 text-[11px] ${i <= step ? "font-semibold text-green-800" : "text-gray-400"}`}>{STATUS_LABEL[s]}</p>
              </li>
            ))}
          </ol>
        )}
        {order.status === "placed" && order.user_id === user.id && <CancelOrderButton orderId={order.id} />}
      </div>

      <div className="rounded-2xl bg-white p-5 text-sm">
        <h2 className="mb-2 font-bold">Items</h2>
        <ul className="divide-y">
          {items.map((it) => (
            <li key={it.product_id} className="flex justify-between py-2">
              <span>{it.name} × {it.qty}</span>
              <span>{rupees(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 space-y-1 border-t pt-2">
          <div className="flex justify-between"><span>Delivery fee</span><span>{order.delivery_fee ? rupees(order.delivery_fee) : "FREE"}</span></div>
          <div className="flex justify-between font-bold"><span>Total ({order.payment_method.toUpperCase()})</span><span>{rupees(order.total)}</span></div>
        </div>
        <h2 className="mb-1 mt-4 font-bold">Delivering to</h2>
        <p className="whitespace-pre-line text-gray-600">{order.address}, {order.pincode}</p>
      </div>
    </div>
  );
}
