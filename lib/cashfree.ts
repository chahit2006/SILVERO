import crypto from "crypto";

// TECH_STACK.md: "Cashfree — Node SDK + REST API, called from an API route."
// Implemented against the plain REST API rather than the official `cashfree-pg`
// SDK — that package pulls in `@sentry/node` as a dependency (telemetry we
// didn't ask for and shouldn't ship silently). The REST contract is small
// enough that this isn't a real tradeoff.
//
// ⚠️ Written against Cashfree's documented Orders API (v2023-08-01) from
// memory/training knowledge, NOT verified against a live sandbox — we don't
// have real Cashfree credentials in this environment (see .env.example).
// Confirm field names/response shape against Cashfree's current API
// reference before the first real sandbox test, and expect to adjust.

const API_VERSION = "2023-08-01";

function baseUrl() {
  // Cashfree's own sandbox/production hosts differ — no separate env flag,
  // just checks NODE_ENV like the rest of the app's environments (ARCHITECTURE.md).
  return process.env.NODE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function credentials() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    throw new Error(
      "Cashfree is not configured — set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env. " +
        "(Expected in this dev environment — we don't have real sandbox keys yet.)",
    );
  }
  return { appId, secretKey };
}

export type CreateCashfreeOrderInput = {
  orderId: string; // our Order.id — passed as Cashfree's order_id
  amount: number; // rupees
  customerId: string; // our User.id, or a guest identifier
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
};

export type CashfreeOrderSession = {
  paymentSessionId: string;
  cfOrderId: string;
};

/** Creates a Cashfree order and returns the payment_session_id the client-side JS SDK needs. */
export async function createCashfreeOrder(input: CreateCashfreeOrderInput): Promise<CashfreeOrderSession> {
  const { appId, secretKey } = credentials();

  const res = await fetch(`${baseUrl()}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": API_VERSION,
    },
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
      },
      order_meta: {
        return_url: input.returnUrl,
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Cashfree order creation failed: ${data?.message ?? res.statusText}`);
  }

  return { paymentSessionId: data.payment_session_id, cfOrderId: data.cf_order_id ?? data.order_id };
}

/**
 * Verifies a Cashfree webhook signature. SECURITY_CHECKLIST.md §5 — never
 * mark an order paid without this passing. Uses a constant-time comparison
 * to avoid a timing side-channel on the signature check.
 */
export function verifyCashfreeWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed — an unconfigured webhook secret must never be treated as "verified."
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export type CashfreeWebhookPayload = {
  type: string; // "PAYMENT_SUCCESS_WEBHOOK" | "PAYMENT_FAILED_WEBHOOK" | ...
  data: {
    order: { order_id: string; order_amount: number };
    payment?: { payment_status: string; cf_payment_id?: string };
  };
};
