"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";

export function RegistryPurchaseButton({ shareSlug, productId }: { shareSlug: string; productId: string }) {
  const router = useRouter();
  const { refresh } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/registry/${shareSlug}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Couldn't add that item.");

      await refresh();
      router.push("/checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-1 text-xs text-red-700">{error}</p>}
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="rounded-full bg-olive-dark px-4 py-2 text-xs uppercase tracking-wide text-ivory disabled:opacity-50"
      >
        {loading ? "Adding…" : "Purchase This"}
      </button>
    </div>
  );
}
