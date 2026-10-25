import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { boughtTogether, canReview, getProduct, isWishlisted, listCategories, listReviews, similarProducts } from "@/lib/catalog";
import { rupees } from "@/lib/pricing";
import { AddButton } from "@/components/AddButton";
import { BuyNowButton } from "@/components/BuyNowButton";
import { ProductCard } from "@/components/ProductCard";
import { Stars } from "@/components/Stars";
import { WishlistButton } from "@/components/WishlistButton";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await getProduct(Number((await params).id));
  if (!product) notFound();
  const user = await currentUser();
  const [categories, reviews, similar, together, wishlisted, reviewable] = await Promise.all([
    listCategories(),
    listReviews(product.id),
    similarProducts(product),
    boughtTogether(product.id),
    user ? isWishlisted(user.id, product.id) : false,
    user ? canReview(user.id, product.id) : false,
  ]);
  const category = categories.find((c) => c.id === product.category_id);
  const off = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const mine = user ? reviews.find((r) => r.user_id === user.id) : undefined;
  const histogram = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));

  return (
    <div className="space-y-8">
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:underline">Home</Link>
        {category && <> › <Link href={`/category/${category.slug}`} className="hover:underline">{category.name}</Link></>}
        {" "}› <span className="text-gray-800">{product.name}</span>
      </nav>

      <section className="grid gap-6 rounded-2xl bg-white p-6 md:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-xl bg-gray-50 text-9xl">{product.emoji}</div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-gray-500">{product.unit}</p>
          {product.rating_count ? (
            <a href="#reviews"><Stars rating={product.rating_avg} count={product.rating_count} size="lg" /></a>
          ) : (
            <p className="text-sm text-gray-500">No reviews yet</p>
          )}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{rupees(product.price)}</span>
            {off > 0 && (
              <>
                <span className="text-gray-400 line-through">MRP {rupees(product.mrp)}</span>
                <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">{off}% OFF</span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500">Inclusive of all taxes · Delivered in minutes</p>
          <p className={`text-sm font-semibold ${product.stock > 0 ? "text-green-700" : "text-red-600"}`}>
            {product.stock <= 0 ? "Out of stock" : product.stock < 10 ? `Only ${product.stock} left` : "In stock"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <AddButton product={product} />
            <BuyNowButton product={product} />
            <WishlistButton productId={product.id} initial={wishlisted} loggedIn={!!user} />
          </div>
        </div>
      </section>

      {together.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Frequently bought together</h2>
          <Grid products={together} />
        </section>
      )}

      {similar.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Similar products</h2>
          <Grid products={similar} />
        </section>
      )}

      <section id="reviews" className="grid gap-6 rounded-2xl bg-white p-6 md:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          <h2 className="text-lg font-bold">Customer reviews</h2>
          {reviews.length ? (
            <>
              <Stars rating={product.rating_avg} count={product.rating_count} size="lg" />
              {histogram.map(({ n, count }) => (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-8">{n} ★</span>
                  <div className="h-2 flex-1 rounded bg-gray-100">
                    <div className="h-2 rounded bg-amber-400" style={{ width: `${(count / reviews.length) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-gray-500">{count}</span>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          )}
        </div>
        <div className="space-y-4">
          {reviewable ? (
            <ReviewForm productId={product.id} existing={mine} />
          ) : (
            <p className="text-sm text-gray-500">
              {user ? "You can review this product after it's delivered to you." : "Log in and order this product to leave a review."}
            </p>
          )}
          {reviews.map((r) => (
            <article key={r.user_id} className="border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Stars rating={r.rating} />
                {r.title && <span className="font-semibold">{r.title}</span>}
              </div>
              <p className="text-xs text-gray-500">
                {r.author} · {new Date(r.created_at).toLocaleDateString("en-IN")} · <span className="text-orange-700">Verified purchase</span>
              </p>
              {r.body && <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{r.body}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Grid({ products }: { products: Awaited<ReturnType<typeof similarProducts>> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
