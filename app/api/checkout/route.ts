import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCartOwner, cartWhere } from "@/lib/cart";
import { lockAndDecrementStock, InsufficientStockError } from "@/lib/stock";
import { getDeliveryCost } from "@/lib/shiprocket";

const DEFAULT_ITEM_WEIGHT_GRAMS = 50;

const checkoutSchema = z.object({
  contactEmail: z.string().trim().toLowerCase().email(),
  contactPhone: z.string().trim().min(6).max(20),
  contactFirstName: z.string().trim().min(1).max(80),
  contactLastName: z.string().trim().min(1).max(80),
  shippingLine1: z.string().trim().min(1).max(200),
  shippingLine2: z.string().trim().max(200).optional(),
  shippingCity: z.string().trim().min(1).max(100),
  shippingState: z.string().trim().min(1).max(100),
  shippingPincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code."),
  shippingCountry: z.string().trim().max(100).default("India"),
  deliveryMethod: z.enum(["STANDARD", "EXPRESS"]),
  addressId: z.string().optional(), // reference only — see DATA_MODEL.md Order snapshot note
});

// POST /api/checkout — API_SPEC.md: "Create order (PENDING), lock +
// decrement stock in one transaction." ARCHITECTURE.md checkout flow steps
// 2–3. Cashfree session creation is a separate call (/api/cashfree/create-order)
// made by the client right after this succeeds.
export async function POST(req: Request) {
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form for errors." }, { status: 400 });
  }
  const input = parsed.data;

  const owner = await getCartOwner();
  const cartItems = await db.cartItem.findMany({ where: cartWhere(owner), include: { product: true } });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
  }

  // Recalculated from live DB prices — SECURITY_CHECKLIST.md §6: "never
  // trust a total the client sends."
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalWeightGrams = cartItems.reduce(
    (sum, item) => sum + (item.product.weightGrams ?? DEFAULT_ITEM_WEIGHT_GRAMS) * item.quantity,
    0,
  );
  const shipping = await getDeliveryCost(input.deliveryMethod, input.shippingPincode, totalWeightGrams);
  const total = subtotal + shipping;

  try {
    const order = await db.$transaction(async (tx) => {
      await lockAndDecrementStock(
        tx,
        cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      );

      const created = await tx.order.create({
        data: {
          userId: owner.userId,
          addressId: input.addressId,
          status: "PENDING",
          subtotal,
          shipping,
          total,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          contactFirstName: input.contactFirstName,
          contactLastName: input.contactLastName,
          shippingLine1: input.shippingLine1,
          shippingLine2: input.shippingLine2,
          shippingCity: input.shippingCity,
          shippingState: input.shippingState,
          shippingPincode: input.shippingPincode,
          shippingCountry: input.shippingCountry,
          deliveryMethod: input.deliveryMethod,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              size: item.size,
              quantity: item.quantity,
              price: item.product.price, // snapshot — DATA_MODEL.md: "price at time of purchase"
              registryItemId: item.registryItemId, // carried through so the webhook can mark it purchased on payment success
            })),
          },
        },
      });

      // Cart is now the order — clear it (same transaction, so a crash
      // between order-creation and cart-clearing can't happen).
      await tx.cartItem.deleteMany({ where: cartWhere(owner) });

      return created;
    });

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Checkout failed:", err);
    return NextResponse.json({ error: "Something went wrong placing your order. Please try again." }, { status: 500 });
  }
}
