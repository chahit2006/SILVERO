import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET/POST/PATCH/DELETE /api/account/addresses — API_SPEC.md.
// No [id] sub-route is documented, so PATCH/DELETE take `id` in the body —
// each still re-verifies the address belongs to the requesting user.

const addressSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code."),
  country: z.string().trim().max(100).default("India"),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: { isDefault: "desc" },
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = addressSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  if (parsed.data.isDefault) {
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  const address = await db.address.create({ data: { ...parsed.data, userId: user.id } });
  return NextResponse.json({ address }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addressSchema.partial().extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const { id, ...data } = parsed.data;
  const existing = await db.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Address not found." }, { status: 404 });
  }

  if (data.isDefault) {
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  const address = await db.address.update({ where: { id }, data });
  return NextResponse.json({ address });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const existing = await db.address.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Address not found." }, { status: 404 });
  }

  await db.address.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ success: true });
}
