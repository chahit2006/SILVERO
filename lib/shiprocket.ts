// TECH_STACK.md — "Shiprocket API — order handoff after payment confirmation
// (rate calculation + shipment creation)." Plain REST calls (Shiprocket has
// no official Node SDK).
//
// ⚠️ Written against Shiprocket's documented External API from
// memory/training knowledge, NOT verified live — we don't have real
// Shiprocket credentials in this environment. Confirm the request/response
// shapes against Shiprocket's current API docs before the first real test.
//
// DESIGN_SYSTEM.md §8: Standard delivery is always free (matches the
// site-wide "complimentary shipping" messaging) — only Express has a real
// cost, so that's the only case that needs a live Shiprocket rate call.

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// No warehouse/pickup pincode is defined anywhere in the docs — this is a
// placeholder until the client provides their actual dispatch location.
const PICKUP_PINCODE = process.env.SHIPROCKET_PICKUP_PINCODE ?? "110001";

// Fallback when a Product has no weightGrams set (DATA_MODEL.md "Notes").
const DEFAULT_ITEM_WEIGHT_GRAMS = 50;
const FALLBACK_EXPRESS_RATE = 150; // used when Shiprocket isn't configured/reachable — clearly a placeholder

let cachedToken: { token: string; expiresAt: number } | null = null;

function configured() {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

async function getAuthToken(): Promise<string> {
  if (!configured()) {
    throw new Error("Shiprocket is not configured — set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env.");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`Shiprocket auth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // Shiprocket tokens are valid ~10 days — cache for 9 to be safe, avoids a
  // login call on every request from this single long-running process
  // (ARCHITECTURE.md — single VPS, PM2-managed process).
  cachedToken = { token: data.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return cachedToken.token;
}

export type RateEstimateInput = { deliveryPincode: string; totalWeightGrams: number; codAmount?: number };

/**
 * Returns an Express delivery rate in rupees, or `null` if Shiprocket isn't
 * configured / the call fails — callers should fall back to a flat estimate
 * rather than blocking checkout on a third-party API being reachable.
 */
export async function getExpressRateEstimate(input: RateEstimateInput): Promise<number | null> {
  if (!configured()) return null;

  try {
    const token = await getAuthToken();
    const weightKg = Math.max(0.1, input.totalWeightGrams / 1000);

    const params = new URLSearchParams({
      pickup_postcode: PICKUP_PINCODE,
      delivery_postcode: input.deliveryPincode,
      weight: weightKg.toFixed(2),
      cod: input.codAmount ? "1" : "0",
    });

    const res = await fetch(`${BASE_URL}/courier/serviceability/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const couriers = data?.data?.available_courier_companies ?? [];
    if (couriers.length === 0) return null;

    // Cheapest courier that quotes the shortest estimated delivery — a
    // reasonable proxy for "Express" until real courier selection UI exists.
    const cheapest = couriers.reduce((min: any, c: any) => (c.rate < min.rate ? c : min), couriers[0]);
    return Math.ceil(cheapest.rate);
  } catch (err) {
    console.error("Shiprocket rate estimate failed:", err);
    return null;
  }
}

/**
 * Single source of truth for delivery pricing — used by both
 * /api/shiprocket/rates (checkout page's live estimate) and /api/checkout
 * (the actual charge), so they can't drift from each other.
 */
export async function getDeliveryCost(
  method: "STANDARD" | "EXPRESS",
  pincode: string,
  totalWeightGrams: number,
): Promise<number> {
  if (method === "STANDARD") return 0; // always free — DESIGN_SYSTEM.md §8
  const liveRate = await getExpressRateEstimate({ deliveryPincode: pincode, totalWeightGrams });
  return liveRate ?? FALLBACK_EXPRESS_RATE;
}

export type ShipmentOrderInput = {
  orderId: string;
  createdAt: Date;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  shippingLine1: string;
  shippingLine2?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  total: number;
  items: { name: string; quantity: number; price: number; weightGrams: number | null }[];
};

/**
 * Creates the Shiprocket shipment for a paid order. Called internally from
 * the Cashfree webhook handler once payment is confirmed — never exposed to
 * the client directly (API_SPEC.md: "/api/shiprocket/create-shipment ...
 * called internally after payment confirmation, not by the client").
 * Returns the Shiprocket shipment id, or `null` if unconfigured/failed —
 * failure here must not un-confirm the payment, just needs manual follow-up.
 */
export async function createShipment(input: ShipmentOrderInput): Promise<string | null> {
  if (!configured()) {
    console.warn(`Shiprocket not configured — skipping shipment creation for order ${input.orderId}.`);
    return null;
  }

  try {
    const token = await getAuthToken();

    const res = await fetch(`${BASE_URL}/orders/create/adhoc`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        order_id: input.orderId,
        order_date: input.createdAt.toISOString().slice(0, 19).replace("T", " "),
        pickup_location: "Primary", // must match a pickup location name registered in the Shiprocket dashboard
        billing_customer_name: input.contactFirstName,
        billing_last_name: input.contactLastName,
        billing_address: input.shippingLine1,
        billing_address_2: input.shippingLine2 ?? "",
        billing_city: input.shippingCity,
        billing_state: input.shippingState,
        billing_pincode: input.shippingPincode,
        billing_country: "India",
        billing_email: input.contactEmail,
        billing_phone: input.contactPhone,
        shipping_is_billing: true,
        order_items: input.items.map((item) => ({
          name: item.name,
          units: item.quantity,
          selling_price: item.price,
        })),
        payment_method: "Prepaid", // Cashfree confirms payment before this is ever called
        sub_total: input.total,
        length: 10,
        breadth: 10,
        height: 5, // cm — placeholder package dimensions, no real values captured anywhere
        weight: (
          input.items.reduce((sum, item) => sum + (item.weightGrams ?? DEFAULT_ITEM_WEIGHT_GRAMS) * item.quantity, 0) / 1000
        ).toFixed(2),
      }),
    });

    if (!res.ok) {
      console.error(`Shiprocket shipment creation failed for order ${input.orderId}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.shipment_id ? String(data.shipment_id) : null;
  } catch (err) {
    console.error(`Shiprocket shipment creation threw for order ${input.orderId}:`, err);
    return null;
  }
}
