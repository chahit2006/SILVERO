import { getProducts, type ProductFilters } from "@/lib/products";
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
  const { products, total } = await getProducts(baseFilters);

  return (
    <ProductListingPage
      config={{ title, description, baseFilters, categories }}
      initialProducts={products}
      initialTotal={total}
    />
  );
}
