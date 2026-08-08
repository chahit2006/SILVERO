"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/providers/CartProvider";
import { OrderSummary } from "./OrderSummary";

type Step = "contact" | "shipping" | "payment";
const STEPS: Step[] = ["contact", "shipping", "payment"];

type FormState = {
  contactEmail: string;
  contactPhone: string;
  contactFirstName: string;
  contactLastName: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  deliveryMethod: "STANDARD" | "EXPRESS";
};

const EMPTY_FORM: FormState = {
  contactEmail: "",
  contactPhone: "",
  contactFirstName: "",
  contactLastName: "",
  shippingLine1: "",
  shippingLine2: "",
  shippingCity: "",
  shippingState: "",
  shippingPincode: "",
  deliveryMethod: "STANDARD",
};

// DESIGN_SYSTEM.md §8 "Checkout Page" — form left (60%) / summary right
// (40%), Contact → Shipping → Payment with a progress indicator, guest
// checkout always available.
export function CheckoutFlow() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, subtotal, refresh: refreshCart } = useCart();

  const [step, setStep] = useState<Step>("contact");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [rates, setRates] = useState<{ standard: number; express: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  // Prefill contact name/email for a logged-in shopper.
  useEffect(() => {
    if (!session?.user) return;
    const [firstName, ...rest] = (session.user.name ?? "").split(" ");
    setForm((f) => ({
      ...f,
      contactEmail: f.contactEmail || session.user?.email || "",
      contactFirstName: f.contactFirstName || firstName || "",
      contactLastName: f.contactLastName || rest.join(" "),
    }));
  }, [session]);

  // PIN → city/state autofill (DESIGN_SYSTEM.md §8: "PIN auto-fills city"),
  // via India Post's free public pincode API — no key required.
  useEffect(() => {
    if (!/^\d{6}$/.test(form.shippingPincode)) {
      setRates(null);
      return;
    }

    const controller = new AbortController();

    fetch(`https://api.postalpincode.in/pincode/${form.shippingPincode}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const po = data?.[0]?.PostOffice?.[0];
        if (po) {
          setForm((f) => ({ ...f, shippingCity: f.shippingCity || po.District, shippingState: f.shippingState || po.State }));
        }
      })
      .catch(() => {}); // best-effort — manual entry still works

    fetch(`/api/shiprocket/rates?pincode=${form.shippingPincode}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setRates({ standard: data.standard, express: data.express }))
      .catch(() => {});

    return () => controller.abort();
  }, [form.shippingPincode]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-text-dark/60">Your bag is empty — add something before checking out.</p>
      </div>
    );
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function canAdvance(from: Step) {
    if (from === "contact") {
      return form.contactEmail && form.contactPhone && form.contactFirstName && form.contactLastName;
    }
    if (from === "shipping") {
      return form.shippingLine1 && form.shippingCity && form.shippingState && /^\d{6}$/.test(form.shippingPincode);
    }
    return true;
  }

  async function handlePlaceOrder() {
    setError(null);
    setPlacing(true);

    try {
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, shippingCountry: "India" }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData?.error ?? "Could not place your order.");

      const orderId = checkoutData.orderId as string;
      await refreshCart(); // cart was cleared server-side by /api/checkout

      const sessionRes = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        // Order exists (PENDING) but payment couldn't start — send them to
        // the confirmation page, which shows real status rather than
        // pretending payment happened.
        throw new Error(sessionData?.error ?? "Order placed, but payment couldn't start. Contact support.");
      }

      // Cashfree's hosted checkout — PCI scope stays with Cashfree
      // (SECURITY_CHECKLIST.md §5). Unverified against a live account, see
      // lib/cashfree.ts.
      const cashfree = await loadCashfreeSdk();
      cashfree.checkout({ paymentSessionId: sessionData.paymentSessionId, redirectTarget: "_self" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPlacing(false);
    }
  }

  const shippingCost = form.deliveryMethod === "STANDARD" ? 0 : (rates?.express ?? null);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 lg:px-8">
      <Stepper current={step} />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {step === "contact" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl">Contact</h2>
              <Field label="Email">
                <input type="email" required value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Phone (+91)">
                <input type="tel" required value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name">
                  <input required value={form.contactFirstName} onChange={(e) => update("contactFirstName", e.target.value)} className={inputClass} />
                </Field>
                <Field label="Last name">
                  <input required value={form.contactLastName} onChange={(e) => update("contactLastName", e.target.value)} className={inputClass} />
                </Field>
              </div>
              <StepButton disabled={!canAdvance("contact")} onClick={() => setStep("shipping")} label="Continue to Shipping" />
            </div>
          )}

          {step === "shipping" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl">Shipping</h2>
              <Field label="Address line 1">
                <input required value={form.shippingLine1} onChange={(e) => update("shippingLine1", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Address line 2 (optional)">
                <input value={form.shippingLine2} onChange={(e) => update("shippingLine2", e.target.value)} className={inputClass} />
              </Field>
              <Field label="PIN code">
                <input
                  required
                  pattern="\d{6}"
                  value={form.shippingPincode}
                  onChange={(e) => update("shippingPincode", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input required value={form.shippingCity} onChange={(e) => update("shippingCity", e.target.value)} className={inputClass} />
                </Field>
                <Field label="State">
                  <input required value={form.shippingState} onChange={(e) => update("shippingState", e.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label="Country">
                <input disabled value="India" className={`${inputClass} bg-ivory text-text-dark/50`} />
              </Field>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-text-dark/60">Delivery</p>
                <div className="space-y-2">
                  <DeliveryOption
                    selected={form.deliveryMethod === "STANDARD"}
                    onSelect={() => update("deliveryMethod", "STANDARD")}
                    label="Standard"
                    detail="5–7 business days"
                    price="Free"
                  />
                  <DeliveryOption
                    selected={form.deliveryMethod === "EXPRESS"}
                    onSelect={() => update("deliveryMethod", "EXPRESS")}
                    label="Express"
                    detail="2–3 business days"
                    price={rates ? formatPriceInline(rates.express) : "Enter PIN code"}
                  />
                </div>
              </div>

              <StepButton disabled={!canAdvance("shipping")} onClick={() => setStep("payment")} label="Continue to Payment" />
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl">Payment</h2>
              <p className="text-sm text-text-dark/60">
                You&apos;ll be redirected to Cashfree&apos;s secure checkout — UPI, cards, net banking, and
                wallets accepted. We never see or store your card/UPI details.
              </p>
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full rounded-full bg-olive-dark py-3.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-50"
              >
                {placing ? "Placing order…" : "Place Order"}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <OrderSummary items={items} subtotal={subtotal} shipping={shippingCost} />
        </div>
      </div>
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const labels: Record<Step, string> = { contact: "Contact", shipping: "Shipping", payment: "Payment" };
  return (
    <div className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wide">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span className={STEPS.indexOf(current) >= i ? "text-olive-dark" : "text-text-dark/30"}>{labels[s]}</span>
          {i < STEPS.length - 1 && <span className="text-text-dark/20">—</span>}
        </div>
      ))}
    </div>
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

function StepButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function DeliveryOption({
  selected,
  onSelect,
  label,
  detail,
  price,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  detail: string;
  price: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-card border px-4 py-3 text-left text-sm ${
        selected ? "border-olive-dark" : "border-black/10"
      }`}
    >
      <span>
        <span className="font-medium">{label}</span>
        <span className="ml-2 text-text-dark/50">{detail}</span>
      </span>
      <span>{price}</span>
    </button>
  );
}

function formatPriceInline(rupees: number) {
  return rupees === 0 ? "Free" : `₹${rupees}`;
}

// Cashfree JS SDK — loaded lazily, only needed at the payment step.
// See lib/cashfree.ts for the "unverified against a live account" caveat.
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
      if (!window.Cashfree) {
        reject(new Error("Cashfree SDK failed to load."));
        return;
      }
      resolve(window.Cashfree({ mode: process.env.NODE_ENV === "production" ? "production" : "sandbox" }));
    };
    script.onerror = () => reject(new Error("Cashfree SDK failed to load."));
    document.body.appendChild(script);
  });
}
