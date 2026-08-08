import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

// One invoice per paid order — no separate Invoice model in DATA_MODEL.md,
// Order is the source of truth. Downloadable PDF invoices would be a Phase 2+
// addition once checkout produces real paid orders.
export default async function InvoicesPage() {
  const user = await requireUser();
  const orders = await db.order.findMany({
    where: { userId: user.id, status: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Invoices</h1>

      {orders.length === 0 ? (
        <p className="rounded-card border border-dashed border-black/15 p-10 text-center text-sm text-text-dark/60">
          No invoices yet — these appear once you have a paid order.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded-card border border-black/10">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between p-4 text-sm">
              <span>Invoice — Order #{order.id.slice(-8).toUpperCase()}</span>
              <span className="text-text-dark/50">{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
              <span className="font-medium">{formatPrice(order.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
