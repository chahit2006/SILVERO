import { getHeadingsWithOptions } from "@/lib/attributes";
import { AttributesManager } from "@/components/admin/AttributesManager";

export const dynamic = "force-dynamic";

// FILTER_SPEC_IMPLEMENTATION.md Part 1 — the Attributes Manager. Headings are
// fixed in code; everything inside them is the client's to manage without a
// deploy. requireAdmin() already ran in app/admin/layout.tsx.
export default async function AdminAttributesPage() {
  const headings = await getHeadingsWithOptions();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-xl">Filter Attributes</h2>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-text-dark/60">
        The options shoppers can filter by. Add, rename, reorder, or remove options here and the product form and shop
        filters pick them up immediately — no developer needed. An option only shows on the shop page once at least one
        live product is tagged with it. The headings themselves are fixed in code.
      </p>

      <AttributesManager headings={headings} />
    </div>
  );
}
