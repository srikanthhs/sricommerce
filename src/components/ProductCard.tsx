import { AddButton } from "./AddButton";
import { rupees } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const off = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  return (
    <div className="relative flex flex-col rounded-xl border border-gray-200 bg-white p-3">
      {off > 0 && (
        <span className="absolute left-2 top-2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{off}% OFF</span>
      )}
      <div className="flex h-24 items-center justify-center text-5xl">{product.emoji}</div>
      <p className="mt-2 text-[11px] font-medium text-gray-500">⏱ 10 MINS</p>
      <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-gray-900">{product.name}</h3>
      <p className="text-xs text-gray-500">{product.unit}</p>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">{rupees(product.price)}</p>
          {off > 0 && <p className="text-xs text-gray-400 line-through">{rupees(product.mrp)}</p>}
        </div>
        <AddButton product={product} />
      </div>
    </div>
  );
}
