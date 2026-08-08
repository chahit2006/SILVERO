import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createCashfreeOrder } from "@/lib/cashfree";
import { generateUniqueGiftCardCode, MIN_AMOUNT, MAX_AMOUNT } from "@/lib/gift-cards";

// POST /api/gift-cards — API_SPEC.md: "Purchase a gift card." Guest
// purchase is allowed (DESIGN_SYSTEM.md's guest-checkout precedent) — the
// GiftCard row is created unpaid, exactly like Order at checkout time, and
// the Cashfree webhook is what actually activates it.
const schema = z
  .object({
    amount: z.number().int().min(MIN_AMOUNT).max(MAX_AMOUNT),
    isDigital: z.boolean(),
    recipientName: z.string().trim().max(100).optional(),
    senderName: z.string().trim().max(100).optional(),
    message: z.string().trim().max(500).optional(),
    deliveryDate: z.string().datetime().optional(),
    buyerEmail: z.string().trim().toLowerCase().email(),
    buyerPhone: z.string().trim().min(6).max(20),
    shippingLine1: z.string().trim().max(200).optional(),
    shippingLine2: z.string().trim().max(200).optional(),
    shippingCity: z.string().trim().max(100).optional(),
    shippingState: z.string().trim().max(100).optional(),
    shippingPincode: z
      .string()
      .trim()
      .regex(/^\d{6}$/)
      .optional(),
  })
  .refine((data) => data.isDigital || (data.shippingLine1 && data.shippingCity && data.shippingState && data.shippingPincode), {
    message: "Shipping address is required for a physical gift card.",
  });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form for errors." }, { status: 400 });
  }
  const input = parsed.data;

  const sessionUser = await getSessionUser();
  const code = await generateUniqueGiftCardCode();

  const giftCard = await db.giftCard.create({
    data: {
      code,
      amount: input.amount,
      balance: input.amount,
      isDigital: input.isDigital,
      recipientName: input.recipientName,
      senderName: input.senderName,
      message: input.message,
      deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
      purchasedByUserId: sessionUser?.id,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      shippingLine1: input.isDigital ? null : input.shippingLine1,
      shippingLine2: input.isDigital ? null : input.shippingLine2,
      shippingCity: input.isDigital ? null : input.shippingCity,
      shippingState: input.isDigital ? null : input.shippingState,
      shippingPincode: input.isDigital ? null : input.shippingPincode,
    },
  });

  try {
    const origin = new URL(req.url).origin;
    const session = await createCashfreeOrder({
      orderId: giftCard.id,
      amount: giftCard.amount,
      customerId: sessionUser?.id ?? `guest-${giftCard.id}`,
      customerEmail: giftCard.buyerEmail,
      customerPhone: giftCard.buyerPhone,
      returnUrl: `${origin}/gifting/gift-cards/${giftCard.id}/confirmation`,
    });

    return NextResponse.json({ giftCardId: giftCard.id, paymentSessionId: session.paymentSessionId }, { status: 201 });
  } catch (err) {
    console.error("Gift card payment session failed:", err);
    // Leave the unpaid row in place — harmless, matches how an abandoned
    // PENDING Order is handled (see ARCHITECTURE.md's known gap note).
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
