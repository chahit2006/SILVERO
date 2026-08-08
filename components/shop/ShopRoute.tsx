import { getPriceBounds, getProducts, type ProductFilters } from "@/lib/products";
import type { NavCategory } from "@/lib/nav-data";
import { ProductListingPage } from "./ProductListingPage";

// Server component: does the initial Prisma fetch for SSR/SEO
// (TECH_STACK.md — category pages need to be crawlable), then hands off to
// the client ProductListingPage for interactive filtering. Every /shop/*
// route (this ships 17 of them) is just this component with a different config.
export async function ShopRoute({
  title,
  description,
  baseFilters,
  categories,
}: {
  title: string;
  description?: string;
  baseFilters: ProductFilters;
  categories?: NavCategory[];
}) {
  // Both queries hit the same table with the same base filters, so they run
  // together rather than adding a second round-trip to first paint.
  const [{ products, total }, priceBounds] = await Promise.all([
    getProducts(baseFilters),
    getPriceBounds(baseFilters),
  ]);

  return (
    <ProductListingPage
      config={{ title, description, baseFilters, categories, priceBounds }}
      initialProducts={products}
      initialTotal={total}
    />
  );
}
