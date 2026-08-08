import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { generateUniqueShareSlug } from "@/lib/registry";

// POST /api/registry — API_SPEC.md: "Create a registry." Registry.userId is
// required in DATA_MODEL.md — no guest-owned registries, only guest
// fulfillment of someone else's.
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  occasion: z.string().trim().min(1).max(100),
  eventDate: z.string().datetime().optional(),
  productIds: z.array(z.string().min(1)).min(1).max(50),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to create a registry." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the form for errors." }, { status: 400 });

  const products = await db.product.findMany({ where: { id: { in: parsed.data.productIds } }, select: { id: true } });
  if (products.length === 0) {
    return NextResponse.json({ error: "Add at least one valid product." }, { status: 400 });
  }

  const shareSlug = await generateUniqueShareSlug();

  const registry = await db.registry.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      occasion: parsed.data.occasion,
      eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
      shareSlug,
      items: { create: products.map((p) => ({ productId: p.id })) },
    },
    include: { items: true },
  });

  return NextResponse.json({ registry }, { status: 201 });
}
