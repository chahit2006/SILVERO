import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/auth";
import { getHeadingsWithOptions } from "@/lib/attributes";

// GET /api/admin/attributes — FILTER_SPEC_IMPLEMENTATION.md Part 1.
// The /admin/attributes page renders from Prisma directly (same pattern as
// every other admin list view); this exists for the documented API surface
// and for the client component to re-read after a mutation if it needs to.
export async function GET() {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ headings: await getHeadingsWithOptions() });
}
