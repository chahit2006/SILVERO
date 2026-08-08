import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const user = await requireUser();
  const orderIds = (await db.order.findMany({ where: { userId: user.id }, select: { id: true } })).map(
    (o) => o.id,
  );
  const returns = orderIds.length
    ? await db.returnRequest.findMany({ where: { orderId: { in: orderIds } }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Returns</h1>
        <Link href="/account/returns/new" className="text-xs uppercase tracking-wide text-olive-dark underline">
          Start a return
        </Link>
      </div>

      {returns.length === 0 ? (
        <p className="rounded-card border border-dashed border-black/15 p-10 text-center text-sm text-text-dark/60">
          No return requests yet.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded-card border border-black/10">
          {returns.map((r) => (
            <li key={r.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p>Order #{r.orderId.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-text-dark/50">{r.reason}</p>
              </div>
              <span className="rounded-full bg-ivory px-3 py-1 text-xs uppercase tracking-wide">{r.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
