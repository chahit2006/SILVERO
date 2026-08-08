import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCartOwner, cartWhere } from "@/lib/cart";

// GET /api/cart, POST /api/cart — API_SPEC.md. Cart is scoped to the
// logged-in user or a guest cookie (see lib/cart.ts) — never trust a
// client-supplied userId/sessionId.
export async function GET() {
  const owner = await getCartOwner();
  const items = await db.cartItem.findMany({
    where: cartWhere(owner),
    include: { product: true },
    orderBy: { id: "asc" },
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return NextResponse.json({ items, subtotal });
}

const addItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().max(20).optional(),
  quantity: z.number().int().min(1).max(10).default(1),
  isGift: z.boolean().optional(),
  giftWrap: z.enum(["signature", "premium"]).optional(),
  giftNote: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { productId, size, quantity, isGift, giftWrap, giftNote } = parsed.data;

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const owner = await getCartOwner();

  // Same product+size already in the cart → bump quantity instead of a duplicate row.
  const existing = await db.cartItem.findFirst({
    where: { ...cartWhere(owner), productId, size: size ?? null },
  });

  const item = existing
    ? await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + quantity, 10) },
        include: { product: true },
      })
    : await db.cartItem.create({
        data: {
          ...owner,
          productId,
          size,
          quantity,
          isGift,
          giftWrap,
          giftNote,
        },
        include: { product: true },
      });

  return NextResponse.json({ item }, { status: 201 });
}
