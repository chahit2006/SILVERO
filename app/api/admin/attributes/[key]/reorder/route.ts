import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";
import { findHeading } from "@/lib/attributes";

// PATCH /api/admin/attributes/[key]/reorder — persist a drag-to-reorder.
// Body is the heading's full option id list in its new order; sortOrder is
// rewritten from the array index so the values stay dense (0,1,2…) instead of
// drifting after repeated moves.
const reorderSchema = z.object({ optionIds: z.array(z.string().min(1)).min(1) });

export async function PATCH(req: Request, { params }: { params: { key: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const heading = findHeading(params.key);
  if (!heading) return NextResponse.json({ error: "Unknown filter heading." }, { status: 400 });

  const parsed = reorderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const headingRow = await db.filterHeading.findUnique({
    where: { key: heading.key },
    include: { options: { select: { id: true } } },
  });
  if (!headingRow) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Reject a partial or foreign list rather than reordering what it does
  // cover: a request that doesn't name exactly this heading's options is a
  // stale client, and applying it would scramble the order it meant to set.
  const own = new Set(headingRow.options.map((o) => o.id));
  const sent = new Set(parsed.data.optionIds);
  if (sent.size !== parsed.data.optionIds.length || sent.size !== own.size || ![...sent].every((id) => own.has(id))) {
    return NextResponse.json({ error: "Option list is out of date. Reload the page and try again." }, { status: 409 });
  }

  await db.$transaction(
    parsed.data.optionIds.map((id, i) => db.filterOption.update({ where: { id }, data: { sortOrder: i } })),
  );

  console.info(`Admin ${admin.email} reordered ${parsed.data.optionIds.length} option(s) in ${heading.key}`);

  return NextResponse.json({ ok: true });
}
