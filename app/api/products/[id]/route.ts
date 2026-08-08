import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products/[id] — used by ProductDetailDrawer. API_SPEC.md
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: { category: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ product });
}
