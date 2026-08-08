# SILVERO.925 — Feature Spec, Batch 2

Source: client voice memo (2026-08-08), covering the 5 features left undone after Phase 1/2 (per `BUILD_STATUS.md`'s "Explicitly skipped" list). This doc is the spec for building them now.

## 1. Advanced PLP Filters *(replaces the originally-planned "Jewellery Finder Quiz")*

**Change from the original plan:** the client redirected this from a guided quiz flow to a straightforward filter system — the reference given was H&M-style filtering. This is simpler to build than a quiz and reuses the filter groundwork already in `DESIGN_SYSTEM.md` §6.

**Spec:**
- Lives on every PLP (`/shop`, `/shop/nar/*`, `/shop/nari/*`, etc.) — not a separate page or route
- Filter groups:
  - **Price** — range slider (min/max), not just preset buckets — drag-to-select like H&M's price filter
  - **Category** — checkboxes (relevant sub-categories for the current view)
  - **Material** — checkboxes
  - **Stone** — checkboxes
  - **Occasion** — checkboxes
- Desktop: sidebar, always visible. Mobile: bottom-sheet modal, opened via a "Filter" button (per existing `DESIGN_SYSTEM.md` §6 spec)
- Applying filters updates the product grid — either live (on every change) or via an explicit "Apply" button on mobile (recommended, avoids re-fetching on every slider drag)
- Active filters show as dismissible tags above the grid, plus a "Clear all"
- **Implementation:** extend the existing `/api/products` route with query params (`priceMin`, `priceMax`, `material[]`, `stone[]`, `occasion[]`) — see `API_SPEC.md`. No new database model needed.

**Dropped:** the `/quiz` route and any question-flow/scoring logic — not building this anymore.

## 2. Compare

**Spec:**
- Customer selects 2 (up to maybe 3–4) products to compare — via a "Compare" checkbox/icon on product cards, similar to the pattern on car/phone comparison sites
- `/compare?ids=<id1>,<id2>` — a dedicated page, side-by-side columns
- Compared attributes: price, material, stone, design/style notes, size options — pull directly from existing `Product` fields, no new attributes needed unless the client wants more granular spec fields later
- CTA per column: "Add to Bag"
- **Implementation:** entirely client-side/stateless — no new database model. The compare list can live in URL query params (shareable, survives refresh) or session storage. Each product's data comes from the existing `/api/products/[id]` route.

## 3. Build Your Own Stack

**Spec:**
- Starts from a **preset stack** — a curated bundle (e.g. "Everyday Stack": 1 ring + 1 chain + 1 earring pair) — the client described several pre-made boxes
- Customer can then customize: remove any item, add a new item in the same category (swap earring for a different earring), stays within an optional budget guide
- The finished stack goes into the cart as **one grouped unit** ("stack box"), not scattered individual line items — this needs the new `stackId` field on `CartItem` (see `DATA_MODEL.md`)
- **Presets:** since these are curated/content, not something customers create, store them as seed data (a JSON config or a lightweight `StackPreset` table if the client wants to edit them without a code change — confirm which with the client; JSON is faster to ship for a beginner team)
- **Implementation:** `/build-your-stack` page, `/api/stacks/presets` to list options, `/api/stacks/[id]/add-to-cart` to commit the (possibly customized) selection to the cart with a shared `stackId`

## 4. Book Appointment

**Client explicitly said this is low priority right now** — build it, but don't let it block the other 4 features. Tied to retail partner store rollout timing (per earlier project notes).

**Spec:**
- For customers uncertain about buying online — "book an appointment with your nearest Silvero store"
- Form: name, contact, preferred date/time, nearest store (dropdown or map-style picker)
- Confirmation shows the store address/link and appointment time
- **Implementation:** already has a DB model (`Appointment` in `DATA_MODEL.md`) and a route (`/appointment`) — this was already speced, just wasn't built. No new spec work needed, just build it last within this batch.

## 5. Services: Corporate Gifting, Bulk Orders, Custom Engraving

All three are **contact/query-form based** — none of them are live customization builders. Confirmed explicitly by the client for Corporate and Bulk ("you don't have to build anything complex, just a query box that routes to the team").

### Corporate Gifting
- Static info page (pre-made corporate box products shown, not customizable inline) + a query form: company name, contact, occasion, quantity, budget, timeline
- Submits to `CorporateLead` with `type: "CORPORATE"`

### Bulk Orders
- For retailers/wholesalers — same underlying form/dashboard as Corporate Gifting, same `CorporateLead` model, `type: "BULK"`
- Client mentioned these leads should be visible on the **same dashboard** as Corporate Gifting — one admin view, filterable by type, not two separate systems

### Custom Engraving
- Different from Circle's "Custom One-of-One Order" — this is simpler: engrave a hidden message on an **existing** product (not a new design)
- Form: select the product, message text, placement (e.g. "inside the band"), contact preference
- New model needed: `EngravingRequest` (added to `DATA_MODEL.md`)
- Not gated to Circle members — open to any customer, on the relevant product

## Summary of Data Model Changes
Already applied to `DATA_MODEL.md` and `API_SPEC.md`:
- `CartItem.stackId` (nullable) — groups Build Your Stack items
- New model: `EngravingRequest`
- `/api/products` extended with filter query params
- New routes: `/api/engraving-requests`, `/api/stacks/presets`, `/api/stacks/[id]/add-to-cart`

## Directory Changes
Already applied to `DIRECTORY_STRUCTURE.md`:
- Dropped `/quiz` (replaced by PLP filters)
- Dropped standalone `/shop-the-look` (already covered by the homepage section) and `/unboxing` (confirmed cut — needs 3D animation, client passed on it)
- Kept `/build-your-stack` and `/compare`

## Build Order (within this batch)
1. Advanced PLP filters — touches the most-used page, do it first
2. Compare — self-contained, no DB changes, quick win
3. Build Your Own Stack — the most involved of the five (new field, presets, cart grouping logic)
4. Corporate/Bulk/Engraving forms — three simple forms, similar shape, batch them together
5. Book Appointment — lowest priority, already fully speced from before, build last

## Note on Source Quality
This spec is drafted from a voice memo transcription — Hinglish audio, translated and pieced together, some sections were unclear. Where the intent was ambiguous (e.g. exact preset stack contents, exact number of comparable products, whether stack presets need a CMS or can be hardcoded), I've made a reasonable call and flagged it above — confirm those specific points with the client before considering them locked.
