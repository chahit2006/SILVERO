import { NextResponse } from "next/server";
import { getProducts, parseProductFilters } from "@/lib/products";

// GET /api/products — API_SPEC.md. Filter/sort logic lives in lib/products.ts
// (also used by every /shop/* server component's initial SSR fetch) so
// there's exactly one place that builds this query — same principle as
// lib/stock.ts for the stock-lock transaction.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const result = await getProducts(parseProductFilters(searchParams));
  return NextResponse.json(result);
}
