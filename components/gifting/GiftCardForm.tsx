"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/format";

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => void;
    };
  }
}

function loadCashfreeSdk(): Promise<ReturnType<NonNullable<Window["Cashfree"]>>> {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve(window.Cashfree({ mode: process.env.NODE_ENV === "production" ? "production" : "sandbox" }));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => {
      if (!window.Cashfree) return reject(new Error("Cashfree SDK failed to load."));
      resolve(window.Cashfree({ mode: process.env.NODE_ENV === "production" ? "production" : "sandbox" }));
    };
    script.onerror = () => reject(new Error("Cashfree SDK failed to load."));
    document.body.appendChild(script);
  });
}

const PRESETS = [1000, 2500, 5000, 10000];

// PRD.md §4 "Gift Cards" — digital + physical, preset + custom amounts,
// personalization, scheduled delivery.
export function GiftCardForm() {
  const { data: session } = useSession();
  const [isDigital, setIsDigital] = useState(true);
  const [amount, setAmount] = useState(PRESETS[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [form, setForm] = useState({
    recipientName: "",
    senderName: "",
    message: "",
    deliveryDate: "",
    buyerEmail: session?.user?.email ?? "",
    buyerPhone: "",
    shippingLine1: "",
    shippingCity: "",
    shippingState: "",
    shippingPincode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const finalAmount = customAmount ? parseInt(customAmount, 10) || 0 : amount;

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          isDigital,
          recipientName: form.recipientName || undefined,
          senderName: form.senderName || undefined,
          message: form.message || undefined,
          deliveryDate: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : undefined,
          buyerEmail: form.buyerEmail,
          buyerPhone: form.buyerPhone,
          ...(isDigital
            ? {}
            : {
                shippingLine1: form.shippingLine1,
                shippingCity: form.shippingCity,
                shippingState: form.shippingState,
                shippingPincode: form.shippingPincode,
              }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");

      const cashfree = await loadCashfreeSdk();
      cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsDigital(true)}
          className={`flex-1 rounded-full border py-2.5 text-sm uppercase tracking-wide ${isDigital ? "border-olive-dark bg-olive-dark text-ivory" : "border-black/15"}`}
        >
          Digital
        </button>
        <button
          type="button"
          onClick={() => setIsDigital(false)}
          className={`flex-1 rounded-full border py-2.5 text-sm uppercase tracking-wide ${!isDigital ? "border-olive-dark bg-olive-dark text-ivory" : "border-black/15"}`}
        >
          Physical (Shipped)
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-text-dark/60">Amount</p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setAmount(p);
                setCustomAmount("");
              }}
              className={`rounded-lg border py-2 text-sm ${amount === p && !customAmount ? "border-olive-dark bg-olive-dark text-ivory" : "border-black/15"}`}
            >
              {formatPrice(p)}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Custom amount (₹500 – ₹50,000)"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Recipient name (optional)">
          <input value={form.recipientName} onChange={(e) => update("recipientName", e.target.value)} className={inputClass} />
        </Field>
        <Field label="From (optional)">
          <input value={form.senderName} onChange={(e) => update("senderName", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Personal message (optional)">
        <textarea maxLength={500} rows={3} value={form.message} onChange={(e) => update("message", e.target.value)} className={inputClass} />
      </Field>

      {isDigital && (
        <Field label="Scheduled delivery date (optional)">
          <input type="date" value={form.deliveryDate} onChange={(e) => update("deliveryDate", e.target.value)} className={inputClass} />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Your email">
          <input type="email" required value={form.buyerEmail} onChange={(e) => update("buyerEmail", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Your phone">
          <input type="tel" required value={form.buyerPhone} onChange={(e) => update("buyerPhone", e.target.value)} className={inputClass} />
        </Field>
      </div>

      {!isDigital && (
        <div className="space-y-3 rounded-card bg-ivory p-4">
          <p className="text-xs uppercase tracking-wide text-text-dark/60">Shipping address</p>
          <input required placeholder="Address" value={form.shippingLine1} onChange={(e) => update("shippingLine1", e.target.value)} className={inputClass} />
          <div className="grid grid-cols-3 gap-2">
            <input required placeholder="City" value={form.shippingCity} onChange={(e) => update("shippingCity", e.target.value)} className={inputClass} />
            <input required placeholder="State" value={form.shippingState} onChange={(e) => update("shippingState", e.target.value)} className={inputClass} />
            <input required placeholder="PIN" pattern="\d{6}" value={form.shippingPincode} onChange={(e) => update("shippingPincode", e.target.value)} className={inputClass} />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || finalAmount < 500}
        className="w-full rounded-full bg-olive-dark py-3.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-50"
      >
        {submitting ? "Redirecting to payment…" : `Buy Gift Card — ${formatPrice(finalAmount)}`}
      </button>
    </form>
  );
}

const inputClass = "w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">{label}</label>
      {children}
    </div>
  );
}
