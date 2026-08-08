// Static filter option lists for the PLP sidebar. Material/Stone/Occasion
// are free-text Product fields (DATA_MODEL.md), so there's no DB-backed
// enum to draw from — these match what prisma/seed.ts populates. Expand
// this list as real product data introduces new values.
export const MATERIAL_OPTIONS = ["925 Sterling Silver", "925 Sterling Silver, Gold-Plated"];
export const STONE_OPTIONS = ["Cubic Zirconia", "Moissanite"];
export const OCCASION_OPTIONS = ["Everyday", "Festive", "Wedding", "Gifting"];

// DESIGN_SYSTEM.md §6 — "Price Range (₹0–2K, 2K–5K, 5K–10K, 10K–15K, 15K+)"
export const PRICE_BANDS: { label: string; min?: number; max?: number }[] = [
  { label: "₹0 – 2,000", min: 0, max: 2000 },
  { label: "₹2,000 – 5,000", min: 2000, max: 5000 },
  { label: "₹5,000 – 10,000", min: 5000, max: 10000 },
  { label: "₹10,000 – 15,000", min: 10000, max: 15000 },
  { label: "₹15,000+", min: 15000 },
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];
