// Static nav data for the header mega-menu and footer, matching the sitemap
// in PRD.md §2 and the Category model in DATA_MODEL.md.
//
// TODO: once /api/categories is built (Phase 1 shop work), replace this with
// a server-fetched list so category names/order are DB-driven, not hardcoded.

export type NavCategory = {
  slug: string;
  name: string; // brand name, e.g. "Zanjeer"
  englishName: string; // e.g. "Chains"
  href: string;
};

export const narCategories: NavCategory[] = [
  { slug: "zanjeer", name: "Zanjeer", englishName: "Chains", href: "/shop/nar/zanjeer" },
  { slug: "nishaan", name: "Nishaan", englishName: "Rings", href: "/shop/nar/nishaan" },
  { slug: "sitara", name: "Sitara", englishName: "Tennis Bracelets", href: "/shop/nar/sitara" },
  { slug: "sankalp", name: "Sankalp", englishName: "Kada", href: "/shop/nar/sankalp" },
];

export const nariCategories: NavCategory[] = [
  { slug: "resham", name: "Resham", englishName: "Chains", href: "/shop/nari/resham" },
  { slug: "vaada", name: "Vaada", englishName: "Rings", href: "/shop/nari/vaada" },
  { slug: "noor", name: "Noor", englishName: "Pendant Sets", href: "/shop/nari/noor" },
  { slug: "jhalak", name: "Jhalak", englishName: "Pendant Chains", href: "/shop/nari/jhalak" },
  { slug: "kalai", name: "Kalai", englishName: "Bracelets", href: "/shop/nari/kalai" },
  { slug: "valaya", name: "Valaya", englishName: "Kada", href: "/shop/nari/valaya" },
];

export const popularSearches = ["Vaada", "Zanjeer", "Stacking", "Noor", "Gift cards"];
