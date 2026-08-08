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
export async function getProducts(filters: ProductFilters) {
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.ProductWhereInput = {
    ...(filters.category?.length ? { category: { slug: { in: filters.category } } } : {}),
    ...(filters.gender ? { category: { gender: filters.gender } } : {}),
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

export function parseProductFilters(searchParams: URLSearchParams): ProductFilters {
  const csv = (key: string) => {
    const v = searchParams.get(key);
    if (!v) return undefined;
    const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : undefined;
  };
  const gender = searchParams.get("gender");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") as ProductSort | null;

  return {
    category: csv("category"),
    gender: gender === "NAR" || gender === "NARI" ? gender : undefined,
    material: csv("material"),
    stone: csv("stone"),
    occasion: csv("occasion"),
    minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
    isNew: searchParams.get("isNew") === "true",
    isBestseller: searchParams.get("isBestseller") === "true",
    sort: sort ?? undefined,
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
  };
}
