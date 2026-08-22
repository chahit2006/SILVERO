# SILVERO — Full Spec Status (Product Page + Filters)

Checked against `SILVERO Product Page Spec.docx` and `SILVERO Filter Specification.docx` (both July 2026, Developer Handoff — re-uploaded versions confirmed byte-identical to the ones checked previously). Codebase: `github.com/chahit2006/SILVERO`, `main` branch. Nothing has been implemented since the last check — this reflects the same code, verified more thoroughly: I ran the app locally (seeded Postgres + `next dev`) and screenshotted the shop grid, filter sidebar, product panel (desktop + all accordions expanded), and mobile view, rather than relying on code reading alone.

Legend: ✅ Done · 🟡 Partial (exists, differs from spec in a real way) · ❌ Not done. ⏸ marks spec items the client explicitly put ON HOLD — for those, the bar is "does the empty framework exist," not "is the feature fully built."

**Totals: 2 done · 26 partial · 53 not done, out of 91 requirements checked** (22 product-page elements + 69 filter/category/schema requirements — some items count in both where they overlap, e.g. the finish system).

---

## Part 1 — Product Page (`components/shop/ProductDetailDrawer.tsx`)

The spec describes a full 21-element standalone PDP. What exists is a side-drawer opened from the shop grid, built to a minimal MVP scope — most content added to the spec after that MVP was never retrofitted in.

| # | Element | Status | What's actually there |
|---|---|---|---|
| 1 | Breadcrumb | ❌ Not done | No breadcrumb component anywhere in the repo or on screen. |
| 2 | Image Gallery | 🟡 Partial | Main image + arrows + thumbnail strip, capped at 4 images, correct olive-ring on selection. Missing: zoom/lightbox, video loop, desktop-vertical/mobile-swipe distinction, no 5–7 image minimum enforced. |
| 3 | Category & Name | 🟡 Partial | Category renders as plain grey text ("VALAYA"), not a link to the category page. Name renders correctly in serif display font. |
| 4 | Price + Plating Charges | ❌ Not done | Flat price only (`₹2,766`). No `finish` field exists anywhere to key a dynamic surcharge off of. |
| 5 | Description | ✅ Done | Short-form copy renders correctly. Content itself (tone, "ends with 925 silver") is a copywriting task, not a code gap. |
| 6 | Trust Badges (4) | 🟡 Partial | Only 3 render — "925 Sterling Silver," "Lifetime Plating," "Complimentary Shipping" — as plain bordered text pills, no icons, no olive-light container. "BIS Hallmarked" and "Skin Safe & Hypoallergenic" are missing; "Lifetime Plating" isn't a spec badge at all. |
| 7 | Finish/Plating Selector (Chamak) | ❌ Not done | No swatch selector. No `finish` field in the schema. |
| 8 | Size Selector (Naap) | 🟡 Partial | Renders as rounded pills (spec wants rectangles), shown whenever a product happens to have size data rather than gated to the spec's category list. No out-of-stock greyed/strikethrough (a `ProductSizeStock` model exists but isn't read here). No "Naap Guide" link. |
| 9 | Engraving Option (Naam Likho) | ❌ Not done | No customer-facing engraving UI. `EngravingRequest` model + `/admin/engraving-requests` exist but are an admin-only queue — nothing lets a customer submit one. |
| 10 | Quantity Stepper | ❌ Not done | Add to Bag / Buy Now always send `quantity: 1`. No stepper. |
| 11 | Primary CTAs | 🟡 Partial | Add to Bag + Buy Now render correctly. No Compare button beside Add to Bag (Compare lives elsewhere — see #12). No express-checkout logos row. |
| 12 | Compare Feature (Tulna) | 🟡 Partial | Cap is 4 (`CompareProvider.tsx` `MAX_COMPARE = 4`), spec wants 3. Table shows Price/Material/Stone/Occasion/Sizes/Description — Finish, Weight, Stone Colour, Type, Hallmark status all missing; Occasion/Description aren't spec columns. Entry point is a checkbox on the shop grid card, not a button on the product panel. |
| 13 | Wishlist & Share | 🟡 Partial | Bare heart icon, no "Save to Wishlist" label. Share is entirely absent — no icon, no popover, no WhatsApp/Pinterest/copy-link. |
| 14 | Delivery Info + PIN checker | ❌ Not done | Static text only ("Complimentary shipping across India · Standard delivery in 5–7 days"). No PIN input, no Check button, no estimate logic. |
| 15 | Accordions (4) | 🟡 Partial | Structure matches (4 sections, first open by default). Content diverges: Details is one freeform sentence, not the structured spec list; Care has no guide link; **Returns currently reads "Easy 7-day returns on unworn items"** — directly contradicting the spec's 15-day policy and omitting the engraved-non-returnable / 7–10 day refund language. Live customer-facing content bug, independent of any larger build. |
| 16 | Jodi Banao (curated cross-sell) | ❌ Not done | Doesn't exist as a distinct section; no admin field to curate it. |
| 17 | Aur Dekhein (algorithmic) | 🟡 Partial | Renders as a static 2-column grid, not a horizontal carousel; same-category only (no price-range matching); this one section is standing in for both #16 and #17's intent without fully matching either. |
| 18 | Kehte Hain (Reviews) | ❌ Not done | No `Review` model, no reviews UI anywhere. |
| 19 | Dekhbhal Mini (finish-linked care tips) | ❌ Not done | Can't exist without a `finish` attribute (same root cause as #4/#7). |
| 20 | Hallmark Pramaan | ❌ Not done | Section doesn't exist. |
| 21 | Mobile Sticky Bar | ❌ Not done | Confirmed at 390px viewport — no fixed bottom bar. Product panel is an in-flow block with an inline (non-sticky) CTA. |
| 22 | Plating Charge System (dev brief) | ❌ Not done | No `finish` or plating-charge field anywhere in `prisma/schema.prisma` or any migration. Root blocker for #4, #7, #19. |

---

## Part 2 — Filters, Attributes & Category Map

### Admin & schema foundation

| Requirement | Status | Detail |
|---|---|---|
| Attributes Manager (self-managed filter options) | ❌ Not done | No such admin page exists (`AdminNav.tsx` lists Dashboard/Orders/Products/Circle Orders/Corporate-Bulk/Engraving only). `ProductForm.tsx` uses free-text inputs for Material/Stone/Occasion, not admin-managed option lists. |
| `finish` field + swatches | ❌ Not done | Doesn't exist. Closest thing in the live UI is a **"Material" filter** with just 2 options (925 Sterling Silver / 925 Sterling Silver, Gold-Plated) — confirmed on screen. It doesn't match the spec's Chamak taxonomy (7 finishes, swatch UI) at all. |
| Plating-charge fields (per-finish amount + active flag) | ❌ Not done | Zero hits for finish/plating across `schema.prisma` and every migration file. |
| `price_range` (auto-calculated) | ❌ Not done | No such column; current price filter is a raw continuous value. |
| `weight_class` (auto-calculated) | ❌ Not done | No such column. `weightGrams` exists on `Product` but isn't classified or surfaced as a filter at all. |
| `stone_color` | ❌ Not done | No such column, no filter, no conditional visibility logic. |
| `design_style` | ❌ Not done | No such column, no filter. |
| `collection` | ❌ Not done | No such column, no filter, no admin way to add collections. |
| `product_type` | ❌ Not done | No such column. |
| `set_includes` (Noor only) | ❌ Not done | No such column. |
| Product-level `gender` (Sitara/Takma, nar/nari/unisex) | ❌ Not done | `Gender` enum is NAR/NARI only — no unisex value exists at all, so this is structurally impossible without a schema change first. |
| `gender_section` | ❌ Not done | No such column on `Product`. |
| `is_gift_ready`, `is_adjustable`, `is_stackable` | ❌ Not done (⏸ ON HOLD) | Spec says build these 3 as inactive boolean fields — none of the 3 exist. |
| `occasion` | 🟡 Partial | Exists but as a single nullable string; spec requires multi-select array. |
| `stone` | ✅ Done | Exists, single-select shape matches (options aren't Attributes-Manager-driven, but the field itself is correct). |
| `sizeOptions` / `ProductSizeStock` | ✅ Done | Matches the spec's multi-select/nullable `size` concept. |
| `isNew`, `isBestseller` | 🟡 Partial (⏸ ON HOLD) | Both fields exist (matches the "build the field" instruction), but both are wired as **active** route filters (`/shop/new`, `/shop/bestsellers`) rather than the inactive toggle-UI the ON HOLD instruction calls for. |
| `product_name`, `product_price`, `product_weight`, `sku`, `stock_quantity` | ✅ Done | All present with reasonable mapping (price as Int vs. spec's Decimal is a documented deliberate choice, functionally fine). |

### Sort & common filters (confirmed on screen)

| Requirement | Status | Detail |
|---|---|---|
| Sort dropdown | 🟡 Partial (⏸ ON HOLD) | Spec: build framework, leave inactive. Screenshotted directly — a "Featured" sort dropdown is **fully live and functional** at the top of the shop grid, contradicting the hold instruction. Missing "Bestselling" and "Rating" from the spec's expected option list. |
| Daam (Price) | 🟡 Partial | Screenshotted — a continuous drag slider (₹2,300–₹5,200+), not the spec's 7 fixed bands. Documented in code as a deliberate deviation from `DESIGN_SYSTEM.md`. |
| Chamak (Finish) | ❌ Not done | See "Material" filter note above — nothing matching this exists. |
| Ratna (Stone) | 🟡 Partial | Screenshotted — options are "Cubic Zirconia" / "Moissanite." Spec wants "No Stone" / "CZ" / "Gemstone" — only 1 of 3 spec values represented (CZ, loosely). |
| Ratna Rang (Stone Colour) | ❌ Not done | No filter section, confirmed absent on screen. |
| Rachna (Design Style) | ❌ Not done | No filter section, confirmed absent on screen. |
| Mauka (Occasion) | 🟡 Partial | Screenshotted — 4 options (Everyday/Festive/Wedding/Gifting) of the spec's 7; missing Office, Showstopper, Stacking. |
| Vajan (Weight) | ❌ Not done | No filter section, confirmed absent on screen. |
| Sangrah (Collection) | ❌ Not done | No filter section, confirmed absent on screen. |
| Toggle filters (Naya/Pasand/Tohfa/Samayojya/Sajja) | 🟡 Partial (⏸ ON HOLD) | Only 2 of 5 exist as fields, and both are active route filters, not inactive toggle UI (same issue as `isNew`/`isBestseller` above). |

### Category map (confirmed on screen — 10 categories render in the sidebar)

| Requirement | Status | Detail |
|---|---|---|
| 13-category map | 🟡 Partial | Only 10 seeded/live: Zanjeer, Nishaan, Sitara, Sankalp (Nar) + Resham, Vaada, Noor, Jhalak, Kalai, Valaya (Nari). **Missing entirely: Dastband, Kundal, Takma.** |
| Sitara as Unisex + gender toggle | ❌ Not done | Seeded as Nar-only (`gender: "NAR"`); no unisex value exists in the `Gender` enum to support a toggle at all. |
| Category-specific Naap/Prakar filters (9 categories: Zanjeer, Resham, Nishaan, Vaada, Sankalp, Valaya, Dastband, Kalai, Sitara) | ❌ Not done | One identical static filter set applies to every category page — no per-category size/type filter config exists anywhere. |

---

## What's actually blocking the most

1. **No `finish` field in the schema.** This single gap blocks the plating-charge system, the finish selector, and the finish-linked care tips on the product page, *and* the Chamak filter, *and* is a prerequisite for the Attributes Manager to have anything to manage. Highest-leverage first build.
2. **No Attributes Manager.** Every "admin adds/renames/reorders options without code changes" requirement in the filter spec depends on this existing; right now every option list is hardcoded in `lib/filter-options.ts`.
3. **3 of 13 categories don't exist** (Dastband, Kundal, Takma), and Sitara's gender model is wrong at the schema level, not just the seed-data level.
4. **One live content bug independent of all the above**: the Returns accordion's "7-day" text contradicts the 15-day policy — a one-line fix, worth doing regardless of build priority.

---

*Verified 2026-08-14 against `main` — Prisma schema/migrations, admin panel code, and a locally-run instance (seeded Postgres + `next dev`) screenshotted at desktop and mobile viewports.*

---

## Addendum — independent re-verification (2026-08-14, on adding this file to the repo)

Spot-checked this audit against the live tree before adopting it. **The audit is accurate**;
every claim below was independently confirmed:

- `Gender` enum is `NAR | NARI` only (`prisma/schema.prisma:14`) — no unisex value. Confirmed.
- Zero occurrences of `finish` (as a schema field) or any plating-charge column across
  `schema.prisma` and all 13 migrations. The only `finish` hit in the repo is prose in
  `app/(static)/terms/page.tsx:24`. Confirmed.
- `MAX_COMPARE = 4` (`components/providers/CompareProvider.tsx:6`) vs. the spec's 3. Confirmed.
- `AdminNav.tsx` lists exactly the six pages named. Confirmed.
- `ProductSizeStock` exists and is unread by `ProductDetailDrawer.tsx`. Confirmed.
- 10 seeded categories; Sitara seeded `gender: "NAR"`. Confirmed.

Two additions the audit does not mention:

1. **~~The "7-day returns" text appears in _two_ places, not one.~~ — RESOLVED 2026-08-14.**
   Superseded: the client confirmed the **returns and exchange feature is removed entirely**,
   so row #15's "7-day vs the spec's 15-day policy" finding is moot — there is no returns
   policy to be inconsistent with. The model (`ReturnRequest`), page, and API route were
   already gone (migration `20260809125745_remove_return_request`); what remained was two
   orphaned customer-facing claims, both now **deleted** on instruction:
   - `components/home/TrustBar.tsx` — the "Easy Returns / 7-day no-questions returns" item
     (trust bar now has 3 items; see the layout note below)
   - `components/shop/ProductDetailDrawer.tsx` — the entire "Returns" accordion, removed
     from both the `ACCORDIONS` list and `accordionContent()` (accordion set is now
     Details / Care / Shipping)

   Two follow-ups left open deliberately:
   - **Layout:** `TrustBar`'s grid is still `grid-cols-2 lg:grid-cols-4` with 3 items, so
     desktop leaves one empty cell and mobile leaves an orphan on row 2. A one-line change
     to `lg:grid-cols-3` fixes it — not applied, as it wasn't part of the deletion.
   - **Policy display:** no returns/refund/exchange policy is now stated anywhere on the
     site. India's Consumer Protection (E-Commerce) Rules 2020 generally require an
     e-commerce entity to display its returns/refund policy — "no returns" is a valid
     policy but usually still has to be *stated*. Raised for whoever owns the legal side.

2. **`ProductSizeStock` is recorded but never decremented.** Per
   `PRODUCT_MGMT_PHASE_PLAN.md` Phase 4 (not built) and the note in `lib/stock.ts`,
   checkout still decrements the flat `Product.stock`. So per-size counts in the admin
   panel do not go down when orders are placed. This makes product-page item #8's
   out-of-stock greying unreliable until Phase 4 lands — sequencing dependency worth
   knowing before scheduling #8.
