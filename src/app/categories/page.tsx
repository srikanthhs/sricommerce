import Link from "next/link";
import { listCategories, listProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);
  return (
    <section>
      <h1 className="mb-4 text-lg font-bold">All categories</h1>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {categories.map((c) => {
          const count = products.filter((p) => p.category_id === c.id).length;
          return (
            <Link key={c.id} href={`/category/${c.slug}`} className="flex flex-col items-center rounded-xl bg-white p-3 text-center hover:shadow">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">{c.emoji}</span>
              <span className="mt-2 text-xs font-semibold leading-tight">{c.name}</span>
              <span className="text-[11px] text-gray-500">{count} items</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
