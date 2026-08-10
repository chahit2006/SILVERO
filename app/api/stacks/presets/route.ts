import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STACK_PRESETS } from "@/lib/stack-presets";

// GET /api/stacks/presets — FEATURE_SPEC_BATCH2.md §3. Resolves each
// preset's category slots into real, in-stock products from the catalogue,
// with the first (by createdAt) as the default pick per slot.
export async function GET() {
  const resolved = await Promise.all(
    STACK_PRESETS.map(async (preset) => {
      const slots = await Promise.all(
        preset.slots.map(async (slot) => {
          const options = await db.product.findMany({
            where: { category: { slug: slot.categorySlug }, isArchived: false, stock: { gt: 0 } },
            orderBy: { createdAt: "asc" },
          });
          return { ...slot, options, defaultProductId: options[0]?.id ?? null };
        }),
      );
      return { ...preset, slots };
    }),
  );

  return NextResponse.json({ presets: resolved });
}
