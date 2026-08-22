// FILTER_SPEC_IMPLEMENTATION.md Part 1 — populates the Attributes Manager.
//
// Idempotent, and safe to run against a live database: it creates the fixed
// headings (lib/attributes.ts) and backfills options from two sources —
// the starter lists below, and every distinct value existing products already
// carry in material/stone/occasion. That backfill is the point: the PLP now
// only offers options that exist in this table, so a free-text value nobody
// registered here would silently vanish from the sidebar on deploy.
//
// Run: npx tsx prisma/seed-attributes.ts  (also runs as part of prisma/seed.ts)
import { PrismaClient } from "@prisma/client";
import { FILTER_HEADINGS, type MappedProductField } from "../lib/attributes";

const db = new PrismaClient();

// Starter options, from the Filter Specification. Real option lists are the
// client's to curate in /admin/attributes — these exist so the manager isn't
// an empty page on first load, not as a spec-complete list.
const STARTER_OPTIONS: Record<string, string[]> = {
  finish: [
    "925 Silver",
    "925 Sterling Silver",
    "925 Sterling Silver, Gold-Plated",
    "Rose Gold Plated",
    "Oxidised Silver",
    "Two-Tone",
    "Matte Finish",
  ],
  stone: ["No Stone", "Cubic Zirconia", "Moissanite"],
  stone_color: ["White", "Black", "Green", "Red", "Blue"],
  design_style: ["Minimal", "Statement", "Traditional", "Contemporary"],
  occasion: ["Everyday", "Festive", "Wedding", "Gifting"],
  collection: [], // empty at launch, per spec
};

async function distinctProductValues(field: MappedProductField): Promise<string[]> {
  const rows = await db.product.findMany({ select: { [field]: true }, distinct: [field] });
  return (rows as Record<string, unknown>[])
    .map((r) => r[field])
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export async function seedAttributes() {
  for (const heading of FILTER_HEADINGS) {
    const row = await db.filterHeading.upsert({
      where: { key: heading.key },
      update: {},
      create: { key: heading.key },
    });

    const fromProducts = heading.field ? await distinctProductValues(heading.field) : [];
    // Starter options keep their listed order; anything discovered on real
    // products lands after them rather than interleaving.
    const labels = [...new Set([...(STARTER_OPTIONS[heading.key] ?? []), ...fromProducts])];

    for (const [i, label] of labels.entries()) {
      await db.filterOption.upsert({
        where: { headingId_label: { headingId: row.id, label } },
        update: {}, // never touch sortOrder/label on an existing row — the admin owns those
        create: { headingId: row.id, label, sortOrder: i },
      });
    }

    console.log(`  ${heading.key}: ${labels.length} option(s)`);
  }
}

// Only self-executes when run directly, so prisma/seed.ts can import it.
if (require.main === module) {
  console.log("Seeding filter headings + options...");
  seedAttributes()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
