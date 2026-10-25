// Read-only star rating, e.g. ★★★★☆ 4.2 (18)
export function Stars({ rating, count, size = "sm" }: { rating: number | null | undefined; count?: number; size?: "sm" | "lg" }) {
  if (!rating) return null;
  const full = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-1 ${size === "lg" ? "text-base" : "text-xs"}`}>
      <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
        {"★".repeat(full)}
        <span className="text-gray-300">{"★".repeat(5 - full)}</span>
      </span>
      <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
      {count != null && <span className="text-gray-500">({count})</span>}
    </span>
  );
}
