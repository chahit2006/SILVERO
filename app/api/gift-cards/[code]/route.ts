import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// GET /api/gift-cards/[code] — API_SPEC.md: "Validate/check balance."
// Rate-limited — a gift card code is a bearer credential (whoever has the
// code can eventually spend the balance), so this endpoint is a brute-force
// target the same way login is.
export async function GET(req: Request, { params }: { params: { code: string } }) {
  const ip = getClientIp(req);
  if (!rateLimit(`giftcard-lookup:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const giftCard = await db.giftCard.findUnique({ where: { code: params.code.trim().toUpperCase() } });

  // Same response shape whether the code doesn't exist or just isn't paid
  // yet — doesn't leak which case it is.
  if (!giftCard || !giftCard.isPaid) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, balance: giftCard.balance, isDigital: giftCard.isDigital });
}
