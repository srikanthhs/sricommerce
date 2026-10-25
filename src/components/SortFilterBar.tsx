"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  ["relevance", "Relevance"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["discount", "Biggest discount"],
  ["rating", "Customer rating"],
] as const;

// Sort and filter controls that live in the URL, so results can be shared and bookmarked.
export function SortFilterBar({ count }: { count: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  const select = "rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm";
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
      <span className="mr-auto text-gray-500">{count} item{count === 1 ? "" : "s"}</span>
      <select aria-label="Sort by" value={params.get("sort") ?? "relevance"} onChange={(e) => set("sort", e.target.value === "relevance" ? null : e.target.value)} className={select}>
        {SORT_OPTIONS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
      </select>
      <select aria-label="Rating" value={params.get("rating") ?? ""} onChange={(e) => set("rating", e.target.value || null)} className={select}>
        <option value="">Any rating</option>
        <option value="4">4★ & up</option>
        <option value="3">3★ & up</option>
      </select>
      <select aria-label="Price" value={params.get("max") ?? ""} onChange={(e) => set("max", e.target.value || null)} className={select}>
        <option value="">Any price</option>
        <option value="50">Under ₹50</option>
        <option value="100">Under ₹100</option>
        <option value="200">Under ₹200</option>
      </select>
      <label className="flex items-center gap-1.5">
        <input type="checkbox" checked={params.get("instock") === "1"} onChange={(e) => set("instock", e.target.checked ? "1" : null)} />
        In stock
      </label>
    </div>
  );
}
