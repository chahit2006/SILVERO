import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import {
  ORDER_STATUSES,
  STATUS_LABELS,
  derivePaymentLabel,
  isOrderStatus,
} from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

// ADMIN_PANEL_SPEC.md §4 — order list, filterable by status.
//
// This is a server component reading Prisma directly, matching every other
// page in the app (see app/account/(dashboard)/orders/page.tsx). The
// /api/admin/orders route specified in §6 exists alongside it for
// programmatic/client use, not as a hop this page makes through its own HTTP
// layer. Both sit behind the same admin check.
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  // Anything that isn't a real OrderStatus (typo, hand-edited URL) falls back
  // to "All" rather than erroring or silently returning zero rows.
  const activeStatus = isOrderStatus(searchParams.status) ? searchParams.status : null;

  const [orders, counts] = await Promise.all([
    db.order.findMany({
      where: activeStatus ? { status: activeStatus } : undefined,
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        contactFirstName: true,
        contactLastName: true,
        contactEmail: true,
        userId: true,
      },
      orderBy: { createdAt: "desc" },
      // Deliberate cap: an unpaginated findMany is fine at launch volume and
      // becomes a problem quietly. 100 newest + an explicit notice below beats
      // a page that degrades without telling anyone. Add real pagination when
      // this notice starts showing up.
      take: 100,
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countFor = (status: string) => counts.find((c) => c.status === status)?._count._all ?? 0;
  const totalCount = counts.reduce((sum, c) => sum + c._count._all, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <FilterTab href="/admin/orders" label="All" count={totalCount} active={!activeStatus} />
        {ORDER_STATUSES.map((status) => (
          <FilterTab
            key={status}
            href={`/admin/orders?status=${status}`}
            label={STATUS_LABELS[status]}
            count={countFor(status)}
            active={activeStatus === status}
          />
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-card border border-dashed border-black/15 p-10 text-center">
          <p className="text-sm text-text-dark/60">
            {activeStatus
              ? `No orders with status ${STATUS_LABELS[activeStatus]}.`
              : "No orders yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/10">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-black/10 bg-ivory/60 text-left">
              <tr className="text-xs uppercase tracking-wide text-text-dark/60">
                <th className="p-3 font-medium">Order</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Payment</th>
                <th className="p-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-ivory/40">
                  <td className="p-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-olive-dark underline"
                    >
                      #{order.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className="block">
                      {`${order.contactFirstName} ${order.contactLastName}`.trim() || "—"}
                    </span>
                    <span className="block text-xs text-text-dark/50">
                      {order.contactEmail}
                      {/* Guest checkout is supported, so a missing userId is
                          normal, not a data problem — label it so nobody goes
                          looking for the "missing" account. */}
                      {order.userId ? "" : " · guest"}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap text-text-dark/70">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-3">
                    <span className="whitespace-nowrap rounded-full bg-ivory px-3 py-1 text-xs uppercase tracking-wide">
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="p-3 text-text-dark/70">{derivePaymentLabel(order.status)}</td>
                  <td className="p-3 text-right font-medium">{formatPrice(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orders.length === 100 && (
        <p className="mt-3 text-xs text-text-dark/50">
          Showing the 100 most recent. Narrow by status to see older orders — pagination is not
          built yet.
        </p>
      )}
    </div>
  );
}

function FilterTab({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-wide transition-colors duration-150 ${
        active ? "bg-olive-dark text-ivory" : "bg-ivory text-text-dark/70 hover:bg-ivory/70"
      }`}
    >
      {label} ({count})
    </Link>
  );
}
