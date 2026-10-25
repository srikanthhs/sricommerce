import Link from "next/link";
import { filtersFromParams, listCategories, listProducts } from "@/lib/catalog";
import { SortFilterBar } from "@/components/SortFilterBar";
import { ProductCard } from "@/components/ProductCard";
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

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-r from-green-700 to-emerald-500 p-6 text-white">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Groceries delivered in 10 minutes</h1>
        <p className="mt-1 text-sm opacity-90">Fresh fruits, dairy, snacks and daily essentials at your door.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Shop by category</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="flex flex-col items-center rounded-xl bg-white p-3 text-center hover:shadow">
              <span className="text-3xl">{c.emoji}</span>
              <span className="mt-1 text-xs font-medium">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {categories.map((c) => {
        const items = products.filter((p) => p.category_id === c.id).slice(0, 6);
        if (!items.length) return null;
        return (
          <section key={c.id}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-bold">{c.name}</h2>
              <Link href={`/category/${c.slug}`} className="text-sm font-semibold text-green-700">see all</Link>
            </div>
            <Grid products={items} />
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
