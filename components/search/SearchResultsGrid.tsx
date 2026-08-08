"use client";

import { useState } from "react";
import type { Product } from "@prisma/client";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductDetailDrawer } from "@/components/shop/ProductDetailDrawer";
import { useWishlist } from "@/components/providers/WishlistProvider";

export function SearchResultsGrid({ products }: { products: Product[] }) {
  const { ids, toggle } = useWishlist();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

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
