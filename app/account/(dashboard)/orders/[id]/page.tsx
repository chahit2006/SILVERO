import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } } },
  });

  // SECURITY_CHECKLIST.md §2 — must belong to the requesting user, not just exist.
  if (!order || order.userId !== user.id) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Order #{order.id.slice(-8).toUpperCase()}</h1>
        <Link href={`/account/orders/${order.id}/tracking`} className="text-xs uppercase tracking-wide text-olive-dark underline">
          Track order
        </Link>
      </div>

      <p className="mb-4 text-xs uppercase tracking-wide text-text-dark/50">
        Placed {new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.status}
      </p>

      <ul className="divide-y divide-black/10 rounded-card border border-black/10">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{item.product.name}</p>
              <p className="text-xs text-text-dark/50">
                {item.size ? `Size ${item.size} · ` : ""}Qty {item.quantity}
              </p>
            </div>
            <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-dark/60">Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-dark/60">Shipping</span>
          <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
