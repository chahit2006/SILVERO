import { getPriceBounds, getProducts, type ProductFilters } from "@/lib/products";
import { getPlpFilterGroups } from "@/lib/attributes";
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
  // All three hit the same table with the same base filters, so they run
  // together rather than adding round-trips to first paint. The filter groups
  // are resolved here rather than in the client component because
  // "hide-when-empty" (FILTER_SPEC_IMPLEMENTATION.md Part 1) needs to know
  // which options real products carry — a database question, and one whose
  // answer belongs in the crawlable initial render.
  const [{ products, total }, priceBounds, filterGroups] = await Promise.all([
    getProducts(baseFilters),
    getPriceBounds(baseFilters),
    getPlpFilterGroups(baseFilters),
  ]);

  return (
    <ProductListingPage
      config={{ title, description, baseFilters, categories, priceBounds, filterGroups }}
      initialProducts={products}
      initialTotal={total}
    />
  );
}
