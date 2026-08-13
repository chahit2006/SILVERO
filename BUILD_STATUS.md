# SILVERO.925 — Build Status

Snapshot as of 2026-08-08. Keep this updated as work continues — it's the fastest way for anyone (human or AI) to answer "where are we?" without re-reading the whole session history.

## Done

### Phase 1 — Foundation + Storefront
- Next.js 14 / TypeScript / Tailwind scaffold, Prisma schema, global components (Header, Footer, SearchOverlay)
- Homepage — all 12 sections (`DESIGN_SYSTEM.md` §5)
- Full Shop — 17 routes on one shared `ProductListingPage` component (5 special views + Nar/Nari hubs + 10 sub-categories)
- Product detail drawer pattern (no standalone PDP, per PRD)
- Cart — server-persisted, guest cookie merges into account on login
- Auth — NextAuth credentials, real register/login/session, bcrypt hashing
- Account shell — dashboard, orders+tracking, invoices, wishlist, recently-viewed, addresses, payments (shell), circle (shell then, now real), referrals, loyalty, preferences (shell)
- 9 guide pages (shared template) + all static/about/search pages

### Phase 2 — Core Commerce
- `lib/stock.ts` — the one stock-lock transaction (`SELECT...FOR UPDATE`, row-locked, deadlock-safe ordering)
- Cashfree integration — REST API directly (not the official SDK, which silently pulls in `@sentry/node`)
- Shiprocket integration — rates + shipment creation, graceful fallback when unconfigured
- `/checkout` (3-step: Contact → Shipping → Payment) + `/order/[id]/confirmation`
- Real server-side total recalculation, never trusts client-sent prices

### Phase 2 — Circle + Custom Order
- Free-via-past-purchase and paid Circle membership (paid path reuses the Cashfree flow)
- Server-side membership gating, independently re-checked at the API layer
- Custom Order form — HEIC→JPEG conversion, magic-byte file validation (not extension/MIME), random filenames, 5-file/10MB limits
- Public `/circle` landing + `/circle/custom-order` entry (built for real, since Circle itself is the feature)

### Phase 2 — Gifting
- Gift cards — digital/physical, preset+custom amounts, real Cashfree payment flow
- Registry — create, public share-link view, guest purchase (goes through **real** checkout + webhook, not a fake "mark purchased" button)
- 4 gifting guides + hub, wrapping page, build-your-gift bundler

### Admin Panel — complete, per `ADMIN_PANEL_SPEC.md`
- `Role` enum (`CUSTOMER`/`CIRCLE`/`ADMIN`) + `User.role` — migration `20260808140000_admin_role`, backfills existing Circle members to `CIRCLE`
- `requireAdmin()` / `getAdminOrNull()` in `lib/auth.ts` — role read from the DB per request (never from the JWT, so promote/demote takes effect immediately), `=== "ADMIN"` exactly, non-admins redirected to `/account` and API routes answer 404
- `prisma/promote-admin.ts` — promotes an existing account; no code path anywhere creates an admin with a password
- **Navigation**: "Admin Panel" link in the account sidebar for admins only — there was previously no way to reach `/admin` without typing the URL
- **Dashboard** (`/admin`) — revenue/orders-today/pending/low-stock cards, 7/30/90-day revenue line chart, top-5-products bar chart, category-revenue pie chart (`recharts`), all from `/api/admin/stats`
- **Products** (`/admin/products` + `/new` + `/[id]/edit`) — list with category/stock/archived filters, shared add/edit form, image upload reusing Custom Order's exact validation rigor (signature check, size/count limits, random filenames — see `lib/image-upload.ts`'s `processImageUploads()`), soft-delete via `Product.isArchived` (never a hard delete — preserves `OrderItem` history). Customer-facing queries (`lib/products.ts`, `lib/search.ts`, `/api/products/[id]`) all exclude archived products now.
- **3 queues**: `/admin/circle-orders` (status + quotation), `/admin/corporate-leads` (view, filter by type), `/admin/engraving-requests` (status) — `/admin/orders` was already done
- `EngravingRequest` model applied (was documented in `DATA_MODEL.md` but never reached `schema.prisma`)
- **Bug fixed**: cancelling an order (webhook failure *or* admin action) now actually restocks — `lib/stock.ts` gained `restockItems()`, and the webhook's old inline increment (a quiet violation of CLAUDE.md #4's "exactly one place") was replaced with a call to it

### Admin Product Management — 3-change follow-up, in progress (`PRODUCT_MGMT_PHASE_PLAN.md`)
1. **Barcode Image upload** — ✅ done — `Product.barcodeImage String?` (migration `20260813150942_add_barcode_image`), `processBarcodeUpload()` in `lib/image-upload.ts` (deliberately not built on the JPEG-forcing photo pipeline — PNG stays PNG so a barcode/QR isn't scannability-damaged by lossy re-encoding), single-file field on the Add/Edit form directly below Images, both admin API routes handle upload/replace/remove.
2. **Admin-typed Product ID / SKU** — ✅ done — `Product.sku String? @unique` (migration `20260813151331_add_product_sku`), "Product ID / SKU" field on the Add/Edit form (letters/numbers/hyphen/underscore only, max 64), both admin API routes validate format + uniqueness (409 on collision), admin-only — not shown on storefront or invoices.
3. **Per-size stock** — ✅ done — `ProductSizeStock` table, one row per `(productId, size)` (migration `20260813152214_add_product_size_stock`, which also backfilled a `stock: 0` row per existing `sizeOptions` entry — `Product.stock` untouched, not split across sizes). Add/Edit form's old comma-separated "Size options" field is now a repeatable size+qty row list (writes both `sizeOptions` and `ProductSizeStock` from the same rows so they can't drift); sizeless products still just use flat `Product.stock`. `ProductsTable` shows the per-size breakdown (red for any size under 5) instead of one number for sized products, plus a distinct "Needs stock entry" badge for a sized product where every size is still at the post-migration 0. Low-stock definition (dashboard card, `lowStock=true` filter) now reads "any size < 5" for sized products via `lib/stock.ts`'s new `lowStockWhere()`/`isProductLowStock()` — one shared definition, not three copies. `prisma/seed.ts` updated to seed matching `ProductSizeStock` rows so a `migrate reset` stays consistent with real data.
4. Checkout per-size stock-lock + customer-facing size-selector out-of-stock display — blocked on client confirmation, see plan doc

### Batch 2 — 4 of 5 features done (`FEATURE_SPEC_BATCH2.md` Build Order)
1. **Advanced PLP filters** — ✅ done (dual-thumb price slider, category/material/stone/occasion checkboxes, mobile draft+apply, the category/gender filter-collision bug fixed)
2. **Compare** — ✅ done — `CompareProvider` (session-storage while building a selection across PLPs) + a "Compare" checkbox on PLP product cards + a floating `CompareBar` + `/compare?ids=` (URL-shareable, stateless, no new DB model, per spec)
3. **Build Your Own Stack** — ✅ done — `CartItem.stackId` applied (was documented, not implemented), presets as JSON config (`lib/stack-presets.ts`, per the spec's own "JSON is faster to ship" call), `/api/stacks/presets` (resolves category slots to real in-stock products), `/api/stacks/[id]/add-to-cart`, `/build-your-stack` page, and the cart drawer now visually groups stack items into one "stack box" instead of scattered lines
4. **Book Appointment** — ✅ done — `/appointment` page + `/api/appointments` (rate-limited). `Appointment.storeId` was added (the model had nowhere to record which store), backed by a hardcoded `lib/stores.ts` list rather than a real Store model, since Store Locator itself is explicitly out of scope (`PRD.md` §1) — swap the placeholder addresses for real ones before launch
5. **Corporate Gifting / Bulk / Custom Engraving forms** — ⚠️ **admin side only, not customer-facing yet.** The admin queues (`/admin/corporate-leads`, `/admin/engraving-requests`) exist and the `EngravingRequest` model is applied, but there's still no `/corporate`, `/corporate/bulk`, or `/services/engraving` page, and no public `POST /api/corporate-leads` or `/api/engraving-requests` route — so nothing can actually populate those queues yet. This is the one piece of Batch 2 left.

**Total: 88 pages, 40 API routes, 240 source files. Every stage verified against a real seeded local Postgres — not just build-clean — including a genuinely signed Cashfree webhook payload for the payment-confirmation paths, and a real product-archive round trip (create → visible in shop → archived → gone from shop + 404s direct lookup → still visible to admin).**

## Not done

**Removed 2026-08-09:** Returns & Exchanges — the self-service `/account/returns` (+`/new`) flow, the `/admin/returns` queue, the public `/returns` policy page, and the `ReturnRequest` model (migration `20260809125745_remove_return_request`) were all built and then removed at the client's request. No returns/refund feature ships in this build; order cancellation still exists and still notes that refunds are processed by hand in the Cashfree dashboard (`ADMIN_PANEL_SPEC.md` §4/§5, `lib/admin-orders.ts`).

**Explicitly skipped, still cut:** standalone `/shop-the-look` and `/unboxing` pages (Quiz was replaced with Advanced PLP Filters per client direction, not skipped).

> **Update 2026-08-09:** Compare, Build Your Own Stack, and Book Appointment (Batch 2 features 2–4) are now built — see the Batch 2 section above. Only feature 5 (the customer-facing Corporate/Bulk/Engraving forms) remains from that original "skipped" list.

**Phase 3, not started:** full QA pass, security review of gated/payment flows, Hostinger deployment, monitoring setup, handover.

**Flagged gaps from along the way** (each has a comment at its source citing this):
| Gap | Where | Why it's not done |
|---|---|---|
| No cron job to release stock on abandoned (never-webhooked) `PENDING` orders | `ARCHITECTURE.md` | Needs a scheduled job (cron / `node-cron` in PM2) — real gap before trusting inventory counts |
| `CIRCLE_JOIN_FEE` = ₹499 | `lib/circle.ts` | Placeholder — `PRD.md` explicitly says confirm real pricing with the client |
| No transactional email provider | forgot-password, Custom Order confirmation, gift card delivery | Free-tools-only constraint means this needs a deliberate pick (e.g. Resend/Brevo free tier), not an invented integration |
| Contact form uses `mailto:` | `/contact` | No `ContactMessage` model exists; didn't want a fake "message sent" that silently discards input |
| Preferences page not persisted | `/account/preferences` | No schema field for marketing consent yet |
| 2 high-severity `npm audit` findings | Next 14.2.35's bundled deps | No 14.x patch available yet; didn't jump to Next 15/16 unilaterally |
| Cashfree/Shiprocket never tested against real credentials | `lib/cashfree.ts`, `lib/shiprocket.ts` | Written from API knowledge, verify against live docs before first real sandbox test |
| Brand hex colors, hero CTA style, body font | `DESIGN_SYSTEM.md` §10 | Sampled placeholders — get real values from the client/designer |
| Placeholder product photography | `prisma/seed.ts`, `public/placeholders/` | No real photography exists yet |
| "As Seen In" press logos | `components/home/AsSeenIn.tsx` | Unverified — don't ship without confirming real press mentions |
| ~~No admin role/panel~~ | — | Closed 2026-08-08 — `ADMIN_PANEL_SPEC.md` written, role gate + `/admin/orders` built (see above) |
| ~~Cancelling an order doesn't restock it~~ | — | Closed 2026-08-09 — `lib/stock.ts` gained `restockItems()`, used by both the webhook's PAYMENT_FAILED branch (previously an inline increment, now consolidated per CLAUDE.md #4) and the admin cancel path. The abandoned-`PENDING`-order cron gap above is still open — this only fixes the manual/webhook cancel paths, not orders nobody ever acts on. |
| No `Order.paymentStatus` | `ADMIN_PANEL_SPEC.md` §2/§4 vs `DATA_MODEL.md` | Spec assumes a field that doesn't exist; payment is derived from `OrderStatus` in `lib/admin-orders.ts` and can't tell a cancelled-unpaid order from a cancelled-refunded one |
| `recharts` not installed | `package.json` | `ADMIN_PANEL_SPEC.md` §2 says it's "already in your allowed frontend libraries" — it isn't in `package.json`; needs adding before the dashboard charts |

## How to run

> **Correction 2026-08-08:** the paragraph below described one particular machine and no longer
> matches a fresh checkout. `node_modules/`, `.env` and `.env.local` are all gitignored, so a new
> clone needs `npm install` and its own env files before anything runs. The Postgres service
> present is **18**, not 17, and the `silvero` / `silvero_dev_pw` credentials below did not
> authenticate against it — treat them as the intended convention, not as working values.

Everything is already set up in this environment — Postgres is running as a Windows service, seeded, and the dev server is live right now at **http://localhost:3000**.

```bash
# If you need to start it again later:
cd Silvero
npm install
npm run dev
# → http://localhost:3000
```

**Local Postgres** (installed natively — `C:\Program Files\PostgreSQL\17`):
- DB: `silvero_dev`, role: `silvero` / `silvero_dev_pw`
- `DATABASE_URL` is already set in both `.env` (Prisma CLI) and `.env.local` (Next.js runtime) — two files because they're two different tools' conventions
- Reseed anytime: `npx prisma db seed` (10 categories, 40 placeholder products)
- Re-migrate after a schema change: `npx prisma migrate dev`
- Browse the DB visually: `npx prisma studio`
- Make yourself an admin: register normally at `/account/register`, then `npx tsx prisma/promote-admin.ts you@example.com` (add `--demote` to reverse it). Takes effect on the next request — no sign-out needed.

**Payments/shipping are unconfigured on purpose** — `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`, `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` are blank in `.env.local`. Every route that calls them fails gracefully (clear error, no crash) rather than hanging — that's expected until real sandbox keys are added. Add them to `.env.local` and restart the dev server to go live.

**Try it yourself:** register at `/account/register`, browse `/shop`, add to cart, walk through `/checkout` (it'll stop at the Cashfree redirect step without real keys), check out `/circle` and `/gifting`.
