import Link from "next/link";
import { currentUser, isAdmin } from "@/lib/auth";
import { CartLink } from "./CartLink";
import { DeliverTo } from "./DeliverTo";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const user = await currentUser();
  return (
    <header className="sticky top-0 z-10 shadow-sm">
      <div className="bg-gradient-to-r from-green-800 to-emerald-600 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 pb-2 pt-3 sm:py-3">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            <span className="text-yellow-300">collectorate</span>
            <span className="text-white">.</span>
          </Link>
          <form action="/" className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-gray-900 shadow-inner">
              <span aria-hidden="true" className="text-gray-500">🔍</span>
              <input
                name="q"
                type="search"
                placeholder="Search for milk, bread, chips…"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
          </form>
          {/* On phones these live in the bottom tab bar. */}
          <nav className="ml-auto hidden items-center gap-4 text-sm font-medium sm:flex">
            {isAdmin(user) && <Link href="/admin">Admin</Link>}
            {user ? (
              <>
                <Link href="/wishlist">Wishlist</Link>
                <Link href="/orders">My Orders</Link>
                <LogoutButton className="text-white/90 hover:text-white" />
              </>
            ) : (
              <Link href="/login">Login</Link>
            )}
            <CartLink />
          </nav>
          {isAdmin(user) && (
            <Link href="/admin" className="ml-auto rounded bg-white/15 px-2 py-1 text-xs font-semibold sm:hidden">Admin</Link>
          )}
        </div>
      </div>
      <div className="bg-emerald-700/95 text-xs text-white sm:text-sm">
        <div className="mx-auto max-w-6xl px-4 py-1.5">
          <DeliverTo />
        </div>
      </div>
    </header>
  );
}
