import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Shell only — Cashfree integration is Phase 2 (TECH_STACK.md), and card/UPI
// data should never touch our server directly (SECURITY_CHECKLIST.md §5).
// Saved payment methods, when built, will be tokens from Cashfree's hosted
// checkout, not raw card data stored here.
export default async function PaymentsPage() {
  await requireUser();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Payment Methods</h1>
      <p className="rounded-card border border-dashed border-black/15 p-10 text-center text-sm text-text-dark/60">
        No saved payment methods yet. Payments are handled securely by Cashfree at checkout — we never
        store your card or UPI details.
      </p>
    </div>
  );
}
