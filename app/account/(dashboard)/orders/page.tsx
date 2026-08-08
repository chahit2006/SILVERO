import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Orders</h1>

      {orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <ul className="divide-y divide-black/10 rounded-card border border-black/10">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">Order #{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-text-dark/50">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-ivory px-3 py-1 text-xs uppercase tracking-wide">
                  {order.status}
                </span>
                <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                <Link href={`/account/orders/${order.id}`} className="text-xs uppercase tracking-wide text-olive-dark underline">
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Checkout (order creation) is Phase 2 — so a fresh account will always see
// this until that's built, which is expected, not a bug.
function EmptyOrders() {
  return (
    <div className="rounded-card border border-dashed border-black/15 p-10 text-center">
      <p className="text-sm text-text-dark/60">You haven&apos;t placed any orders yet.</p>
      <Link href="/shop" className="mt-3 inline-block text-sm uppercase tracking-wide text-olive-dark underline">
        Start shopping
      </Link>
    </div>
  );
}
