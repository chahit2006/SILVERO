import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { PendingPoller } from "@/components/checkout/PendingPoller";

export const dynamic = "force-dynamic";

// Public route (PRD.md §2 sitemap — /order/[id]/confirmation, no /account
// prefix) so a guest checkout has somewhere to land. The order's cuid id is
// the access control — same reasoning as /api/cashfree/create-order.
// CLAUDE.md constraint #6: never treat arriving on this page as proof of
// payment — it only ever displays Order.status as the webhook last set it.
export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <PendingPoller isPending={order.status === "PENDING"} />

      <StatusBanner status={order.status} />

      <div className="mt-8 rounded-card border border-black/10 p-5">
        <p className="mb-1 text-xs uppercase tracking-wide text-text-dark/50">Order #{order.id.slice(-8).toUpperCase()}</p>
        <p className="mb-4 text-xs text-text-dark/40">
          Shipping to {order.shippingLine1}, {order.shippingCity}, {order.shippingState} {order.shippingPincode}
        </p>

        <ul className="divide-y divide-black/10">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3 text-sm">
              <span>
                {item.product.name} {item.size ? `(Size ${item.size})` : ""} × {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 space-y-1 border-t border-black/10 pt-3 text-sm">
          <div className="flex justify-between text-text-dark/60">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-text-dark/60">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/shop" className="text-sm uppercase tracking-wide text-olive-dark underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

function StatusBanner({ status }: { status: string }) {
  if (status === "PAID" || status === "SHIPPED" || status === "DELIVERED") {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl">Thank you — order confirmed</h1>
        <p className="mt-2 text-sm text-text-dark/60">A confirmation has been recorded on your order.</p>
      </div>
    );
  }
  if (status === "CANCELLED") {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl">Payment didn&apos;t go through</h1>
        <p className="mt-2 text-sm text-text-dark/60">Your order was cancelled and the items are back in stock. No charge was made.</p>
      </div>
    );
  }
  return (
    <div className="text-center">
      <h1 className="font-display text-3xl">Confirming your payment…</h1>
      <p className="mt-2 text-sm text-text-dark/60">
        This usually takes a few seconds. This page will update automatically.
      </p>
    </div>
  );
}
