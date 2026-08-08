import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCartOwner } from "@/lib/cart";

// POST /api/registry/[shareSlug]/purchase — API_SPEC.md: "Guest marks an
// item purchased." Implemented as: add the item to the guest's cart, tagged
// with registryItemId. The item is only actually marked `purchased` once a
// real payment clears (Cashfree webhook) — see DATA_MODEL.md "Notes" on
// registryItemId for why this isn't an instant flip-a-flag endpoint.
const schema = z.object({ productId: z.string().min(1) });

export async function POST(req: Request, { params }: { params: { shareSlug: string } }) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const registry = await db.registry.findUnique({ where: { shareSlug: params.shareSlug } });
  if (!registry) return NextResponse.json({ error: "Registry not found." }, { status: 404 });

  const registryItem = await db.registryItem.findFirst({
    where: { registryId: registry.id, productId: parsed.data.productId },
  });
  if (!registryItem) {
    return NextResponse.json({ error: "Item not found on this registry." }, { status: 404 });
  }
  if (registryItem.purchased) {
    return NextResponse.json({ error: "This item has already been purchased." }, { status: 409 });
  }

  const owner = await getCartOwner();
  const cartItem = await db.cartItem.create({
    data: { ...owner, productId: parsed.data.productId, quantity: 1, registryItemId: registryItem.id },
    include: { product: true },
  });

  return NextResponse.json({ item: cartItem }, { status: 201 });
}
