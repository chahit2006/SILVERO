import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";

// GET /api/admin/stats?days=7|30|90 — ADMIN_PANEL_SPEC.md §2 dashboard aggregates.
//
// "Paid" here means status IN (PAID, SHIPPED, DELIVERED) — DATA_MODEL.md's
// "Notes" on the missing Order.paymentStatus field explains why; same
// derivation lib/admin-orders.ts uses, just inlined as SQL for these
// aggregate queries rather than pulled through that file's JS helper.
const PAID_STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const;
const VALID_PERIODS = [7, 30, 90] as const;

export async function GET(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const daysParam = parseInt(searchParams.get("days") ?? "7", 10);
  const days = (VALID_PERIODS as readonly number[]).includes(daysParam) ? daysParam : 7;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const periodStart = new Date(todayStart);
  periodStart.setDate(periodStart.getDate() - (days - 1));

  const [todayRevenue, ordersToday, pendingOrders, lowStock, dailyRows, topProductRows, categoryRows] =
    await Promise.all([
      db.order.aggregate({
        where: { status: { in: [...PAID_STATUSES] }, createdAt: { gte: todayStart } },
        _sum: { total: true },
      }),
      db.order.count({ where: { createdAt: { gte: todayStart } } }),
      db.order.count({ where: { status: "PENDING" } }),
      db.product.count({ where: { stock: { lt: 5 }, isArchived: false } }),

      db.$queryRaw<{ day: Date; revenue: bigint }[]>`
        SELECT DATE("createdAt") as day, SUM(total) as revenue
        FROM "Order"
        WHERE status IN ('PAID','SHIPPED','DELIVERED') AND "createdAt" >= ${periodStart}
        GROUP BY DATE("createdAt")
        ORDER BY day ASC
      `,

      db.$queryRaw<{ id: string; name: string; units: bigint }[]>`
        SELECT p.id, p.name, SUM(oi.quantity) as units
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "Product" p ON p.id = oi."productId"
        WHERE o.status IN ('PAID','SHIPPED','DELIVERED') AND o."createdAt" >= ${periodStart}
        GROUP BY p.id, p.name
        ORDER BY units DESC
        LIMIT 5
      `,

      db.$queryRaw<{ id: string; name: string; revenue: bigint }[]>`
        SELECT c.id, c.name, SUM(oi.quantity * oi.price) as revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "Product" p ON p.id = oi."productId"
        JOIN "Category" c ON c.id = p."categoryId"
        WHERE o.status IN ('PAID','SHIPPED','DELIVERED') AND o."createdAt" >= ${periodStart}
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `,
    ]);

  // Fill in zero-revenue days — GROUP BY only returns days that had an order.
  const revenueByDay = new Map(dailyRows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.revenue)]));
  const series: { date: string; revenue: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(periodStart);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, revenue: revenueByDay.get(key) ?? 0 });
  }

  return NextResponse.json({
    overview: {
      todayRevenue: todayRevenue._sum.total ?? 0,
      ordersToday,
      pendingOrders,
      lowStock,
    },
    salesSeries: series,
    topProducts: topProductRows.map((r) => ({ id: r.id, name: r.name, units: Number(r.units) })),
    categoryBreakdown: categoryRows.map((r) => ({ id: r.id, name: r.name, revenue: Number(r.revenue) })),
  });
}
