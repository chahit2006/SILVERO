import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";
import { countProductsUsing, findHeading } from "@/lib/attributes";

// PATCH/DELETE /api/admin/attributes/options/[id] — rename or remove one
// admin-managed filter option. FILTER_SPEC_IMPLEMENTATION.md Part 1.

const patchSchema = z.object({ label: z.string().trim().min(1).max(120) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const option = await db.filterOption.findUnique({ where: { id: params.id }, include: { heading: true } });
  if (!option) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const nextLabel = parsed.data.label;
  if (nextLabel === option.label) return NextResponse.json({ option });

  const duplicate = await db.filterOption.findUnique({
    where: { headingId_label: { headingId: option.headingId, label: nextLabel } },
  });
  if (duplicate) return NextResponse.json({ error: "Another option in this heading already uses that name." }, { status: 409 });

  const field = findHeading(option.heading.key)?.field ?? null;

  // Part 1 still tags products with the option's *text* (Product.material /
  // .stone / .occasion are free-text Strings until Part 2 turns them into
  // FKs). So a rename has to rewrite every product carrying the old label in
  // the same transaction — otherwise those products keep a value no filter
  // offers any more, and drop out of the PLP sidebar entirely. Archived
  // products are rewritten too: they can be un-archived later.
  const { updated, retagged } = await db.$transaction(async (tx) => {
    const updated = await tx.filterOption.update({ where: { id: option.id }, data: { label: nextLabel } });
    // Headings with no Product column yet (stone_color, design_style,
    // collection — Part 2) have nothing to retag.
    const retagged = field
      ? await tx.product.updateMany({ where: { [field]: option.label }, data: { [field]: nextLabel } })
      : { count: 0 };
    return { updated, retagged };
  });

  console.info(
    `Admin ${admin.email} renamed filter option ${option.heading.key}/"${option.label}" → "${nextLabel}" (${retagged.count} product(s) retagged)`,
  );

  return NextResponse.json({ option: updated, retagged: retagged.count });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const option = await db.filterOption.findUnique({ where: { id: params.id }, include: { heading: true } });
  if (!option) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Guardrail, not in the spec but the alternative is worse: deleting an
  // option that products still carry would leave them tagged with a value no
  // filter offers, invisible in the sidebar and unfixable without knowing the
  // exact old string. Renaming or retagging those products first is
  // recoverable; this isn't. The admin UI shows the same count up front.
  const field = findHeading(option.heading.key)?.field ?? null;
  if (field) {
    const inUse = await countProductsUsing(field, option.label);
    if (inUse > 0) {
      return NextResponse.json(
        {
          error: `${inUse} product${inUse === 1 ? "" : "s"} still use${inUse === 1 ? "s" : ""} "${option.label}". Retag those products first, then delete this option.`,
        },
        { status: 409 },
      );
    }
  }

  await db.filterOption.delete({ where: { id: option.id } });
  console.info(`Admin ${admin.email} deleted filter option ${option.heading.key}/"${option.label}"`);

  return NextResponse.json({ ok: true });
}
