import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { CIRCLE_JOIN_FEE, getCircleMembership, makeCircleJoinOrderId, qualifiesViaPastPurchase } from "@/lib/circle";
import { createCashfreeOrder } from "@/lib/cashfree";

// POST /api/circle/join — API_SPEC.md: "Join Circle (free-via-purchase or
// paid path)." See lib/circle.ts for the CIRCLE_JOIN_FEE placeholder caveat.
export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Sign in to join Circle." }, { status: 401 });

  const existing = await getCircleMembership(sessionUser.id);
  if (existing) {
    return NextResponse.json({ error: "You're already a Circle member." }, { status: 409 });
  }

  if (await qualifiesViaPastPurchase(sessionUser.id)) {
    const membership = await db.circleMembership.create({
      data: { userId: sessionUser.id, qualifiedVia: "PURCHASE" },
    });
    return NextResponse.json({ qualifiedVia: "PURCHASE", membership }, { status: 201 });
  }

  // No qualifying purchase — paid path via Cashfree, same pattern as
  // product checkout but with a synthesized order id (no Order row exists
  // for a membership fee). Webhook completes the join on payment success.
  const user = await db.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  try {
    const origin = new URL(req.url).origin;
    const session = await createCashfreeOrder({
      orderId: makeCircleJoinOrderId(sessionUser.id),
      amount: CIRCLE_JOIN_FEE,
      customerId: sessionUser.id,
      customerEmail: user.email,
      customerPhone: user.phone ?? "0000000000",
      returnUrl: `${origin}/account/circle`,
    });

    return NextResponse.json({ requiresPayment: true, paymentSessionId: session.paymentSessionId, fee: CIRCLE_JOIN_FEE });
  } catch (err) {
    console.error("Circle join payment session failed:", err);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
