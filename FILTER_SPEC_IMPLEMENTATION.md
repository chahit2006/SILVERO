# Filter Specification — Implementation Plan

Source doc: `SILVERO Filter Specification.docx` (Developer Handoff, July 2026).
This file reconciles that spec with what's already built in this repo, flags
conflicts with earlier decisions, and sets the build order. Read this before
touching filter/category code — it supersedes `FEATURE_SPEC_BATCH2.md` §1 on
filters specifically (that doc is still correct on everything else in Batch 2).

Status: **Part 1 built (2026-08-22). Parts 2–7 not started.** See
`BUILD_STATUS.md` for what Part 1 shipped and the one caveat on it (no live
database was reachable at build time, so the migration and seed still need to
be applied and exercised).

---

## ⚠️ Conflict to resolve before building — Price filter

- **Filter Specification (new):** `Daam (Price)` is a fixed set of auto-calculated
  buckets — Under ₹1K / ₹1-2K / ₹2-3.5K / ₹3.5-5K / ₹5-8K / ₹8-10K / ₹10K+ —
  with a `price_range` VARCHAR field derived from `product_price`.
- **What's built (`FEATURE_SPEC_BATCH2.md` §1, `components/shop/PriceRangeSlider.tsx`):**
  a drag-to-select continuous range slider, explicitly chosen *instead of*
  preset buckets, per client direction at the time ("not just preset buckets —
  drag-to-select like H&M's price filter").

**Do not silently pick one.** Confirm with the client which is current intent
before building — the spec doc may reflect a later change of mind, or may be
stale relative to the H&M-style decision. Note the answer here once decided:

> Decision: _TBD — confirm with client_

---

## Part 1 — Admin Attributes Manager (build first) — ✅ BUILT

Shipped as described below, with these decisions made during the build:

- **Product fields unchanged.** `material`/`stone`/`occasion` are still the
  free-text String columns they were; only the *source of their values*
  changed (dropdowns fed by `FilterOption`). Renaming `material` → `finish`,
  turning `occasion` into an array, and adding real FK columns are Part 2's
  job and its own client review — Part 1 deliberately doesn't pre-empt them.
  The PLP section title therefore still reads "Material", not "Finish".
- **All six headings exist and are manageable now**, including the three with
  no product field yet (`stone_color`, `design_style`, `collection`). The
  admin UI marks those as awaiting Part 2, so the client can curate the option
  lists ahead of the field migration.
- **Delete is refused while an option is in use**, with the product count
  shown. Not in the spec, but the alternative strands those products on a
  value no filter offers and no UI can find. Rename is the recoverable path,
  and it rewrites the tagged products in the same transaction.
- **Hide-when-empty is scoped per route**, using that route's base filters —
  a Zanjeer page won't offer a stone no chain has. Not scoped to the shopper's
  own selections, which would make a checkbox disappear as it's ticked.


This is the foundational piece everything else depends on. Today, `finish`
(currently called `material`), `stone`, and `occasion` are free-text `<input>`
fields in `components/admin/ProductForm.tsx`, and PLP filter options are
hardcoded in `lib/filter-options.ts`. The spec requires these to be fully
admin-managed: add/rename/reorder/delete options with no code changes, and
options auto-appear/hide in the PLP based on whether any product uses them.

**New model needed** (naming suggestion, adjust to fit `DATA_MODEL.md` conventions):

```prisma
model FilterHeading {
  id      String @id @default(cuid())
  key     String @unique // "finish", "stone", "stone_color", "design_style", "occasion", "collection" — fixed in code, matches spec's "headings are fixed in code"
  options FilterOption[]
}

model FilterOption {
  id        String        @id @default(cuid())
  headingId String
  heading   FilterHeading @relation(fields: [headingId], references: [id])
  label     String        // e.g. "925 Silver", "Rozana (Everyday)"
  sortOrder Int           @default(0)

  @@unique([headingId, label])
}
```

- Admin UI: new `/admin/attributes` page — list headings (fixed), CRUD on
  options within each heading, drag-to-reorder.
- Product form: replace free-text inputs with dropdowns/multi-selects sourced
  from `FilterOption` for the relevant heading.
- PLP: a filter option only renders if ≥1 non-archived product currently has
  it tagged (hide-when-empty, per spec).
- Adding a new **heading** (not option) still requires a developer — that's
  explicit in the spec, no UI needed for it.

## Part 2 — Schema fields (new/changed on `Product`)

| Field | Type | Status | Notes |
|---|---|---|---|
| `finish` | single select, FK to FilterOption | **new** | Replaces free-text `material`. 7 values + colour swatches (swatch hex can live on `FilterOption` or a separate lookup). |
| `stone` | single select, FK to FilterOption | **change** | Currently free-text; move to Attributes Manager. |
| `stone_color` | single select, FK to FilterOption, nullable | **new** | Only shown/applicable when `stone` ≠ "No Stone". |
| `design_style` | multi-select array | **new** | No existing field. |
| `occasion` | multi-select array | **change** | Currently single free-text string; needs to become an array. |
| `collection` | single select, nullable | **new** | Empty at launch; filter hides when no product has one, per spec. |
| `product_type` (Prakar) | single select, nullable | **new** | Only applicable to categories listed in Part 4. |
| `size` (Naap) | multi-select array, nullable | **change** | `sizeOptions` already exists but is only used in the purchase-time size picker (`ProductDetailDrawer.tsx`) — not exposed as a PLP filter. Needs wiring into `FilterPanel.tsx`. |
| `set_includes` | single select, nullable | **new** | Noor only. |
| `gender` (product-level) | enum: nar / nari / unisex | **new** | Sitara and Takma only — see Part 3 gender gap. |
| `price_range` | derived, not stored (or computed column) | **conflict — see above** | |
| `weight_class` | derived: halka / madhyam / bhari from `weightGrams` | **new** | `weightGrams` exists on `Product` already; just needs bucketing logic + PLP filter wiring. Not currently exposed as a filter. |

Toggle fields `is_new`, `is_bestseller`, `is_gift_ready`, `is_adjustable`,
`is_stackable`: `isNew` and `isBestseller` already exist and are **live**
(power `/shop/new`, `/shop/bestsellers`) — spec says these should be ON HOLD/
inactive. Decide whether to actually disable them or treat the spec's
ON HOLD note as already superseded by them shipping. `isGiftReady`,
`isAdjustable`, `isStackable` don't exist — add as boolean fields, leave
unused in UI per spec (framework only).

## Part 3 — Category gaps

**Missing categories (3 of 13) — no pages, nav entries, or seed data:**
- Dastband (Men's Bracelets)
- Kundal (Women's Earrings)
- Takma (Unisex Brooches)

**Unisex gender is architecturally missing.** `Category.gender` in
`prisma/schema.prisma` is `enum Gender { NAR NARI }` — no `UNISEX` value.
Sitara is currently hardcoded under Nar only in `lib/nav-data.ts`, and there's
no `Sabhi/Nar/Nari` toggle anywhere in the code. This needs:
1. `UNISEX` added to the `Gender` enum (migration)
2. A `gender` field at the *product* level (see Part 2 table) so a Sitara/
   Takma product can be tagged Nar, Nari, or Unisex individually
3. The `Sabhi (All) / Nar / Nari` toggle UI on the Sitara and Takma category
   pages specifically — not needed elsewhere

## Part 4 — Category-specific filters (Naap / Prakar)

Not built at all currently. Needs `product_type` field (Part 2) and PLP UI
that conditionally renders a Size and/or Type filter section per category:

| Category | Naap (Size) | Prakar (Type) |
|---|---|---|
| Zanjeer | 16"/18"/20"/21"/24" | Italian/Cuban/Tennis |
| Resham | 16"/18"/20"/21" | Tennis/Chains |
| Nishaan | ⏸ on hold | Stone/Couple Band/Band/Enamel/Solitaire/Eternity/Cocktail |
| Vaada | 4–28 (all sizes) | same as Nishaan |
| Sankalp | 2.4–2.8 | MI Band/Leather Strap Kada/Rolex/Punjabi/Side Lock |
| Valaya | 2.3–2.6 | 3 Piece/Side Lock/MI Band |
| Dastband | 6–9" | ⏸ on hold |
| Kalai | 6–8" | ⏸ on hold |
| Sitara | ⏸ on hold | none |
| Noor, Jhalak, Kundal, Takma | none | none (common filters only) |

Sizes/types marked ⏸ on hold: build the field and UI framework but leave
option lists empty/inactive until confirmed, same pattern as the sort dropdown.

## Part 5 — Sort dropdown

Currently **live and functional** with English labels (Featured/Price↑/
Price↓/Newest) powering real sorting. Spec wants:
- Status: ON HOLD — dropdown framework built, options inactive until confirmed
- Labels (when activated): Pasand (Featured), Sabse Chahita (Bestselling),
  Price Low-High, Price High-Low, Naya Pehle (Newest), Taare (Rating)
- No rating system exists yet, so "Taare" can't be wired up regardless

Decide: keep sort live as-is (arguably better than spec, already shipped and
working), or roll back to inactive-framework + relabel in Hindi to match spec
exactly. Flag for client confirmation same as the price conflict.

---

## Build order

1. **Confirm the price filter conflict** (buckets vs. slider) — blocks Part 2's `price_range` decision — ⏳ still open
2. ~~**Attributes Manager** (Part 1) — `FilterHeading`/`FilterOption` models, admin CRUD UI, product form rewire~~ — ✅ done 2026-08-22
3. **Schema migration** (Part 2) — new/changed Product fields, `weight_class` bucketing, `Gender` enum `UNISEX` addition
4. **3 missing categories** (Part 3) — Dastband, Kundal, Takma: pages, nav, seed data
5. **Unisex gender toggle** (Part 3) — Sitara + Takma product-level gender + `Sabhi/Nar/Nari` UI
6. **Category-specific Naap/Prakar filters** (Part 4) — conditional PLP sections per category
7. **Sort dropdown reconciliation** (Part 5) — client decision, then implement

Each step should get its own client review checkpoint given how much of this
touches customer-facing PLP behavior — don't batch all 7 into one delivery.
