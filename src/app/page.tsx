import Link from "next/link";
import { filtersFromParams, listCategories, listProducts } from "@/lib/catalog";
import { ProductRow } from "@/components/ProductRow";
import { SortFilterBar } from "@/components/SortFilterBar";
import { ProductCard } from "@/components/ProductCard";
import { one } from "@/lib/db";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : undefined;
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts(q ? { q, ...filtersFromParams(sp) } : {}),
  ]);

  if (q) {
    return (
      <section>
        <h1 className="mb-2 text-lg font-bold">Results for “{q}”</h1>
        <SortFilterBar count={products.length} />
        {products.length ? <Grid products={products} /> : <p className="text-gray-500">No products found.</p>}
      </section>
    );
  }

  const welcomeActive = !!(await one("SELECT 1 FROM coupons WHERE code = 'WELCOME50' AND active = 1"));
  const deals = products
    .filter((p) => p.mrp > p.price && p.stock > 0)
    .sort((a, b) => b.mrp / b.price - a.mrp / a.price)
    .slice(0, 6);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Category chips: a swipeable strip on phones, a grid on larger screens. */}
      <section>
        <h2 className="mb-3 hidden text-lg font-bold sm:block">Shop by category</h2>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-7 sm:px-0">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="flex w-20 shrink-0 flex-col items-center text-center sm:w-auto sm:rounded-xl sm:bg-white sm:p-3 sm:hover:shadow">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl sm:h-auto sm:w-auto sm:bg-transparent">{c.emoji}</span>
              <span className="mt-1 text-[11px] font-medium leading-tight sm:text-xs">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-gradient-to-r from-green-700 to-emerald-500 p-5 text-white sm:p-6">
        <h1 className="text-xl font-extrabold sm:text-3xl">Groceries delivered in 10 minutes</h1>
        <p className="mt-1 text-sm opacity-90">Fresh fruits, dairy, snacks and daily essentials at your door.</p>
        {welcomeActive && (
          <p className="mt-3 inline-block rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold">
            New here? Use <span className="text-yellow-300">WELCOME50</span> for 50% off your first order
          </p>
        )}
      </section>

      {deals.length > 0 && (
        <section className="rounded-2xl bg-white p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Today&apos;s deals</h2>
            <span className="text-xs font-semibold text-red-600">Limited time</span>
          </div>
          <ProductRow products={deals} />
        </section>
      )}

      {categories.map((c) => {
        const items = products.filter((p) => p.category_id === c.id).slice(0, 6);
        if (!items.length) return null;
        return (
          <section key={c.id}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-bold">{c.name}</h2>
              <Link href={`/category/${c.slug}`} className="text-sm font-semibold text-green-700">See all ›</Link>
            </div>
            <ProductRow products={items} />
          </section>
        );
      })}
    </div>
  );
}

function Grid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
