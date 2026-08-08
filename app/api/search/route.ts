import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchProducts } from "@/lib/search";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// GET /api/search?q=... — API_SPEC.md. Rate-limited per
// SECURITY_CHECKLIST.md §9 ("an unthrottled search endpoint is an easy
// target for scraping/DoS"). Response shape consumed by SearchOverlay.
// Product matching logic lives in lib/search.ts (shared with /search page).
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`search:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const [products, categories] = await Promise.all([
    searchProducts(q, 8),
    db.category.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { englishName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
    }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({ ...p, image: p.images[0] })),
    categories,
  });
}
