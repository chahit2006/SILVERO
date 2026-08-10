import type { OrderStatus } from "@prisma/client";

// ADMIN_PANEL_SPEC.md §4. The manual-status-update rules live here, in one
// place, for the same reason stock-lock logic lives only in lib/stock.ts
// (CLAUDE.md constraint #4): the admin page renders the dropdown from this
// table and the PATCH route validates against this table, so the UI can never
// offer a transition the API would reject, and — much more importantly — the
// API can never be talked into one the UI wouldn't offer.

/**
 * CLAUDE.md constraint #6 / SECURITY_CHECKLIST.md §5: the Cashfree webhook is
 * the only thing that may ever write PAID. PENDING is likewise webhook
 * territory — it is the state an order is *born* in, not one an admin
 * restores. Neither value appears anywhere in ALLOWED_TRANSITIONS below, and
 * the PATCH route rejects anything not found there, so there is no admin
 * request that can produce either.
 */
export const ADMIN_FORBIDDEN_STATUSES: readonly OrderStatus[] = ["PENDING", "PAID"];

/**
 * What an admin may move each status to. Spec §4 lists the intended manual
 * interventions as "mark as Shipped, mark as Delivered, Cancel" — this maps
 * those onto the states they actually make sense from.
 *
 * - PENDING   → CANCELLED only. The order was never paid, so there is nothing
 *               to ship; cancelling is how an admin clears an abandoned one by
 *               hand until the stock-release cron in BUILD_STATUS.md exists.
 * - PAID      → SHIPPED (the normal path, when Shiprocket's sync is late) or
 *               CANCELLED (refund handled manually in the Cashfree dashboard —
 *               spec §5 is explicit that no refund API is being integrated, so
 *               cancelling here does NOT move money).
 * - SHIPPED   → DELIVERED, or CANCELLED for a parcel lost/returned in transit.
 * - DELIVERED → terminal. There is no returns/exchange flow to hand a
 *               delivered order back into (that feature was cut), so this
 *               stays a dead end.
 * - CANCELLED → terminal. Reinstating would mean re-locking stock, which only
 *               lib/stock.ts may do — a fresh order is the correct answer.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (ADMIN_FORBIDDEN_STATUSES.includes(to)) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Every status, in pipeline order — drives the filter tabs on the list page. */
export const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

/**
 * ⚠️ Spec §2 and §4 both refer to a `paymentStatus` field on `Order`
 * ("sum of Order.total where paymentStatus = PAID", "status, payment status"
 * as separate list columns). **No such field exists** — DATA_MODEL.md models
 * payment as one value inside `OrderStatus`, where PAID is a stage that
 * SHIPPED and DELIVERED have already moved past.
 *
 * Rather than invent a column, payment is derived from the single status we
 * do have. The one case the derivation genuinely cannot answer is CANCELLED,
 * which collapses "abandoned before paying" and "paid, then cancelled" into
 * one value — so it reports "Unknown" instead of guessing, and the detail
 * page shows the Cashfree order ID next to it so an admin can check the
 * Cashfree dashboard.
 *
 * Raised for the team: if separating these matters (it will, for refund
 * reconciliation), the fix is a real `paymentStatus` field written only by
 * the webhook — a schema change, not something to paper over here.
 */
export function derivePaymentLabel(status: OrderStatus): "Paid" | "Unpaid" | "Unknown" {
  if (status === "PAID" || status === "SHIPPED" || status === "DELIVERED") return "Paid";
  if (status === "PENDING") return "Unpaid";
  return "Unknown";
}

/** Spec §4 wants the operational meaning visible, not just the enum name. */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
