"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Poll for status changes until real-time updates (websockets / push) are added.
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}

export function CancelOrderButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-4">
      <button
        className="text-sm font-semibold text-red-600"
        onClick={async () => {
          if (!confirm("Cancel this order?")) return;
          const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
          if (!res.ok) setError((await res.json()).error);
          router.refresh();
        }}
      >
        Cancel order
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
