"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderItem, Product } from "@prisma/client";

type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] };

export function NewReturnForm({ orders }: { orders: OrderWithItems[] }) {
  const router = useRouter();
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("Original payment method");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedOrder = orders.find((o) => o.id === orderId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (itemIds.length === 0) {
      setError("Select at least one item to return.");
      return;
    }

    const res = await fetch("/api/account/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, itemIds, reason, refundMethod }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      return;
    }

    setSubmitted(true);
    setTimeout(() => router.push("/account/returns"), 1200);
  }

  if (submitted) {
    return <p className="rounded-card bg-ivory p-4 text-sm">Return request submitted.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">Order</label>
        <select
          value={orderId}
          onChange={(e) => {
            setOrderId(e.target.value);
            setItemIds([]);
          }}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm"
        >
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              Order #{o.id.slice(-8).toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {selectedOrder && (
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-text-dark/60">Items to return</p>
          <div className="space-y-2">
            {selectedOrder.items.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={itemIds.includes(item.id)}
                  onChange={() =>
                    setItemIds((prev) =>
                      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                    )
                  }
                />
                {item.product.name} {item.size ? `(Size ${item.size})` : ""}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">Reason</label>
        <textarea
          required
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">Refund method</label>
        <select
          value={refundMethod}
          onChange={(e) => setRefundMethod(e.target.value)}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm"
        >
          <option>Original payment method</option>
          <option>Store credit</option>
        </select>
      </div>

      <button type="submit" className="rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory">
        Submit Return
      </button>
    </form>
  );
}
