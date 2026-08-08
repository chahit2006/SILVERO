"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/admin-orders";

// ADMIN_PANEL_SPEC.md §4 — manual status update, for when Shiprocket's sync
// is delayed or an order needs intervention by hand.
//
// `options` is computed on the server from ALLOWED_TRANSITIONS, so this
// component never decides what is legal — it only renders what it was handed
// and reports back what the API said. The API re-validates the same table
// regardless of what arrives here.
export function OrderStatusForm({
  orderId,
  currentStatus,
  options,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  options: readonly OrderStatus[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<OrderStatus | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (options.length === 0) {
    return (
      <p className="text-sm text-text-dark/50">
        {STATUS_LABELS[currentStatus]} is a final status — no further updates from here.
        {currentStatus === "DELIVERED" && " A delivered order coming back is a return request."}
      </p>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || busy) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selected }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Could not update this order. Please try again.");
        return;
      }

      setSelected("");
      // Re-fetch the server component rather than patching local state, so the
      // status badge, the allowed-transition list and the list page's counts
      // all come back from the database in agreement.
      router.refresh();
    } catch {
      setError("Network error — the order was not updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
      <label htmlFor="status" className="sr-only">
        New status
      </label>
      <select
        id="status"
        value={selected}
        onChange={(e) => setSelected(e.target.value as OrderStatus)}
        disabled={busy}
        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm disabled:opacity-50"
      >
        <option value="">Change status to…</option>
        {options.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={!selected || busy}
        className="rounded-lg bg-olive-dark px-4 py-2 text-sm text-ivory transition-opacity duration-150 disabled:opacity-40"
      >
        {busy ? "Updating…" : "Update"}
      </button>

      {selected === "CANCELLED" && (
        // Spec §5: refunds are manual. Saying so at the moment of the click is
        // worth more than saying it in a doc nobody has open.
        <p className="w-full text-xs text-text-dark/60">
          Cancelling only changes this order&apos;s status — it does not refund the customer or
          return stock. Process any refund in the Cashfree dashboard.
        </p>
      )}

      {error && (
        <p role="alert" className="w-full text-xs text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
