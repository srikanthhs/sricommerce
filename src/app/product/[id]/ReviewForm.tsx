"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewForm({ productId, existing }: { productId: number; existing?: { rating: number; title: string; body: string } }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      className="space-y-2 rounded-xl border border-gray-200 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) return setMsg("Pick 1 to 5 stars.");
        const res = await fetch(`/api/products/${productId}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, title, body }),
        });
        setMsg(res.ok ? "Thanks for your review!" : ((await res.json()).error ?? "Something went wrong."));
        if (res.ok) router.refresh();
      }}
    >
      <p className="font-semibold">{existing ? "Update your review" : "Write a review"}</p>
      <div className="flex gap-1 text-2xl" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className={n <= rating ? "text-amber-500" : "text-gray-300"}
          >
            ★
          </button>
        ))}
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Headline (optional)" maxLength={100} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-700" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did you like or dislike?" rows={3} maxLength={2000} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-700" />
      <div className="flex items-center gap-3">
        <button className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">Submit</button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </form>
  );
}
