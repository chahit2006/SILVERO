import { NextResponse } from "next/server";
import { getCartOwner, cartWhere } from "@/lib/cart";
import { db } from "@/lib/db";
import { getDeliveryCost } from "@/lib/shiprocket";

const DEFAULT_ITEM_WEIGHT_GRAMS = 50;

// GET /api/shiprocket/rates?pincode=XXXXXX — API_SPEC.md. Delivery pricing
// logic lives in lib/shiprocket.ts (shared with /api/checkout) so the quote
// shown here can't drift from what's actually charged.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get("pincode");

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Valid 6-digit pincode required." }, { status: 400 });
  }

  const owner = await getCartOwner();
  const items = await db.cartItem.findMany({ where: cartWhere(owner), include: { product: true } });

  const totalWeightGrams = items.reduce(
    (sum, item) => sum + (item.product.weightGrams ?? DEFAULT_ITEM_WEIGHT_GRAMS) * item.quantity,
    0,
  );

  const [standard, express] = await Promise.all([
    getDeliveryCost("STANDARD", pincode, totalWeightGrams),
    getDeliveryCost("EXPRESS", pincode, totalWeightGrams),
  ]);

  return NextResponse.json({ standard, express });
}
