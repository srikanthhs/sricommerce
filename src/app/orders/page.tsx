import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { rupees } from "@/lib/pricing";
import { STATUS_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/orders");
  const orders = await listOrders(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-lg font-bold">My Orders</h1>
      {!orders.length && <p className="text-gray-500">No orders yet.</p>}
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/orders/${o.id}`} className="flex items-center justify-between rounded-xl bg-white p-4 hover:shadow">
              <div>
                <p className="font-semibold">Order #{o.id}</p>
                <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{rupees(o.total)}</p>
                <p className="text-xs text-green-700">{STATUS_LABEL[o.status]}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
