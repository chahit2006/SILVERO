"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Product } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/providers/CartProvider";

// PRD.md §4 lists "build-your-gift" under Gifting. Simplified real version:
// pick a few pieces from a curated set, add them all to the bag together as
// a gift (isGift + giftWrap pre-selected) — rather than a fully custom
// bundle-pricing/discount engine, which isn't specified anywhere.
export function BuildYourGift() {
  const { addItem, open } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [giftWrap, setGiftWrap] = useState<"signature" | "premium">("signature");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/products?isBestseller=true")
      .then((res) => res.json())
      .then((data) => setProducts((data.products ?? []).slice(0, 8)));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev));
  }

  async function handleAddBundle() {
    setAdding(true);
    for (const id of selected) {
      await addItem({ productId: id, quantity: 1, isGift: true, giftWrap });
    }
    setAdding(false);
    open();
  }

  const total = products.filter((p) => selected.includes(p.id)).reduce((sum, p) => sum + p.price, 0);

  return (
    <div>
      <p className="mb-4 text-sm text-text-dark/60">Pick up to 4 pieces to bundle as one gift.</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`rounded-card border-2 p-2 text-left transition-colors duration-150 ${isSelected ? "border-olive-dark" : "border-transparent"}`}
            >
              <div className="relative aspect-square overflow-hidden rounded-card bg-ivory">
                {p.images[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover" />}
              </div>
              <p className="mt-2 text-xs">{p.name}</p>
              <p className="text-xs text-text-dark/50">{formatPrice(p.price)}</p>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-8 rounded-card bg-ivory p-5">
          <p className="mb-3 text-xs uppercase tracking-wide text-text-dark/60">Gift wrap</p>
          <div className="mb-4 flex gap-2">
            {(["signature", "premium"] as const).map((w) => (
              <button
                key={w}
                onClick={() => setGiftWrap(w)}
                className={`rounded-full border px-4 py-1.5 text-xs capitalize ${giftWrap === w ? "border-olive-dark bg-olive-dark text-ivory" : "border-black/15"}`}
              >
                {w}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm">
              {selected.length} item(s) · {formatPrice(total)}
            </p>
            <button
              onClick={handleAddBundle}
              disabled={adding}
              className="rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add Bundle to Bag"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
