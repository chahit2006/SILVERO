import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";

// PATCH /api/admin/engraving-requests/[id] — ADMIN_PANEL_SPEC.md §5.
// EngravingRequest.status is a free-form String in the schema (REQUESTED,
// CONFIRMED, IN_PRODUCTION, SHIPPED per DATA_MODEL.md's comment), not an
// enum — validated against that same fixed list here so the API can't be
// talked into a typo'd status the UI never offers.
const STATUSES = ["REQUESTED", "CONFIRMED", "IN_PRODUCTION", "SHIPPED"] as const;

const patchSchema = z.object({ status: z.enum(STATUSES) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const existing = await db.engravingRequest.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const updated = await db.engravingRequest.update({ where: { id: params.id }, data: { status: parsed.data.status } });
  console.info(`Admin ${admin.email} updated engraving request ${updated.id}: ${updated.status}`);

  return NextResponse.json({ engravingRequest: updated });
}
