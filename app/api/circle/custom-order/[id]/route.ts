import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCircleMemberOrNull } from "@/lib/circle";

// GET /api/circle/custom-order/[id] — API_SPEC.md: "Status lookup for the
// logged-in member's own submission." Ownership check, same reasoning as
// /api/account/orders/[id].
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const member = await getCircleMemberOrNull();
  if (!member) {
    return NextResponse.json({ error: "SILVERO Circle membership required." }, { status: 403 });
  }

  const submission = await db.customOrder.findUnique({ where: { id: params.id } });
  if (!submission || submission.userId !== member.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ submission });
}
