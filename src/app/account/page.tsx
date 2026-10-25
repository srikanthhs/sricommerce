import Link from "next/link";
import { currentUser, isAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { rupees } from "@/lib/pricing";
import { STATUS_LABEL } from "@/lib/types";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 text-center">
        <p className="text-4xl">👤</p>
        <h1 className="mt-2 text-lg font-bold">Your account</h1>
        <p className="mt-1 text-sm text-gray-500">Log in to see your orders, wishlist and more.</p>
        <Link href="/login?next=/account" className="mt-4 inline-block w-full rounded-lg bg-green-700 py-2 font-semibold text-white">
          Log in or sign up
        </Link>
      </div>
    );
  }
  const orders = (await listOrders(user.id)).slice(0, 3);
  const name = user.name ?? user.email ?? `+91 ${user.phone}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl bg-white p-5">
        <p className="text-sm text-gray-500">Hello,</p>
        <h1 className="text-xl font-bold">{name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile href="/orders" icon="📦" label="Your orders" />
        <Tile href="/wishlist" icon="♡" label="Your wishlist" />
        <Tile href="/cart" icon="🛒" label="Your cart" />
        {isAdmin(user) ? <Tile href="/admin" icon="🏪" label="Store admin" /> : <Tile href="/categories" icon="▦" label="Browse categories" />}
      </div>

      <div className="rounded-2xl bg-white p-5">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-bold">Recent orders</h2>
          <Link href="/orders" className="text-sm font-semibold text-green-700">See all ›</Link>
        </div>
        {orders.length ? (
          <ul className="divide-y">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex justify-between py-2 text-sm">
                  <span>Order #{o.id} · {STATUS_LABEL[o.status]}</span>
                  <span className="font-semibold">{rupees(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No orders yet.</p>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5">
        <LogoutButton className="w-full rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700" />
      </div>
    </div>
  );
}

function Tile({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl bg-white p-4 font-semibold hover:shadow">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
