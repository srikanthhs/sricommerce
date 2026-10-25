"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

const TABS = [
  { href: "/", label: "Home", icon: "🏠", match: (p: string) => p === "/" },
  { href: "/categories", label: "Categories", icon: "▦", match: (p: string) => p.startsWith("/categor") },
  { href: "/wishlist", label: "Wishlist", icon: "♡", match: (p: string) => p.startsWith("/wishlist") },
  { href: "/account", label: "You", icon: "👤", match: (p: string) => ["/account", "/orders", "/login"].some((x) => p.startsWith(x)) },
  { href: "/cart", label: "Cart", icon: "🛒", match: (p: string) => p.startsWith("/cart") },
];

// App-style tab bar, shown on phones only.
export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "font-semibold text-green-700" : "text-gray-600"}`}
              >
                {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded bg-green-700" />}
                <span className="text-lg leading-none">{t.icon}</span>
                {t.label}
                {t.href === "/cart" && count > 0 && (
                  <span className="absolute right-3 top-1 min-w-4 rounded-full bg-amber-400 px-1 text-[10px] font-bold text-gray-900">{count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
