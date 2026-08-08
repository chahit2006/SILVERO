import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createCashfreeOrder } from "@/lib/cashfree";

// POST /api/cashfree/create-order — API_SPEC.md. Creates the Cashfree
// payment session for an already-created (PENDING) Order — /api/checkout is
// what actually creates the Order + locks stock.
const schema = z.object({ orderId: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "This order has already been processed." }, { status: 409 });
  }

  // Defense in depth: if this order belongs to a logged-in user, only that
  // user (or a guest with no session at all — the checkout redirect flow)
  // can request its payment session. A guest order (userId null) has no
  // identity to check against — knowledge of the order id is the capability,
  // same as the public /order/[id]/confirmation page.
  const requester = await getSessionUser();
  if (order.userId && requester && order.userId !== requester.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  try {
    const origin = new URL(req.url).origin;
    const session = await createCashfreeOrder({
      orderId: order.id,
      amount: order.total,
      customerId: order.userId ?? `guest-${order.id}`,
      customerEmail: order.contactEmail,
      customerPhone: order.contactPhone,
      returnUrl: `${origin}/order/${order.id}/confirmation`,
    });

    await db.order.update({ where: { id: order.id }, data: { cashfreeOrderId: session.cfOrderId } });

    return NextResponse.json({ paymentSessionId: session.paymentSessionId });
  } catch (err) {
    console.error("Cashfree create-order failed:", err);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
