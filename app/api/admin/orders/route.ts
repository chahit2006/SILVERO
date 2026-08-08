import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";
import { isOrderStatus } from "@/lib/admin-orders";

// GET /api/admin/orders — ADMIN_PANEL_SPEC.md §6, "GET list with status filter".
//
// 404, not 403, for a non-admin: spec §1 says an unauthorised response must
// not reveal that the admin surface exists, and that applies to the API just
// as much as to the pages. Same reason there is no distinction here between
// "logged out", "logged in as a customer" and "logged in as a Circle member".
export async function GET(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const statusParam = new URL(req.url).searchParams.get("status");
  if (statusParam !== null && !isOrderStatus(statusParam)) {
    return NextResponse.json({ error: "Unknown status filter." }, { status: 400 });
  }
  // Unlike the page (which quietly falls back to "All" on a bad status), the
  // API rejects one — a caller passing a status the server doesn't recognise
  // wants to know, not to receive every order as if it had asked for that.
  const status = statusParam === null ? null : statusParam;

  const orders = await db.order.findMany({
    where: status ? { status } : undefined,
    select: {
      id: true,
      status: true,
      subtotal: true,
      shipping: true,
      total: true,
      createdAt: true,
      userId: true,
      contactFirstName: true,
      contactLastName: true,
      contactEmail: true,
      contactPhone: true,
      cashfreeOrderId: true,
      shiprocketShipmentId: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // matches the list page's cap — see the note there
  });

  return NextResponse.json({ orders });
}
