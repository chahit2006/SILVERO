import { db } from "./db";

// Single source of truth for search matching — used by /api/search (predictive
// results in SearchOverlay) and the /search results page's SSR fetch.
export async function searchProducts(q: string, take = 24) {
  if (!q.trim()) return [];

  return db.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { material: { contains: q, mode: "insensitive" } },
        { occasion: { contains: q, mode: "insensitive" } },
      ],
    },
    take,
  });
}
