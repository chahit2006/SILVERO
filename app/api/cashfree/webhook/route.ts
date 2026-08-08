import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCashfreeWebhookSignature, type CashfreeWebhookPayload } from "@/lib/cashfree";
import { createShipment } from "@/lib/shiprocket";
import { parseCircleJoinOrderId } from "@/lib/circle";

// POST /api/cashfree/webhook — API_SPEC.md / SECURITY_CHECKLIST.md §5 /
// CLAUDE.md constraint #6: THE ONLY place an order gets marked "paid."
// Never trust the frontend return_url redirect for this — Cashfree can
// redirect the browser back before the webhook has even fired.
export async function POST(req: Request) {
  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");

  // Raw text, not req.json() — signature verification needs the exact bytes
  // Cashfree signed, and re-serializing parsed JSON isn't guaranteed to
  // produce an identical byte string.
  const rawBody = await req.text();

  if (!signature || !timestamp || !verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    console.error("Cashfree webhook: signature verification failed.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: CashfreeWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const orderId = payload?.data?.order?.order_id;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id." }, { status: 400 });
  }

  // Circle-join payments use a synthesized order id, not a real Order row —
  // lib/circle.ts's paid-membership path. Handle and return before the
  // product-order lookup below.
  const circleUserId = parseCircleJoinOrderId(orderId);
  if (circleUserId) {
    return handleCircleJoinWebhook(circleUserId, payload);
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) {
    // Not a product order — check whether it's a gift card purchase
    // (GiftCard.id doubles as the Cashfree order_id, same as Order).
    const giftCard = await db.giftCard.findUnique({ where: { id: orderId } });
    if (giftCard) {
      return handleGiftCardWebhook(giftCard, payload);
    }

    // Ack 200 anyway — returning an error just makes Cashfree retry a
    // webhook for an order id that will never exist on our side.
    console.error(`Cashfree webhook: unknown order_id ${orderId}`);
    return NextResponse.json({ received: true });
  }

  // Idempotency — webhooks can (and do) arrive more than once.
  if (order.status !== "PENDING") {
    return NextResponse.json({ received: true });
  }

  const paymentStatus = payload.data.payment?.payment_status;

  if (payload.type === "PAYMENT_SUCCESS_WEBHOOK" || paymentStatus === "SUCCESS") {
    await db.order.update({ where: { id: order.id }, data: { status: "PAID" } });

    const shipmentId = await createShipment({
      orderId: order.id,
      createdAt: order.createdAt,
      contactFirstName: order.contactFirstName,
      contactLastName: order.contactLastName,
      contactEmail: order.contactEmail,
      contactPhone: order.contactPhone,
      shippingLine1: order.shippingLine1,
      shippingLine2: order.shippingLine2,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPincode: order.shippingPincode,
      total: order.total,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        weightGrams: item.product.weightGrams,
      })),
    });
    // A failed shipment call here must NOT undo the payment confirmation —
    // it just needs manual follow-up (retry via /api/shiprocket/create-shipment).
    if (shipmentId) {
      await db.order.update({ where: { id: order.id }, data: { shiprocketShipmentId: shipmentId } });
    } else {
      console.error(`Order ${order.id} paid but Shiprocket shipment creation failed — needs manual retry.`);
    }

    // Registry gifting (PRD.md §4 / DATA_MODEL.md "Notes" on
    // registryItemId) — only now, on confirmed payment, is a registry item
    // actually marked purchased.
    const registryItems = order.items.filter((item) => item.registryItemId);
    for (const item of registryItems) {
      await db.registryItem.update({
        where: { id: item.registryItemId! },
        data: { purchased: true, purchasedByGuestName: `${order.contactFirstName} ${order.contactLastName}`.trim() },
      });
    }
  } else if (payload.type === "PAYMENT_FAILED_WEBHOOK" || paymentStatus === "FAILED") {
    // ARCHITECTURE.md checkout flow step 7 — release the stock lock taken
    // at /api/checkout time.
    await db.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    });
  }
  // Other webhook types (e.g. USER_DROPPED, pending states) are intentionally
  // no-ops — the order just stays PENDING until a terminal webhook arrives.

  return NextResponse.json({ received: true });
}

async function handleGiftCardWebhook(giftCard: { id: string; isPaid: boolean }, payload: CashfreeWebhookPayload) {
  if (giftCard.isPaid) return NextResponse.json({ received: true }); // idempotent

  const paymentStatus = payload.data.payment?.payment_status;
  if (payload.type === "PAYMENT_SUCCESS_WEBHOOK" || paymentStatus === "SUCCESS") {
    await db.giftCard.update({ where: { id: giftCard.id }, data: { isPaid: true } });
    // Scheduled/immediate delivery email would go here — no transactional
    // email provider configured yet (same gap noted elsewhere). The code is
    // viewable at /gifting/gift-cards/[id]/confirmation in the meantime.
  }
  // Failure case: row just stays isPaid=false, functionally inert — same
  // treatment as an abandoned Order.

  return NextResponse.json({ received: true });
}

async function handleCircleJoinWebhook(userId: string, payload: CashfreeWebhookPayload) {
  const existing = await db.circleMembership.findUnique({ where: { userId } });
  if (existing) return NextResponse.json({ received: true }); // idempotent — already joined

  const paymentStatus = payload.data.payment?.payment_status;
  if (payload.type === "PAYMENT_SUCCESS_WEBHOOK" || paymentStatus === "SUCCESS") {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      console.error(`Circle join webhook: unknown user ${userId}`);
      return NextResponse.json({ received: true });
    }
    // Membership row and role are written together — DATA_MODEL.md requires
    // them to always agree, and a half-applied join (row without role, or
    // role without row) is exactly what a webhook retried mid-failure would
    // otherwise leave behind. ADMIN is never overwritten: an admin who pays
    // to join Circle keeps their admin rights, and requireAdmin() is the only
    // thing that reads that value.
    await db.$transaction([
      db.circleMembership.create({ data: { userId, qualifiedVia: "PAID" } }),
      db.user.updateMany({ where: { id: userId, role: "CUSTOMER" }, data: { role: "CIRCLE" } }),
    ]);
  }
  // Failure case: nothing to release (no stock/order was touched for a
  // membership payment) — just don't create the membership.

  return NextResponse.json({ received: true });
}
