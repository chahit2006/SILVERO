import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET/POST/DELETE /api/account/wishlist — API_SPEC.md.
// WishlistItem has no login-free path (composite @@id([userId, productId]) in
// DATA_MODEL.md) — wishlist requires an account, unlike guest carts.

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const items = await db.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });
  return NextResponse.json({ items });
}

const productIdSchema = z.object({ productId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = productIdSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const product = await db.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const item = await db.wishlistItem.upsert({
    where: { userId_productId: { userId: user.id, productId: parsed.data.productId } },
    update: {},
    create: { userId: user.id, productId: parsed.data.productId },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = productIdSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  await db.wishlistItem
    .delete({
      where: { userId_productId: { userId: user.id, productId: parsed.data.productId } },
    })
    .catch(() => null); // already removed — treat as success

  return NextResponse.json({ success: true });
}
