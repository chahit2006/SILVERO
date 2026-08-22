import { db } from "./db";
import { buildProductWhere, type ProductFilters } from "./products";

/**
 * FILTER_SPEC_IMPLEMENTATION.md Part 1 — the Attributes Manager.
 *
 * The Filter Specification fixes the *headings* in code and makes only the
 * *options* inside them admin-managed. This file is that fixed list: the one
 * place a heading key, its admin label, and its PLP behaviour are declared.
 * Adding a heading is deliberately a developer change (spec, explicit).
 */

/** Product columns an option list is allowed to drive today. */
export type MappedProductField = "material" | "stone" | "occasion";

export type FilterHeadingDef = {
  key: string;
  /** Shown in /admin/attributes. */
  label: string;
  /**
   * The Product column this heading's options tag, or null if the column
   * doesn't exist yet. Part 1 keeps the existing free-text String columns and
   * only changes where their *values* come from; Part 2 of the spec is what
   * renames `material` → `finish`, turns `occasion` into an array, and adds
   * real FK columns for the rest. Headings with `field: null` are fully
   * manageable in the admin now and start driving products when Part 2 lands.
   */
  field: MappedProductField | null;
  /**
   * Section title on the customer-facing PLP, when this heading is wired up.
   * Note "finish" still renders as "Material": the customer-facing rename is
   * part of Part 2's field migration and its own client review, not this one.
   */
  plpTitle?: string;
  /** Query-string key the PLP uses for this heading (matches lib/products.ts). */
  queryKey?: MappedProductField;
  /** Admin-only note explaining a heading that isn't live yet. */
  note?: string;
};

export const FILTER_HEADINGS: FilterHeadingDef[] = [
  { key: "finish", label: "Finish", field: "material", plpTitle: "Material", queryKey: "material" },
  { key: "stone", label: "Stone", field: "stone", plpTitle: "Stone", queryKey: "stone" },
  {
    key: "stone_color",
    label: "Stone Colour",
    field: null,
    note: "No product field yet — added in Part 2. Options set up here now will apply then.",
  },
  {
    key: "design_style",
    label: "Design Style",
    field: null,
    note: "No product field yet — Part 2 adds it as a multi-select.",
  },
  { key: "occasion", label: "Occasion", field: "occasion", plpTitle: "Occasion", queryKey: "occasion" },
  {
    key: "collection",
    label: "Collection",
    field: null,
    note: "No product field yet — Part 2. Empty at launch by design; the PLP filter stays hidden until a product has one.",
  },
];

export function findHeading(key: string): FilterHeadingDef | undefined {
  return FILTER_HEADINGS.find((h) => h.key === key);
}

export type HeadingWithOptions = FilterHeadingDef & {
  options: { id: string; label: string; sortOrder: number; productCount: number }[];
};

/**
 * Every heading with its admin-managed options, in admin sort order, each
 * carrying how many non-archived products currently use it. The count is what
 * the admin UI shows before a destructive edit, and it's also what decides
 * whether an option is offered on the PLP at all.
 */
export async function getHeadingsWithOptions(): Promise<HeadingWithOptions[]> {
  const [rows, counts] = await Promise.all([
    db.filterHeading.findMany({
      include: { options: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] } },
    }),
    getOptionUsageCounts(),
  ]);

  return FILTER_HEADINGS.map((heading) => {
    const row = rows.find((r) => r.key === heading.key);
    const used = heading.field ? counts[heading.field] : undefined;
    return {
      ...heading,
      options: (row?.options ?? []).map((o) => ({
        id: o.id,
        label: o.label,
        sortOrder: o.sortOrder,
        productCount: used?.get(o.label) ?? 0,
      })),
    };
  });
}

/** label → product count, per mapped Product column, non-archived only. */
async function getOptionUsageCounts(): Promise<Record<MappedProductField, Map<string, number>>> {
  const fields: MappedProductField[] = ["material", "stone", "occasion"];
  const grouped = await Promise.all(
    fields.map((field) =>
      db.product.groupBy({ by: [field], where: { isArchived: false }, _count: { _all: true } }),
    ),
  );

  const out = {} as Record<MappedProductField, Map<string, number>>;
  fields.forEach((field, i) => {
    const map = new Map<string, number>();
    for (const row of grouped[i] as Record<string, unknown>[]) {
      const label = row[field];
      if (typeof label === "string" && label.length > 0) {
        map.set(label, (row._count as { _all: number })._all);
      }
    }
    out[field] = map;
  });
  return out;
}

/** How many non-archived products carry one exact label in one column. */
export function countProductsUsing(field: MappedProductField, label: string) {
  return db.product.count({ where: { isArchived: false, [field]: label } });
}

/** A heading as the PLP sidebar needs it: title, query key, option labels. */
export type PlpFilterGroup = {
  key: string;
  title: string;
  queryKey: MappedProductField;
  options: string[];
};

/**
 * The filter groups to render for one shop route.
 *
 * Two rules from the spec combine here: options come from the Attributes
 * Manager (admin order, not alphabetical), and an option only appears if at
 * least one non-archived product in this view actually has it tagged —
 * "hide-when-empty". A heading whose options all drop out renders no section
 * at all rather than an empty accordion.
 *
 * Takes the route's *base* filters only, never the shopper's own selections —
 * same rule as getPriceBounds(). Narrowing the option list as they tick boxes
 * would make the checkbox they just ticked disappear out from under them.
 */
export async function getPlpFilterGroups(baseFilters: ProductFilters): Promise<PlpFilterGroup[]> {
  const wired = FILTER_HEADINGS.filter(
    (h): h is FilterHeadingDef & { field: MappedProductField; queryKey: MappedProductField } =>
      h.field !== null && h.queryKey !== undefined,
  );

  const where = buildProductWhere(baseFilters);

  const [headingRows, ...inUsePerHeading] = await Promise.all([
    db.filterHeading.findMany({
      where: { key: { in: wired.map((h) => h.key) } },
      include: { options: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] } },
    }),
    ...wired.map((h) =>
      db.product.findMany({ where, select: { [h.field]: true }, distinct: [h.field] }),
    ),
  ]);

  return wired
    .map((heading, i) => {
      const inUse = new Set(
        (inUsePerHeading[i] as Record<string, unknown>[])
          .map((row) => row[heading.field])
          .filter((v): v is string => typeof v === "string" && v.length > 0),
      );
      const options = (headingRows.find((r) => r.key === heading.key)?.options ?? [])
        .map((o) => o.label)
        .filter((label) => inUse.has(label));

      return {
        key: heading.key,
        title: heading.plpTitle ?? heading.label,
        queryKey: heading.queryKey,
        options,
      };
    })
    .filter((group) => group.options.length > 0);
}

/** Option labels per mapped Product column, in the admin's chosen order. */
export type ProductAttributeOptions = Record<MappedProductField, string[]>;

/**
 * What the admin product form offers in its Finish/Stone/Occasion dropdowns.
 *
 * Unlike the PLP, this is *not* filtered by usage — the form is how an option
 * comes into use in the first place, so a brand-new option has to be
 * selectable before any product carries it.
 */
export async function getProductAttributeOptions(): Promise<ProductAttributeOptions> {
  const wired = FILTER_HEADINGS.filter((h): h is FilterHeadingDef & { field: MappedProductField } => h.field !== null);

  const rows = await db.filterHeading.findMany({
    where: { key: { in: wired.map((h) => h.key) } },
    include: { options: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] } },
  });

  const out = { material: [], stone: [], occasion: [] } as ProductAttributeOptions;
  for (const heading of wired) {
    out[heading.field] = (rows.find((r) => r.key === heading.key)?.options ?? []).map((o) => o.label);
  }
  return out;
}
