"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { ProductDetailDrawer } from "@/components/shop/ProductDetailDrawer";

// DESIGN_SYSTEM.md §5 #7 — full-bleed lifestyle image, clickable hotspots →
// popover card. This is the homepage section only — the standalone
// /shop-the-look page is out of scope for this pass (see PRD.md §7 gap).
export function ShopTheLook({ products }: { products: Product[] }) {
  const [openHotspot, setOpenHotspot] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const hotspots = products.slice(0, 2).map((product, i) => ({
    product,
    top: i === 0 ? "35%" : "68%",
    left: i === 0 ? "32%" : "62%",
  }));

  if (hotspots.length === 0) return null;

  return (
    <section className="relative mx-auto max-w-screen-2xl px-4 py-16 lg:px-8">
      <h2 className="mb-6 font-display text-2xl uppercase">Shop the Look</h2>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card">
        <Image src="/placeholders/lifestyle-a.svg" alt="" fill className="object-cover" />

        {hotspots.map((spot, i) => (
          <div key={spot.product.id} className="absolute" style={{ top: spot.top, left: spot.left }}>
            <button
              aria-label={`Shop ${spot.product.name}`}
              onClick={() => setOpenHotspot(openHotspot === i ? null : i)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md ring-2 ring-white"
            >
              <span className="h-2 w-2 rounded-full bg-olive-dark" />
            </button>

            {openHotspot === i && (
              <button
                onClick={() => {
                  setSelectedProductId(spot.product.id);
                  setOpenHotspot(null);
                }}
                className="absolute left-1/2 top-10 w-40 -translate-x-1/2 rounded-card bg-white p-3 text-left shadow-lg animate-fade-in"
              >
                <p className="text-xs font-medium">{spot.product.name}</p>
                <p className="text-xs text-text-dark/60">{formatPrice(spot.product.price)}</p>
              </button>
            )}
          </div>
        ))}
      </div>

      <ProductDetailDrawer
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onOpenDetail={setSelectedProductId}
      />
    </section>
  );
}
