"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@prisma/client";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductDetailDrawer } from "@/components/shop/ProductDetailDrawer";
import { useWishlist } from "@/components/providers/WishlistProvider";

// DESIGN_SYSTEM.md §5 #4 "New Arrivals" and #6 "Bestsellers" — same
// 4-product-grid + "View all" pattern, real data from lib/products.ts.
export function ProductGridSection({
  title,
  products,
  viewAllHref,
}: {
  title: string;
  products: Product[];
  viewAllHref: string;
}) {
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-16 lg:px-8">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-display text-2xl uppercase">{title}</h2>
        <Link href={viewAllHref} className="text-xs uppercase tracking-wide link-underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            wishlisted={wishlistIds.has(product.id)}
            onToggleWishlist={toggleWishlist}
            onOpenDetail={setSelectedProductId}
          />
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
