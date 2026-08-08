import { redirect } from "next/navigation";
import { db } from "./db";
import { requireUser, getSessionUser } from "./auth";

// PRD.md: "SILVERO Circle membership has two qualification paths: free via
// a past purchase, or paid for non-purchasers. Confirm the exact price/logic
// with the client before building the gate." That confirmation hasn't
// happened — ₹499 is a placeholder so the paid path is real and testable,
// not a guess at the client's actual pricing. Change this the moment a real
// number exists; search for CIRCLE_JOIN_FEE before launch.
export const CIRCLE_JOIN_FEE = 499;

// Cashfree order_ids for a Circle-join payment are synthesized (not a real
// Order row — joining isn't a product purchase) as `circle-{userId}-{ts}`,
// so the single webhook handler can tell the two apart. See
// app/api/cashfree/webhook/route.ts.
const CIRCLE_ORDER_PREFIX = "circle-";

export function makeCircleJoinOrderId(userId: string): string {
  return `${CIRCLE_ORDER_PREFIX}${userId}-${Date.now()}`;
}

export function parseCircleJoinOrderId(orderId: string): string | null {
  if (!orderId.startsWith(CIRCLE_ORDER_PREFIX)) return null;
  const rest = orderId.slice(CIRCLE_ORDER_PREFIX.length);
  const userId = rest.slice(0, rest.lastIndexOf("-"));
  return userId || null;
}

export async function getCircleMembership(userId: string) {
  return db.circleMembership.findUnique({ where: { userId } });
}

/** Free qualification path — has the user ever completed (paid+) an order? */
export async function qualifiesViaPastPurchase(userId: string): Promise<boolean> {
  const paidOrder = await db.order.findFirst({
    where: { userId, status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
    select: { id: true },
  });
  return Boolean(paidOrder);
}

/**
 * Server-side Circle gate — ARCHITECTURE.md "Membership Gating": non-members
 * are redirected before the page renders, they never receive the form's
 * HTML. Requires login first (reuses requireUser()'s redirect), then checks
 * membership specifically.
 */
export async function requireCircleMember() {
  const user = await requireUser();
  const membership = await getCircleMembership(user.id);
  if (!membership) {
    redirect("/circle");
  }
  return { user, membership };
}

/**
 * Same check as requireCircleMember() but for API routes — returns null
 * instead of redirecting. CLAUDE.md constraint #5 / ARCHITECTURE.md: the API
 * route re-checks independently of whatever the UI already gated.
 */
export async function getCircleMemberOrNull() {
  const user = await getSessionUser();
  if (!user) return null;
  const membership = await getCircleMembership(user.id);
  if (!membership) return null;
  return { user, membership };
}
