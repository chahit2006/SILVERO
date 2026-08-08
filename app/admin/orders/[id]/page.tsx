import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { ALLOWED_TRANSITIONS, STATUS_LABELS, derivePaymentLabel } from "@/lib/admin-orders";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export const dynamic = "force-dynamic";

// ADMIN_PANEL_SPEC.md §4 — order detail: full item list, customer + shipping
// address, payment status, Cashfree order ID, Shiprocket shipment ID, and the
// manual status update.
//
// Unlike /account/orders/[id] there is no ownership check here, and that is
// the point: an admin's job is to look at other people's orders. The gate is
// the layout's requireAdmin(), and it is the only one that applies.
export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: { select: { name: true, slug: true } } } },
      user: { select: { id: true, email: true } },
    },
  });

  if (!order) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/orders" className="text-xs uppercase tracking-wide text-olive-dark underline">
          ← All orders
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h2 className="font-display text-2xl">Order #{order.id.slice(-8).toUpperCase()}</h2>
          <span className="rounded-full bg-ivory px-3 py-1 text-xs uppercase tracking-wide">
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <p className="mt-1 text-xs text-text-dark/50">
          Placed{" "}
          {new Date(order.createdAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}{" "}
          · Full ID {order.id}
        </p>
      </div>

      <section className="mb-8 rounded-card border border-black/10 p-4">
        <h3 className="mb-3 text-xs uppercase tracking-wide text-text-dark/50">Update status</h3>
        <OrderStatusForm
          orderId={order.id}
          currentStatus={order.status}
          options={ALLOWED_TRANSITIONS[order.status]}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Customer">
          <Field label="Name" value={`${order.contactFirstName} ${order.contactLastName}`.trim()} />
          <Field label="Email" value={order.contactEmail} />
          <Field label="Phone" value={order.contactPhone} />
          <Field
            label="Account"
            // Snapshot fields are the source of truth for an order (see the
            // schema comment on Order) — the linked account is extra context,
            // and its absence just means guest checkout.
            value={order.user ? order.user.email : "Guest checkout — no account"}
          />
        </Panel>

        <Panel title="Shipping address">
          <Field label="Line 1" value={order.shippingLine1} />
          {order.shippingLine2 && <Field label="Line 2" value={order.shippingLine2} />}
          <Field label="City" value={order.shippingCity} />
          <Field label="State" value={order.shippingState} />
          <Field label="Pincode" value={order.shippingPincode} />
          <Field label="Country" value={order.shippingCountry} />
          <Field label="Method" value={order.deliveryMethod} />
        </Panel>

        <Panel title="Payment">
          <Field label="Status" value={derivePaymentLabel(order.status)} />
          <Field label="Cashfree order ID" value={order.cashfreeOrderId ?? "— not created —"} />
          <p className="mt-2 text-xs text-text-dark/50">
            Payment status is written only by the Cashfree webhook and can&apos;t be changed from
            this screen. Refunds are processed in the Cashfree dashboard.
          </p>
        </Panel>

        <Panel title="Shipment">
          <Field label="Shiprocket shipment ID" value={order.shiprocketShipmentId ?? "— not created —"} />
          {order.shiprocketShipmentId ? (
            <p className="mt-2 text-xs text-text-dark/50">
              Track this shipment from the Shiprocket dashboard — no tracking-URL format is
              confirmed for this account yet, so no link is shown rather than a guessed one.
            </p>
          ) : (
            <p className="mt-2 text-xs text-text-dark/50">
              No shipment created. Shiprocket runs unconfigured in this environment
              (BUILD_STATUS.md), so this is expected locally.
            </p>
          )}
        </Panel>
      </div>

      <section className="mt-8">
        <h3 className="mb-3 text-xs uppercase tracking-wide text-text-dark/50">
          Items ({order.items.length})
        </h3>
        <ul className="divide-y divide-black/10 rounded-card border border-black/10">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-text-dark/50">
                  {item.size ? `Size ${item.size} · ` : ""}Qty {item.quantity} ·{" "}
                  {formatPrice(item.price)} each
                  {/* price is snapshotted at purchase — say so, so nobody
                      reconciles it against today's catalogue price. */}
                </p>
              </div>
              <p className="shrink-0 text-sm">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-dark/60">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-dark/60">Shipping</span>
            <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-black/10 pt-1 font-medium">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-black/10 p-4">
      <h3 className="mb-3 text-xs uppercase tracking-wide text-text-dark/50">{title}</h3>
      <dl className="space-y-1.5">{children}</dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="shrink-0 text-text-dark/60">{label}</dt>
      <dd className="min-w-0 break-words text-right">{value}</dd>
    </div>
  );
}
