import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCartOwner } from "@/lib/cart";

// PATCH/DELETE /api/cart/[itemId] — API_SPEC.md.
// SECURITY_CHECKLIST.md §2: never trust that *an* item with this ID exists —
// verify it belongs to the requesting owner (session user or guest cookie).
async function loadOwnedItem(itemId: string) {
  const owner = await getCartOwner();
  const item = await db.cartItem.findUnique({ where: { id: itemId } });
  if (!item) return { owner, item: null };

  const belongsToOwner = owner.userId
    ? item.userId === owner.userId
    : item.sessionId === owner.sessionId;

  return { owner, item: belongsToOwner ? item : null };
}

const updateSchema = z.object({
  quantity: z.number().int().min(1).max(10).optional(),
  size: z.string().max(20).nullable().optional(),
  isGift: z.boolean().optional(),
  giftWrap: z.enum(["signature", "premium"]).nullable().optional(),
  giftNote: z.string().max(200).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { itemId: string } }) {
  const { item } = await loadOwnedItem(params.itemId);
  if (!item) {
    return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const updated = await db.cartItem.update({
    where: { id: item.id },
    data: parsed.data,
    include: { product: true },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: { params: { itemId: string } }) {
  const { item } = await loadOwnedItem(params.itemId);
  if (!item) {
    return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
  }

  await db.cartItem.delete({ where: { id: item.id } });
  return NextResponse.json({ success: true });
}
