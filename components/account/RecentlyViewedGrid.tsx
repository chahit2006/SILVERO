"use client";

import { useState } from "react";
import type { Product } from "@prisma/client";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductDetailDrawer } from "@/components/shop/ProductDetailDrawer";
import { useWishlist } from "@/components/providers/WishlistProvider";

export function RecentlyViewedGrid({ products }: { products: Product[] }) {
  const { ids, toggle } = useWishlist();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  if (products.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-black/15 p-10 text-center text-sm text-text-dark/60">
        Nothing viewed yet — browse the shop and it&apos;ll show up here.
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
            wishlisted={ids.has(product.id)}
            onToggleWishlist={toggle}
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
