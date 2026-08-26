// TEMPORARY — trial images for design review only. Delete this file and its
// two imports (components/shop/ProductCard.tsx, components/shop/ProductDetailDrawer.tsx)
// once admin-panel uploads are live and real Product.images data exists.
//
// Matches by product SLUG PREFIX rather than the category relation: list/grid
// queries (lib/products.ts getProducts) don't `include: { category: true }`,
// so a bare Product here has no `.category.slug` to key off. Every seeded
// product's slug does start with its category slug though
// (prisma/seed.ts: `${cat.slug}-${name}-${i}`), so a prefix check is enough
// without touching the query layer or the DB.
import type { Product } from "@prisma/client";

const TRIAL_IMAGES: Record<string, string[]> = {
  zanjeer: [
    "/placeholders/zanjeer-1.png",
    "/placeholders/zanjeer-2.png",
    "/placeholders/zanjeer-3.png",
    "/placeholders/zanjeer-4.png",
  ],
  sankalp: ["/placeholders/sankalp-1.png", "/placeholders/sankalp-2.png"],
  nishaan: ["/placeholders/nishaan-1.png", "/placeholders/nishaan-2.png"],
  resham: ["/placeholders/resham-1.png"],
  vaada: ["/placeholders/vaada-1.png"],
};

/** Returns trial gallery images for this product's category, or null if none apply. */
export function getTrialImages(product: Pick<Product, "slug">): string[] | null {
  for (const [categorySlug, images] of Object.entries(TRIAL_IMAGES)) {
    if (product.slug.startsWith(`${categorySlug}-`)) return images;
  }
  return null;
}
