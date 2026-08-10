import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";

// PATCH /api/admin/circle-orders/[id] — ADMIN_PANEL_SPEC.md §5: "Approve/
// reject Circle custom orders, update status through the pipeline, attach
// quotation details." The pipeline order itself (SUBMITTED → ... → SHIPPED)
// is CustomOrderStatus in the schema — this route accepts any value in that
// enum rather than a hand-maintained transition table like
// lib/admin-orders.ts's, since nothing here is payment-sensitive (unlike
// Order, where CLAUDE.md #6 requires that transition whitelist).
const STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "QUOTATION_SENT",
  "APPROVED",
  "IN_PRODUCTION",
  "QUALITY_CHECK",
  "READY",
  "SHIPPED",
] as const;

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  quotationDetails: z.string().trim().max(2000).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const existing = await db.customOrder.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await db.customOrder.update({ where: { id: params.id }, data: parsed.data });
  console.info(`Admin ${admin.email} updated custom order ${updated.id}: ${JSON.stringify(parsed.data)}`);

  return NextResponse.json({ customOrder: updated });
}
