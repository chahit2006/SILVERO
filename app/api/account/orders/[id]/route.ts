import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/account/orders/[id] — API_SPEC.md.
// SECURITY_CHECKLIST.md §2: must verify the order belongs to the requesting
// user, not just that *some* order with this ID exists.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } } },
  });

  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
