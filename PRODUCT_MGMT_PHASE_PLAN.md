# Admin Product Management — Barcode / Product ID / Per-Size Stock

Phase plan for the 3 changes requested on top of the current Add/Edit Product admin
flow. Written 2026-08-13. Supersedes nothing in `ADMIN_PANEL_SPEC.md` — it's an
addendum once each phase lands (update that doc + `DATA_MODEL.md` alongside the
schema, per `schema.prisma`'s own header).

**How this file came to exist:** the original ask included a long list of open
questions (field names, validation rules, schema shape for per-size stock, migration
strategy, blast radius on existing flat-stock reads). The user asked me to decide
those myself, phase the work, write it down, and start on Phase 1 — so the decisions
below are mine, made against the live codebase (not the attached docs, which were
confirmed to have drifted from it), and flagged where I held back rather than guessing.

## Decisions made

### 1. Barcode Image
- New field: `Product.barcodeImage String?` — single URL, nullable (not every
  product will have one immediately), separate from `images String[]`.
- Upload pipeline: new `processBarcodeUpload()` in `lib/image-upload.ts`, reusing
  `processImageUploads()`'s validation (magic-byte signature check, random UUID
  filename, `public/uploads/barcodes/`) — same rigor as product photos, per
  `SECURITY_CHECKLIST.md` §4. **One deliberate difference from `processProductPhotos`:**
  it does not force everything to JPEG. A barcode/QR image is often module-pattern
  data where JPEG's lossy compression can break scannability; PNG input stays PNG,
  only HEIC gets converted (browsers can't render HEIC at all) and JPEG input is
  re-encoded at a higher quality (95 vs 88) with orientation normalized. `maxFiles: 1`.
- Form: single-file input directly below the existing Images section, with the same
  preview/remove affordance as existing images (singular, not a gallery).
- Not required on the form — optional like `weightGrams`.

### 2. Product ID / SKU
- Confirmed via full-repo grep: **no `sku` field exists anywhere in the live build**
  (not `schema.prisma`, no migration, no `.ts`/`.tsx` reference). The Filter
  Specification doc describing `sku VARCHAR (unique)` is describing something
  unbuilt, not something hidden from the admin UI — so this is a new field, not a
  visibility toggle, confirming the suspicion in the original ask.
- Field name: `sku` on the model (matches the Filter Spec doc's DB naming and is the
  conventional term); admin-facing label is **"Product ID / SKU"** so it reads
  correctly against both docs' terminology.
- Type/validation: `String?`, trimmed, max 64 chars, pattern `^[A-Za-z0-9_-]+$`
  (letters/numbers/hyphen/underscore only — keeps it safe for barcode labels and
  URLs, similar rigor to the existing `slug` pattern but case-preserving since SKUs
  are conventionally uppercase).
- Uniqueness: `@unique` at the DB level (Postgres allows multiple `NULL`s under a
  unique constraint, so this is safe to add without every existing row needing a
  value first).
- Required or optional: **nullable**, not required in the Zod schema. The 40 seed
  products (and any real ones — `BUILD_STATUS.md` confirms nothing has shipped to
  production yet) get `null` rather than an invented value; the admin form will show
  the field prominently so it gets filled in by hand going forward, but nothing
  blocks saving a product without one yet.
- Customer-facing: admin-only for now — not exposed on the storefront or invoices.
  (Flag: revisit if the client wants it on packing slips later — that's a
  Shiprocket/invoice change, out of scope here.)

### 3. Per-size stock
- **Schema shape chosen: a new relational table**, not a JSON field —
  ```prisma
  model ProductSizeStock {
    id        String  @id @default(cuid())
    productId String
    product   Product @relation(fields: [productId], references: [id])
    size      String  // opaque label — "10", "2.4\"", "16\"", whatever the category uses
    stock     Int     @default(0)
    @@unique([productId, size])
  }
  ```
  Reasoning: `lib/stock.ts`'s existing `SELECT ... FOR UPDATE` row-lock pattern
  extends naturally to locking one `(productId, size)` row instead of the whole
  product; a JSON field would have no DB-level uniqueness and would force locking
  the entire `Product` row for every size, which is worse contention, not better.
  This does touch CLAUDE.md constraint #4 ("stock-lock logic lives in exactly one
  place") — noted for Phase 4 below, not silently extended today.
- **Sizeless products keep flat `Product.stock`.** Categories like Sitara (tennis
  bracelets), Noor (pendant sets), Kalai (bracelets) ship with `sizeOptions: []` in
  the seed data — no `ProductSizeStock` rows get created for them, and `Product.stock`
  stays their source of truth. No forced `"ONE_SIZE"` row.
- **Migration/backfill — explicitly not guessed.** For products that already have
  `sizeOptions` entries, the migration creates one `ProductSizeStock` row per
  existing size label with `stock: 0`. It does **not** split, divide, or copy the
  existing flat `stock` value across sizes — that would be inventing data. `Product.stock`
  is left untouched (not deleted, not repurposed) so nothing is silently lost; the
  admin will need to re-enter real per-size counts by hand for previously-sized
  products. The admin product list will visibly flag "needs per-size stock entry"
  for any sized product where every size row is still 0, so this isn't a silent gap.
- **Admin surfaces:** Add/Edit form replaces the old single "Size options
  (comma-separated)" text input with a repeatable size+qty row list; the product
  list/detail view shows the per-size breakdown instead of one number for sized
  products (falls back to the flat number for sizeless ones).
- **Low-stock definition:** the dashboard card and the `lowStock=true` list filter
  currently read flat `stock < 5`. For sized products this becomes "any size's stock
  < 5"; for sizeless products it stays the flat check. Handled in Phase 3.

## What's explicitly NOT in this round — needs your sign-off first

Two things stay untouched until you confirm, because they're cross-cutting/outward
facing (checkout + live storefront) rather than admin-only, and CLAUDE.md flags
exactly this kind of change as needing confirmation rather than an assumption:

- **`lib/stock.ts`'s `lockAndDecrementStock`/`restockItems` staying size-blind.**
  They already ignore `CartItem.size`/`OrderItem.size` today (pre-existing gap, not
  introduced by this work) — decrementing/restocking only the flat `Product.stock`
  pool regardless of which size was bought. Making per-size stock the real inventory
  source of truth without also fixing checkout means the admin-visible numbers can
  drift from what checkout actually enforces. Not fixing it silently either.
- **The customer-facing size selector** (`components/shop/ProductDetailDrawer.tsx`)
  gets no changes — no greyed-out/line-through out-of-stock states. Matches the
  scope check from the original ask.

These become **Phase 4**, only after you decide whether/when to do them.

## Phases

| Phase | Scope | Status |
|---|---|---|
| **1** | Barcode Image upload — schema, pipeline, form field, API routes | ✅ Done — migration `20260813150942_add_barcode_image` |
| **2** | Admin-typed Product ID / SKU — schema, form field, API validation | ✅ Done — migration `20260813151331_add_product_sku` |
| **3** | Per-size stock — schema + migration, admin form redesign, admin list/detail breakdown, low-stock definition update | ✅ Done — migration `20260813152214_add_product_size_stock` |
| **4** | *(needs separate confirmation)* Checkout per-size stock-lock + customer-facing size-selector out-of-stock display | Not started — blocked on your answer |

Each phase gets its own migration and its own doc sync (`DATA_MODEL.md`,
`BUILD_STATUS.md`, `ADMIN_PANEL_SPEC.md` where relevant) rather than one big
migration at the end, so any phase can ship or be reverted independently.
