import { Prisma } from "@prisma/client";
import { db } from "./db";

const PAGE_SIZE = 24; // DESIGN_SYSTEM.md §6 — "24 products per load"

export type ProductSort = "featured" | "price-asc" | "price-desc" | "newest";

export type ProductFilters = {
  category?: string[];
  gender?: "NAR" | "NARI";
  material?: string[];
  stone?: string[];
  occasion?: string[];
  minPrice?: number;
  maxPrice?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  sort?: ProductSort;
  page?: number;
};

// Single source of truth for the shop filter/sort logic — used by both
// /api/products (client-side filter changes) and every /shop/* server
// component's initial SSR fetch (TECH_STACK.md — category pages need to be
// crawlable). Keep this the only place that builds the query.
// Exported (2026-08-22) so lib/attributes.ts can scope its "which filter
// options are actually in use" query to exactly the same set of products a
// route lists — anything else and the sidebar could offer a checkbox that
// returns nothing.
export function buildProductWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  // `category` and `gender` both constrain the SAME relation, so they have to
  // be merged into one nested object. Spreading them as two separate
  // `category:` keys meant the second silently overwrote the first — on a
  // gender hub (/shop/nar, where baseFilters.gender is set) every category
  // checkbox the shopper ticked was dropped on the floor, and the grid just
  // kept showing all of Nar. Fixed 2026-08-08 as part of FEATURE_SPEC_BATCH2 §1.
  const category: Prisma.CategoryWhereInput = {
    ...(filters.category?.length ? { slug: { in: filters.category } } : {}),
    ...(filters.gender ? { gender: filters.gender } : {}),
  };

  return {
    // Every customer-facing product query goes through this function — the
    // one place a soft-deleted product needs to disappear from the storefront.
    // Admin's own product list (app/admin/products) queries Prisma directly,
    // specifically so it can still see (and un-archive) archived products.
    isArchived: false,
    ...(Object.keys(category).length ? { category } : {}),
    ...(filters.material?.length ? { material: { in: filters.material } } : {}),
    ...(filters.stone?.length ? { stone: { in: filters.stone } } : {}),
    ...(filters.occasion?.length ? { occasion: { in: filters.occasion } } : {}),
    ...(filters.isNew ? { isNew: true } : {}),
    ...(filters.isBestseller ? { isBestseller: true } : {}),
    ...(filters.minPrice != null || filters.maxPrice != null
      ? {
          price: {
            ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
  };
}

export async function getProducts(filters: ProductFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where = buildProductWhere(filters);

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    filters.sort === "price-asc"
      ? [{ price: "asc" }]
      : filters.sort === "price-desc"
        ? [{ price: "desc" }]
        : filters.sort === "newest"
          ? [{ createdAt: "desc" }]
          : [{ isBestseller: "desc" }, { createdAt: "desc" }]; // "featured" (default)

  const [products, total] = await Promise.all([
    db.product.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.product.count({ where }),
  ]);

  return { products, total, page, pageSize: PAGE_SIZE };
}

export type PriceBounds = { min: number; max: number };

/** Slider track granularity — bounds round outward to this, so the ends land
 *  on ₹1,900/₹8,000 rather than ₹1,873/₹7,994. */
const PRICE_STEP = 100;

/**
 * FEATURE_SPEC_BATCH2.md §1 — the price filter is a drag-to-select range
 * slider, so it needs real ends to span. Those come from the catalogue rather
 * than a hardcoded ₹0–₹20,000, or the handles would sit in dead space the
 * moment real product data replaces the seed.
 *
 * Called with the route's *base* filters only, never the shopper's own
 * selections: the track has to stay still while they drag it. Recomputing
 * bounds from the filtered set would shrink the rail under the handle they're
 * holding, which is the classic way this control turns unusable.
 */
export async function getPriceBounds(filters: ProductFilters): Promise<PriceBounds> {
  const { minPrice, maxPrice, ...rest } = filters;
  const agg = await db.product.aggregate({
    where: buildProductWhere(rest),
    _min: { price: true },
    _max: { price: true },
  });

  // Empty catalogue (or a view with no products) — a 0–0 slider is inert but
  // harmless, and the panel hides the control entirely in that case.
  const rawMin = agg._min.price ?? 0;
  const rawMax = agg._max.price ?? 0;

  return {
    min: Math.max(0, Math.floor(rawMin / PRICE_STEP) * PRICE_STEP),
    max: Math.ceil(rawMax / PRICE_STEP) * PRICE_STEP,
  };
}

export function parseProductFilters(searchParams: URLSearchParams): ProductFilters {
  const csv = (key: string) => {
    const v = searchParams.get(key);
    if (!v) return undefined;
    const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : undefined;
  };

  // FEATURE_SPEC_BATCH2.md §1 and API_SPEC.md's Batch 2 row both name these
  // params `priceMin`/`priceMax`, but the route shipped in Phase 1 with
  // `minPrice`/`maxPrice` and the PLP already calls it that way. Accepting
  // both costs one `??` and avoids either breaking the live caller or
  // shipping an endpoint that contradicts its own spec. `minPrice` stays
  // canonical (it's what's actually in use); the docs are updated to say so.
  const num = (...keys: string[]) => {
    for (const key of keys) {
      const raw = searchParams.get(key);
      if (raw === null || raw.trim() === "") continue;
      const parsed = Number(raw);
      // Reject NaN/Infinity/negatives rather than passing them to Prisma —
      // `gte: NaN` throws at the driver, which would turn a mangled URL into
      // a 500 instead of an unfiltered grid.
      if (!Number.isFinite(parsed) || parsed < 0) continue;
      return Math.round(parsed);
    }
    return undefined;
  };

  let minPrice = num("minPrice", "priceMin");
  let maxPrice = num("maxPrice", "priceMax");
  // An inverted range matches nothing and reads as a bug to the shopper, who
  // sees an empty grid with two filters that look reasonable. Swap instead.
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const gender = searchParams.get("gender");
  const sort = searchParams.get("sort") as ProductSort | null;
  const page = num("page");

  return {
    category: csv("category"),
    gender: gender === "NAR" || gender === "NARI" ? gender : undefined,
    material: csv("material"),
    stone: csv("stone"),
    occasion: csv("occasion"),
    minPrice,
    maxPrice,
    isNew: searchParams.get("isNew") === "true",
    isBestseller: searchParams.get("isBestseller") === "true",
    sort: sort ?? undefined,
    page,
  };
}
