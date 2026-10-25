import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

// Swipeable row on phones, regular grid on larger screens.
export function ProductRow({ products }: { products: Product[] }) {
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
      {products.map((p) => (
        <div key={p.id} className="w-40 shrink-0 snap-start sm:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
