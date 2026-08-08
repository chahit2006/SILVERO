import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCartOwner, cartWhere } from "@/lib/cart";

// GET/POST /api/recently-viewed — not in API_SPEC.md (the
// /account/recently-viewed page needs a way to read and record views, and
// there wasn't one documented). Flagged for API_SPEC.md to be updated.
// Reuses the same guest-cookie identity as the cart (lib/cart.ts) rather
// than minting a second guest cookie.

const MAX_STORED = 20;

export async function GET() {
  const owner = await getCartOwner();
  const views = await db.recentlyViewed.findMany({
    where: cartWhere(owner),
    include: { product: true },
    orderBy: { viewedAt: "desc" },
    take: MAX_STORED,
  });
  return NextResponse.json({ views });
}

const schema = z.object({ productId: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const product = await db.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const owner = await getCartOwner();

  await db.recentlyViewed.deleteMany({
    where: { ...cartWhere(owner), productId: parsed.data.productId },
  });
  await db.recentlyViewed.create({
    data: { ...owner, productId: parsed.data.productId },
  });

  // Trim to the most recent MAX_STORED entries for this owner.
  const stale = await db.recentlyViewed.findMany({
    where: cartWhere(owner),
    orderBy: { viewedAt: "desc" },
    skip: MAX_STORED,
    select: { id: true },
  });
  if (stale.length) {
    await db.recentlyViewed.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
