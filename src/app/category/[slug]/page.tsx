import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, listCategories, listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const [products, categories] = await Promise.all([listProducts({ categoryId: category.id }), listCategories()]);

  return (
    <div className="flex gap-4">
      <aside className="hidden w-48 shrink-0 space-y-1 sm:block">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${c.id === category.id ? "bg-green-50 font-semibold text-green-800" : "hover:bg-white"}`}
          >
            <span>{c.emoji}</span> {c.name}
          </Link>
        ))}
      </aside>
      <section className="flex-1">
        <h1 className="mb-4 text-lg font-bold">{category.name}</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
