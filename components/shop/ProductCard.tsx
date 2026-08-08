"use client";

import Image from "next/image";
import type { Product } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { HeartIcon } from "@/components/ui/icons";

// DESIGN_SYSTEM.md §6 "Product Card". Reused by every /shop/* page and the
// homepage's New Arrivals / Bestsellers grids.
export function ProductCard({
  product,
  wishlisted = false,
  onToggleWishlist,
  onOpenDetail,
}: {
  product: Product;
  wishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onOpenDetail: (productId: string) => void;
}) {
  const badge = product.isBestseller ? "BESTSELLER" : product.isNew ? "NEW" : null;

  return (
    <div className="group">
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-ivory">
        <button
          onClick={() => onOpenDetail(product.id)}
          aria-label={`View ${product.name}`}
          className="absolute inset-0"
        >
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 22vw, 45vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
          )}
        </button>

        {badge && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-olive-dark px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ivory">
            {badge}
          </span>
        )}

        {onToggleWishlist && (
          <button
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={() => onToggleWishlist(product.id)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-colors duration-200"
          >
            <HeartIcon
              filled={wishlisted}
              className={wishlisted ? "text-olive-dark" : "text-text-dark/60"}
              width={16}
              height={16}
            />
          </button>
        )}
      </div>

      <button onClick={() => onOpenDetail(product.id)} className="mt-3 block w-full text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-dark sm:text-xs">
          {product.name}
        </p>
        <p className="mt-1 text-[13px] font-medium text-text-dark/70">{formatPrice(product.price)}</p>
      </button>
    </div>
  );
}
