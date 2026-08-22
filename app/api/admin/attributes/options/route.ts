import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";
import { findHeading } from "@/lib/attributes";

// POST /api/admin/attributes/options — add one option to a fixed heading.
// Headings themselves are not creatable here: the Filter Specification makes
// adding a heading a developer change (lib/attributes.ts), and an unknown key
// is rejected rather than quietly creating a heading no UI knows how to show.
const createSchema = z.object({
  headingKey: z.string().trim().min(1),
  label: z.string().trim().min(1).max(120),
});

export async function POST(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const heading = findHeading(parsed.data.headingKey);
  if (!heading) return NextResponse.json({ error: "Unknown filter heading." }, { status: 400 });

  // The heading row is created by prisma/seed-attributes.ts, but upserting
  // here means a database that never had that script run still works.
  const headingRow = await db.filterHeading.upsert({
    where: { key: heading.key },
    update: {},
    create: { key: heading.key },
  });

  const duplicate = await db.filterOption.findUnique({
    where: { headingId_label: { headingId: headingRow.id, label: parsed.data.label } },
  });
  if (duplicate) return NextResponse.json({ error: "That option already exists in this heading." }, { status: 409 });

  // New options go to the end of the admin's chosen order, not the top.
  const last = await db.filterOption.findFirst({
    where: { headingId: headingRow.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const option = await db.filterOption.create({
    data: { headingId: headingRow.id, label: parsed.data.label, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });

  console.info(`Admin ${admin.email} added filter option ${heading.key}/"${option.label}"`);

  return NextResponse.json({ option }, { status: 201 });
}
