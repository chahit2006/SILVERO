import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET/POST /api/account/returns — API_SPEC.md.
// ReturnRequest.orderId has no Prisma relation to Order in DATA_MODEL.md
// (plain string field), so ownership is verified with a lookup, not a join.

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const orderIds = (await db.order.findMany({ where: { userId: user.id }, select: { id: true } })).map(
    (o) => o.id,
  );

  const returns = orderIds.length
    ? await db.returnRequest.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return NextResponse.json({ returns });
}

const returnSchema = z.object({
  orderId: z.string().min(1),
  itemIds: z.array(z.string().min(1)).min(1),
  reason: z.string().trim().min(1).max(500),
  refundMethod: z.string().trim().min(1).max(100),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = returnSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const order = await db.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const returnRequest = await db.returnRequest.create({ data: parsed.data });
  return NextResponse.json({ returnRequest }, { status: 201 });
}
