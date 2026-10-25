"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WishlistButton({ productId, initial, loggedIn }: { productId: number; initial: boolean; loggedIn: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);

  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!loggedIn) return router.push(`/login?next=/product/${productId}`);
        setBusy(true);
        const res = await fetch("/api/wishlist", {
          method: saved ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        setBusy(false);
        if (res.ok) {
          setSaved(!saved);
          router.refresh();
        }
      }}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold ${saved ? "border-rose-500 bg-rose-50 text-rose-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
    >
      {saved ? "♥ In wishlist" : "♡ Add to wishlist"}
    </button>
  );
}
