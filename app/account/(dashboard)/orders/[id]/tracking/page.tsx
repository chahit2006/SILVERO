import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const STEPS = ["PENDING", "PAID", "SHIPPED", "DELIVERED"] as const;

// Live carrier tracking depends on Shiprocket (Phase 2 — ARCHITECTURE.md/
// TECH_STACK.md). Until then this just visualizes Order.status.
export default async function OrderTrackingPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const order = await db.order.findUnique({ where: { id: params.id } });
  if (!order || order.userId !== user.id) notFound();

  const currentIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl">Track Order #{order.id.slice(-8).toUpperCase()}</h1>

      {order.status === "CANCELLED" ? (
        <p className="rounded-card bg-red-50 p-4 text-sm text-red-700">This order was cancelled.</p>
      ) : (
        <ol className="space-y-6">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-4">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  i <= currentIndex ? "bg-olive-dark text-ivory" : "border border-black/15 text-text-dark/30"
                }`}
              >
                {i <= currentIndex ? "✓" : i + 1}
              </span>
              <span className={i <= currentIndex ? "text-sm" : "text-sm text-text-dark/40"}>
                {step.charAt(0) + step.slice(1).toLowerCase()}
              </span>
            </li>
          ))}
        </ol>
      )}

      {!order.shiprocketShipmentId && order.status !== "PENDING" && (
        <p className="mt-8 text-xs text-text-dark/40">
          Carrier tracking details will appear here once shipment creation is connected.
        </p>
      )}
    </div>
  );
}
