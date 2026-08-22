// The Material/Stone/Occasion lists that lived here were removed on
// 2026-08-22: FILTER_SPEC_IMPLEMENTATION.md Part 1 makes those options
// admin-managed, so they now come from the FilterOption table via
// getPlpFilterGroups() in lib/attributes.ts — which also enforces the spec's
// hide-when-empty rule. Editing filter options is no longer a code change.

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
