"use client";

import { useState } from "react";
import type { Product } from "@prisma/client";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductDetailDrawer } from "@/components/shop/ProductDetailDrawer";
import { useWishlist } from "@/components/providers/WishlistProvider";

export function WishlistGrid({ initialProducts }: { initialProducts: Product[] }) {
  const { toggle } = useWishlist();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  // Tracked locally rather than reading WishlistProvider's `ids` directly —
  // that context fetches asynchronously on mount, which would flash an
  // empty grid before it resolves. initialProducts (SSR) is the source of
  // truth here; we only need to know what's been removed *this visit*.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const products = initialProducts.filter((p) => !removedIds.has(p.id));

  function handleToggle(productId: string) {
    setRemovedIds((prev) => new Set(prev).add(productId));
    toggle(productId);
  }

  if (products.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-black/15 p-10 text-center text-sm text-text-dark/60">
        Your wishlist is empty.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            wishlisted
            onToggleWishlist={handleToggle}
            onOpenDetail={setSelectedProductId}
          />
        ))}
      </div>
      <ProductDetailDrawer
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onOpenDetail={setSelectedProductId}
      />
    </>
  );
}
