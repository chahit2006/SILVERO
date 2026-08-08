import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCircleMembership, qualifiesViaPastPurchase } from "@/lib/circle";

// GET /api/circle/status — API_SPEC.md: "Membership status/points for logged-in user."
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const membership = await getCircleMembership(user.id);
  if (membership) {
    return NextResponse.json({ isMember: true, membership });
  }

  return NextResponse.json({ isMember: false, eligibleForFreeJoin: await qualifiesViaPastPurchase(user.id) });
}
