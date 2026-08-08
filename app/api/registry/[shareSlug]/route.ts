import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/registry/[shareSlug] — API_SPEC.md: "Public registry view
// (guest-accessible)." No auth — the unguessable shareSlug is the access
// control, same pattern as /order/[id]/confirmation. Only what a gift-giver
// needs is returned — not the owner's email/address.
export async function GET(_req: Request, { params }: { params: { shareSlug: string } }) {
  const registry = await db.registry.findUnique({
    where: { shareSlug: params.shareSlug },
    include: {
      user: { select: { firstName: true, lastName: true } },
      items: { include: { product: true } },
    },
  });

  if (!registry) {
    return NextResponse.json({ error: "Registry not found." }, { status: 404 });
  }

  return NextResponse.json({
    name: registry.name,
    occasion: registry.occasion,
    eventDate: registry.eventDate,
    ownerName: `${registry.user.firstName} ${registry.user.lastName}`.trim(),
    items: registry.items,
  });
}
