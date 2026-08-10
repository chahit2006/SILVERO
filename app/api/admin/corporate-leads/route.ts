import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";

// GET /api/admin/corporate-leads — ADMIN_PANEL_SPEC.md §5/§6: "View
// Corporate + Bulk leads in one list, filterable by type." Read-only —
// CorporateLead has no status field to mutate (spec's own §5 table just
// says "View", unlike the other three queues).
export async function GET(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const leads = await db.corporateLead.findMany({
    where: type === "CORPORATE" || type === "BULK" ? { type } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leads });
}
