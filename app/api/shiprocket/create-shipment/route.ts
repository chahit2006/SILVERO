import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createShipment } from "@/lib/shiprocket";

// POST /api/shiprocket/create-shipment — API_SPEC.md: "called internally
// after payment confirmation, not by the client." In practice the Cashfree
// webhook (app/api/cashfree/webhook) calls lib/shiprocket.ts's
// createShipment() directly — no HTTP hop needed for that path. This route
// exists for the documented API surface and as a manual retry path (e.g. the
// webhook's shipment call failed but payment succeeded) — same ownership
// check as /api/cashfree/create-order, and it's a no-op if a shipment
// already exists.
const schema = z.object({ orderId: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const requester = await getSessionUser();
  if (order.userId && (!requester || order.userId !== requester.id)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status !== "PAID") {
    return NextResponse.json({ error: "Order isn't paid yet." }, { status: 409 });
  }
  if (order.shiprocketShipmentId) {
    return NextResponse.json({ shipmentId: order.shiprocketShipmentId }); // already created — idempotent
  }

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

  if (!shipmentId) {
    return NextResponse.json({ error: "Shiprocket shipment creation failed. Try again shortly." }, { status: 502 });
  }

  await db.order.update({ where: { id: order.id }, data: { shiprocketShipmentId: shipmentId } });
  return NextResponse.json({ shipmentId });
}
