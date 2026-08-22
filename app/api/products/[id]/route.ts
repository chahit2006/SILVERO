import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products/[id] — used by ProductDetailDrawer. API_SPEC.md
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    // sizeStocks drives the size selector's out-of-stock state
    // (SILVERO_Full_Spec_Status_1.md Part 1 #8) — a size with stock <= 0
    // renders greyed/struck-through rather than being silently selectable.
    include: { category: true, sizeStocks: true },
  });

  // Archived products 404 here too, same as the listing/search — a
  // soft-deleted product shouldn't be independently viewable by a direct id
  // lookup any more than it should show up in a grid.
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ product });
}
