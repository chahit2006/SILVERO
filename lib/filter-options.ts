// Static filter option lists for the PLP sidebar. Material/Stone/Occasion
// are free-text Product fields (DATA_MODEL.md), so there's no DB-backed
// enum to draw from — these match what prisma/seed.ts populates. Expand
// this list as real product data introduces new values.
export const MATERIAL_OPTIONS = ["925 Sterling Silver", "925 Sterling Silver, Gold-Plated"];
export const STONE_OPTIONS = ["Cubic Zirconia", "Moissanite"];
export const OCCASION_OPTIONS = ["Everyday", "Festive", "Wedding", "Gifting"];

// The preset PRICE_BANDS (₹0–2K, 2K–5K, …) that DESIGN_SYSTEM.md §6 specified
// were removed on 2026-08-08: FEATURE_SPEC_BATCH2.md §1 replaced them with a
// drag-to-select range slider ("not just preset buckets"), whose ends come
// from the live catalogue via getPriceBounds() in lib/products.ts rather than
// from a hardcoded list that real product data would immediately outgrow.
// DESIGN_SYSTEM.md §6 is stale on this point — flagged for that doc.

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];
