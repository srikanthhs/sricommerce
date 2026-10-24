import Link from "next/link";
import { currentUser, isAdmin } from "@/lib/auth";
import { CartLink } from "./CartLink";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const user = await currentUser();
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          <span className="text-yellow-500">collectorate</span>
          <span className="text-green-700">.</span>
        </Link>
        <form action="/" className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <input
            name="q"
            placeholder="Search for milk, bread, chips…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-green-700"
          />
        </form>
        <nav className="ml-auto flex items-center gap-4">
          {isAdmin(user) && (
            <Link href="/admin" className="text-sm font-medium text-gray-700">Admin</Link>
          )}
          {user ? (
            <>
              <Link href="/orders" className="text-sm font-medium text-gray-700">My Orders</Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-gray-700">Login</Link>
          )}
          <CartLink />
        </nav>
      </div>
    </header>
  );
}
