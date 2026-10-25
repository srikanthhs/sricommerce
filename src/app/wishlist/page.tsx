import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listWishlist } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/wishlist");
  const products = await listWishlist(user.id);

  return (
    <section>
      <h1 className="mb-4 text-lg font-bold">My Wishlist</h1>
      {products.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <p className="text-gray-500">
          Nothing saved yet. Tap “Add to wishlist” on any product. <Link href="/" className="font-semibold text-green-700">Browse products</Link>
        </p>
      )}
    </section>
  );
}
