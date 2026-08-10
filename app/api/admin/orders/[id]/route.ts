import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";
import { ORDER_STATUSES, canTransition, STATUS_LABELS } from "@/lib/admin-orders";
import { restockItems } from "@/lib/stock";

// ADMIN_PANEL_SPEC.md §6 — "GET detail, PATCH status".

// PENDING and PAID are absent from this schema by construction, not by
// filtering: the enum a request is even allowed to *name* excludes them, so
// "mark this paid" is rejected at parse time, before any order is loaded.
// CLAUDE.md constraint #6 — the Cashfree webhook is the only source of truth
// for paid, and this route must not be a second one.
const patchSchema = z.object({
  status: z.enum(["SHIPPED", "DELIVERED", "CANCELLED"]),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: { select: { id: true, name: true, slug: true } } } } },
  });
  if (!order) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ order });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const attempted = (body as { status?: unknown } | null)?.status;
    // A rejected PENDING/PAID is worth a log line — it is either a UI bug or
    // someone poking at the endpoint, and both are things to know about.
    if (attempted === "PENDING" || attempted === "PAID") {
      console.warn(
        `Admin ${admin.email} attempted to set order ${params.id} to ${attempted} — refused; payment status is webhook-only.`
      );
      return NextResponse.json(
        { error: "Payment status is set by the Cashfree webhook and can't be changed here." },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: `Status must be one of: ${ORDER_STATUSES.filter((s) => s !== "PENDING" && s !== "PAID").join(", ")}.` },
      { status: 400 }
    );
  }

  const order = await db.order.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, items: { select: { productId: true, quantity: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (order.status === parsed.data.status) {
    return NextResponse.json({ order }); // idempotent — a double-click is not an error
  }

  if (!canTransition(order.status, parsed.data.status)) {
    return NextResponse.json(
      {
        error: `Can't move an order from ${STATUS_LABELS[order.status]} to ${STATUS_LABELS[parsed.data.status]}.`,
      },
      { status: 422 }
    );
  }

  // Note what this deliberately does NOT do: cancelling does not refund.
  // Spec §5 is explicit that refunds are processed by hand in the Cashfree
  // dashboard; no refund API is planned. Restocking, on the other hand, DOES
  // happen below — stock is decremented at /api/checkout time regardless of
  // payment status (ARCHITECTURE.md), so PENDING, PAID, and SHIPPED orders
  // all hold a real lock that a cancellation must release.
  let updated;
  try {
    updated = await db.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id: order.id,
          // Guards against two admins acting on the same order at once: the row
          // must still hold the status the transition was validated against, or
          // this matches zero rows and the transaction is rolled back below.
          status: order.status,
        },
        data: { status: parsed.data.status },
      });
      if (result.count === 0) {
        throw new Error("STALE_ORDER");
      }

      if (parsed.data.status === "CANCELLED") {
        await restockItems(tx, order.items);
      }

      return tx.order.findUniqueOrThrow({ where: { id: order.id }, select: { id: true, status: true } });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "STALE_ORDER") {
      return NextResponse.json(
        { error: "This order changed while you were viewing it. Reload and try again." },
        { status: 409 }
      );
    }
    throw err;
  }

  console.info(`Admin ${admin.email} set order ${order.id}: ${order.status} → ${updated.status}`);

  return NextResponse.json({ order: updated });
}
