import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCartOwner } from "@/lib/cart";
import { getStackPreset } from "@/lib/stack-presets";

// POST /api/stacks/[id]/add-to-cart — FEATURE_SPEC_BATCH2.md §3: "commit the
// (possibly customized) selection to the cart with a shared stackId."
const schema = z.object({
  selections: z.array(z.object({ categorySlug: z.string().min(1), productId: z.string().min(1) })).min(1),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const preset = getStackPreset(params.id);
  if (!preset) return NextResponse.json({ error: "Stack not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  // Every submitted slot has to be one this preset actually defines, and
  // every product has to genuinely belong to that slot's category — a
  // customer "customizing" a slot is still constrained to "swap for another
  // item in the same category" per the spec, not an arbitrary product.
  const presetSlugs = new Set(preset.slots.map((s) => s.categorySlug));
  for (const sel of parsed.data.selections) {
    if (!presetSlugs.has(sel.categorySlug)) {
      return NextResponse.json({ error: "That item isn't part of this stack." }, { status: 400 });
    }
  }

  const products = await db.product.findMany({
    where: { id: { in: parsed.data.selections.map((s) => s.productId) } },
    include: { category: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  for (const sel of parsed.data.selections) {
    const product = productById.get(sel.productId);
    if (!product || product.isArchived || product.category.slug !== sel.categorySlug) {
      return NextResponse.json({ error: "One of the selected items is no longer available." }, { status: 400 });
    }
    if (product.stock < 1) {
      return NextResponse.json({ error: `"${product.name}" is out of stock.` }, { status: 409 });
    }
  }

  const owner = await getCartOwner();
  const stackId = randomUUID();

  const items = await db.$transaction(
    parsed.data.selections.map((sel) =>
      db.cartItem.create({
        data: { ...owner, productId: sel.productId, quantity: 1, stackId },
        include: { product: true },
      }),
    ),
  );

  return NextResponse.json({ items, stackId }, { status: 201 });
}
